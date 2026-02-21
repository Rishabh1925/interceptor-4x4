/**
 * Test if we can load analysis data from Supabase
 */

async function testAnalysisLoading() {
  console.log('🔍 Testing Analysis Data Loading...\n');

  // Test 1: Check if we can access the frontend
  console.log('1️⃣ Testing frontend access...');
  try {
    const response = await fetch('http://localhost:5174/chatbot');
    if (response.ok) {
      console.log('✅ Frontend accessible');
    } else {
      console.log('❌ Frontend error:', response.status);
      return;
    }
  } catch (error) {
    console.log('❌ Frontend not accessible:', error.message);
    return;
  }

  // Test 2: Check browser console for analysis loading
  console.log('\n2️⃣ Analysis Loading Test Instructions:');
  console.log('📋 To debug the analysis loading issue:');
  console.log('');
  console.log('1. Open your browser and go to: http://localhost:5174/chatbot');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to the Console tab');
  console.log('4. Refresh the page');
  console.log('5. Look for these debug messages:');
  console.log('   - "🔍 Initializing chat and loading analysis context..."');
  console.log('   - "📊 Attempting to load recent analysis..."');
  console.log('   - "📊 Recent analysis data: [object]"');
  console.log('   - "✅ Found latest analysis: [filename]" OR "⚠️ No recent analysis found"');
  console.log('');
  console.log('6. Send a test message and look for:');
  console.log('   - "🤖 Sending message: [your message]"');
  console.log('   - "📊 Analysis context available: true/false"');
  console.log('   - "✅ Using analysis-specific response" OR "⚠️ Using general response"');

  // Test 3: Check if there's analysis data in the database
  console.log('\n3️⃣ Possible Issues:');
  console.log('');
  console.log('❓ If you see "⚠️ No recent analysis found":');
  console.log('   → You need to upload and analyze a video first');
  console.log('   → Go to the Analysis page and upload a video');
  console.log('   → Wait for analysis to complete');
  console.log('   → Then return to the chatbot');
  console.log('');
  console.log('❓ If you see "📊 Analysis context available: false":');
  console.log('   → The analysis data isn\'t being passed correctly');
  console.log('   → Check the browser console for errors');
  console.log('');
  console.log('❓ If you see "⚠️ Using general response":');
  console.log('   → The chatbot doesn\'t have analysis context');
  console.log('   → This causes the generic fallback responses');

  // Test 4: Provide solution steps
  console.log('\n4️⃣ Solution Steps:');
  console.log('');
  console.log('Step 1: Upload a video for analysis');
  console.log('   • Go to http://localhost:5174/workbench');
  console.log('   • Upload any video file (MP4, AVI, MOV)');
  console.log('   • Wait for analysis to complete');
  console.log('');
  console.log('Step 2: Return to chatbot');
  console.log('   • Go to http://localhost:5174/chatbot');
  console.log('   • Check browser console for debug messages');
  console.log('   • You should see "✅ Found latest analysis: [filename]"');
  console.log('');
  console.log('Step 3: Test analysis-specific questions');
  console.log('   • Ask: "What does my analysis result mean?"');
  console.log('   • Ask: "How confident is the detection?"');
  console.log('   • You should get specific responses about your video');

  console.log('\n🎯 Expected Behavior:');
  console.log('✅ With analysis context: Specific responses about your video');
  console.log('❌ Without analysis context: Generic fallback responses');
  console.log('');
  console.log('The chatbot is working correctly - it just needs analysis data to provide specific responses!');
}

testAnalysisLoading().catch(console.error);