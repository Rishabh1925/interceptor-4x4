/**
 * Test OnDemand.io connection
 * Run this to test if we can connect to OnDemand agents
 */

// Test configuration
const config = {
  organizationId: '696e5c1c994f1554f9f957fa',
  agentId: '696ae690c7d6dfdf7e337e7e'
};

async function testOnDemandConnection() {
  console.log('Testing OnDemand.io connection...');
  
  const endpoints = [
    'https://app.on-demand.io/api/health',
    'https://api.on-demand.io/health',
    'https://app.on-demand.io/api/agents',
    'https://api.on-demand.io/agents',
    `https://app.on-demand.io/api/agents/${config.agentId}`,
    `https://api.on-demand.io/agents/${config.agentId}`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      
      const headers = {
        'X-Organization-ID': config.organizationId,
        'Organization-ID': config.organizationId,
        'Content-Type': 'application/json'
      };

      const response = await fetch(endpoint, {
        method: 'GET',
        headers
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log('Response:', data.substring(0, 200) + '...');
        console.log('✅ SUCCESS - This endpoint works!');
        return { endpoint, success: true };
      } else {
        console.log('❌ Failed');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n🔍 Testing agent execution endpoints...');
  
  const executeEndpoints = [
    `https://app.on-demand.io/api/agents/${config.agentId}/execute`,
    `https://api.on-demand.io/agents/${config.agentId}/execute`,
    `https://app.on-demand.io/api/agents/${config.agentId}/run`,
    `https://api.on-demand.io/agents/${config.agentId}/run`
  ];

  const testInput = {
    video_data: "test",
    filename: "test.mp4",
    perspectives_requested: 1
  };

  for (const endpoint of executeEndpoints) {
    try {
      console.log(`\nTesting execution: ${endpoint}`);
      
      const headers = {
        'X-Organization-ID': config.organizationId,
        'Organization-ID': config.organizationId,
        'Content-Type': 'application/json'
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(testInput)
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log('Response:', data.substring(0, 200) + '...');
        console.log('✅ SUCCESS - Agent execution works!');
        return { endpoint, success: true, type: 'execution' };
      } else if (response.status === 400) {
        console.log('🟡 Bad Request - Endpoint exists but input format wrong');
      } else {
        console.log('❌ Failed');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n❌ No working endpoints found');
  return { success: false };
}

// Run the test
testOnDemandConnection()
  .then(result => {
    console.log('\n=== FINAL RESULT ===');
    console.log(result);
  })
  .catch(error => {
    console.error('Test failed:', error);
  });