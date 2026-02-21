/**
 * Test script for DEMO VIDEO ANALYSIS AGENT
 * Use this after configuring the agent in OnDemand Flow Builder
 */

const AGENT_CONFIG = {
  agentId: '696ae690c7d6dfdf7e337e7e',
  organizationId: '696e5c1c994f1554f9f957fa',
  apiKey: 'jqOlQ6yATLnVf3Q4NikwGy7hSHIpyv30'
};

// Test data to send to the agent
const testVideoData = {
  filename: 'test_video.mp4',
  fileSize: 2048576, // 2MB
  duration: 15.5,
  resolution: '1280x720',
  fps: 30,
  metadata: {
    codec: 'H.264',
    bitrate: '2000 kbps',
    created: '2024-01-15T10:30:00Z'
  }
};

async function testDemoVideoAgent() {
  console.log('🧪 Testing DEMO VIDEO ANALYSIS AGENT...');
  console.log('Agent ID:', AGENT_CONFIG.agentId);
  
  // Try different API endpoint patterns
  const endpoints = [
    `https://app.on-demand.io/api/agents/${AGENT_CONFIG.agentId}/execute`,
    `https://api.on-demand.io/agents/${AGENT_CONFIG.agentId}/execute`,
    `https://app.on-demand.io/api/v1/agents/${AGENT_CONFIG.agentId}/run`,
    // Add the actual endpoint URL you get from OnDemand here
    // `https://your-actual-endpoint-from-ondemand.com/execute`
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Trying endpoint: ${endpoint}`);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AGENT_CONFIG.apiKey}`,
        'X-Organization-ID': AGENT_CONFIG.organizationId,
        'Organization-ID': AGENT_CONFIG.organizationId
      };

      console.log('📤 Sending request with headers:', Object.keys(headers));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          input: testVideoData,
          // Alternative input formats to try
          data: testVideoData,
          payload: testVideoData,
          video_data: testVideoData
        })
      });

      console.log(`📥 Response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ SUCCESS! Agent response:');
        console.log(JSON.stringify(result, null, 2));
        
        // Validate expected response structure
        if (result && (result.data || result.output || result.result)) {
          console.log('✅ Agent returned structured data');
          return { success: true, endpoint, result };
        } else {
          console.log('⚠️  Agent responded but format may be unexpected');
          return { success: true, endpoint, result, warning: 'Unexpected format' };
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ All endpoints failed. Please check:');
  console.log('1. Agent is properly configured in OnDemand Flow Builder');
  console.log('2. Webhook output panel is closed');
  console.log('3. Agent is deployed and active');
  console.log('4. API endpoint URL is correct');
  
  return { success: false };
}

// Run the test
testDemoVideoAgent()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 DEMO VIDEO ANALYSIS AGENT is working!');
      console.log('Next steps:');
      console.log('1. Create the remaining 5 agents using the prompts in E-RAKSHA_ONDEMAND_AGENTS_INTEGRATION.txt');
      console.log('2. Test each agent individually');
      console.log('3. Integrate all agents into the prediction pipeline');
    } else {
      console.log('\n🔧 Agent needs configuration. Follow these steps:');
      console.log('1. Go to OnDemand Flow Builder');
      console.log('2. Open agent 696ae690c7d6dfdf7e337e7e');
      console.log('3. Close webhook output panel');
      console.log('4. Add the prompts from the integration file');
      console.log('5. Test with sample data');
      console.log('6. Deploy the agent');
    }
  })
  .catch(error => {
    console.error('Test failed:', error);
  });