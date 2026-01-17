/**
 * Chunked Upload Utility for Large Video Files
 * 
 * Implements Resumable Chunked Upload Protocol to bypass Vercel's 4.5MB payload limit.
 * Uses Blob.slice() API to segment videos into manageable chunks for sequential transmission.
 * 
 * Technical Implementation:
 * - Client-side: Blob.slice() segments video into 4MB chunks
 * - Transmission: Sequential multipart streams with ACK confirmation
 * - Server-side: Write Stream Buffer for reassembly
 * - Result: Process 500MB+ files within stateless serverless context
 */

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks (under Vercel's 4.5MB limit)

export interface UploadProgress {
  chunk: number;
  totalChunks: number;
  progress: number;
  uploadId: string;
  bytesUploaded: number;
  totalBytes: number;
}

export interface UploadResult {
  success: boolean;
  uploadId: string;
  message?: string;
  analysisResult?: any;
}

export class ChunkedUploader {
  private file: File;
  private onProgress?: (progress: UploadProgress) => void;
  private onComplete?: (result: any) => void;
  private onError?: (error: Error) => void;
  
  private totalChunks: number;
  private currentChunk: number = 0;
  private uploadId: string;
  private aborted: boolean = false;

  constructor(
    file: File,
    callbacks: {
      onProgress?: (progress: UploadProgress) => void;
      onComplete?: (result: any) => void;
      onError?: (error: Error) => void;
    }
  ) {
    this.file = file;
    this.onProgress = callbacks.onProgress;
    this.onComplete = callbacks.onComplete;
    this.onError = callbacks.onError;
    
    this.totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    this.uploadId = this.generateUploadId();
  }

  /**
   * Generate unique upload ID for tracking
   */
  private generateUploadId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Slice file into chunks using Blob.slice()
   * This creates a new Blob containing bytes from start to end without loading entire file into memory
   */
  private getChunk(chunkIndex: number): Blob {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, this.file.size);
    
    // Blob.slice() is memory-efficient - it doesn't copy data, just creates a view
    return this.file.slice(start, end);
  }

  /**
   * Upload a single chunk to the server
   */
  private async uploadChunk(chunkIndex: number): Promise<void> {
    if (this.aborted) {
      throw new Error('Upload aborted');
    }

    const chunk = this.getChunk(chunkIndex);
    const formData = new FormData();
    
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', this.totalChunks.toString());
    formData.append('uploadId', this.uploadId);
    formData.append('fileName', this.file.name);
    formData.append('fileSize', this.file.size.toString());

    try {
      const response = await fetch('/api/upload-chunk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Chunk ${chunkIndex} upload failed`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to upload chunk ${chunkIndex}: ${error.message}`);
    }
  }

  /**
   * Upload all chunks sequentially
   * Sequential upload ensures proper reassembly and avoids overwhelming the server
   */
  async start(): Promise<any> {
    try {
      console.log(`Starting chunked upload: ${this.totalChunks} chunks for ${this.file.name}`);
      
      for (let i = 0; i < this.totalChunks; i++) {
        if (this.aborted) {
          throw new Error('Upload aborted by user');
        }

        await this.uploadChunk(i);
        
        this.currentChunk = i + 1;
        const progress = (this.currentChunk / this.totalChunks) * 100;
        const bytesUploaded = Math.min(this.currentChunk * CHUNK_SIZE, this.file.size);
        
        // Notify progress callback
        if (this.onProgress) {
          this.onProgress({
            chunk: this.currentChunk,
            totalChunks: this.totalChunks,
            progress: progress,
            uploadId: this.uploadId,
            bytesUploaded,
            totalBytes: this.file.size,
          });
        }
      }

      // All chunks uploaded, signal completion and trigger analysis
      console.log('All chunks uploaded, completing upload...');
      const result = await this.completeUpload();
      
      if (this.onComplete) {
        this.onComplete(result);
      }

      return result;
    } catch (error: any) {
      console.error('Upload error:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  /**
   * Signal server that all chunks are uploaded and trigger video analysis
   * Includes retry logic for serverless environment issues
   */
  private async completeUpload(): Promise<any> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting upload completion (attempt ${attempt}/${maxRetries})`);
        
        const response = await fetch('/api/complete-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uploadId: this.uploadId,
            fileName: this.file.name,
            fileSize: this.file.size,
            totalChunks: this.totalChunks,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Check if this is a serverless cleanup issue
          if (errorData.code === 'UPLOAD_SESSION_EXPIRED' || errorData.code === 'DIRECTORY_ACCESS_ERROR') {
            console.warn(`Serverless cleanup detected on attempt ${attempt}:`, errorData.error);
            
            if (attempt < maxRetries) {
              console.log('Retrying by re-uploading chunks...');
              // Re-upload all chunks and try again
              await this.reuploadAllChunks();
              continue;
            }
          }
          
          throw new Error(errorData.error || 'Failed to complete upload');
        }

        return await response.json();
        
      } catch (error: any) {
        lastError = error;
        console.error(`Upload completion attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError || new Error('Upload completion failed after all retries');
  }

  /**
   * Re-upload all chunks (for retry scenarios)
   */
  private async reuploadAllChunks(): Promise<void> {
    console.log('Re-uploading all chunks due to serverless cleanup...');
    
    for (let i = 0; i < this.totalChunks; i++) {
      await this.uploadChunk(i);
      
      // Update progress for re-upload
      if (this.onProgress) {
        const progress = ((i + 1) / this.totalChunks) * 100;
        const bytesUploaded = Math.min((i + 1) * CHUNK_SIZE, this.file.size);
        
        this.onProgress({
          chunk: i + 1,
          totalChunks: this.totalChunks,
          progress: progress,
          uploadId: this.uploadId,
          bytesUploaded,
          totalBytes: this.file.size,
        });
      }
    }
  }

  /**
   * Abort the upload process
   */
  abort(): void {
    this.aborted = true;
  }
}

/**
 * Helper function to format bytes for display
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Helper function to format upload speed
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}
