/**
 * File Reassembly API - Combine Chunks into Final File
 * 
 * Reassembles uploaded chunks into the complete file using write stream buffer.
 * Memory-efficient approach that doesn't load the full file into memory.
 */

import fs from 'fs';
import path from 'path';

const TEMP_DIR = '/tmp/chunks';
const OUTPUT_DIR = '/tmp/files'; // Final assembled files

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Reassemble chunks into final file using write stream buffer
 * Memory-efficient: processes chunks sequentially without loading full file
 */
function reassembleFile(uploadId, filename) {
  const uploadDir = path.join(TEMP_DIR, uploadId);
  const outputPath = path.join(OUTPUT_DIR, `${uploadId}_${filename}`);
  
  // Get all chunk files sorted by index
  const chunkFiles = fs.readdirSync(uploadDir)
    .filter(file => file.startsWith('chunk_') && file.endsWith('.bin'))
    .sort(); // Already zero-padded, so lexicographic sort works
  
  console.log(`Reassembling ${chunkFiles.length} chunks for ${uploadId}`);
  
  // Create write stream for output file
  const writeStream = fs.createWriteStream(outputPath);
  
  try {
    // Process chunks sequentially using write stream buffer
    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(uploadDir, chunkFile);
      
      // Read chunk and write to output stream (memory efficient)
      const chunkBuffer = fs.readFileSync(chunkPath);
      writeStream.write(chunkBuffer);
      
      // Clean up chunk file immediately after writing
      fs.unlinkSync(chunkPath);
    }
    
    // Close write stream
    writeStream.end();
    
    // Clean up upload directory and metadata
    const metadataPath = path.join(uploadDir, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }
    fs.rmdirSync(uploadDir);
    
    console.log(`File reassembled successfully: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    // Clean up on error
    writeStream.destroy();
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw error;
  }
}

/**
 * Validate that all chunks are present
 */
function validateChunks(uploadDir, expectedChunks) {
  const chunkFiles = fs.readdirSync(uploadDir)
    .filter(file => file.startsWith('chunk_') && file.endsWith('.bin'));
  
  if (chunkFiles.length !== expectedChunks) {
    throw new Error(`Missing chunks. Expected ${expectedChunks}, found ${chunkFiles.length}`);
  }
  
  // Verify chunk sequence is complete (0 to expectedChunks-1)
  const chunkIndices = chunkFiles
    .map(file => parseInt(file.match(/chunk_(\d+)\.bin/)[1]))
    .sort((a, b) => a - b);
  
  for (let i = 0; i < expectedChunks; i++) {
    if (chunkIndices[i] !== i) {
      throw new Error(`Missing chunk ${i}. Found chunks: ${chunkIndices.join(', ')}`);
    }
  }
  
  return true;
}

export default async function handler(req, res) {
  // CORS headers
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
    const { uploadId, filename, totalChunks, totalSize } = req.body;

    // Validation
    if (!uploadId || !filename || !totalChunks) {
      return res.status(400).json({ 
        error: 'Missing required fields: uploadId, filename, totalChunks' 
      });
    }

    const uploadDir = path.join(TEMP_DIR, uploadId);
    
    // Check if upload directory exists
    if (!fs.existsSync(uploadDir)) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Read and validate metadata
    const metadataPath = path.join(uploadDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return res.status(400).json({ error: 'Upload metadata not found' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    // Validate all chunks are present
    validateChunks(uploadDir, totalChunks);
    
    console.log(`Starting reassembly for ${uploadId}: ${filename}`);

    // Reassemble file using write stream buffer
    const outputPath = reassembleFile(uploadId, filename);
    
    // Get final file stats
    const stats = fs.statSync(outputPath);
    const actualSize = stats.size;
    
    // Validate file size matches expected
    if (totalSize && actualSize !== totalSize) {
      console.warn(`Size mismatch: expected ${totalSize}, got ${actualSize}`);
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`Reassembly complete: ${filename} (${actualSize} bytes, ${processingTime}ms)`);

    // Return success response with file info
    return res.status(200).json({
      success: true,
      uploadId,
      filename,
      filePath: outputPath, // For development - in production, return cloud URL
      fileSize: actualSize,
      totalChunks,
      processingTime,
      message: 'File reassembled successfully'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('File reassembly error:', error);
    
    return res.status(500).json({
      error: `File reassembly failed: ${error.message}`,
      processingTime
    });
  }
}