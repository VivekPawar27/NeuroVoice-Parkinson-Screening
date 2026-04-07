# NeuroVoice CNN-LSTM Integration - Testing Guide

## Overview
Complete testing procedures for the NeuroVoice CNN-LSTM Keras model integration with the frontend and backend.

---

## Pre-Test Checklist

- [ ] Model file `best_parkinsons_model.keras` is in `neurovoice-backend/models/`
- [ ] TensorFlow installed: `pip list | grep tensorflow`
- [ ] Librosa installed: `pip list | grep librosa`
- [ ] Python 3.8+ installed: `python --version`
- [ ] Node.js installed: `node --version`
- [ ] Port 5000 is available (not in use)
- [ ] Port 3000 is available (not in use)

---

## Test Suite 1: Backend Service Tests

### Test 1.1: Model Loading
```bash
cd neurovoice-backend

python -c "
from services.neurovoice_service import load_keras_model, get_model_info
result = load_keras_model()
print(f'✓ Model loaded: {result}')
info = get_model_info()
print(f'Model info: {info}')
"
```

**Expected Output**:
```
✓ Model loaded: True
Model info: {...model details...}
```

### Test 1.2: Backend Startup
```bash
cd neurovoice-backend
python app_neurovoice.py
```

**Expected Output**:
```
============================================================
NeuroVoice Backend Server Starting
============================================================
Audio Upload Folder: /path/to/uploads
Models Folder: /path/to/models
============================================================

 * Running on http://0.0.0.0:5000
```

### Test 1.3: Health Check Endpoint
```bash
# While backend is running (in another terminal)
curl http://127.0.0.1:5000/

# Expected Response:
# {
#   "message": "NeuroVoice Backend Running",
#   "version": "3.0.0",
#   "model": "CNN-LSTM Keras",
#   ...
# }
```

### Test 1.4: Model Info Endpoint
```bash
curl http://127.0.0.1:5000/api/model/info

# Expected fields in response:
# - model_loaded: true
# - model_name: best_parkinsons_model.keras
# - architecture: CNN-LSTM
# - input_shape: (None, 128, ...)
# - audio_parameters: {sr: 22050, duration: 3, ...}
```

### Test 1.5: Status Endpoint
```bash
curl http://127.0.0.1:5000/api/status

# Should show operational status with model loaded
```

---

## Test Suite 2: Audio Processing Tests

### Test 2.1: Create Test Audio
```bash
# Create a simple 15-second WAV file using Python
python -c "
import numpy as np
from scipy.io import wavfile

# Generate 15 seconds of audio at 22050 Hz
sr = 22050
duration = 15
samples = sr * duration
t = np.linspace(0, duration, samples)

# Create a simple sine wave at 440 Hz
frequency = 440
audio = 0.3 * np.sin(2 * np.pi * frequency * t)

# Add some noise for realism
audio += 0.05 * np.random.randn(len(audio))

# Normalize
audio = audio / np.max(np.abs(audio))

# Save as WAV
output_file = 'test_audio_15sec.wav'
wavfile.write(output_file, sr, (audio * 32767).astype(np.int16))
print(f'✓ Test audio created: {output_file}')
"
```

### Test 2.2: Test Audio Splitting
```bash
python -c "
from services.neurovoice_service import split_audio_into_segments
import librosa
import numpy as np

# Load test audio
audio, sr = librosa.load('test_audio_15sec.wav', sr=22050)
segments = split_audio_into_segments(audio, sr=sr)

print(f'✓ Splitting test:')
print(f'  Total audio: {len(audio)} samples ({len(audio)/sr:.1f}s)')
print(f'  Segments created: {len(segments)}')
for i, seg in enumerate(segments):
    print(f'  Segment {i+1}: {len(seg)} samples ({len(seg)/sr:.1f}s)')
"
```

**Expected Output**:
```
✓ Splitting test:
  Total audio: 331050 samples (15.0s)
  Segments created: 5
  Segment 1: 66150 samples (3.0s)
  Segment 2: 66150 samples (3.0s)
  ...
```

### Test 2.3: Test Mel-Spectrogram Processing
```bash
python -c "
from services.neurovoice_service import preprocess_audio_segment
import librosa
import numpy as np

audio, sr = librosa.load('test_audio_15sec.wav', sr=22050)
segment = audio[:sr*3]  # First 3 seconds

mel_spec = preprocess_audio_segment(segment, sr=sr)

print(f'✓ Mel-spectrogram processing:')
print(f'  Input shape: {(sr*3,)}')
print(f'  Output shape: {mel_spec.shape}')
print(f'  Expected shape: (128, ~259, 1)')
print(f'  Data type: {mel_spec.dtype}')
print(f'  Value range: [{mel_spec.min():.3f}, {mel_spec.max():.3f}]')
"
```

**Expected Output**:
```
✓ Mel-spectrogram processing:
  Input shape: (66150,)
  Output shape: (128, 259, 1)
  Expected shape: (128, ~259, 1)
  Data type: float32
  Value range: [0.000, 1.000]
```

---

## Test Suite 3: Prediction Tests

### Test 3.1: Single Segment Prediction
```bash
python -c "
from services.neurovoice_service import predict_from_audio_file
import os

# Use test audio
audio_file = 'test_audio_15sec.wav'

if os.path.exists(audio_file):
    result = predict_from_audio_file(audio_file)
    
    print('✓ Single audio prediction:')
    print(f'  Status: {result.get(\"status\")}')
    print(f'  Risk Score: {result.get(\"risk_score\", 0):.1f}%')
    print(f'  Risk Level: {result.get(\"risk_level\")}')
    print(f'  Confidence: {result.get(\"confidence\", 0):.2%}')
    print(f'  Segments Analyzed: {result.get(\"segments_analyzed\")}')
    print(f'  Aggregate Stats:')
    stats = result.get('aggregate_stats', {})
    print(f'    Mean: {stats.get(\"mean_probability\", 0):.2%}')
    print(f'    Std: {stats.get(\"std_probability\", 0):.2%}')
else:
    print(f'Error: Test audio file not found')
"
```

**Expected Output**:
```
✓ Single audio prediction:
  Status: Healthy or Parkinson's Disease
  Risk Score: XX.X%
  Risk Level: Low/Moderate/High Risk
  Confidence: XX.XX%
  Segments Analyzed: 5
  Aggregate Stats:
    Mean: XX.XX%
    Std: X.XX%
```

### Test 3.2: API Prediction Test
```bash
# With backend running, test the API endpoint
curl -X POST http://127.0.0.1:5000/api/predict \
  -F "audio=@test_audio_15sec.wav"

# Expected Response (JSON):
# {
#   "status": "Healthy or Parkinson's Disease",
#   "risk_score": XX.X,
#   "risk_level": "...",
#   "confidence": X.XX,
#   "segments_analyzed": 5,
#   "segment_predictions": [...],
#   "aggregate_stats": {...},
#   "insights": [...],
#   "model_used": "CNN-LSTM NeuroVoice",
#   "explanation": "..."
# }
```

---

## Test Suite 4: Frontend Tests

### Test 4.1: Start Frontend
```bash
cd neurovoice-frontend
npm start
```

**Expected**: Browser opens to `http://localhost:3000`

### Test 4.2: Test Recording
1. Open `http://localhost:3000`
2. Click "🎙️ Record Voice"
3. Click "🎙️ Start Recording"
4. Speak for 15+ seconds
5. Click "⏹️ Stop Recording"
6. Verify audio playback works

### Test 4.3: Test Upload
1. Click "📁 Upload Recording"  
2. Drag and drop `test_audio_15sec.wav` 
3. Verify file is shown with correct size
4. Click "Analyze"

### Test 4.4: Test Results Page
1. After analysis completes, verify:
   - [ ] Overall status displayed correctly
   - [ ] Risk score shown as percentage
   - [ ] Risk level displayed with correct color
   - [ ] Confidence percentage shown
   - [ ] Segment predictions visible
   - [ ] Aggregate statistics chart present
   - [ ] Clinical insights listed
   - [ ] "Download Report" button works
   - [ ] "New Analysis" button returns to home

### Test 4.5: Test Error Handling
1. Try uploading invalid file (e.g., image)
   - Expected: Error message shown
2. Try uploading very short audio (<1 sec)
   - Expected: Error or warning message
3. Try analyzing without uploading
   - Expected: "Please upload audio" message

---

## Test Suite 5: End-to-End Integration Tests

### Test 5.1: Full Workflow - Recording
1. **Start backend**: `python app_neurovoice.py`
2. **Start frontend**: `npm start`
3. **Record audio**: 15+ seconds of voice
4. **Analyze**: Click "Analyze"
5. **View results**: Verify all components appear
6. **Download report**: Save and verify content

### Test 5.2: Full Workflow - Upload
1. **Create test audio**: Run test 2.1
2. **Upload file**: Via frontend
3. **Verify processing**: Monitor backend console
4. **Check results**: All fields populated
5. **Validate response**: JSON structure correct

### Test 5.3: Batch Processing
```bash
# Create another test audio
cp test_audio_15sec.wav test_audio_2.wav

# Test batch API
curl -X POST http://127.0.0.1:5000/api/predict/batch \
  -F "files=@test_audio_15sec.wav" \
  -F "files=@test_audio_2.wav"

# Expected: Array of predictions
```

### Test 5.4: Model Management
```bash
# Test model info
curl http://127.0.0.1:5000/api/model/info

# Test model delete
curl -X DELETE http://127.0.0.1:5000/api/model/delete

# Verify error on next prediction
curl -X POST http://127.0.0.1:5000/api/predict \
  -F "audio=@test_audio_15sec.wav"
# Should show: "Model not loaded"

# Test model upload
curl -X POST http://127.0.0.1:5000/api/model/upload \
  -F "model=@neurovoice-backend/models/best_parkinsons_model.keras"
```

---

## Test Suite 6: Performance Tests

### Test 6.1: Response Time
```bash
# Measure prediction response time
time curl -X POST http://127.0.0.1:5000/api/predict \
  -F "audio=@test_audio_15sec.wav" > /dev/null
```

**Expected**: < 10 seconds for prediction

### Test 6.2: Concurrent Requests
```bash
# Test multiple simultaneous requests
for i in {1..3}; do
  curl -X POST http://127.0.0.1:5000/api/predict \
    -F "audio=@test_audio_15sec.wav" &
done
wait

# Should handle without errors
```

### Test 6.3: Large File Handling
```bash
# Test with longer audio (45+ seconds)
ffmpeg -f lavfi -i sine=f=440:d=45 -q:a 9 -acodec libmp3lame \
  -b:a 192k test_audio_45sec.mp3

curl -X POST http://127.0.0.1:5000/api/predict \
  -F "audio=@test_audio_45sec.mp3"
```

**Expected**: Should process correctly with more segments

---

## Test Suite 7: Data Validation Tests

### Test 7.1: Response Structure
Verify API response contains all required fields:
```python
required_fields = [
    'status',
    'risk_score',
    'risk_level',
    'confidence',
    'audio_duration',
    'segments_analyzed',
    'segment_predictions',
    'aggregate_stats',
    'insights',
    'model_used'
]

# After getting prediction response, check:
for field in required_fields:
    assert field in response, f"Missing field: {field}"
```

### Test 7.2: Value Ranges
Verify predicted values are within expected ranges:
```python
result = prediction_response

assert 0 <= result['risk_score'] <= 100, "Risk score out of range"
assert 0 <= result['confidence'] <= 1, "Confidence out of range"
assert result['segments_analyzed'] >= 1, "No segments analyzed"
assert len(result['segment_predictions']) > 0, "No segment predictions"

for seg in result['segment_predictions']:
    assert 0 <= seg['probability_parkinsons'] <= 1
    assert seg['confidence'] > 0
```

### Test 7.3: Consistency Checks
```python
stats = result['aggregate_stats']

# Mean should be average of segments
segment_probs = [seg['probability_parkinsons'] for seg in result['segment_predictions']]
expected_mean = np.mean(segment_probs)
assert abs(stats['mean_probability'] - expected_mean) < 0.001

# Max should be highest, min should be lowest
assert stats['max_probability'] == max(segment_probs)
assert stats['min_probability'] == min(segment_probs)
```

---

## Troubleshooting During Testing

### Issue: Backend won't start
```
Solution:
1. Check if port 5000 is in use
2. Verify TensorFlow is installed: pip install tensorflow==2.13.0
3. Check model file exists: ls neurovoice-backend/models/
4. Review error messages in console
```

### Issue: Model loading fails
```
Solution:
1. Verify model file is valid: file best_parkinsons_model.keras
2. Re-download model from Colab if corrupted
3. Check TensorFlow version matches: pip show tensorflow
4. Try: python -c "import tensorflow as tf; tf.keras.models.load_model('models/best_parkinsons_model.keras')"
```

### Issue: Prediction returns error
```
Solution:
1. Check audio file format is supported
2. Verify audio is at least a few seconds long
3. Check for console error messages on backend
4. Ensure librosa installed: pip install librosa==0.10.0
```

### Issue: Frontend can't connect
```
Solution:
1. Verify backend is running: curl http://127.0.0.1:5000/
2. Check network/firewall: netstat -an | grep 5000
3. Check browser console for CORS errors
4. Verify API endpoint URL in Upload.js
```

---

## Success Criteria

✅ All tests in Suite 1-4 pass  
✅ End-to-end workflow completes without errors  
✅ Results page shows all expected components  
✅ Segment analysis displays correctly  
✅ Download report generates valid file  
✅ API endpoints respond with correct JSON format  
✅ Response times are acceptable (<10 seconds)  
✅ No console errors in browser  
✅ No exceptions in backend logs  

---

## Next Steps After Testing

1. **Deploy**: Use production WSGI server (Gunicorn)
2. **Monitor**: Set up logging and error tracking
3. **Optimize**: Profile and optimize slow operations
4. **Validate**: Test with real user data
5. **Document**: Create user manual for healthcare professionals

---

**Test Date**: _______________
**Tester**: _______________
**Status**: ✅ PASS / ❌ FAIL

---

**Last Updated**: April 5, 2026  
**NeuroVoice Version**: 3.0.0
