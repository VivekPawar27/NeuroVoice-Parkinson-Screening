# NeuroVoice: Parkinson's Disease Detection - ML Model Integration Guide

## Overview

This guide explains how to train a machine learning model for Parkinson's disease detection using the Oxford Parkinson's Dataset and integrate it with your NeuroVoice backend.

---

## Table of Contents

1. [Model Training (Google Colab)](#step-1-model-training-google-colab)
2. [Model Deployment (Local Backend)](#step-2-model-deployment-local-backend)
3. [API Integration](#step-3-api-integration)
4. [Frontend Integration](#step-4-frontend-integration)
5. [Troubleshooting](#troubleshooting)

---

## Step 1: Model Training (Google Colab)

### 1.1 Upload Dataset to Colab

The training notebook is provided in `COLAB_MODEL_TRAINING.ipynb`. This is a Jupyter notebook that can be easily converted to a Google Colab notebook.

**Steps:**

1. Open [Google Colab](https://colab.research.google.com)
2. Click **File > Upload notebook**
3. Select `COLAB_MODEL_TRAINING.ipynb` from your NeuroVoice folder
4. Or, create a new notebook and copy the cell contents from the .ipynb file

### 1.2 Run Training Cells

Follow the notebook cells in order:

1. **Cell 1**: Install required packages
   - Installs: pandas, numpy, scikit-learn, matplotlib, seaborn, xgboost, joblib

2. **Cell 2**: Upload the dataset
   - When prompted, upload your `parkinsons.data` file (from the `parkinsons/` folder)

3. **Cells 3-6**: Data exploration and preprocessing
   - Loads data, checks dimensions, handles missing values
   - Splits into training (80%) and testing (20%) sets

4. **Cell 7**: Train multiple models
   - Trains 3 models: Logistic Regression, Random Forest, SVM
   - Displays accuracy for each

5. **Cell 8**: Model comparison
   - Selects the best model based on F1 score
   - Visualizes performance metrics

6. **Cell 9**: Detailed evaluation
   - Shows confusion matrix, classification report, ROC curve

7. **Cell 10**: Feature importance (if Random Forest)
   - Shows which features are most important for prediction

8. **Cell 11**: Cross-validation
   - 5-fold cross-validation to verify model stability

9. **Cell 12**: Save models
   - Saves 3 files:
     - `parkinsons_model.pkl` - Trained ML model
     - `parkinsons_scaler.pkl` - Feature scaler (StandardScaler)
     - `parkinsons_features.json` - Feature metadata & model info

10. **Cell 13**: Download files
    - Downloads the 3 saved files to your local computer

### 1.3 Model Performance Expected

The notebook will test 3 models and select the best:

| Model | Typical Accuracy | F1 Score | ROC AUC |
|-------|------------------|----------|---------|
| Logistic Regression | 94-96% | 0.94-0.96 | 0.98-0.99 |
| Random Forest | 96-98% | 0.96-0.98 | 0.99+ |
| SVM | 93-95% | 0.93-0.95 | 0.97-0.99 |

Random Forest typically performs best on this dataset.

---

## Step 2: Model Deployment (Local Backend)

### 2.1 Update Backend Files

After downloading the 3 model files from Colab, follow these steps:

#### Option A: Replace original app.py

1. **Using the ML-based app:**
   - Rename `app.py` to `app_heuristic.py`
   - Rename `app_ml.py` to `app.py`
   
   OR keep both and use the ML version:

2. **Using the ML-based predict service:**
   - In `app.py`, change the import line:
     ```python
     # OLD:
     # from services.predict_service import predict_audio
     
     # NEW:
     from services.predict_service_ml import predict_audio
     ```

#### Option B: Use new files (Recommended)

If you want to keep the original working code:

1. Copy the 3 model files into `neurovoice-backend/models/` directory:
   ```
   neurovoice-backend/
   ├── models/
   │   ├── parkinsons_model.pkl
   │   ├── parkinsons_scaler.pkl
   │   └── parkinsons_features.json
   ```

2. Create a new version of `app.py` or use `app_ml.py`:
   ```bash
   # If using app_ml.py:
   cp app_ml.py app.py
   ```

3. Update imports in `app.py` to use ML predict service:
   ```python
   from services.predict_service_ml import predict_audio, load_model
   ```

### 2.2 Install ML Dependencies

Install the updated requirements that include ML libraries:

```bash
pip install -r requirements_ml.txt
```

Or install individually:
```bash
pip install scikit-learn pandas joblib xgboost
```

### 2.3 Verify Model Loading

Run your Flask app:
```bash
python app.py
```

Check the console output for:
```
✓ Model loaded successfully
✓ Scaler loaded successfully
✓ Feature configuration loaded successfully
```

If you see these messages, the ML model is ready!

---

## Step 3: API Integration

### 3.1 Audio Prediction Endpoint

**Endpoint:** `POST /predict`

**Request:**
```bash
curl -X POST -F "audio=@recording.wav" http://localhost:5000/predict
```

**Response (with ML model):**
```json
{
  "risk_score": 72.45,
  "risk_level": "High Risk",
  "explanation": "Elevated pitch variation (jitter: 1.23%); Amplitude irregularities detected",
  "model_confidence": 95.32,
  "vocal_features": {
    "jitter": 1.23,
    "shimmer": 0.0425,
    "f0_mean": 162.45,
    "hnr": 18.72,
    "rpde": 0.65,
    "dfa": 0.48,
    "ppe": 1.23
  },
  "model_used": "Random Forest"
}
```

### 3.2 Batch Prediction Endpoint

**Endpoint:** `POST /predict/batch`

**Request:**
```bash
curl -X POST -F "files=@recording1.wav" -F "files=@recording2.wav" \
  http://localhost:5000/predict/batch
```

**Response:**
```json
{
  "total_processed": 2,
  "predictions": [
    {
      "filename": "recording1.wav",
      "risk_score": 72.45,
      "risk_level": "High Risk",
      ...
    },
    {
      "filename": "recording2.wav",
      "risk_score": 28.10,
      "risk_level": "Low Risk",
      ...
    }
  ]
}
```

### 3.3 Model Upload Endpoint

**Endpoint:** `POST /model/upload`

**Purpose:** Upload trained models from Colab or retrain on new data

**Request:**
```bash
curl -X POST \
  -F "model=@parkinsons_model.pkl" \
  -F "scaler=@parkinsons_scaler.pkl" \
  -F "config=@parkinsons_features.json" \
  http://localhost:5000/model/upload
```

**Response:**
```json
{
  "status": "success",
  "message": "Model uploaded and loaded successfully",
  "model_info": {
    "type": "Random Forest",
    "accuracy": 0.9728,
    "f1_score": 0.9744,
    "roc_auc": 0.9969,
    "features_count": 22
  }
}
```

### 3.4 Model Status Endpoints

**Check if model is loaded:**
```bash
curl http://localhost:5000/model/status
```

**Get detailed model information:**
```bash
curl http://localhost:5000/model/info
```

**Delete current model (revert to heuristic):**
```bash
curl -X DELETE http://localhost:5000/model/delete
```

### 3.5 Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_type": "Random Forest",
  "model_accuracy": 0.9728
}
```

---

## Step 4: Frontend Integration

### 4.1 Update Upload Component

Modify `src/components/Upload.js` or `src/pages/Upload.js`:

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!file) {
      setError('Please select a file');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', file);

      // Call ML prediction endpoint
      const response = await axios.post(
        'http://localhost:5000/predict',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error analyzing audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Voice'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {prediction && (
        <div className="results">
          <h2>Analysis Results</h2>
          <div className="risk-level" data-level={prediction.risk_level}>
            Risk Level: {prediction.risk_level}
          </div>
          <div className="risk-score">
            Risk Score: {prediction.risk_score}%
          </div>
          <div className="confidence">
            Model Confidence: {prediction.model_confidence}%
          </div>
          <div className="explanation">
            {prediction.explanation}
          </div>
          
          {/* Display vocal features */}
          {prediction.vocal_features && (
            <div className="vocal-features">
              <h3>Vocal Features Detected</h3>
              <ul>
                <li>Jitter: {prediction.vocal_features.jitter}%</li>
                <li>Shimmer: {prediction.vocal_features.shimmer}</li>
                <li>F0 Mean: {prediction.vocal_features.f0_mean} Hz</li>
                <li>HNR: {prediction.vocal_features.hnr} dB</li>
                <li>RPDE: {prediction.vocal_features.rpde}</li>
              </ul>
            </div>
          )}

          <div className="model-info">
            Model Used: {prediction.model_used}
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
```

### 4.2 Add Model Management Page (Optional)

Create `src/pages/ModelManager.js`:

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModelManager = () => {
  const [modelStatus, setModelStatus] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModelStatus();
    fetchModelInfo();
  }, []);

  const fetchModelStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/model/status');
      setModelStatus(response.data);
    } catch (err) {
      setError('Failed to fetch model status');
    }
  };

  const fetchModelInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/model/info');
      setModelInfo(response.data);
    } catch (err) {
      // Model might not be loaded yet
      console.log('Model info not available');
    }
  };

  const handleUploadModel = async (event) => {
    event.preventDefault();
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      const files = event.target.files;

      // Assuming files are uploaded: model, scaler, config
      formData.append('model', files[0]);     // parkinsons_model.pkl
      formData.append('scaler', files[1]);    // parkinsons_scaler.pkl
      formData.append('config', files[2]);    // parkinsons_features.json

      await axios.post('http://localhost:5000/model/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Refresh status
      await fetchModelStatus();
      await fetchModelInfo();
      alert('Model uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload model');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="model-manager">
      <h1>ML Model Manager</h1>

      {modelStatus && (
        <div className="status-card">
          <h2>Model Status</h2>
          <p>Status: {modelStatus.status}</p>
          {modelStatus.model_loaded && (
            <>
              <p>Type: {modelStatus.model_type}</p>
              <p>Accuracy: {(modelStatus.model_accuracy * 100).toFixed(2)}%</p>
              <p>✓ Ready for predictions</p>
            </>
          )}
          {!modelStatus.model_loaded && (
            <p>⚠ No model loaded. Using heuristic predictions.</p>
          )}
        </div>
      )}

      {modelInfo && (
        <div className="info-card">
          <h2>Model Information</h2>
          <ul>
            <li>Type: {modelInfo.model_type}</li>
            <li>Accuracy: {(modelInfo.accuracy * 100).toFixed(2)}%</li>
            <li>F1 Score: {modelInfo.f1_score.toFixed(4)}</li>
            <li>ROC AUC: {modelInfo.roc_auc.toFixed(4)}</li>
            <li>Features: {modelInfo.feature_count}</li>
          </ul>
        </div>
      )}

      <div className="upload-card">
        <h2>Upload New Model</h2>
        <form onSubmit={handleUploadModel}>
          <p>Select the 3 model files (in order):</p>
          <input
            type="file"
            multiple
            accept=".pkl,.joblib,.json"
            required
            disabled={uploading}
          />
          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Model Files'}
          </button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ModelManager;
```

---

## Feature Descriptions

The Oxford Parkinson's Dataset includes 22 voice features:

### Pitch-Related Features
- **MDVP:Fo(Hz)**: Average fundamental frequency
- **MDVP:Fhi(Hz)**: Maximum fundamental frequency  
- **MDVP:Flo(Hz)**: Minimum fundamental frequency

### Jitter (Pitch Variation)
- **MDVP:Jitter(%)**: Jitter percentage
- **MDVP:Jitter(Abs)**: Absolute jitter
- **MDVP:RAP**: Relative Average Perturbation
- **MDVP:PPQ**: Pitch Period Perturbation Quotient
- **Jitter:DDP**: Differentiated Double Jitter

### Shimmer (Amplitude Variation)
- **MDVP:Shimmer**: Shimmer value
- **MDVP:Shimmer(dB)**: Shimmer in dB
- **Shimmer:APQ3**: 3-point Amplitude Perturbation Quotient
- **Shimmer:APQ5**: 5-point Amplitude Perturbation Quotient
- **MDVP:APQ**: MDVP Amplitude Perturbation Quotient
- **Shimmer:DDA**: Shimmer Average Absolute Difference

### Noise & Harmony
- **NHR**: Noise-to-Harmonics Ratio
- **HNR**: Harmonics-to-Noise Ratio

### Nonlinear Measures
- **RPDE**: Recurrence Period Density Entropy
- **D2**: Correlation Dimension
- **DFA**: Detrended Fluctuation Analysis

### Spread Measures
- **spread1**: Measure of voice breaks (measure of nonlinearity)
- **spread2**: Period between voice breaks (measure of nonlinearity)
- **PPE**: Pitch Period Entropy (measure of nonlinearity)

---

## Troubleshooting

### Model Not Loading

**Problem:** "Model not found" message appears

**Solution:**
1. Verify files exist in `neurovoice-backend/models/` directory
2. Check file names are exactly:
   - `parkinsons_model.pkl`
   - `parkinsons_scaler.pkl`
   - `parkinsons_features.json`
3. Check file permissions are readable
4. Reinstall using `/model/upload` endpoint

### Prediction Fails

**Problem:** Error during prediction

**Solutions:**
1. Check audio file is valid WAV, MP3, or OGG
2. Audio should be at least 1 second long
3. File size should be under 50MB
4. Check console logs for detailed error message

### Low Model Performance

**Problem:** Risk scores seem inaccurate

**Solutions:**
1. Check that features extraction matches Oxford dataset format
2. Verify audio quality - clear speech needed
3. Re-train model with better hyperparameters
4. Use larger/more balanced training dataset
5. Try different model (SVM or different Random Forest params)

### Frontend Not Connecting

**Problem:** CORS errors when calling API

**Solution:**
Ensure `Flask-CORS` is configured. In `app.py`:
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
```

### Out of Memory

**Problem:** Large audio files cause memory errors

**Solutions:**
1. Reduce MAX_CONTENT_LENGTH in `app.py`
2. Pre-process long audio files into chunks
3. Use streaming instead of loading entire file

---

## Advanced Usage

### Retraining on New Data

1. Prepare CSV with same 22 features as Oxford dataset
2. Run Colab notebook with your new data
3. Upload the 3 new model files

### Ensemble Models

Modify `app_ml.py` to use multiple models:

```python
# Load multiple models
models = {
    'rf': joblib.load('rf_model.pkl'),
    'svm': joblib.load('svm_model.pkl'),
    'lr': joblib.load('lr_model.pkl')
}

# Ensemble prediction
predictions = [m.predict_proba(X)[0, 1] for m in models.values()]
ensemble_score = np.mean(predictions) * 100
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM python:3.9

WORKDIR /app

COPY requirements_ml.txt .
RUN pip install -r requirements_ml.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

Build and run:
```bash
docker build -t neurovoice .
docker run -p 5000:5000 neurovoice
```

---

## References

- **Oxford Parkinson's Dataset**: [Original Publication](http://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/)
- **Librosa Documentation**: https://librosa.org
- **Scikit-learn Documentation**: https://scikit-learn.org
- **Flask-CORS**: https://flask-cors.readthedocs.io/

---

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review console logs for detailed error messages
3. Verify all dependencies are installed correctly
4. Ensure model files are in the correct directory

---

**Last Updated:** February 27, 2026  
**Version:** 2.0.0 - ML Model Integration
