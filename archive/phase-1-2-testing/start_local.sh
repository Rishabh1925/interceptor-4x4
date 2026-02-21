#!/bin/bash

# E-Raksha Local Server Startup Script
# Phase 1+2 Development Server

echo "================================================"
echo "🛡️  INTERCEPTOR - E-Raksha Local Server"
echo "================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if ! python3 -c "import flask" 2>/dev/null; then
    echo "⚠️  Flask not found. Installing dependencies..."
    pip install -r requirements-local.txt
else
    echo "✅ Dependencies installed"
fi
echo ""

# Run setup if needed
if [ ! -d "data" ]; then
    echo "🔧 Running initial setup..."
    python3 setup.py
    echo ""
fi

# Start the server
echo "🚀 Starting local API server..."
echo "📍 Server will be available at: http://localhost:5000"
echo "🌐 Open test_api.html in your browser to test"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================================"
echo ""

python3 app.py
