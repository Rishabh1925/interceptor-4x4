# Phase 1+2 Testing Files

This folder contains files created to make Phase 1+2 runnable locally for testing.

## 📁 What's in This Folder

### Core Files
- **`app.py`** - Flask API server (runs on port 5000)
- **`test_api.html`** - Web interface for testing
- **`test_server.py`** - Automated test script

### Startup Scripts
- **`start_local.sh`** - Mac/Linux startup script
- **`start_local.bat`** - Windows startup script

### Dependencies
- **`requirements-local.txt`** - Minimal Python dependencies (Flask, flask-cors)

### Documentation
- **`QUICKSTART.md`** - 2-minute quick start guide
- **`RUN_LOCAL.md`** - Detailed setup instructions
- **`PHASE_1_2_STATUS.md`** - Complete status report
- **`LOCAL_SETUP_COMPLETE.txt`** - Summary of what was done

## 🚀 Quick Start

```bash
# From the project root directory
cd "phase 1+2 testing"

# Install dependencies
conda install flask flask-cors -y

# Start server
python app.py
```

Then open `test_api.html` in your browser or visit http://localhost:5000

## ⚠️ Important Notes

1. **These files are NOT committed to git** - They're for local testing only
2. **No existing files were modified** - All files in this folder are new
3. **Run from project root** - The server needs access to `config/` and other Phase 1+2 files
4. **Phase 3+4 not included** - This only tests Phase 1+2 functionality

## 🎯 Purpose

These files allow you to:
- Test Phase 1+2 API endpoints locally
- Verify the backend logic works
- Test video analysis without deploying
- Develop and debug before Phase 3+4

## 📊 What Gets Tested

- ✅ API server startup
- ✅ Health check endpoint
- ✅ Video prediction endpoint
- ✅ Model routing logic
- ✅ Confidence scoring
- ✅ JSON response format

## 🔗 Related Files (Outside This Folder)

The server uses these Phase 1+2 files from the main project:
- `config/agent_config.yaml` - Agent configuration
- `api/*.js` - Original Vercel functions (for reference)
- `requirements.txt` - Full project dependencies

## 💡 Usage Tips

1. **Start server first**: `python app.py`
2. **Test with web UI**: Open `test_api.html`
3. **Run automated tests**: `python test_server.py`
4. **Check logs**: Watch terminal output

---

**Created for**: Phase 1+2 local testing  
**Status**: Ready to use  
**Team**: 4x4 - E-Raksha Hackathon 2026
