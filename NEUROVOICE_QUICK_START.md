# NeuroVoice Backend - Quick Start (2 Steps)

## Prerequisites
- Python 3.8+
- pip

## Quick Setup

### Step 1: Download Model
1. Run the notebook: `NeuroVoice_Model_Training.ipynb` in Google Colab
2. Download `best_parkinsons_model.keras` from Colab
3. Place in: `neurovoice-backend/models/best_parkinsons_model.keras`

### Step 2: Install & Run

```bash
# Install dependencies
cd neurovoice-backend
pip install -r requirements_ml.txt

# Run the backend
python app_neurovoice.py
```

Server starts at: `http://127.0.0.1:5000`

## Frontend

```bash
cd neurovoice-frontend
npm install  # (only first time)
npm start
```

Frontend at: `http://localhost:3000`

## Test API

```bash
# Check if running
curl http://127.0.0.1:5000/

# Get model info
curl http://127.0.0.1:5000/api/model/info

# Upload audio
curl -X POST http://127.0.0.1:5000/api/predict \
  -F "audio=@your_audio.wav"
```

## Audio Input Format
- **Minimum**: 15 seconds
- **Formats**: WAV, MP3, WebM, OGG, FLAC, M4A
- **Processing**: Auto-split into 3-sec segments

## Expected Output
```json
{
  "status": "Parkinson's Disease or Healthy",
  "risk_score": 75.5,
  "risk_level": "High Risk",
  "segments_analyzed": 5,
  "segment_predictions": [...],
  "aggregate_stats": {...}
}
```

---

**See NEUROVOICE_SETUP_GUIDE.md for detailed documentation**
