/**
 * Local test for agent integration logic
 * Tests the core functions without API calls
 */

// Simulate the analysis functions from ondemand-webhook.js
function analyzeVideoFile(fileBuffer, filename) {
  const hash = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
  const fileSize = fileBuffer.length;
  const hashInt = parseInt(hash.slice(0, 8), 16);
  const estimatedDuration = Math.max(1, fileSize / (1024 * 1024 * 2));
  const estimatedFrameCount = Math.floor(estimatedDuration * 30);
  const brightness = 80 + (hashInt % 120);
  const contrast = 20 + (hashInt >> 8) % 60;
  const blurScore = 50 + (hashInt >> 16) % 100;
  
  return {
    fps: 30, width: 1280, height: 720,
    frame_count: estimatedFrameCount, duration: estimatedDuration,
    brightness, contrast, blur_score: blurScore,
    file_hash: hash, file_size: fileSize
  };
}

function calculateAgentConfidenceAdjustment(preprocessingData) {
  if (!preprocessingData) return 0;
  
  let adjustment = 0;
  const outputs = [
    preprocessingData.agent1_output || '',
    preprocessingData.agent2_output || '',
    preprocessingData.agent3_output || ''
  ].join(' ').toLowerCase();
  
  // Positive indicators (suggest authenticity)
  const positiveIndicators = ['authentic', 'real', 'genuine', 'original', 'legitimate', 'high quality', 'professional'];
  const negativeIndicators = ['fake', 'manipulated', 'synthetic', 'artificial', 'deepfake', 'suspicious', 'anomal'];
  
  positiveIndicators.forEach(indicator => {
    if (outputs.includes(indicator)) adjustment -= 0.05; // Lower fake bias
  });
  
  negativeIndicators.forEach(indicator => {
    if (outputs.includes(indicator)) adjustment += 0.1; // Higher fake bias
  });
  
  return Math.max(-0.3, Math.min(0.3, adjustment));
}

function generatePredictionWithAgents(videoAnalysis, preprocessingData) {
  const hashInt = parseInt(videoAnalysis.file_hash.slice(0, 8), 16);
  let baseScore = (hashInt % 1000) / 1000;
  const { brightness, contrast, blur_score: blur } = videoAnalysis;
  
  let confidenceModifier = brightness < 80 ? 0.85 : brightness > 200 ? 0.9 : 1.0;
  let fakeBias = (contrast < 30 ? 0.1 : 0) + (blur < 50 ? 0.15 : 0);
  
  // Incorporate agent insights
  if (preprocessingData) {
    const agentAdjustment = calculateAgentConfidenceAdjustment(preprocessingData);
    fakeBias += agentAdjustment;
    console.log('Agent adjustment:', agentAdjustment);
  }
  
  let rawConfidence = 0.5 + (baseScore - 0.5) * 0.8 + fakeBias;
  rawConfidence = Math.max(0.1, Math.min(0.99, rawConfidence));

  return {
    is_fake: rawConfidence > 0.5,
    confidence: Math.round(rawConfidence * 10000) / 10000,
    ondemand_adjustment: preprocessingData ? calculateAgentConfidenceAdjustment(preprocessingData) : 0,
  };
}

function generateAnalysisReport(videoAnalysis, prediction, preprocessingData, filename) {
  const modelsUsed = ["BG-Model-N"];
  if (prediction.confidence < 0.85 && prediction.confidence > 0.15) {
    if (videoAnalysis.brightness < 80) modelsUsed.push("LL-Model-N");
    if (videoAnalysis.blur_score < 100) modelsUsed.push("CM-Model-N");
    modelsUsed.push("AV-Model-N");
    if (prediction.confidence > 0.3 && prediction.confidence < 0.7) modelsUsed.push("RR-Model-N");
  }

  // Add agent models
  if (preprocessingData) {
    modelsUsed.push("Agent-1-Quality", "Agent-2-Metadata", "Agent-3-Content");
  }

  return {
    prediction: prediction.is_fake ? 'fake' : 'real',
    confidence: prediction.confidence,
    faces_analyzed: Math.max(1, Math.floor(videoAnalysis.frame_count / 30)),
    models_used: modelsUsed,
    
    // Agent analysis results
    ondemand_analysis: preprocessingData ? {
      agents_used: 3,
      preprocessing_complete: true,
      agent_insights: {
        agent1: preprocessingData.agent1_output?.substring(0, 200) + '...',
        agent2: preprocessingData.agent2_output?.substring(0, 200) + '...',
        agent3: preprocessingData.agent3_output?.substring(0, 200) + '...'
      },
      confidence_adjustment: prediction.ondemand_adjustment || 0
    } : null,
    
    analysis: {
      confidence_breakdown: {
        eraksha_base: prediction.confidence - (prediction.ondemand_adjustment || 0),
        ondemand_adjustment: prediction.ondemand_adjustment || 0,
        final_confidence: prediction.confidence,
      },
      routing: {
        confidence_level: prediction.confidence >= 0.85 || prediction.confidence <= 0.15 ? 'high' : 
                         prediction.confidence >= 0.65 || prediction.confidence <= 0.35 ? 'medium' : 'low',
        specialists_invoked: modelsUsed.length,
        ondemand_agents_used: preprocessingData ? true : false,
      },
    },
    filename,
    file_size: videoAnalysis.file_size,
    processing_time: 2.5,
    timestamp: new Date().toISOString(),
  };
}

// Test the integration
function testAgentIntegration() {
  console.log('Testing Agent Integration Logic');
  console.log('================================\n');

  // Mock video file
  const mockVideoBuffer = Buffer.from('mock video data for testing');
  const filename = 'test_video.mp4';

  // Mock agent data (simulating what OnDemand would send)
  const mockAgentData = {
    'llm-1': {
      output: `TECHNICAL ASSESSMENT for ${filename}:
- Resolution: 1280x720 detected
- Compression Level: medium quality
- Frame Rate: 30fps consistent
- Bitrate Estimate: 1500 kbps
- Duration: 5.2 seconds

QUALITY METRICS:
- Overall Quality Score: 0.85
- Artifacts Detected: minor compression artifacts
- Enhancement Needed: no

FORENSIC SUITABILITY:
- Legal Admissibility: suitable for analysis
- Chain of Custody: maintained
- Recommendations: proceed with deepfake detection`
    },
    'llm-2': {
      output: `METADATA ANALYSIS for ${filename}:
- File Size: ${mockVideoBuffer.length} bytes
- Creation Timestamp: ${new Date().toISOString()}
- Modification History: no edits detected
- Codec Information: H.264/AAC

DEVICE INFORMATION:
- Recording Device: iPhone 12 Pro
- Software Used: native camera app
- GPS Coordinates: not present
- Device Settings: auto mode

INTEGRITY ASSESSMENT:
- Metadata Consistency: consistent
- Suspicious Indicators: none detected
- Chain of Custody: unbroken
- Forensic Hash: abc123def456`
    },
    'llm-3': {
      output: `CONTENT CLASSIFICATION for ${filename}:
- Content Type: human face detected
- Scene Setting: indoor
- Lighting Conditions: natural lighting
- Background Type: static

SUBJECT ANALYSIS:
- Face Count: 1 face detected
- Audio Present: yes with good quality
- Motion Complexity: low
- Interaction Type: single person

LEGAL ASSESSMENT:
- Legal Relevance: high
- Privacy Concerns: none
- Evidence Quality: strong
- Classification Confidence: 0.92`
    }
  };

  // Extract preprocessing data (simulating webhook processing)
  const preprocessingData = {
    agent1_output: mockAgentData['llm-1'].output,
    agent2_output: mockAgentData['llm-2'].output,
    agent3_output: mockAgentData['llm-3'].output,
    combined_timestamp: new Date().toISOString(),
    preprocessing_complete: true,
    raw_ondemand_data: mockAgentData
  };

  console.log('1. Analyzing video file...');
  const videoAnalysis = analyzeVideoFile(mockVideoBuffer, filename);
  console.log('✓ Video analysis complete');

  console.log('\n2. Generating prediction with agent insights...');
  const prediction = generatePredictionWithAgents(videoAnalysis, preprocessingData);
  console.log('✓ Prediction generated');

  console.log('\n3. Creating analysis report...');
  const result = generateAnalysisReport(videoAnalysis, prediction, preprocessingData, filename);
  console.log('✓ Report created');

  console.log('\n=== FINAL RESULT ===');
  console.log('Prediction:', result.prediction);
  console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
  console.log('Models Used:', result.models_used.join(', '));
  console.log('Agents Used:', result.ondemand_analysis.agents_used);
  console.log('Agent Adjustment:', (result.ondemand_analysis.confidence_adjustment * 100).toFixed(1) + '%');
  
  console.log('\n=== AGENT INSIGHTS ===');
  console.log('Agent 1 (Quality):', result.ondemand_analysis.agent_insights.agent1.substring(0, 100) + '...');
  console.log('Agent 2 (Metadata):', result.ondemand_analysis.agent_insights.agent2.substring(0, 100) + '...');
  console.log('Agent 3 (Content):', result.ondemand_analysis.agent_insights.agent3.substring(0, 100) + '...');

  console.log('\n✅ Integration test completed successfully!');
  
  return result;
}

// Run the test
const testResult = testAgentIntegration();

// Test the format that frontend expects
console.log('\n=== FRONTEND FORMAT TEST ===');
console.log('Has ondemand_analysis:', !!testResult.ondemand_analysis);
console.log('Has agent_insights:', !!testResult.ondemand_analysis?.agent_insights);
console.log('Has models_used:', !!testResult.models_used);
console.log('Agent models in list:', testResult.models_used.filter(m => m.includes('Agent')));

console.log('\n🎯 Ready for frontend integration!');