# Running INTERCEPTOR Locally (Phase 1+2)

This guide shows how to run the Phase 1+2 files locally for development and testing.

## 📋 What's Included

**Phase 1 - Project Setup:**
- Configuration files (package.json, requirements.txt, tsconfig, etc.)
- Project documentation (README.md, PROBLEM_STATEMENT.md)

**Phase 2 - Core Backend:**
- API endpoints (api/ folder)
- Model configurations (config/ folder)
- Training scripts
- Model inspection tools

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
# Install minimal dependencies for local server
pip install -r requirements-local.txt

# OR install full dependencies (if you want to run training scripts)
pip install -r requirements.txt
```

### 2. Run Setup Script

```bash
python setup.py
```

This creates necessary directories:
- `data/raw` and `data/processed`
- `models/checkpoints`
- `logs`
- `outputs`
- `test-videos`

### 3. Start the Local API Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

You should see:
```
🚀 E-Raksha Local Development Server
📁 Upload folder: uploads
🔧 Models configured: 5
🌐 Starting server on http://localhost:5000
```

### 4. Test the API

**Option A: Use the Web Interface**

Open `test_api.html` in your browser:
```bash
# On macOS
open test_api.html

# On Linux
xdg-open test_api.html

# Or just double-click the file
```

**Option B: Use cURL**

```bash
curl -X POST http://localhost:5000/api/predict \
  -F "file=@/path/to/your/video.mp4"
```

**Option C: Use Python**

```python
import requests

url = "http://localhost:5000/api/predict"
files = {"file": open("video.mp4", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

## 📡 API Endpoints

### GET /
Returns API status and available endpoints

```bash
curl http://localhost:5000/
```

### GET /api/health
Health check endpoint

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": 1234567890.123,
  "models_available": ["bg", "av", "cm", "rr", "ll"]
}
```

### POST /api/predict
Analyze video for deepfake detection

```bash
curl -X POST http://localhost:5000/api/predict \
  -F "file=@video.mp4"
```

Response:
```json
{
  "prediction": "fake",
  "confidence": 0.8234,
  "models_used": ["BG-Model-N", "AV-Model-N", "CM-Model-N"],
  "analysis": {
    "confidence_breakdown": {...},
    "routing": {...},
    "model_predictions": {...}
  },
  "processing_time": 0.45
}
```

## 🔧 Configuration

### Agent Configuration

Edit `config/agent_config.yaml` to customize:

```yaml
thresholds:
  high_confidence: 0.85
  medium_confidence: 0.60
  low_confidence: 0.40

routing:
  use_av_model: true
  av_threshold: 0.70
```

### Model Weights

The system uses these model weights (from testing):
- **BG-Model-N**: 54% accuracy, weight 1.0
- **AV-Model-N**: 53% accuracy, weight 1.0
- **CM-Model-N**: 70% accuracy, weight 2.0 (best performer)
- **RR-Model-N**: 56% accuracy, weight 1.0
- **LL-Model-N**: 56% accuracy, weight 1.0

## 📝 Training Scripts

Phase 2 includes training scripts for each specialist model:

```bash
# Train Background/Lighting model
python train_bg_stage1_faceforensics.py

# Train Temporal model
python train_tm_stage1_faceforensics.py

# Train Compression model
python train_cm_stage2_celebdf.py

# Train Re-recording model
python train_rr_stage2_celebdf.py
```

**Note:** These require datasets (FaceForensics++, CelebDF) which are not included.

## 🔍 Model Inspection

Inspect model architectures:

```bash
# Inspect actual architecture
python inspect_actual_architecture.py

# Inspect local models
python inspect_local_models.py

# Detailed model analysis
python detailed_model_analysis.py
```

## 🐛 Troubleshooting

### Port Already in Use

If port 5000 is busy, edit `app.py` and change:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Use different port
```

### CORS Issues

The server has CORS enabled by default. If you still face issues:
```python
# In app.py, CORS is already configured:
CORS(app)  # Allows all origins
```

### File Upload Size

Default max file size is handled by Flask. To increase:
```python
# In app.py, add:
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB
```

## 📦 What's NOT Included (Phase 3+4)

The following are in later phases and not committed yet:
- Frontend React application (src/ folder)
- Docker configuration
- Deployment configs (render.yaml, vercel.json)
- Test videos and results
- Full documentation

## 🎯 Next Steps

After Phase 1+2 is working:
1. **Phase 3**: Frontend application and UI
2. **Phase 4**: Deployment, testing, and documentation

## 💡 Tips

1. **Development Mode**: The Flask server runs in debug mode with auto-reload
2. **Logging**: Check console output for request logs
3. **Testing**: Use `test_api.html` for quick visual testing
4. **API Testing**: Use Postman or curl for detailed API testing

## 🤝 Support

If you encounter issues:
1. Check that Python 3.8+ is installed
2. Verify all dependencies are installed
3. Ensure port 5000 is available
4. Check console output for error messages

---

**Built with ❤️ by Team 4x4 for E-Raksha Hackathon 2026**
