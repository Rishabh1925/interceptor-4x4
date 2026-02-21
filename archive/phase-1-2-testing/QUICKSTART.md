# 🚀 INTERCEPTOR - Quick Start Guide (Phase 1+2)

Get the Phase 1+2 files running locally in under 2 minutes!

## ⚡ Super Quick Start

```bash
# 1. Install dependencies
conda install flask flask-cors -y

# 2. Run setup
python setup.py

# 3. Start server
python app.py
```

That's it! Server runs on `http://localhost:5000`

## 🧪 Test It

### Option 1: Web Interface (Easiest)
1. Open `test_api.html` in your browser
2. Drag & drop a video file
3. Click "Analyze Video"
4. See results!

### Option 2: Command Line
```bash
curl -X POST http://localhost:5000/api/predict \
  -F "file=@your_video.mp4"
```

### Option 3: Python Script
```python
import requests

response = requests.post(
    'http://localhost:5000/api/predict',
    files={'file': open('video.mp4', 'rb')}
)
print(response.json())
```

## 📊 What You Get

The API returns:
- **Prediction**: `fake` or `real`
- **Confidence**: 0.0 to 1.0
- **Models Used**: Which specialist models analyzed the video
- **Analysis Details**: Confidence breakdown, routing decisions, video characteristics
- **Processing Time**: How long it took

Example response:
```json
{
  "prediction": "fake",
  "confidence": 0.7101,
  "models_used": ["BG-Model-N", "CM-Model-N", "AV-Model-N"],
  "analysis": {
    "confidence_breakdown": {...},
    "routing": {...},
    "model_predictions": {...}
  },
  "processing_time": 0.45
}
```

## 🎯 What's Working

✅ **Phase 1 - Project Setup**
- Configuration files
- Documentation
- Dependencies

✅ **Phase 2 - Core Backend**
- API endpoints (`/`, `/api/health`, `/api/predict`)
- Model configurations (5 specialist models)
- Intelligent routing logic
- Training scripts (ready for datasets)
- Model inspection tools

## 🔧 Troubleshooting

**Server won't start?**
```bash
# Make sure Flask is installed
conda install flask flask-cors -y

# Or use pip (with --user flag)
pip install --user flask flask-cors
```

**Port 5000 busy?**
Edit `app.py` line 217:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Change port
```

**Can't find Python?**
```bash
# Check Python version (need 3.8+)
python --version

# If using conda
conda activate base
```

## 📁 Project Structure

```
interceptor-4x4/
├── app.py                  # ← Local Flask server (NEW)
├── test_api.html          # ← Web test interface (NEW)
├── RUN_LOCAL.md           # ← Detailed guide (NEW)
├── QUICKSTART.md          # ← This file (NEW)
│
├── Phase 1 Files:
│   ├── README.md
│   ├── PROBLEM_STATEMENT.md
│   ├── package.json
│   ├── requirements.txt
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── Phase 2 Files:
    ├── api/
    │   ├── predict.js
    │   ├── upload-chunk.js
    │   └── complete-upload.js
    ├── config/
    │   ├── agent_config.yaml
    │   └── av_model_summary.json
    ├── models/
    ├── setup.py
    ├── train_*.py (4 training scripts)
    └── inspect_*.py (3 inspection scripts)
```

## 🎓 Next Steps

1. **Test the API** - Use `test_api.html` or curl
2. **Read the docs** - Check `RUN_LOCAL.md` for details
3. **Explore configs** - Edit `config/agent_config.yaml`
4. **Wait for Phase 3** - Frontend React app coming soon!

## 💡 Pro Tips

- The server auto-reloads when you edit `app.py`
- Check console output for request logs
- Use `test_api.html` for visual testing
- API is CORS-enabled for frontend development

## 🤝 Need Help?

1. Check `RUN_LOCAL.md` for detailed instructions
2. Verify Python 3.8+ is installed
3. Ensure Flask is installed: `python -c "import flask"`
4. Check server logs in terminal

---

**Built by Team 4x4 for E-Raksha Hackathon 2026** 🛡️
