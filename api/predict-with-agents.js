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
  
  // Enhanced video analysis
  const brightness = 60 + (hashInt % 140);
  const contrast = 15 + (hashInt >> 8) % 70;
  const blurScore = 30 + (hashInt >> 16) % 140;
  const compressionLevel = (hashInt >> 12) % 100;
  const motionComplexity = (hashInt >> 4) % 100;
  const audioQuality = 50 + (hashInt >> 20) % 50;
  
  const videoAnalysis = {
    fps: 30, width: 1280, height: 720,
    frame_count: estimatedFrameCount, duration: estimatedDuration,
    brightness, contrast, blur_score: blurScore,
    compression_level: compressionLevel,
    motion_complexity: motionComplexity,
    audio_quality: audioQuality,
    file_hash: hash, file_size: fileSize
  };

  // Simulate agent insights
  const agentInsights = {
    agent1: `Quality Analysis: Video resolution ${videoAnalysis.width}x${videoAnalysis.height}, brightness ${brightness}, compression ${compressionLevel}% ${compressionLevel > 60 ? 'high compression detected' : 'good quality'}`,
    agent2: `Metadata Analysis: File size ${fileSize} bytes, duration ${estimatedDuration.toFixed(1)}s, audio quality ${audioQuality}% ${audioQuality < 60 ? 'audio sync issues possible' : 'good audio sync'}`,
    agent3: `Content Analysis: Motion complexity ${motionComplexity}%, lighting ${brightness < 70 ? 'low light conditions' : brightness > 180 ? 'overexposed' : 'good lighting'}, ${contrast < 25 ? 'low contrast detected' : 'normal contrast'}`
  };

  // Enhanced specialist model predictions
  const MODELS = {
    "bg": { "name": "BG-Model-N", "accuracy": 0.54, "weight": 1.0, "specialty": "background_analysis" },
    "av": { "name": "AV-Model-N", "accuracy": 0.53, "weight": 1.0, "specialty": "audiovisual_sync" },
    "cm": { "name": "CM-Model-N", "accuracy": 0.70, "weight": 2.0, "specialty": "compression_artifacts" },
    "rr": { "name": "RR-Model-N", "accuracy": 0.56, "weight": 1.0, "specialty": "resolution_consistency" },
    "ll": { "name": "LL-Model-N", "accuracy": 0.56, "weight": 1.0, "specialty": "lighting_analysis" },
    "tm": { "name": "TM-Model-N", "accuracy": 0.62, "weight": 1.5, "specialty": "temporal_consistency" },
  };

  let baseScore = (hashInt % 1000) / 1000;
  let confidenceModifier = 1.0;
  
  // Quality-based adjustments
  if (brightness < 80) confidenceModifier *= 0.85;
  if (brightness > 200) confidenceModifier *= 0.9;
  if (blurScore > 120) confidenceModifier *= 0.8;
  if (compressionLevel > 80) confidenceModifier *= 0.75;

  const modelPredictions = {};
  let weightedSum = 0, totalWeight = 0;
  
  Object.entries(MODELS).forEach(([key, info]) => {
    let modelConf = baseScore;
    
    // Each model has different sensitivities
    switch(info.specialty) {
      case "background_analysis":
        modelConf += (motionComplexity > 70 ? 0.15 : -0.1);
        modelConf += (blurScore > 100 ? 0.1 : 0);
        break;
      case "audiovisual_sync":
        modelConf += (audioQuality < 60 ? 0.2 : -0.05);
        modelConf += (motionComplexity > 50 ? 0.1 : -0.1);
        break;
      case "compression_artifacts":
        modelConf += (compressionLevel > 60 ? 0.25 : -0.15);
        modelConf += (blurScore > 80 ? 0.15 : 0);
        break;
      case "resolution_consistency":
        modelConf += (blurScore > 90 ? 0.2 : -0.1);
        modelConf += (compressionLevel > 70 ? 0.1 : 0);
        break;
      case "lighting_analysis":
        modelConf += (brightness < 70 || brightness > 180 ? 0.2 : -0.1);
        modelConf += (contrast < 25 ? 0.15 : 0);
        break;
      case "temporal_consistency":
        modelConf += (motionComplexity > 80 ? 0.2 : -0.05);
        modelConf += (estimatedFrameCount > 100 ? 0.1 : 0);
        break;
    }
    
    // Add agent-based adjustments
    const agentText = JSON.stringify(agentInsights).toLowerCase();
    if (info.specialty === "compression_artifacts" && agentText.includes('compression')) {
      modelConf += agentText.includes('high') ? 0.15 : -0.1;
    }
    if (info.specialty === "audiovisual_sync" && agentText.includes('audio')) {
      modelConf += agentText.includes('issues') ? 0.2 : -0.05;
    }
    if (info.specialty === "lighting_analysis" && agentText.includes('lighting')) {
      modelConf += agentText.includes('low light') || agentText.includes('overexposed') ? 0.15 : -0.05;
    }
    
    // Add randomness for variation
    const modelVar = ((hashInt >> (key.charCodeAt(0) % 8)) % 200 - 100) / 1000;
    modelConf += modelVar;
    
    modelConf = Math.max(0.05, Math.min(0.95, modelConf));
    modelPredictions[info.name] = Math.round(modelConf * 10000) / 10000;
    
    const weight = info.weight * info.accuracy * (0.5 + modelConf * 0.5);
    weightedSum += modelConf * weight;
    totalWeight += weight;
  });

  const finalConfidence = Math.max(0.05, Math.min(0.95, weightedSum / totalWeight));

  // Determine which models to use
  const modelsUsed = ["BG-Model-N"];
  if (finalConfidence < 0.85 && finalConfidence > 0.15) {
    if (brightness < 80) modelsUsed.push("LL-Model-N");
    if (blurScore > 80 || compressionLevel > 60) modelsUsed.push("CM-Model-N");
    modelsUsed.push("AV-Model-N");
    if (finalConfidence > 0.3 && finalConfidence < 0.7) {
      modelsUsed.push("RR-Model-N");
      if (motionComplexity > 70) modelsUsed.push("TM-Model-N");
    }
  }
  
  // Add agent models
  modelsUsed.push("Agent-1-Quality", "Agent-2-Metadata", "Agent-3-Content");

  return {
    prediction: finalConfidence > 0.5 ? 'fake' : 'real',
    confidence: Math.round(finalConfidence * 10000) / 10000,
    faces_analyzed: Math.max(1, Math.floor(videoAnalysis.frame_count / 30)),
    models_used: modelsUsed,
    ondemand_analysis: {
      agents_used: 3,
      preprocessing_complete: true,
      agent_insights: agentInsights,
      confidence_adjustment: Math.round((finalConfidence - baseScore) * 10000) / 10000
    },
    analysis: {
      confidence_breakdown: {
        eraksha_base: Math.round(baseScore * 10000) / 10000,
        ondemand_adjustment: Math.round((finalConfidence - baseScore) * 10000) / 10000,
        final_confidence: finalConfidence,
        quality_adjusted: Math.round(finalConfidence * confidenceModifier * 10000) / 10000,
        quality_score: Math.round(Math.min(brightness / 128, 1.0) * 10000) / 10000,
      },
      routing: {
        confidence_level: finalConfidence >= 0.85 || finalConfidence <= 0.15 ? 'high' : 
                         finalConfidence >= 0.65 || finalConfidence <= 0.35 ? 'medium' : 'low',
        specialists_invoked: modelsUsed.length,
        ondemand_agents_used: true,
        video_characteristics: {
          is_compressed: compressionLevel > 60,
          is_low_light: brightness < 80,
          is_high_motion: motionComplexity > 70,
          resolution: `${videoAnalysis.width}x${videoAnalysis.height}`,
          fps: Math.round(videoAnalysis.fps * 10) / 10,
          duration: `${videoAnalysis.duration.toFixed(1)}s`,
          compression_level: `${compressionLevel}%`,
          audio_quality: `${audioQuality}%`,
        }
      },
      model_predictions: modelPredictions,
      frames_analyzed: Math.min(videoAnalysis.frame_count, 30),
      heatmaps_generated: 2,
      suspicious_frames: finalConfidence > 0.5 ? Math.max(1, Math.floor(Math.abs(hash.charCodeAt(1)) % 5)) : 0,
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