/**
 * Test OnDemand.io agent execution
 */

const config = {
  organizationId: '696e5c1c994f1554f9f957fa',
  agentId: '696ae690c7d6dfdf7e337e7e'
};

async function testAgentExecution() {
  console.log('Testing OnDemand.io agent execution...');
  
  // Test different execution patterns
  const executeEndpoints = [
    `https://app.on-demand.io/api/agents/${config.agentId}/execute`,
    `https://app.on-demand.io/api/v1/agents/${config.agentId}/execute`,
    `https://app.on-demand.io/agents/${config.agentId}/execute`,
    `https://app.on-demand.io/api/agents/${config.agentId}/run`,
    `https://app.on-demand.io/api/agents/${config.agentId}/invoke`,
    `https://app.on-demand.io/rag-agents/${config.agentId}/execute`
  ];

  const testInputs = [
    // Simple test
    {
      input: "test video analysis",
      perspectives_requested: 1
    },
    // Video analysis format
    {
      video_data: "test_video_data",
      filename: "test.mp4",
      perspectives_requested: 3,
      analysis_type: "deepfake_detection_perspectives"
    },
    // Minimal format
    {
      prompt: "Analyze this video for deepfake detection from 3 perspectives",
      data: "test_data"
    }
  ];

  for (const endpoint of executeEndpoints) {
    console.log(`\n🔍 Testing endpoint: ${endpoint}`);
    
    for (let i = 0; i < testInputs.length; i++) {
      const testInput = testInputs[i];
      console.log(`  Input format ${i + 1}:`, JSON.stringify(testInput, null, 2));
      
      try {
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

        console.log(`  Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.text();
          console.log('  ✅ SUCCESS! Response:', data.substring(0, 300) + '...');
          return { 
            endpoint, 
            success: true, 
            inputFormat: testInput,
            response: data 
          };
        } else if (response.status === 400) {
          const errorData = await response.text();
          console.log('  🟡 Bad Request (endpoint exists):', errorData.substring(0, 200));
        } else if (response.status === 401 || response.status === 403) {
          console.log('  🔐 Authentication issue');
        } else if (response.status === 404) {
          console.log('  ❌ Not found');
        } else {
          const errorData = await response.text();
          console.log(`  ❌ Error: ${response.status}`, errorData.substring(0, 200));
        }
      } catch (error) {
        console.log('  ❌ Network Error:', error.message);
      }
    }
  }

  console.log('\n❌ No successful agent execution found');
  return { success: false };
}

// Also test getting agent info
async function testAgentInfo() {
  console.log('\n🔍 Testing agent info endpoints...');
  
  const infoEndpoints = [
    `https://app.on-demand.io/api/agents/${config.agentId}`,
    `https://app.on-demand.io/agents/${config.agentId}`,
    `https://app.on-demand.io/rag-agents/${config.agentId}`
  ];

  for (const endpoint of infoEndpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      
      const headers = {
        'X-Organization-ID': config.organizationId,
        'Organization-ID': config.organizationId
      };

      const response = await fetch(endpoint, {
        method: 'GET',
        headers
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log('✅ Agent info found:', data.substring(0, 300) + '...');
        return { endpoint, success: true, data };
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

// Run tests
async function runAllTests() {
  console.log('=== OnDemand.io Agent Testing ===\n');
  
  const agentInfo = await testAgentInfo();
  const execution = await testAgentExecution();
  
  console.log('\n=== FINAL RESULTS ===');
  console.log('Agent Info:', agentInfo);
  console.log('Agent Execution:', execution);
  
  if (execution.success) {
    console.log('\n🎉 SUCCESS! We can execute OnDemand agents!');
    console.log('Working endpoint:', execution.endpoint);
    console.log('Working input format:', execution.inputFormat);
  } else {
    console.log('\n⚠️  Could not execute agents. May need different authentication or input format.');
  }
}

runAllTests().catch(console.error);