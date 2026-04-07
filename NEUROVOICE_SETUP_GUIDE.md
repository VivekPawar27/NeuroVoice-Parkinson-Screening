# NeuroVoice Integration Guide - CNN-LSTM Model Setup

## Overview
This document provides step-by-step instructions to integrate the NeuroVoice CNN-LSTM Keras model from the Google Colab notebook with the frontend and backend applications.

## Key Features
✅ **15-second audio input** support  
✅ **3-second segment analysis** (automatic splitting)  
✅ **CNN-LSTM deep learning model**  
✅ **Mel-spectrogram feature extraction**  
✅ **Multi-segment predictions with aggregate statistics**  
✅ **Clinical insights and risk assessment**  
✅ **Detailed segment-by-segment analysis**  

---

## Part 1: Extract the Model from Google Colab

### Step 1: Train the Model (or Download if Already Trained)
1. Open the provided `NeuroVoice_Model_Training.ipynb` in Google Colab
2. Run all cells in sequence to train the CNN-LSTM model
3. The model will be saved as `best_parkinsons_model.keras` in the Colab runtime

### Step 2: Download the Model File
There are two options:

#### Option A: Direct Download from Colab
```python
# Run this cell in Colab to download the model
from google.colab import files
files.download('best_parkinsons_model.keras')
```

#### Option B: Download from Google Drive (if saved there)
1. In Colab, mount Google Drive:
```python
from google.colab import drive
drive.mount('/content/drive')
```

2. Save the model to Drive:
```python
import shutil
shutil.copy('best_parkinsons_model.keras', '/content/drive/MyDrive/best_parkinsons_model.keras')
```

3. Download from Google Drive directly through the web interface

---

## Part 2: Setup Backend with Model

### Step 1: Install Dependencies
```bash
# Navigate to backend directory
cd neurovoice-backend

# Install Python dependencies (includes TensorFlow for Keras)
pip install -r requirements_ml.txt
```

### Step 2: Place the Model File
1. Create the models directory (if it doesn't exist):
```bash
mkdir -p neurovoice-backend/models
```

2. Place the downloaded `best_parkinsons_model.keras` file in:
```
neurovoice-backend/models/best_parkinsons_model.keras
```

### Step 3: Verify Model Setup
Test if the model loads correctly:
```bash
python -c "
import tensorflow as tf
model_path = 'models/best_parkinsons_model.keras'
model = tf.keras.models.load_model(model_path)
print('✓ Model loaded successfully!')
print(f'Model shape: {model.input_shape}')
"
```

---

## Part 3: Start the Application

### Step 1: Start the Backend Server

#### Option 1: Using the NeuroVoice Backend
```bash
# Terminal 1: Start the new NeuroVoice backend (CNN-LSTM)
cd neurovoice-backend
python app_neurovoice.py
```

Expected output:
```
============================================================
NeuroVoice Backend Server Starting
============================================================
Audio Upload Folder: /path/to/uploads
Models Folder: /path/to/models
============================================================

 * Running on http://0.0.0.0:5000
```

#### Option 2: Using the Updated Startup Script
```bash
# Or use the startup script (if you prefer one-command startup)
python startup.py
```

### Step 2: Start the Frontend Application

```bash
# Terminal 2: Start the React frontend
cd neurovoice-frontend
npm start
```

Frontend will open at: `http://localhost:3000`

---

## Part 4: Test the Integration

### Step 1: Basic Health Check
```bash
# Check if backend is running
curl http://127.0.0.1:5000/

# Get model info
curl http://127.0.0.1:5000/api/model/info

# Get full status
curl http://127.0.0.1:5000/api/status
```

### Step 2: Upload and Test with Audio

1. Open `http://localhost:3000` in your browser
2. Navigate to "Upload Voice Recording" or "Record Voice"
3. Upload a 15+ second audio file (WAV, MP3, WebM, OGG, FLAC, etc.)
4. Click "Analyze" to process the audio

### Step 3: Expected Results
The response should include:
- **Overall Status**: Healthy or Parkinson's Disease
- **Risk Score**: 0-100% probability
- **Risk Level**: Low Risk, Moderate Risk, or High Risk
- **Segment Predictions**: Individual scores for each 3-second segment
- **Aggregate Statistics**: Mean, std, min, max probabilities
- **Clinical Insights**: Detailed analysis and recommendations

---

## Part 5: API Endpoints Reference

### Health & Status Endpoints
```
GET  /                          # Health check
GET  /health                    # Detailed health status
GET  /api/model/info           # Model information
GET  /api/status               # Full application status
```

### Prediction Endpoints
```
POST /api/predict              # Single audio prediction (main endpoint)
POST /api/predict/batch        # Batch prediction for multiple files
```

**Request Format (Prediction)**:
```
POST /api/predict
Content-Type: multipart/form-data

{
  "audio": <audio_file_blob>
}
```

**Response Format**:
```json
{
  "status": "Parkinson's Disease or Healthy",
  "risk_score": 75.5,
  "risk_level": "High Risk",
  "confidence": 0.95,
  "audio_duration": 15.2,
  "segments_analyzed": 5,
  "segment_predictions": [
    {
      "segment": 1,
      "probability_parkinsons": 0.85,
      "status": "Parkinson's Disease",
      "confidence": 0.92
    },
    ...
  ],
  "aggregate_stats": {
    "mean_probability": 0.755,
    "std_probability": 0.045,
    "max_probability": 0.82,
    "min_probability": 0.68,
    "variance": true
  },
  "insights": [
    "High variability across segments - recommend repeat analysis",
    "Segment 1 shows different pattern"
  ],
  "model_used": "CNN-LSTM NeuroVoice",
  "explanation": "Analyzed 5 audio segments. Average probability of Parkinson's: 75.50%. Risk Level: High Risk."
}
```

### Model Management Endpoints
```
POST   /api/model/upload       # Upload new trained model
DELETE /api/model/delete       # Delete current model
```

---

## Part 6: Audio Processing Details

### Audio Requirements
- **Minimum Duration**: 15 seconds recommended
- **Supported Formats**: WAV, MP3, WebM, OGG, FLAC, M4A
- **Sample Rate**: Automatically resampled to 22,050 Hz
- **Maximum File Size**: 100 MB
- **Processing Unit**: 3-second segments

### Processing Pipeline
1. **Input**: 15-second audio file (or longer)
2. **Splitting**: Automatically split into 3-second segments
3. **Preprocessing**: 
   - Resample to 22,050 Hz
   - Extract 128-bin Mel-spectrogram
   - Normalize using min-max scaling
4. **Prediction**: 
   - Pass each Mel-spectrogram through CNN-LSTM model
   - Get probability scores (0-1)
5. **Aggregation**:
   - Calculate mean, std, min, max across segments
   - Determine overall status (threshold: 0.5)
   - Generate risk level based on mean probability

### Risk Level Classification
- **Low Risk**: 0-40% (< 0.4 probability)
- **Moderate Risk**: 40-70% (0.4-0.7 probability)
- **High Risk**: 70-100% (> 0.7 probability)

---

## Part 7: Troubleshooting

### Issue: "Model not loaded" error
```
Solution:
1. Verify model file exists: neurovoice-backend/models/best_parkinsons_model.keras
2. Ensure TensorFlow is installed: pip install tensorflow==2.13.0
3. Check model file is not corrupted by validating:
   python -c "import tensorflow as tf; tf.keras.models.load_model('models/best_parkinsons_model.keras')"
```

### Issue: "Port 5000 already in use"
```
Solution:
# Find and kill the process using port 5000
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### Issue: "Audio format not supported"
```
Solution:
- Ensure audio file is in one of: WAV, MP3, WebM, OGG, FLAC, M4A
- Check file is not corrupted
- Verify file size is under 100 MB
- Try converting to WAV format using FFmpeg:
  ffmpeg -i input.mp3 -acodec pcm_s16le -ar 22050 output.wav
```

### Issue: "Frontend can't connect to backend"
```
Solution:
1. Verify backend server is running on http://127.0.0.1:5000
2. Check CORS is enabled (it is in app_neurovoice.py)
3. Update API endpoint in Upload.js if backend URL changed
4. Check browser console for specific error messages
```

### Issue: "Prediction accuracy seems low"
```
Solution:
1. Ensure audio quality is good (minimize background noise)
2. Verify audio is at least 15 seconds long
3. Check model was trained on similar audio dataset
4. Review clinical insights for segment-specific issues
5. Try multiple recordings for consistency
```

---

## Part 8: Model Information

### Model Architecture
- **Type**: CNN-LSTM (Convolutional Neural Network + LSTM)
- **Input**: MEL-Spectrogram (128 bins × ~259 timeframes × 1 channel)
- **Output**: Binary classification (0=Healthy, 1=Parkinson's)
- **Training Data**: Multi-language Italian and Spanish voice datasets
- **Optimization**: Adam optimizer with binary cross-entropy loss

### Preprocessing Parameters
```python
SR = 22050              # Sample rate (Hz)
DURATION = 3            # Duration per segment (seconds)
SAMPLES_PER_TRACK = 66150  # 22050 * 3
N_MELS = 128            # Mel-frequency bins
```

### Model Performance Metrics (Expected)
- Accuracy: ~95%+ (on training data)
- AUC-ROC: High (close to 1.0)
- Sensitivity: Good for Parkinson's detection
- Specificity: Good for healthy control identification

---

## Part 9: File Structure

```
NeuroVoice-Parkinsons-Screening/
├── NeuroVoice_Model_Training.ipynb      # Main notebook with model training
├── neurovoice-backend/
│   ├── app_neurovoice.py               # NEW: Flask backend for NeuroVoice
│   ├── services/
│   │   ├── neurovoice_service.py       # NEW: CNN-LSTM prediction service
│   │   ├── predict_service_ml.py       # (Old ML service - kept for reference)
│   │   └── __pycache__/
│   ├── models/
│   │   └── best_parkinsons_model.keras # YOUR MODEL GOES HERE
│   ├── uploads/                        # Temporary audio uploads
│   ├── requirements_ml.txt             # Python dependencies (updated with TensorFlow)
│   └── ...
├── neurovoice-frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Upload.js              # UPDATED: Uses /api/predict endpoint
│   │   │   ├── Result.js              # UPDATED: Shows segment analysis
│   │   │   └── ...
│   │   └── ...
│   ├── package.json
│   └── ...
└── ...
```

---

## Part 10: Quick Start Summary

### One-Time Setup
```bash
# 1. Copy model to right location
# models/best_parkinsons_model.keras

# 2. Install backend dependencies
cd neurovoice-backend
pip install -r requirements_ml.txt

# 3. Install frontend dependencies  
cd ../neurovoice-frontend
npm install
```

### Running the Application
```bash
# Terminal 1: Backend
cd neurovoice-backend
python app_neurovoice.py

# Terminal 2: Frontend
cd neurovoice-frontend
npm start
```

### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Status**: http://localhost:5000/api/status

---

## Part 11: Advanced Usage

### Custom Model Upload
```bash
# Upload a different model via API
curl -X POST http://localhost:5000/api/model/upload \
  -F "model=@path/to/best_parkinsons_model.keras"
```

### Batch Processing
```bash
# Process multiple files
curl -X POST http://localhost:5000/api/predict/batch \
  -F "files=@audio1.wav" \
  -F "files=@audio2.wav" \
  -F "files=@audio3.wav"
```

### Direct Python Prediction
```python
# Use the service directly in Python
from services.neurovoice_service import predict_from_audio_file

result = predict_from_audio_file('path/to/audio.wav')
print(f"Status: {result['status']}")
print(f"Risk Score: {result['risk_score']}%")
print(f"Segments: {result['segments_analyzed']}")
```

---

## Support & Notes

- **Model Training**: The model is trained in Google Colab using the provided NeuroVoice_Model_Training.ipynb
- **Data Requirements**: Models work best with clear voice recordings in quiet environments
- **Clinical Use**: This tool is for screening purposes only - consult medical professionals for diagnosis
- **Updates**: Check repository for model updates and improvements

---

## Contact & Feedback

For issues, questions, or improvements:
- Review troubleshooting section above
- Check application logs for error messages
- Verify all dependencies are installed correctly
- Ensure model file is valid and in correct location

---

**Last Updated**: April 5, 2026  
**Version**: 3.0.0 (CNN-LSTM NeuroVoice)
