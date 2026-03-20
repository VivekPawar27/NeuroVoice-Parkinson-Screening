# ✅ NeuroVoice ML Setup - Complete Checklist

## Pre-Setup Verification

- [ ] You have access to Google Colab
- [ ] You have VS Code and terminal open
- [ ] You have Python 3.8+ installed locally
- [ ] You have pip/conda available
- [ ] You can access the parkinsons/ folder with parkinsons.data file

---

## Phase 1: Model Training in Google Colab (⏱️ 10 minutes)

### Step 1.1: Prepare Google Colab
- [ ] Open https://colab.research.google.com
- [ ] Click **File** → **Upload notebook**
- [ ] Select `COLAB_MODEL_TRAINING.ipynb` from your project
- [ ] Notebook is open and ready in Colab

### Step 1.2: Execute Training Cells
- [ ] **Cell 1**: Run `pip install ...` for packages
  - [ ] Output shows all packages installed
  - [ ] No import errors

- [ ] **Cell 2**: Upload parkinsons.data file
  - [ ] Click file upload button
  - [ ] Select `parkinsons/parkinsons.data`
  - [ ] File uploaded successfully (see file path in cell output)

- [ ] **Cells 3-6**: Run data exploration
  - [ ] Can see dataset shape (197, 24)
  - [ ] Can see class distribution
  - [ ] No missing values reported

- [ ] **Cell 7**: Run model training
  - [ ] Logistic Regression trains (1-2 min)
  - [ ] Random Forest trains (2-3 min)
  - [ ] SVM trains (2-3 min)
  - [ ] All three accuracies printed

- [ ] **Cell 8**: Run model comparison
  - [ ] Results table shows accuracy, precision, recall, f1
  - [ ] Best model selected (usually Random Forest)
  - [ ] Visualizations display

- [ ] **Cell 9**: Run evaluation
  - [ ] Classification report shows
  - [ ] Confusion matrix displays
  - [ ] ROC curve plots

- [ ] **Cell 10**: Feature importance (if Random Forest)
  - [ ] Top 10 features listed
  - [ ] Feature importance chart shows

- [ ] **Cell 11**: Cross-validation
  - [ ] 5 fold CV scores display
  - [ ] Mean CV score shown (~0.95+)

- [ ] **Cell 12**: Save models
  - [ ] `parkinsons_model.pkl` saved ✓
  - [ ] `parkinsons_scaler.pkl` saved ✓
  - [ ] `parkinsons_features.json` saved ✓
  - [ ] Confirmation messages shown

- [ ] **Cell 13**: Download files
  - [ ] Files appear in your Downloads folder:
    - [ ] `parkinsons_model.pkl` (10-50 MB)
    - [ ] `parkinsons_scaler.pkl` (~5 KB)
    - [ ] `parkinsons_features.json` (~1 KB)

### Step 1.3: Verify Training
- [ ] Model accuracy is 94%+ (shown in output)
- [ ] F1 score is 0.94+ (shown in output)
- [ ] All 3 files downloaded successfully
- [ ] Files are readable in your Downloads folder

---

## Phase 2: Backend Preparation (⏱️ 5 minutes)

### Step 2.1: Create Models Directory
- [ ] Open terminal/PowerShell
- [ ] Navigate to project: `cd NeuroVoice-Parkinsons-Screening/neurovoice-backend`
- [ ] Create directory: `mkdir models`
  - [ ] Folder `models/` now exists in backend directory

### Step 2.2: Copy Model Files
- [ ] Copy downloaded files to `models/` directory:
  - [ ] `parkinsons_model.pkl` → `neurovoice-backend/models/`
  - [ ] `parkinsons_scaler.pkl` → `neurovoice-backend/models/`
  - [ ] `parkinsons_features.json` → `neurovoice-backend/models/`
- [ ] Verify files exist:
  ```bash
  ls models/  # or dir models/ on Windows
  ```
  - [ ] All 3 files show in directory listing

### Step 2.3: Check New Files Exist
- [ ] Verify `predict_service_ml.py` exists in `services/`
- [ ] Verify `app_ml.py` exists in backend root
- [ ] Verify `requirements_ml.txt` exists in backend root
- [ ] All files created successfully ✓

---

## Phase 3: Install Dependencies (⏱️ 3 minutes)

### Step 3.1: Install Python Packages
- [ ] In terminal, navigate to backend directory
- [ ] Run: `pip install -r requirements_ml.txt`
- [ ] Wait for installation to complete
- [ ] Check for errors:
  - [ ] No error messages
  - [ ] All packages show "Successfully installed"

### Step 3.2: Verify Installation
- [ ] Run Python check:
  ```bash
  python -c "import sklearn, joblib, pandas, numpy, librosa; print('✓ All packages OK')"
  ```
  - [ ] Output shows: `✓ All packages OK`

---

## Phase 4: Update Backend (⏱️ 2 minutes)

### Step 4.1: Choose Your Approach

**Option A: Use New ML App (RECOMMENDED)**
- [ ] Backup original: `cp app.py app_original.py`
- [ ] Use ML version: `cp app_ml.py app.py`
- [ ] Verify imports are correct in app.py:
  ```python
  from services.predict_service_ml import predict_audio, load_model
  ```

**Option B: Update Existing App**
- [ ] Open `app.py` in editor
- [ ] Find line: `from services.predict_service import predict_audio`
- [ ] Change to: `from services.predict_service_ml import predict_audio, load_model`
- [ ] Save file

### Step 4.2: Verify Updates
- [ ] Open `app.py`
- [ ] Confirm import is from `predict_service_ml`
- [ ] File is saved

---

## Phase 5: Start Backend Server (⏱️ 2 minutes)

### Step 5.1: Start Flask
- [ ] In terminal, ensure you're in backend directory
- [ ] Run: `python app.py`
- [ ] Watch console output for:
  - [ ] `✓ Model loaded successfully`
  - [ ] `✓ Scaler loaded successfully`
  - [ ] `✓ Feature configuration loaded successfully`
  - [ ] `NeuroVoice Backend Server Starting...`
  - [ ] `Running on http://127.0.0.1:5000`

### Step 5.2: Verify Server Running
- [ ] Console shows no errors
- [ ] Server is listening on localhost:5000
- [ ] Model loading messages show ✓

---

## Phase 6: Test API (⏱️ 5 minutes)

### Step 6.1: Basic Health Check
- [ ] Open new terminal window
- [ ] Run:
  ```bash
  curl http://localhost:5000/
  ```
  - [ ] Returns JSON with "NeuroVoice Backend Running"

- [ ] Check health endpoint:
  ```bash
  curl http://localhost:5000/health
  ```
  - [ ] Returns: `"model_loaded": true`
  - [ ] Returns: `"model_type": "Random Forest"` (or your model)
  - [ ] Returns: `"model_accuracy": 0.97...`

### Step 6.2: Check Model Info
- [ ] Run:
  ```bash
  curl http://localhost:5000/model/info
  ```
  - [ ] Shows model details
  - [ ] Shows accuracy, F1 score, ROC AUC
  - [ ] Shows 22 features listed

### Step 6.3: Test Prediction (if you have test audio)
- [ ] If you have a test.wav file, run:
  ```bash
  curl -X POST -F "audio=@test.wav" http://localhost:5000/predict
  ```
  - [ ] Returns JSON response
  - [ ] Includes risk_score (0-100)
  - [ ] Includes risk_level (Low/Moderate/High)
  - [ ] Includes vocal_features object
  - [ ] Includes model_confidence percentage

### Step 6.4: Verify Response Format
- [ ] Response includes:
  - [ ] `"risk_score"`: number between 0-100
  - [ ] `"risk_level"`: string (Low/Moderate/High)
  - [ ] `"explanation"`: descriptive text
  - [ ] `"model_confidence"`: percentage
  - [ ] `"vocal_features"`: object with features
  - [ ] `"model_used"`: string identifying model type

---

## Phase 7: Frontend Integration (⏱️ 10 minutes)

### Step 7.1: Locate Upload Component
- [ ] Navigate to frontend directory
- [ ] Find Upload component:
  - [ ] `src/pages/Upload.js` OR
  - [ ] `src/components/Upload.js`
- [ ] Open in editor

### Step 7.2: Update Audio Handler
- [ ] Find the form submission handler
- [ ] Add code to send to `/predict` endpoint:
  ```javascript
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    try {
      const response = await axios.post(
        'http://localhost:5000/predict',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setPrediction(response.data);
    } catch (error) {
      setError(error.message);
    }
  };
  ```
- [ ] Code added and saved

### Step 7.3: Update Results Display
- [ ] Find where results are displayed
- [ ] Update to show from prediction object:
  ```javascript
  {prediction && (
    <div>
      <p>Risk Level: {prediction.risk_level}</p>
      <p>Risk Score: {prediction.risk_score}%</p>
      <p>Confidence: {prediction.model_confidence}%</p>
      <p>{prediction.explanation}</p>
    </div>
  )}
  ```
- [ ] Changes saved

### Step 7.4: Test Frontend
- [ ] Start frontend dev server: `npm start`
- [ ] Frontend loads on localhost:3000
- [ ] Navigate to Upload page
- [ ] Select audio file
- [ ] Click upload/analyze button
- [ ] Results display correctly from backend

---

## Phase 8: Full End-to-End Test (⏱️ 5 minutes)

### Step 8.1: Test with Sample Audio
- [ ] Have a test audio file (.wav, .mp3, or .ogg)
- [ ] Use frontend to upload audio
- [ ] Verify prediction returns
- [ ] Check results display properly

### Step 8.2: Verify All Components Working
- [ ] ✓ Google Colab: Models trained
- [ ] ✓ Backend: Models loaded and API running
- [ ] ✓ API: Prediction endpoint returns correctly formatted JSON
- [ ] ✓ Frontend: Displays results from API

### Step 8.3: Test Multiple Predictions
- [ ] Try batch prediction via API:
  ```bash
  curl -X POST -F "files=@audio1.wav" -F "files=@audio2.wav" \
    http://localhost:5000/predict/batch
  ```
  - [ ] Returns array of predictions

- [ ] Try uploading different audio files
- [ ] Predictions vary based on audio content
- [ ] No errors in console

---

## Phase 9: Validation & Testing

### Step 9.1: API Response Validation
- [ ] All responses have status 200 (success) or appropriate error code
- [ ] JSON is properly formatted
- [ ] No null values in required fields
- [ ] risk_score is always 0-100
- [ ] risk_level is valid (Low/Moderate/High)

### Step 9.2: Feature Extraction Validation
- [ ] Vocal features are all numbers
- [ ] Jitter values are reasonable (0-5% typical)
- [ ] Shimmer values are reasonable (<0.1 typical)
- [ ] Frequency values make sense (50-300 Hz typical)
- [ ] All 7-8 key features present in response

### Step 9.3: Error Handling Validation
- [ ] Upload without file returns 400 error
- [ ] Upload non-audio file returns 400 error
- [ ] Upload audio <1 second returns appropriate error
- [ ] All errors have meaningful messages

---

## Phase 10: Optional Advanced Setup

### Step 10.1: Database Integration (Optional)
- [ ] If using PostgreSQL, update config.py
- [ ] Predictions are logged to database
- [ ] Can query past predictions

### Step 10.2: Docker Deployment (Optional)
- [ ] Create Dockerfile in backend
- [ ] Build Docker image
- [ ] Run container locally
- [ ] Test API through Docker

### Step 10.3: Production Deployment (Optional)
- [ ] Deploy to cloud (AWS/Azure/GCP)
- [ ] Set up HTTPS/SSL
- [ ] Configure environment variables
- [ ] Set up monitoring/logging

---

## Troubleshooting Checklist

If something doesn't work, check:

### Model Files Missing
- [ ] Check `neurovoice-backend/models/` directory exists
- [ ] All 3 files present:
  - [ ] `parkinsons_model.pkl`
  - [ ] `parkinsons_scaler.pkl`
  - [ ] `parkinsons_features.json`
- [ ] Files are readable (check permissions)
- [ ] File sizes seem reasonable (pkl should be 10-50MB)

### Backend Won't Start
- [ ] Check Python version: `python --version` (should be 3.8+)
- [ ] Check all dependencies installed: `pip list | grep scikit`
- [ ] Check port 5000 is not in use: 
  - [ ] Windows: `netstat -ano | findstr :5000`
  - [ ] Mac/Linux: `lsof -i :5000`
- [ ] Check file paths are correct in app.py

### API Returns Error
- [ ] Check server is running (see console output)
- [ ] Check audio file is valid format
- [ ] Check audio is at least 1 second
- [ ] Check console logs for detailed error message

### Frontend Can't Connect
- [ ] Check CORS enabled in app.py: `CORS(app)`
- [ ] Check Flask-CORS installed: `pip list | grep CORS`
- [ ] Check backend URL in frontend code (`http://localhost:5000`)
- [ ] Check both frontend and backend running on correct ports

### Model Not Loading
- [ ] Verify 3 files in models/ directory
- [ ] Check file names exactly match expected names
- [ ] Try re-uploading using `/model/upload` endpoint
- [ ] Check console for specific error message

---

## Final Verification

### ✅ All Boxes Checked?

If you've checked all boxes above:

1. ✓ Model is trained and saved
2. ✓ Files downloaded and copied
3. ✓ Backend dependencies installed
4. ✓ Backend APIs updated
5. ✓ Server is running with model loaded
6. ✓ Health check returns model_loaded: true
7. ✓ Prediction endpoint works
8. ✓ Frontend updated and integrated
9. ✓ Full end-to-end test passed
10. ✓ All responses formatted correctly

**YOU ARE READY FOR PRODUCTION! 🚀**

---

## System is Ready When

- [ ] Console shows "✓ Model loaded successfully"
- [ ] `curl http://localhost:5000/health` returns model_loaded: true
- [ ] `curl -X POST -F "audio=@test.wav" http://localhost:5000/predict` returns JSON
- [ ] Frontend upload component sends to correct API endpoint
- [ ] Frontend displays results from API response
- [ ] No errors in browser console or server console

---

## Next Steps

Now that everything is set up:

1. **Deploy to Production**
   - Use Docker for containerization
   - Deploy to cloud service
   - Set up monitoring

2. **Improve Model**
   - Retrain with more data
   - Tune hyperparameters
   - Try ensemble methods

3. **Add Features**
   - User authentication
   - Results history
   - Admin dashboard

4. **Monitor**
   - Track prediction accuracy
   - Monitor API performance
   - Log all predictions

---

## Support Resources

- **Google Colab Issues**: Check Colab help documentation
- **Flask Issues**: See Flask Official Docs
- **Audio Processing**: See Librosa Docs
- **ML Issues**: See Scikit-learn Docs
- **Setup Issues**: See ML_INTEGRATION_GUIDE.md
- **API Details**: See README_ML_SOLUTION.md

---

## File Checklist

Before starting, verify these files exist:

### Root Project Folder
- [ ] COLAB_MODEL_TRAINING.ipynb
- [ ] ML_INTEGRATION_GUIDE.md
- [ ] QUICKSTART.md
- [ ] README_ML_SOLUTION.md
- [ ] FILE_INVENTORY.md
- [ ] SETUP_CHECKLIST.md (this file)
- [ ] test_model.py

### Backend Folder
- [ ] app.py (original)
- [ ] app_ml.py (NEW)
- [ ] requirements.txt (original)
- [ ] requirements_ml.txt (NEW)
- [ ] services/predict_service.py (original)
- [ ] services/predict_service_ml.py (NEW)
- [ ] config.py
- [ ] uploads/ (directory)
- [ ] models/ (directory - create if missing)

### Dataset Folder
- [ ] parkinsons/parkinsons.data
- [ ] parkinsons/parkinsons.names

---

**Time to Complete:** 40-60 minutes total

**Difficulty Level:** Intermediate (requires Python, Flask, React familiarity)

**Support:** See ML_INTEGRATION_GUIDE.md for detailed help

---

🎉 **You've got this! Let's detect Parkinson's with AI!** 🎉
