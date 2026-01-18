/**
 * Test the actual API endpoint locally
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testAPIEndpoint() {
  console.log('🧪 Testing API Endpoint');
  console.log('=======================\n');

  try {
    // Create a small test video file
    const testVideoData = Buffer.from('fake video data for testing API endpoint');
    const tempFile = 'temp_test_video.mp4';
    fs.writeFileSync(tempFile, testVideoData);

    console.log('📹 Created test video file:', tempFile);
    console.log('📊 File size:', testVideoData.length, 'bytes');

    // Test the predict-with-agents endpoint
    console.log('\n🚀 Testing /api/predict-with-agents...');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFile), {
      filename: 'test_video.mp4',
      contentType: 'video/mp4'
    });

    const response = await fetch('http://localhost:5173/api/predict-with-agents', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ SUCCESS! API Response:');
      console.log('- Prediction:', result.prediction);
      console.log('- Confidence:', (result.confidence * 100).toFixed(1) + '%');
      console.log('- Models used:', result.models_used?.join(', '));
      console.log('- Enhanced by agents:', result.enhanced_by_agents);
      
      if (result.ondemand_analysis) {
        console.log('- Agents used:', result.ondemand_analysis.agents_used);
        console.log('- Preprocessing complete:', result.ondemand_analysis.preprocessing_complete);
        console.log('- Confidence adjustment:', (result.ondemand_analysis.confidence_adjustment * 100).toFixed(1) + '%');
      }
    } else {
      const errorText = await response.text();
      console.log('\n❌ ERROR! API Response:');
      console.log('Status:', response.status);
      console.log('Error:', errorText);
    }

    // Clean up
    fs.unlinkSync(tempFile);
    console.log('\n🧹 Cleaned up test file');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAPIEndpoint();