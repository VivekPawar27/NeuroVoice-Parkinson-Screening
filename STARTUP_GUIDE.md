# NeuroVoice Startup Guide - Step by Step

## ✅ Complete Setup in 10 Minutes

This guide will help you get the entire NeuroVoice system up and running.

---

## 🔧 Prerequisites Check

Before starting, verify you have:

### Windows
```powershell
# Check Python
python --version  # Should be 3.8 or higher

# Check Node.js
node --version  # Should be 14 or higher
npm --version   # Should be 6 or higher
```

### Mac/Linux
```bash
# Check Python
python3 --version  # Should be 3.8 or higher

# Check Node.js
node --version     # Should be 14 or higher
npm --version      # Should be 6 or higher
```

If missing, install from:
- **Python**: https://www.python.org/downloads/
- **Node.js**: https://nodejs.org/

---

## 📂 Project Location

Your project is located at:
```
c:\Users\Admin\Desktop\NeuroVoice-Parkinsons-Screening
```

---

## 🚀 Step 1: Start the Backend

### Windows (PowerShell or CMD)

```powershell
# Navigate to backend folder
cd c:\Users\Admin\Desktop\NeuroVoice-Parkinsons-Screening\neurovoice-backend

# Create Python virtual environment (first time only)
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python app_ml.py
```

✓ **Success**: You should see:
```
 * Running on http://127.0.0.1:5000
 * Debugger is active!
 * Debugger PIN: xxx-xxx-xxx
```

**⚠️ Note**: Keep this terminal open while using the application!

---

## 🎨 Step 2: Start the Frontend

### Open a NEW terminal (don't close the backend one!)

```bash
# Navigate to frontend folder
cd c:\Users\Admin\Desktop\NeuroVoice-Parkinsons-Screening\neurovoice-frontend

# Install Node dependencies (first time only)
npm install

# Start React development server
npm start
```

✓ **Success**: Browser will automatically open to:
```
http://localhost:3000
```

If it doesn't open automatically, paste the URL in your browser.

**Note**: This terminal will also stay active during development.

---

## 📝 Step 3: Test the System

### Test Backend Health (Optional)
Open your browser and visit:
```
http://localhost:5000/health
```

You should see:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_type": "RandomForestClassifier",
  "model_accuracy": 0.95
}
```

### Test Frontend
1. **Frontend** should now be open at http://localhost:3000
2. You'll see the home page with navigation
3. Click **"Voice Recording"** or **"Upload"**

---

## 🎤 Step 4: Record Your First Analysis

### Option A: Record with Microphone
1. Click **"Start Recording"** button
2. Speak clearly for 5-15 seconds (count, say "ahhhh", etc.)
3. Click **"Stop Recording"**
4. Click **"Analyze Audio"**

### Option B: Upload an Audio File
1. Click **"Choose File"**
2. Select a .wav, .mp3, .ogg file
3. Click **"Analyze Audio"**

### View Results
After analysis completes, you'll see:
- **Risk Score**: 0-100%
- **Risk Level**: Low / Moderate / High
- **Vocal Features**: Jitter, Shimmer, HNR, etc.
- **Interpretation**: Clinical explanation

---

## 🧠 Step 5: Training Your Own Model (Optional)

If you want to train a custom ML model:

1. Open **COLAB_MODEL_TRAINING.ipynb** in:
   - Google Colab (free, cloud-based)
   - Jupyter Lab (local)
   - VS Code (with Jupyter extension)

2. Run all cells sequentially

3. Download generated files:
   - `parkinsons_model.pkl`
   - `parkinsons_scaler.pkl`
   - `parkinsons_features.json`

4. Copy to:
   ```
   neurovoice-backend/models/
   ```

5. Restart backend server (Ctrl+C, then `python app_ml.py`)

---

## 🛑 Step 6: Stopping the Application

### Backend
In the backend terminal:
```
Ctrl + C
```

### Frontend
In the frontend terminal:
```
Ctrl + C
```

Then answer `Y` if prompted.

---

## ⚡ Quick Commands Reference

### Backend
```bash
# Navigate
cd neurovoice-backend

# Setup (first time)
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run
python app_ml.py

# Stop
Ctrl + C
```

### Frontend
```bash
# Navigate
cd neurovoice-frontend

# Setup (first time)
npm install

# Run
npm start

# Stop
Ctrl + C
```

---

## 🐛 Troubleshooting

### Issue: "Python not found"
**Solution**:
```bash
# Try python3 instead
python3 app_ml.py

# Or add Python to PATH
# https://docs.python.org/3/using/windows.html
```

### Issue: "npm not found"
**Solution**:
```bash
# Reinstall Node.js from https://nodejs.org/
# Make sure to check "Add to PATH" during installation
```

### Issue: "Port 5000 already in use"
**Solution**:
```bash
# Windows - Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue: "No microphone access"
**Solution**:
- Check browser permissions (click lock icon in URL bar)
- Grant microphone access
- Refresh the page
- Try a different browser

### Issue: "Model not loaded"
**Solution**:
1. Check files exist:
   ```
   neurovoice-backend/models/
   - parkinsons_model.pkl
   - parkinsons_scaler.pkl
   - parkinsons_features.json
   ```
2. Restart backend: `python app_ml.py`
3. Check `/health` endpoint

### Issue: "Upload hangs/timeout"
**Solution**:
- Try a smaller audio file (< 10MB)
- Check file format is supported (WAV, MP3, OGG, FLAC)
- Restart both backend and frontend

---

## 📊 What to Expect

### First Use
- Brain computing features: **30-60 seconds**
- Displaying results: **< 2 seconds**

### System Information
- **Backend**: Python Flask, runs on port 5000
- **Frontend**: React.js, runs on port 3000
- **ML Model**: Random Forest Classifier (21 features)
- **Audio Processing**: Librosa library
- **Feature Extraction**: 22 vocal characteristics

---

## 🔒 Data Privacy

- Audio files deleted after processing
- No personal data stored
- Results not saved (unless you implement history)
- System runs locally by default
- No data sent to external servers

---

## 📱 Browser Compatibility

### Recommended
- ✅ Chrome / Chromium (best)
- ✅ Edge
- ✅ Firefox
- ✅ Safari

### Requirements
- Latest version recommended
- JavaScript enabled
- WebRTC support (for microphone)
- Local storage enabled

---

## 📚 Next Steps

1. ✅ **System Running**: Backend + Frontend both active
2. ✅ **Test Analysis**: Record and analyze voice
3. 📖 **Learn Features**: Read README.md for API details
4. 🧠 **Train Model**: Use COLAB_MODEL_TRAINING.ipynb with your data
5. 🚀 **Deploy**: Prepare for production use

---

## 🆘 Getting Help

### Check Logs
- **Backend logs**: Check terminal output while running
- **Browser console**: Right-click → Inspect → Console tab
- **Network tab**: Debug API calls (F12 → Network)

### Common Fixes
1. Restart both backend and frontend
2. Clear browser cache (Ctrl+Shift+Delete)
3. Check internet connection
4. Try another browser
5. Reinstall dependencies

### API Testing
```bash
# Test backend
curl http://localhost:5000/health

# Test with sample audio
curl -F "audio=@audio.wav" http://localhost:5000/predict
```

---

## 📝 Important Files

| File | Purpose |
|------|---------|
| `neurovoice-backend/app_ml.py` | Main backend server |
| `neurovoice-frontend/src/App.js` | Main React app |
| `COLAB_MODEL_TRAINING.ipynb` | Model training |
| `README.md` | Full documentation |
| `neurovoice-backend/models/` | ML model files |

---

## ✅ Verification Checklist

- [ ] Python installed (python --version)
- [ ] Node.js installed (node --version)
- [ ] Backend starts successfully
- [ ] Frontend opens in browser
- [ ] Microphone permission granted
- [ ] Test recording works
- [ ] Results display correctly
- [ ] Both terminals keep running

---

## 🎯 You're All Set!

Your NeuroVoice system is ready to use. 

**Next**: Open http://localhost:3000 and start analyzing voices!

For detailed API documentation, see **README.md**

---

**Version**: 2.0.0  
**Last Updated**: March 28, 2026
