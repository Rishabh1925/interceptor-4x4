#!/usr/bin/env python
"""
Quick test script for INTERCEPTOR API
Tests all endpoints and displays results
"""

import requests
import json
import sys

API_URL = "http://localhost:5000"

def test_root():
    """Test root endpoint"""
    print("Testing GET / ...")
    try:
        response = requests.get(f"{API_URL}/")
        print(f"✅ Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def test_health():
    """Test health endpoint"""
    print("\nTesting GET /api/health ...")
    try:
        response = requests.get(f"{API_URL}/api/health")
        print(f"✅ Status: {response.status_code}")
        data = response.json()
        print(f"   Status: {data['status']}")
        print(f"   Models: {', '.join(data['models_available'])}")
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def test_predict():
    """Test predict endpoint with dummy file"""
    print("\nTesting POST /api/predict ...")
    try:
        # Create a dummy video file
        dummy_content = b"fake video data for testing"
        files = {'file': ('test.mp4', dummy_content, 'video/mp4')}
        
        response = requests.post(f"{API_URL}/api/predict", files=files)
        print(f"✅ Status: {response.status_code}")
        
        data = response.json()
        print(f"   Prediction: {data['prediction'].upper()}")
        print(f"   Confidence: {data['confidence']:.2%}")
        print(f"   Models Used: {', '.join(data['models_used'])}")
        print(f"   Processing Time: {data['processing_time']}s")
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def main():
    print("=" * 60)
    print("🛡️  INTERCEPTOR API Test Suite")
    print("=" * 60)
    print(f"Testing API at: {API_URL}\n")
    
    # Check if server is running
    try:
        requests.get(API_URL, timeout=2)
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running!")
        print("\nPlease start the server first:")
        print("  $ python app.py")
        sys.exit(1)
    
    # Run tests
    results = []
    results.append(("Root Endpoint", test_root()))
    results.append(("Health Check", test_health()))
    results.append(("Predict Endpoint", test_predict()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! API is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
