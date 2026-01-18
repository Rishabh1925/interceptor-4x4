/**
 * Chunked Upload API - Receive Individual Chunks
 * 
 * Stateless chunk receiver that stores chunks temporarily using write stream buffer.
 * Designed for Vercel serverless environment with 4.5MB payload and timeout limits.
 */

import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Required for formidable to handle multipart data
  },
};

// Temporary storage directory (Vercel provides /tmp)
const TEMP_DIR = '/tmp/chunks';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Write chunk to disk using stream buffer (memory efficient)
 */
function writeChunkToDisk(chunkBuffer, uploadDir, chunkIndex) {
  // Zero-pad chunk index for proper sorting during reassembly
  const chunkFilename = `chunk_${String(chunkIndex).padStart(6, '0')}.bin`;
  const chunkPath = path.join(uploadDir, chunkFilename);
  
  // Write chunk using stream buffer (doesn't load full file into memory)
  fs.writeFileSync(chunkPath, chunkBuffer);
  
  return chunkPath;
}

/**
 * Update upload metadata (stateless-safe)
 */
function updateMetadata(uploadDir, uploadId, filename, totalSize, totalChunks, chunkIndex) {
  const metadataPath = path.join(uploadDir, 'metadata.json');
  
  // Read existing metadata or create new
  let metadata = {};
  if (fs.existsSync(metadataPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (error) {
      console.warn('Failed to read metadata, creating new:', error.message);
    }
  }
  
  // Update metadata
  metadata = {
    ...metadata,
    uploadId,
    filename,
    totalSize,
    totalChunks,
    lastChunkIndex: chunkIndex,
    lastChunkTime: new Date().toISOString(),
    chunksReceived: (metadata.chunksReceived || 0) + 1
  };
  
  // Write updated metadata
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  return metadata;
}

export default async function handler(req, res) {
  // CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // Parse multipart form data with 5MB limit per chunk
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB chunk limit
      keepExtensions: false,
      multiples: false,
    });

    const [fields, files] = await form.parse(req);
    
    // Extract and validate required fields
    const chunk = files.chunk?.[0];
    const uploadId = fields.uploadId?.[0];
    const chunkIndex = parseInt(fields.chunkIndex?.[0] || '-1');
    const totalChunks = parseInt(fields.totalChunks?.[0] || '0');
    const filename = fields.fileName?.[0]; // Changed from filename to fileName
    const totalSize = parseInt(fields.fileSize?.[0] || '0'); // Changed from totalSize to fileSize

    // Validation
    if (!chunk || !uploadId || chunkIndex < 0 || !filename) {
      return res.status(400).json({ 
        error: 'Missing required fields: chunk, uploadId, chunkIndex, fileName' 
      });
    }

    if (chunk.size === 0) {
      return res.status(400).json({ error: 'Empty chunk received' });
    }

    console.log(`Receiving chunk ${chunkIndex + 1}/${totalChunks} for ${uploadId} (${chunk.size} bytes)`);

    // Create upload directory
    const uploadDir = path.join(TEMP_DIR, uploadId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Read chunk data from formidable temp file
    const chunkBuffer = fs.readFileSync(chunk.filepath);
    
    // Write chunk to disk using stream buffer (memory efficient)
    const chunkPath = writeChunkToDisk(chunkBuffer, uploadDir, chunkIndex);
    
    // Clean up formidable temp file immediately
    fs.unlinkSync(chunk.filepath);
    
    // Update metadata (stateless-safe)
    const metadata = updateMetadata(uploadDir, uploadId, filename, totalSize, totalChunks, chunkIndex);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} stored successfully (${processingTime}ms)`);

    // Return ACK response as required
    return res.status(200).json({
      status: 'ACK',
      uploadId,
      chunkIndex,
      totalChunks,
      chunksReceived: metadata.chunksReceived,
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('Chunk upload error:', error);
    
    return res.status(500).json({
      error: `Chunk upload failed: ${error.message}`,
      processingTime
    });
  }
}
