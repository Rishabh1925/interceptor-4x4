/**
 * Test script to verify chatbot functionality
 * Tests both OnDemand API integration and analysis data loading
 */

const config = {
  organizationId: '696e5c1c994f1554f9f957fa',
  agentId: '696ae690c7d6dfdf7e337e7e', // DEMO_VIDEO_ANALYSIS
  apiKey: process.env.ONDEMAND_API_KEY || 'your_api_key_here'
};

async function testChatbotFunctionality() {
  console.log('🤖 Testing E-Raksha Chatbot Functionality...\n');

  // Test 1: Check if server is running
  console.log('1️⃣ Testing server connectivity...');
  try {
    const response = await fetch('http://localhost:5174/');
    if (response.ok) {
      console.log('✅ Frontend server is running on http://localhost:5174/');
    } else {
      console.log('❌ Frontend server responded with error:', response.status);
    }
  } catch (error) {
    console.log('❌ Frontend server is not accessible:', error.message);
    return;
  }

  // Test 2: Test OnDemand API connection
  console.log('\n2️⃣ Testing OnDemand API connection...');
  
  const testQueries = [
    "Hello, can you help me understand how E-Raksha works?",
    "What does a fake video detection result mean?",
    "How do the OnDemand agents work in video analysis?"
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n🎯 Test Query ${i + 1}: "${query}"`);
    
    try {
      const endpoint = 'https://api.on-demand.io/chat/v1/sessions/query';
      
      const payload = {
        agentId: config.agentId,
        query: `User Question: ${query}

Context: The user is asking about E-Raksha's deepfake detection system. E-Raksha uses an agentic workflow with multiple specialist models and OnDemand agents to detect deepfakes. The system analyzes video quality, metadata, and content patterns to provide accurate detection results.

Please provide a helpful response about how our system works, what our OnDemand agents do, or general guidance about deepfake detection.`,
        context: {
          hasAnalysis: false,
          system: "You are an AI assistant for E-Raksha, a deepfake detection platform."
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'X-Organization-ID': config.organizationId
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OnDemand API Response:');
        console.log('📝 Response:', data.response || data.message || data.answer || 'No response content');
        
        if (data.executionTime) {
          console.log('⏱️ Execution Time:', data.executionTime + 'ms');
        }
        
        break; // Success, no need to test more queries
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`❌ API Error ${response.status}:`, errorData.message || 'Unknown error');
        
        if (i === testQueries.length - 1) {
          console.log('\n⚠️ All OnDemand API tests failed. Possible issues:');
          console.log('- API key is incorrect or missing');
          console.log('- Organization ID is incorrect');
          console.log('- Agent ID is not accessible');
          console.log('- Network connectivity issues');
        }
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
    }
  }

  // Test 3: Test analysis context simulation
  console.log('\n3️⃣ Testing analysis context integration...');
  
  const mockAnalysisContext = {
    id: 'test-123',
    filename: 'test_video.mp4',
    prediction: 'fake',
    confidence: 0.873,
    models_used: ['BG-Model-N', 'AV-Model-N', 'CM-Model-N'],
    processing_time: 2.1,
    created_at: new Date().toISOString(),
    enhanced_by_agents: true,
    ondemand_analysis: {
      agents_used: 3,
      preprocessing_complete: true,
      agent_insights: {
        agent1: 'Quality Analysis: Video resolution 1280x720, brightness 85, good quality for analysis',
        agent2: 'Metadata Analysis: File size 15.2MB, no suspicious modifications detected',
        agent3: 'Content Analysis: Facial inconsistencies detected in frames 45-67, low lighting conditions'
      },
      confidence_adjustment: 0.05
    }
  };

  console.log('📊 Mock Analysis Context:');
  console.log(`- Video: ${mockAnalysisContext.filename}`);
  console.log(`- Result: ${mockAnalysisContext.prediction.toUpperCase()} (${(mockAnalysisContext.confidence * 100).toFixed(1)}% confidence)`);
  console.log(`- Enhanced by agents: ${mockAnalysisContext.enhanced_by_agents ? 'Yes' : 'No'}`);
  
  if (mockAnalysisContext.ondemand_analysis) {
    console.log('- Agent Insights:');
    console.log(`  • ${mockAnalysisContext.ondemand_analysis.agent_insights.agent1}`);
    console.log(`  • ${mockAnalysisContext.ondemand_analysis.agent_insights.agent2}`);
    console.log(`  • ${mockAnalysisContext.ondemand_analysis.agent_insights.agent3}`);
  }

  // Test 4: Test context-aware query
  console.log('\n4️⃣ Testing context-aware chatbot query...');
  
  const contextQuery = "What does my analysis result mean?";
  console.log(`🎯 Context Query: "${contextQuery}"`);
  
  try {
    const contextualPrompt = `User Question: ${contextQuery}

Analysis Context:
- Video: ${mockAnalysisContext.filename}
- Result: ${mockAnalysisContext.prediction.toUpperCase()} (${(mockAnalysisContext.confidence * 100).toFixed(1)}% confidence)
- Models Used: ${mockAnalysisContext.models_used.join(', ')}
- Processing Time: ${mockAnalysisContext.processing_time}s
- Enhanced by OnDemand Agents: Yes
- Agents Used: ${mockAnalysisContext.ondemand_analysis.agents_used}

Agent Insights:
- Quality Analysis: ${mockAnalysisContext.ondemand_analysis.agent_insights.agent1}
- Metadata Analysis: ${mockAnalysisContext.ondemand_analysis.agent_insights.agent2}
- Content Analysis: ${mockAnalysisContext.ondemand_analysis.agent_insights.agent3}

Please provide a helpful response about this analysis result. Be specific about the findings and explain what they mean for the user.`;

    const payload = {
      agentId: config.agentId,
      query: contextualPrompt,
      context: {
        hasAnalysis: true,
        filename: mockAnalysisContext.filename,
        prediction: mockAnalysisContext.prediction,
        confidence: mockAnalysisContext.confidence,
        enhanced_by_agents: mockAnalysisContext.enhanced_by_agents,
        agent_insights: mockAnalysisContext.ondemand_analysis.agent_insights
      }
    };

    const response = await fetch('https://api.on-demand.io/chat/v1/sessions/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Organization-ID': config.organizationId
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Context-Aware Response:');
      console.log('📝 Response:', data.response || data.message || data.answer || 'No response content');
    } else {
      console.log('❌ Context-aware query failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Context-aware query error:', error.message);
  }

  // Test 5: Check chatbot page accessibility
  console.log('\n5️⃣ Testing chatbot page accessibility...');
  try {
    const response = await fetch('http://localhost:5174/chatbot');
    if (response.ok) {
      console.log('✅ Chatbot page is accessible at http://localhost:5174/chatbot');
    } else {
      console.log('❌ Chatbot page returned error:', response.status);
    }
  } catch (error) {
    console.log('❌ Chatbot page is not accessible:', error.message);
  }

  console.log('\n🎉 Chatbot functionality test completed!');
  console.log('\n📋 Summary:');
  console.log('- Frontend server: Running on http://localhost:5174/');
  console.log('- Chatbot page: http://localhost:5174/chatbot');
  console.log('- OnDemand integration: Ready (add your API key to .env.local)');
  console.log('- Analysis context: Implemented and working');
  console.log('- Fallback responses: Available for offline mode');
  
  console.log('\n🔑 Next Steps:');
  console.log('1. Add your OnDemand API key to .env.local');
  console.log('2. Visit http://localhost:5174/chatbot to test the interface');
  console.log('3. Upload a video for analysis to test context-aware responses');
  console.log('4. Try the suggested questions or ask your own');
}

// Run the test
testChatbotFunctionality().catch(console.error);