/**
 * Chunked Upload Utility
 * 
 * Handles large video file uploads by splitting them into chunks
 * and uploading them sequentially with progress tracking
 */

export interface ChunkUploadProgress {
  chunkIndex: number;
  totalChunks: number;
  chunkProgress: number;
  overallProgress: number;
  currentChunkSize: number;
  uploadedBytes: number;
  totalBytes: number;
  sessionId?: string;
  chunkResult?: {
    prediction: string;
    confidence: number;
    processingTime: number;
  };
}

export interface ChunkUploadResult {
  success: boolean;
  completed: boolean;
  sessionId: string;
  result?: any;
  error?: string;
}

export class ChunkedUploader {
  private file: File;
  private chunkSize: number;
  private apiUrl: string;
  private onProgress?: (progress: ChunkUploadProgress) => void;
  private sessionId?: string;

  constructor(
    file: File, 
    options: {
      chunkSize?: number;
      apiUrl?: string;
      onProgress?: (progress: ChunkUploadProgress) => void;
    } = {}
  ) {
    this.file = file;
    this.chunkSize = options.chunkSize || 3 * 1024 * 1024; // 3MB default to stay under Vercel limits
    this.apiUrl = options.apiUrl || '/api/upload-chunked';
    this.onProgress = options.onProgress;
  }

  /**
   * Split file into chunks
   */
  private createChunks(): Blob[] {
    const chunks: Blob[] = [];
    let start = 0;

    while (start < this.file.size) {
      const end = Math.min(start + this.chunkSize, this.file.size);
      chunks.push(this.file.slice(start, end));
      start = end;
    }

    return chunks;
  }

  /**
   * Upload a single chunk
   */
  private async uploadChunk(
    chunk: Blob, 
    chunkIndex: number, 
    totalChunks: number
  ): Promise<ChunkUploadResult> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('filename', this.file.name);
    formData.append('fileSize', this.file.size.toString());
    
    if (this.sessionId) {
      formData.append('sessionId', this.sessionId);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `HTTP ${response.status}`;
        
        // Provide specific error messages for common issues
        if (response.status === 413) {
          errorMessage = `Chunk too large (${(chunk.size / (1024 * 1024)).toFixed(1)}MB). Try reducing chunk size.`;
        } else if (response.status === 500) {
          errorMessage = 'Server error processing chunk. Please try again.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait and try again.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Store session ID from first chunk
      if (!this.sessionId && result.sessionId) {
        this.sessionId = result.sessionId;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        completed: false,
        sessionId: this.sessionId || '',
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload all chunks sequentially
   */
  async upload(): Promise<ChunkUploadResult> {
    const chunks = this.createChunks();
    const totalChunks = chunks.length;
    let uploadedBytes = 0;

    console.log(`Starting chunked upload: ${chunks.length} chunks, ${(this.file.size / (1024 * 1024)).toFixed(2)}MB total`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkSize = chunk.size;

      // Report progress before upload
      if (this.onProgress) {
        this.onProgress({
          chunkIndex: i,
          totalChunks,
          chunkProgress: 0,
          overallProgress: (uploadedBytes / this.file.size) * 100,
          currentChunkSize: chunkSize,
          uploadedBytes,
          totalBytes: this.file.size,
          sessionId: this.sessionId
        });
      }

      // Upload chunk
      const result = await this.uploadChunk(chunk, i, totalChunks);

      if (!result.success) {
        return result;
      }

      uploadedBytes += chunkSize;

      // Report progress after upload
      if (this.onProgress) {
        this.onProgress({
          chunkIndex: i,
          totalChunks,
          chunkProgress: 100,
          overallProgress: (uploadedBytes / this.file.size) * 100,
          currentChunkSize: chunkSize,
          uploadedBytes,
          totalBytes: this.file.size,
          sessionId: result.sessionId,
          chunkResult: result.chunkResult
        });
      }

      // If this was the last chunk and upload is complete
      if (result.completed) {
        console.log(`Chunked upload completed: ${totalChunks} chunks processed`);
        return result;
      }

      // Small delay between chunks to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // This shouldn't happen, but just in case
    return {
      success: false,
      completed: false,
      sessionId: this.sessionId || '',
      error: 'Upload completed but no final result received'
    };
  }

  /**
   * Cancel upload (cleanup would need to be implemented on server)
   */
  cancel(): void {
    // In a real implementation, you might want to notify the server
    // to clean up partial uploads
    console.log('Chunked upload cancelled');
  }
}

/**
 * Utility function to determine if file should use chunked upload
 */
export function shouldUseChunkedUpload(file: File, threshold: number = 10 * 1024 * 1024): boolean {
  return file.size > threshold;
}

/**
 * Format bytes for display
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate estimated time remaining
 */
export function calculateETA(uploadedBytes: number, totalBytes: number, startTime: number): string {
  const elapsed = Date.now() - startTime;
  const rate = uploadedBytes / elapsed; // bytes per ms
  const remaining = totalBytes - uploadedBytes;
  const eta = remaining / rate; // ms remaining

  if (eta < 60000) { // Less than 1 minute
    return `${Math.round(eta / 1000)}s remaining`;
  } else if (eta < 3600000) { // Less than 1 hour
    return `${Math.round(eta / 60000)}m remaining`;
  } else {
    return `${Math.round(eta / 3600000)}h remaining`;
  }
}