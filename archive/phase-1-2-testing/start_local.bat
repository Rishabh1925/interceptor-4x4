@echo off
REM E-Raksha Local Server Startup Script (Windows)
REM Phase 1+2 Development Server

echo ================================================
echo 🛡️  INTERCEPTOR - E-Raksha Local Server
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

echo ✅ Python found
python --version
echo.

REM Check if dependencies are installed
echo 📦 Checking dependencies...
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Flask not found. Installing dependencies...
    pip install -r requirements-local.txt
) else (
    echo ✅ Dependencies installed
)
echo.

REM Run setup if needed
if not exist "data" (
    echo 🔧 Running initial setup...
    python setup.py
    echo.
)

REM Start the server
echo 🚀 Starting local API server...
echo 📍 Server will be available at: http://localhost:5000
echo 🌐 Open test_api.html in your browser to test
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

python app.py
