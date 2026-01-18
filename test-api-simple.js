/**
 * Simple API test using curl
 */

import { execSync } from 'child_process';
import fs from 'fs';

// Create a test file
const testData = Buffer.from('test video data for API endpoint testing');
fs.writeFileSync('test_video.mp4', testData);

console.log('🧪 Testing API with curl...');

try {
  const result = execSync(`curl -X POST -F "file=@test_video.mp4" http://localhost:5173/api/predict-with-agents`, {
    encoding: 'utf8',
    timeout: 30000
  });
  
  console.log('✅ API Response:');
  console.log(result);
} catch (error) {
  console.error('❌ API Error:');
  console.error(error.message);
  if (error.stdout) console.log('STDOUT:', error.stdout);
  if (error.stderr) console.log('STDERR:', error.stderr);
}

// Clean up
fs.unlinkSync('test_video.mp4');
console.log('🧹 Cleaned up test file');