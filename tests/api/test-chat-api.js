/**
 * Test OnDemand.io Chat API (correct approach)
 */

const config = {
  apiKey: 'jqOlQ6yATLnVf3Q4NikwGy7hSHIpyv30',
  agentId: '696ae690c7d6dfdf7e337e7e'
};

async function testChatAPI() {
  console.log('💬 Testing OnDemand.io Chat API...');
  
  const endpoint = 'https://api.on-demand.io/chat/v1/sessions/query';
  
  // Test different queries to the DEMO VIDEO ANALYSIS AGENT
  const testQueries = [
    {
      query: "Analyze this video for deepfake detection from 3 perspectives: technical analysis, temporal consistency, and authenticity assessment. Video filename: test.mp4",
      endpointId: config.agentId,
      responseMode: "sync"
    },
    {
      query: "I need you to analyze a video file for deepfake detection. Please provide 3 different perspectives on the video's authenticity.",
      endpointId: config.agentId,
      responseMode: "sync"
    },
    {
      query: "Perform deepfake analysis on uploaded video with multiple perspectives as requested by the user",
      endpointId: config.agentId,
      responseMode: "sync"
    }
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const payload = testQueries[i];
    console.log(`\n🎯 Test ${i + 1}: Testing chat query`);
    console.log('Query:', payload.query);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS! Agent Response:');
        console.log(JSON.stringify(data, null, 2));
        
        return { 
          success: true, 
          endpoint,
          payload,
          response: data 
        };
      } else {
        const errorData = await response.text();
        console.log(`❌ Error: ${errorData}`);
        
        if (response.status === 401) {
          console.log('🔐 Authentication failed - check API key');
        } else if (response.status === 400) {
          console.log('🟡 Bad Request - check payload format');
        }
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }
  }

  return { success: false };
}

// Also test session creation
async function testSessionCreation() {
  console.log('\n📝 Testing session creation...');
  
  const sessionEndpoint = 'https://api.on-demand.io/chat/v1/sessions';
  
  try {
    const response = await fetch(sessionEndpoint, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpointId: config.agentId,
        title: "Deepfake Analysis Session"
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Session created:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorData = await response.text();
      console.log(`❌ Session creation failed: ${errorData}`);
    }
  } catch (error) {
    console.log('❌ Session creation error:', error.message);
  }
  
  return null;
}

// Run all tests
async function runChatTests() {
  console.log('=== OnDemand.io Chat API Testing ===\n');
  
  // Test session creation first
  const session = await testSessionCreation();
  
  // Test chat queries
  const chatResult = await testChatAPI();
  
  console.log('\n=== FINAL RESULTS ===');
  if (chatResult.success) {
    console.log('🎉 SUCCESS! OnDemand Chat API is working!');
    console.log('We can now integrate the DEMO VIDEO ANALYSIS AGENT!');
    console.log('Working endpoint:', chatResult.endpoint);
    console.log('Agent ID:', config.agentId);
  } else {
    console.log('⚠️ Chat API tests failed');
    console.log('This might be due to:');
    console.log('- Incorrect agent ID');
    console.log('- Agent not published/active');
    console.log('- Different API structure needed');
  }
  
  return chatResult;
}

runChatTests().catch(console.error);