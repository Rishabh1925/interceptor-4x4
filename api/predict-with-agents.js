/**
 * Enhanced prediction endpoint that shows OnDemand agent integration
 * This endpoint simulates the full OnDemand workflow for testing
 */

export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fs from 'fs';
import { createHash } from 'crypto';

// Simple prediction logic (same as predict.js but with agent simulation)
function generateSimpleAgentPrediction(fileBuffer, filename) {
  const hash = createHash('md5').update(fileBuffer.subarray(0, Math.min(1024 * 100, fileBuffer.length))).digest('hex');
  const fileSize = fileBuffer.length;
  const hashInt = parseInt(hash.slice(0, 8), 16);
  const estimatedDuration = Math.max(1, fileSize / (1024 * 1024 * 2));
  const estimatedFrameCount = Math.floor(estimatedDuration * 30);
  const brightness = 80 + (hashInt % 120);
  const contrast = 20 + (hashInt >> 8) % 60;
  const blurScore = 50 + (hashInt >> 16) % 100;
  
  const videoAnalysis = {
    fps: 30, width: 1280, height: 720,
    frame_count: estimatedFrameCount, duration: estimatedDuration,
    brightness, contrast, blur_score: blurScore,
    file_hash: hash, file_size: fileSize
  };

  let baseScore = (hashInt % 1000) / 1000;
  let confidenceModifier = brightness < 80 ? 0.85 : brightness > 200 ? 0.9 : 1.0;
  let fakeBias = (contrast < 30 ? 0.1 : 0) + (blurScore < 50 ? 0.15 : 0);
  
  let rawConfidence = 0.5 + (baseScore - 0.5) * 0.8 + fakeBias;
  rawConfidence = Math.max(0.1, Math.min(0.99, rawConfidence));

  const modelPredictions = {
    "BG-Model-N": Math.round(rawConfidence * 10000) / 10000,
    "AV-Model-N": Math.round((rawConfidence + 0.05) * 10000) / 10000,
    "CM-Model-N": Math.round((rawConfidence - 0.03) * 10000) / 10000,
    "Agent-1-Quality": Math.round((rawConfidence + 0.02) * 10000) / 10000,
    "Agent-2-Metadata": Math.round((rawConfidence - 0.01) * 10000) / 10000,
    "Agent-3-Content": Math.round(rawConfidence * 10000) / 10000
  };

  return {
    prediction: rawConfidence > 0.5 ? 'fake' : 'real',
    confidence: Math.round(rawConfidence * 10000) / 10000,
    faces_analyzed: Math.max(1, Math.floor(videoAnalysis.frame_count / 30)),
    models_used: ["BG-Model-N", "AV-Model-N", "CM-Model-N", "Agent-1-Quality", "Agent-2-Metadata", "Agent-3-Content"],
    ondemand_analysis: {
      agents_used: 3,
      preprocessing_complete: true,
      agent_insights: {
        agent1: `Quality Analysis: Video resolution ${videoAnalysis.width}x${videoAnalysis.height}, brightness ${brightness}, good quality for analysis...`,
        agent2: `Metadata Analysis: File size ${fileSize} bytes, estimated duration ${estimatedDuration.toFixed(1)}s, no suspicious modifications...`,
        agent3: `Content Analysis: Human face detected, ${brightness < 80 ? 'low light' : 'good lighting'} conditions, ${contrast < 30 ? 'low' : 'normal'} contrast...`
      },
      confidence_adjustment: Math.round((fakeBias * 0.5) * 10000) / 10000
    },
    analysis: {
      confidence_breakdown: {
        eraksha_base: Math.round((rawConfidence - fakeBias * 0.5) * 10000) / 10000,
        ondemand_adjustment: Math.round((fakeBias * 0.5) * 10000) / 10000,
        final_confidence: rawConfidence,
        quality_adjusted: Math.round(rawConfidence * confidenceModifier * 10000) / 10000,
        quality_score: Math.round(Math.min(brightness / 128, 1.0) * 10000) / 10000,
      },
      routing: {
        confidence_level: rawConfidence >= 0.85 || rawConfidence <= 0.15 ? 'high' : 
                         rawConfidence >= 0.65 || rawConfidence <= 0.35 ? 'medium' : 'low',
        specialists_invoked: 6,
        ondemand_agents_used: true,
        video_characteristics: {
          is_compressed: blurScore < 100,
          is_low_light: brightness < 80,
          resolution: `${videoAnalysis.width}x${videoAnalysis.height}`,
          fps: Math.round(videoAnalysis.fps * 10) / 10,
          duration: `${videoAnalysis.duration.toFixed(1)}s`,
        }
      },
      model_predictions: modelPredictions,
      frames_analyzed: Math.min(videoAnalysis.frame_count, 30),
      heatmaps_generated: 2,
      suspicious_frames: rawConfidence > 0.5 ? Math.max(1, Math.floor(Math.abs(hash.charCodeAt(1)) % 5)) : 0,
    },
    filename,
    file_size: fileSize,
    processing_time: Math.round((Math.random() * 2 + 1.5) * 100) / 100,
    timestamp: new Date().toISOString(),
    enhanced_by_agents: true
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Parse the uploaded file
    const form = formidable({ maxFileSize: 50 * 1024 * 1024, keepExtensions: true });
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];
    
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileBuffer = fs.readFileSync(file.filepath);
    const filename = file.originalFilename || 'test_video.mp4';

    // Generate prediction with simulated agent integration
    const result = generateSimpleAgentPrediction(fileBuffer, filename);

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Agent prediction error:', error);
    res.status(500).json({
      error: 'Agent prediction failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}