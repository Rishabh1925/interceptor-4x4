/**
 * Test OnDemand.io with correct API format from documentation
 */

const config = {
  apiKey: 'jqOlQ6yATLnVf3Q4NikwGy7hSHIpyv30',
  agentId: '696ae690c7d6dfdf7e337e7e'
};

async function testCorrectAPI() {
  console.log('🔧 Testing OnDemand.io with correct API format...');
  
  // First, let's try to create a session or use the agent tools endpoint
  const endpoint = 'https://api.on-demand.io/chat/v1/sessions/query';
  
  const payload = {
    "query": "Analyze this video for deepfake detection from 3 perspectives: technical analysis, temporal consistency, and authenticity assessment. Video filename: test.mp4",
    "endpointId": "predefined-openai-gpt4.1-nano", // Try with predefined endpoint first
    "responseMode": "sync",
    "reasoningMode": "low",
    "agentsIds": [config.agentId], // Include our agent ID
    "onlyFulfillment": false,
    "modelConfigs": {
      "fulfillmentPrompt": "Analyze the video from multiple perspectives as requested",
      "topSequences": [1],
      "temperature": 0.7,
      "topP": 1
    }
  };

  try {
    console.log('📤 Sending request to:', endpoint);
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apiKey': config.apiKey, // Note: apiKey not apikey
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Response:');
      console.log(JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      const errorData = await response.text();
      console.log(`❌ Error Response: ${errorData}`);
      
      // Try alternative approaches
      if (response.status === 401) {
        console.log('\n🔄 Trying alternative authentication...');
        return await tryAlternativeAuth();
      }
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }

  return { success: false };
}

async function tryAlternativeAuth() {
  console.log('🔄 Trying different authentication methods...');
  
  const endpoint = 'https://api.on-demand.io/chat/v1/sessions/query';
  
  const payload = {
    "query": "What is 1 + 1?", // Simple test query
    "endpointId": "predefined-openai-gpt4.1-nano",
    "responseMode": "sync"
  };

  const authMethods = [
    { 'Authorization': `Bearer ${config.apiKey}` },
    { 'X-API-Key': config.apiKey },
    { 'apikey': config.apiKey },
    { 'API-Key': config.apiKey }
  ];

  for (let i = 0; i < authMethods.length; i++) {
    const headers = {
      ...authMethods[i],
      'Content-Type': 'application/json'
    };

    try {
      console.log(`\n🔑 Auth method ${i + 1}:`, Object.keys(headers)[0]);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS with auth method:', Object.keys(headers)[0]);
        console.log('Response:', JSON.stringify(data, null, 2));
        return { success: true, authMethod: Object.keys(headers)[0], data };
      } else if (response.status !== 401) {
        const errorData = await response.text();
        console.log(`🟡 Different error (not auth):`, errorData.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  return { success: false };
}

// Test with our specific agent
async function testWithOurAgent() {
  console.log('\n🎯 Testing with our DEMO VIDEO ANALYSIS AGENT...');
  
  const endpoint = 'https://api.on-demand.io/chat/v1/sessions/query';
  
  const payload = {
    "query": "I need you to analyze a video for deepfake detection. Please provide exactly 3 perspectives: 1) Technical analysis of compression and artifacts, 2) Temporal consistency across frames, 3) Overall authenticity assessment. The video is called test.mp4",
    "endpointId": config.agentId, // Use our agent directly as endpoint
    "responseMode": "sync"
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apiKey': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Our agent responded:');
      console.log(JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      const errorData = await response.text();
      console.log(`❌ Agent test failed: ${errorData}`);
    }
  } catch (error) {
    console.log('❌ Agent test error:', error.message);
  }

  return { success: false };
}

// Run all tests
async function runAllTests() {
  console.log('=== OnDemand.io Correct API Testing ===\n');
  
  const basicTest = await testCorrectAPI();
  const agentTest = await testWithOurAgent();
  
  console.log('\n=== FINAL RESULTS ===');
  if (basicTest.success || agentTest.success) {
    console.log('🎉 SUCCESS! OnDemand API is working!');
    if (agentTest.success) {
      console.log('✅ Our DEMO VIDEO ANALYSIS AGENT is accessible!');
    }
  } else {
    console.log('⚠️ API tests failed');
    console.log('Next steps:');
    console.log('1. Check if API key needs activation');
    console.log('2. Verify agent is published/deployed');
    console.log('3. Check OnDemand documentation for auth requirements');
  }
}

runAllTests().catch(console.error);