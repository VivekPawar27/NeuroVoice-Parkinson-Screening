# NeuroVoice: Parkinson's Disease Detection System

## 🏥 Project Overview

**NeuroVoice** is a complete web-based system for Parkinson's disease screening using voice analysis. It combines a modern React frontend with a Python-based ML backend to provide real-time audio analysis and risk assessment.

### ✨ Key Features
- **Real-time Voice Recording**: Record voice samples directly from the web interface
- **AI-Powered Analysis**: ML model extracts 22 vocal features and predicts Parkinson's risk
- **Instant Results**: Get risk scores, detailed vocal metrics, and clinical interpretation
- **Model Training**: Complete Jupyter notebook for training custom models
- **Batch Processing**: Analyze multiple audio files at once
- **Model Management**: Upload, delete, and monitor ML models via API

---

## 📁 Project Structure

```
NeuroVoice-Parkinsons-Screening/
├── neurovoice-backend/           # Flask ML backend
│   ├── app_ml.py                # Main Flask application
│   ├── config.py                # Configuration
│   ├── requirements.txt          # Python dependencies
│   ├── services/
│   │   ├── predict_service_ml.py # Feature extraction & predictions
│   │   └── __pycache__/
│   ├── models/                  # ML model files (generated/trained)
│   │   ├── parkinsons_model.pkl
│   │   ├── parkinsons_scaler.pkl
│   │   └── parkinsons_features.json
│   ├── uploads/                 # Uploaded audio files
│   └── reports/                 # Prediction reports
│
├── neurovoice-frontend/          # React.js frontend
│   ├── package.json             # Node.js dependencies
│   ├── public/
│   │   └── index.html           # Main HTML
│   └── src/
│       ├── App.js               # Main React component
│       ├── index.js             # Entry point
│       ├── pages/               # Page components
│       │   ├── Home.js          # Home page
│       │   ├── Upload.js        # Audio upload/recording
│       │   ├── Result.js        # Results display
│       │   ├── History.js       # Prediction history
│       │   └── ...
│       └── services/
│           └── api.js           # API calls
│
├── COLAB_MODEL_TRAINING.ipynb    # Model training notebook (Jupyter)
├── README.md                     # This file
└── package.json                  # Root package config
```

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 14+** with npm
- **Virtual Environment** (recommended)

### 1️⃣ Backend Setup

```bash
# Navigate to backend directory
cd neurovoice-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run the backend server
python app_ml.py
```

Backend will start on: **http://localhost:5000**

✓ You should see:
```
 * Running on http://127.0.0.1:5000
 * Restarting with reloader
```

### 2️⃣ Frontend Setup (New Terminal)

```bash
# Navigate to frontend directory
cd neurovoice-frontend

# Install Node.js dependencies
npm install

# Start React development server
npm start
```

Frontend will open at: **http://localhost:3000**

---

## 📊 Using the Application

### Recording & Analysis
1. **Open Frontend**: Go to http://localhost:3000
2. **Navigate to Upload Page**: Click "Voice Recording" 
3. **Record Audio**: 
   - Click "Start Recording"
   - Speak for 5-20 seconds
   - Click "Stop Recording"
4. **Analyze**: Click "Analyze Audio"
5. **View Results**: See risk score, vocal features, and interpretation

### Batch Processing
```bash
curl -X POST http://localhost:5000/predict/batch \
  -F "files=@audio1.wav" \
  -F "files=@audio2.wav"
```

---

## 🧠 ML Model Training

Use the provided **COLAB_MODEL_TRAINING.ipynb** notebook to:
1. Train a new model with your own dataset
2. Extract 22 vocal features automatically
3. Evaluate model performance
4. Export trained models in the correct format

### Steps:
1. Open `COLAB_MODEL_TRAINING.ipynb` in Google Colab or Jupyter
2. Run all cells in order
3. Download the 3 generated files:
   - `parkinsons_model.pkl`
   - `parkinsons_scaler.pkl`
   - `parkinsons_features.json`
4. Copy to `neurovoice-backend/models/`
5. Restart backend server

---

## 🔌 API Endpoints

### Health Check
```bash
GET /
GET /health
```

### Predictions
```bash
# Single audio prediction
POST /predict
Content-Type: multipart/form-data
Body: audio file

# Batch predictions
POST /predict/batch
Content-Type: multipart/form-data
Body: multiple audio files
```

### Model Management
```bash
# Get model status
GET /model/status

# Get model details
GET /model/info

# Upload new model
POST /model/upload
Content-Type: multipart/form-data
Body: model files

# Delete current model
DELETE /model/delete
```

---

## 📈 Features Extracted

The system extracts 22 vocal features:

### MFCC Features (1-13)
- Mel-Frequency Cepstral Coefficients

### Pitch & Modulation (14-16)
- **F0**: Fundamental Frequency
- **Jitter**: Pitch variation
- **Shimmer**: Amplitude variation

### Voice Quality (17-22)
- **NHR**: Noise-to-Harmonics Ratio
- **HNR**: Harmonics-to-Noise Ratio
- **RPDE**: Recurrence Period Density Entropy
- **DFA**: Detrended Fluctuation Analysis
- **PPE**: Pitch Period Entropy
- **ZCR**: Zero Crossing Rate

---

## 🔧 Configuration

### Backend Configuration
```python
UPLOAD_FOLDER = "uploads"
MODELS_FOLDER = "models"
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac', 'wma'}
```

### Frontend Configuration
```javascript
const API_BASE_URL = 'http://127.0.0.1:5000';
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process on Windows
taskkill /PID <PID> /F

# Install missing dependencies
pip install -r requirements.txt --upgrade
```

### Frontend Errors
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install

# Check Node version
node --version  # Should be 14+
```

### No Model Loaded
1. Check `neurovoice-backend/models/` contains all 3 files
2. Restart backend: `python app_ml.py`
3. Test with: `GET http://localhost:5000/health`

### Audio Not Recording
- Check microphone permissions in browser
- Clear browser cache and reload
- Try Chrome (recommended browser)

---

## 📝 Supported Audio Formats

- **WAV** (recommended)
- **MP3**
- **OGG**
- **FLAC**
- **WMA**

**Recommended**: 5-30 seconds, Mono or Stereo, 16-48kHz

---

## 🆚 Risk Level Interpretation

| Risk Score | Level | Interpretation |
|-----------|-------|-----------------|
| 0-30% | Low | Low risk of Parkinson's disease |
| 31-70% | Moderate | Moderate risk - Consult specialist |
| 71-100% | High | High risk - Immediate consultation recommended |

**⚠️ Medical Disclaimer**: This system is a screening tool only and should NOT replace professional medical diagnosis. Always consult healthcare professionals.

---

## ✅ Checklist Before Using

- [ ] Backend server running on http://localhost:5000
- [ ] Frontend server running on http://localhost:3000
- [ ] Model files in `neurovoice-backend/models/`
- [ ] Microphone permissions granted
- [ ] Test recording works
- [ ] Check `/health` endpoint

---

## 🎯 Next Steps

1. **Start Backend**: `cd neurovoice-backend && python app_ml.py`
2. **Start Frontend**: `cd neurovoice-frontend && npm start`
3. **Test System**: Record a voice sample
4. **Train Custom Model**: Run `COLAB_MODEL_TRAINING.ipynb`
5. **Deploy**: Use Gunicorn for production

---

**Version**: 2.0.0  
**Status**: ✅ Full Integration Complete
