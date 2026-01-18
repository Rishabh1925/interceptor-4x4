/**
 * Test endpoint to simulate OnDemand calling our webhook
 * This helps us test the integration without OnDemand
 */

export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fs from 'fs';

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

    const filename = file.originalFilename || 'test_video.mp4';

    // Simulate OnDemand agent analysis results
    const simulatedOnDemandData = {
      'llm-1': {
        output: `TECHNICAL ASSESSMENT for ${filename}:
- Resolution: 1280x720 detected
- Compression Level: medium quality
- Frame Rate: 30fps consistent
- Bitrate Estimate: 1500 kbps
- Duration: ${Math.random() * 10 + 2} seconds

QUALITY METRICS:
- Overall Quality Score: ${(0.7 + Math.random() * 0.3).toFixed(2)}
- Artifacts Detected: minor compression artifacts
- Enhancement Needed: no

FORENSIC SUITABILITY:
- Legal Admissibility: suitable for analysis
- Chain of Custody: maintained
- Recommendations: proceed with deepfake detection`
      },
      'llm-2': {
        output: `METADATA ANALYSIS for ${filename}:
- File Size: ${file.size} bytes
- Creation Timestamp: ${new Date().toISOString()}
- Modification History: no edits detected
- Codec Information: H.264/AAC

DEVICE INFORMATION:
- Recording Device: ${Math.random() > 0.5 ? 'iPhone 12 Pro' : 'Samsung Galaxy S21'}
- Software Used: native camera app
- GPS Coordinates: not present
- Device Settings: auto mode

INTEGRITY ASSESSMENT:
- Metadata Consistency: consistent
- Suspicious Indicators: none detected
- Chain of Custody: unbroken
- Forensic Hash: ${Math.random().toString(36).substring(2, 15)}`
      },
      'llm-3': {
        output: `CONTENT CLASSIFICATION for ${filename}:
- Content Type: human face detected
- Scene Setting: ${Math.random() > 0.5 ? 'indoor' : 'outdoor'}
- Lighting Conditions: ${Math.random() > 0.5 ? 'natural' : 'artificial'} lighting
- Background Type: ${Math.random() > 0.5 ? 'static' : 'dynamic'}

SUBJECT ANALYSIS:
- Face Count: ${Math.floor(Math.random() * 3) + 1} face(s) detected
- Audio Present: yes with good quality
- Motion Complexity: ${Math.random() > 0.5 ? 'low' : 'moderate'}
- Interaction Type: single person

LEGAL ASSESSMENT:
- Legal Relevance: high
- Privacy Concerns: none
- Evidence Quality: strong
- Classification Confidence: ${(0.8 + Math.random() * 0.2).toFixed(2)}`
      }
    };

    // Call our OnDemand webhook with the simulated data
    const webhookResponse = await fetch(`${req.headers.host?.includes('localhost') ? 'http' : 'https'}://${req.headers.host}/api/ondemand-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simulatedOnDemandData)
    });

    const webhookResult = await webhookResponse.json();

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    if (webhookResponse.ok) {
      // Add OnDemand agents to the models used list
      if (webhookResult.result && webhookResult.result.models_used) {
        webhookResult.result.models_used.push(
          'OnDemand-Agent-1 (Quality)',
          'OnDemand-Agent-2 (Metadata)', 
          'OnDemand-Agent-3 (Content)'
        );
      }

      return res.status(200).json({
        success: true,
        message: 'OnDemand simulation completed successfully',
        result: webhookResult.result,
        simulation_note: 'This result includes simulated OnDemand agent analysis'
      });
    } else {
      return res.status(500).json({
        error: 'OnDemand webhook failed',
        details: webhookResult
      });
    }

  } catch (error) {
    console.error('OnDemand test error:', error);
    res.status(500).json({
      error: 'OnDemand test failed',
      message: error.message
    });
  }
}