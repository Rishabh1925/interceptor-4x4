/**
 * Test script for OnDemand webhook integration
 * Tests the webhook endpoint locally before deployment
 */

const testWebhookPayload = {
  preprocessing_data: {
    agent1_output: `TECHNICAL ASSESSMENT:
- Resolution: 1280x720
- Compression Level: medium
- Frame Rate: 30fps detected
- Bitrate Estimate: 1500 kbps
- Duration: 5.2 seconds

QUALITY METRICS:
- Overall Quality Score: 0.85
- Artifacts Detected: minor compression artifacts, slight noise
- Enhancement Needed: no

FORENSIC SUITABILITY:
- Legal Admissibility: suitable
- Chain of Custody: maintained
- Recommendations: proceed with deepfake analysis`,

    agent2_output: `FILE PROPERTIES:
- File Size: 2.1MB
- Creation Timestamp: 2026-01-18T10:30:00Z
- Modification History: no edits detected
- Codec Information: H.264/AAC

DEVICE INFORMATION:
- Recording Device: iPhone 12 Pro
- Software Used: native camera app
- GPS Coordinates: not present
- Device Settings: auto mode, portrait orientation

INTEGRITY ASSESSMENT:
- Metadata Consistency: consistent
- Suspicious Indicators: none detected
- Chain of Custody: unbroken
- Forensic Hash: a1b2c3d4e5f6...`,

    agent3_output: `CONTENT ANALYSIS:
- Content Type: human face
- Scene Setting: indoor
- Lighting Conditions: natural/artificial mixed
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
- Classification Confidence: 0.92`,

    combined_timestamp: new Date().toISOString(),
    preprocessing_complete: true
  },
  video_file_url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
  case_id: "test-case-" + Date.now(),
  user_email: "test@interceptor.dev"
};

async function testWebhookLocally() {
  console.log('🧪 Testing OnDemand Webhook Integration');
  console.log('=====================================\n');

  try {
    const response = await fetch('http://localhost:5173/api/ondemand-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWebhookPayload)
    });

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: Webhook processed successfully!');
      console.log('\n📊 Analysis Results:');
      console.log('- Prediction:', result.result.prediction);
      console.log('- Confidence:', (result.result.confidence * 100).toFixed(1) + '%');
      console.log('- Models Used:', result.result.models_used.join(', '));
      console.log('- OnDemand Agents Used:', result.result.ondemand_analysis.agents_used);
      console.log('- Processing Time:', result.result.processing_time + 's');
      
      if (result.result.ondemand_analysis.agent_insights) {
        console.log('\n🤖 OnDemand Agent Insights:');
        console.log('- Agent 1:', result.result.ondemand_analysis.agent_insights.agent1?.substring(0, 100) + '...');
        console.log('- Agent 2:', result.result.ondemand_analysis.agent_insights.agent2?.substring(0, 100) + '...');
        console.log('- Agent 3:', result.result.ondemand_analysis.agent_insights.agent3?.substring(0, 100) + '...');
      }
      
      console.log('\n🎯 Confidence Breakdown:');
      console.log('- E-Raksha Base:', result.result.analysis.confidence_breakdown.eraksha_base);
      console.log('- OnDemand Adjustment:', result.result.analysis.confidence_breakdown.ondemand_adjustment);
      console.log('- Final Confidence:', result.result.analysis.confidence_breakdown.final_confidence);
      
    } else {
      console.log('\n❌ ERROR: Webhook failed');
      console.log('Error:', result.error);
      console.log('Message:', result.message);
    }

  } catch (error) {
    console.log('\n💥 NETWORK ERROR:', error.message);
    console.log('\nMake sure your local server is running:');
    console.log('npm run dev');
  }
}

async function testWebhookProduction() {
  console.log('\n🌐 Testing Production Webhook');
  console.log('=============================\n');

  try {
    // Replace with your actual Vercel URL
    const productionUrl = 'https://interceptor-4x4.vercel.app/api/ondemand-webhook';
    
    const response = await fetch(productionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWebhookPayload)
    });

    console.log('📡 Production Response Status:', response.status);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Production webhook working!');
      console.log('Prediction:', result.result.prediction);
      console.log('Confidence:', (result.result.confidence * 100).toFixed(1) + '%');
    } else {
      console.log('❌ Production webhook failed:', result.error);
    }

  } catch (error) {
    console.log('💥 Production test failed:', error.message);
  }
}

// Run tests
console.log('Starting OnDemand Webhook Tests...\n');

// Test locally first
testWebhookLocally()
  .then(() => {
    console.log('\n' + '='.repeat(50));
    return testWebhookProduction();
  })
  .then(() => {
    console.log('\n🎉 All tests completed!');
  })
  .catch(error => {
    console.error('Test suite failed:', error);
  });