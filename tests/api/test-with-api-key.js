/**
 * Test OnDemand.io with actual API key
 */

const config = {
  apiKey: 'jqOlQ6yATLnVf3Q4NikwGy7hSHIpyv30',
  organizationId: '696e5c1c994f1554f9f957fa',
  agentId: '696ae690c7d6dfdf7e337e7e'
};

async function testWithApiKey() {
  console.log('🔑 Testing OnDemand.io with API key...');
  
  // Test different API endpoints with proper authentication
  const endpoints = [
    'https://api.on-demand.io/health',
    'https://api.on-demand.io/v1/health', 
    'https://app.on-demand.io/api/health',
    'https://api.on-demand.io/agents',
    'https://api.on-demand.io/v1/agents',
    `https://api.on-demand.io/agents/${config.agentId}`,
    `https://api.on-demand.io/v1/agents/${config.agentId}`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint}`);
      
      const headers = {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-API-Key': config.apiKey,
        'X-Organization-ID': config.organizationId,
        'Content-Type': 'application/json'
      };

      const response = await fetch(endpoint, {
        method: 'GET',
        headers
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('✅ JSON Response:', JSON.stringify(data, null, 2));
          return { endpoint, success: true, data };
        } else {
          const text = await response.text();
          console.log('📄 Text Response:', text.substring(0, 200) + '...');
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }
  }

  console.log('\n🚀 Testing agent execution endpoints...');
  
  const executeEndpoints = [
    `https://api.on-demand.io/agents/${config.agentId}/execute`,
    `https://api.on-demand.io/v1/agents/${config.agentId}/execute`,
    `https://api.on-demand.io/agents/${config.agentId}/run`,
    `https://api.on-demand.io/v1/agents/${config.agentId}/run`,
    `https://api.on-demand.io/agents/${config.agentId}/invoke`,
    `https://api.on-demand.io/v1/agents/${config.agentId}/invoke`
  ];

  const testPayloads = [
    {
      input: "Analyze this video for deepfake detection from 3 perspectives",
      video_data: "test_video_base64_data_here",
      filename: "test.mp4"
    },
    {
      prompt: "Analyze video for deepfake detection",
      data: {
        video: "test_data",
        perspectives_requested: 3
      }
    },
    {
      message: "Analyze this video for deepfake detection from 3 perspectives",
      context: {
        video_file: "test.mp4",
        analysis_type: "deepfake_detection"
      }
    }
  ];

  for (const endpoint of executeEndpoints) {
    console.log(`\n🎯 Testing execution: ${endpoint}`);
    
    for (let i = 0; i < testPayloads.length; i++) {
      const payload = testPayloads[i];
      console.log(`  Payload ${i + 1}:`, JSON.stringify(payload, null, 2));
      
      try {
        const headers = {
          'Authorization': `Bearer ${config.apiKey}`,
          'X-API-Key': config.apiKey,
          'X-Organization-ID': config.organizationId,
          'Content-Type': 'application/json'
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        console.log(`  Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('  ✅ SUCCESS! Agent Response:', JSON.stringify(data, null, 2));
            return { 
              endpoint, 
              success: true, 
              payload,
              response: data 
            };
          } else {
            const text = await response.text();
            console.log('  ✅ SUCCESS! Text Response:', text.substring(0, 300));
          }
        } else if (response.status === 400) {
          const errorData = await response.text();
          console.log('  🟡 Bad Request (endpoint exists):', errorData.substring(0, 200));
        } else if (response.status === 401) {
          console.log('  🔐 Unauthorized - API key might be invalid');
        } else if (response.status === 403) {
          console.log('  🔐 Forbidden - insufficient permissions');
        } else if (response.status === 404) {
          console.log('  ❌ Not found');
        } else {
          const errorData = await response.text();
          console.log(`  ❌ Error ${response.status}:`, errorData.substring(0, 200));
        }
      } catch (error) {
        console.log('  ❌ Network Error:', error.message);
      }
    }
  }

  return { success: false };
}

// Run the test
testWithApiKey()
  .then(result => {
    console.log('\n=== FINAL RESULT ===');
    if (result.success) {
      console.log('🎉 SUCCESS! OnDemand API is working!');
      console.log('Working endpoint:', result.endpoint);
      console.log('Working payload:', result.payload);
    } else {
      console.log('⚠️ Could not establish working API connection');
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });