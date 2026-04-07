# NeuroVoice - Voice Upload Feature Documentation

## 📋 Overview

The enhanced Voice Analysis Portal now features a professional dual-mode interface with **Record Voice** and **Upload Recording** options, allowing patients to choose their preferred method for voice capture.

## ✨ Features

### 1. **Tabbed Interface**
- **Record Voice Tab**: Real-time voice recording using the device microphone
- **Upload Recording Tab**: Upload pre-recorded audio files from the device
- Easy switching between modes with highlighted tab indicators
- Responsive design that works on desktop and mobile

### 2. **Voice Recording Mode**

#### Capabilities:
- 🎤 Real-time microphone input with echo cancellation
- ⏱️ Built-in timer showing recording duration
- 🔊 Audio playback before analysis
- ✅ Visual feedback (status icons and messages)
- 🔄 Option to re-record if not satisfied

#### Recording Flow:
1. Click **"Start Recording"** button
2. Speak naturally for 10-60 seconds
3. Click **"Stop Recording"** button
4. Preview the recording (optional)
5. Click **"Analyze Voice Sample"** to process

#### Technical Details:
- Formats: WebM or WAV (browser dependent)
- Sample Rate: Auto-detected
- Echo Cancellation: Enabled by default
- Max Duration: No limit (but 10-60 seconds optimal)

### 3. **File Upload Mode**

#### Features:
- 📁 Traditional file browser dialog
- 🎯 **Drag & Drop Support**: Drag audio files directly onto the upload area
- 📊 File information display (name, size, type)
- ✅ Real-time file validation
- 🔄 File removal option before analysis
- 🔊 Audio preview before analysis

#### Supported Formats:
- ✅ WAV (Waveform Audio)
- ✅ MP3 (MPEG Audio)
- ✅ WebM (Web Media)
- ✅ OGG (Ogg Vorbis)
- ✅ M4A (MPEG-4 Audio)
- ✅ AAC (Advanced Audio Coding)
- ✅ FLAC (Free Lossless Audio)

#### File Validation:
- **Max File Size**: 50MB
- **Format Checking**: Both MIME type and file extension validation
- **Error Messages**: Clear feedback on invalid uploads
  - "Unsupported file format" - Shows allowed formats
  - "File is too large" - Shows actual and max file sizes

#### Upload Flow:
1. **Option A - Browse Files**: Click "Browse Files" button
2. **Option B - Drag & Drop**: Drag audio file onto the drop zone
3. Select audio file from device
4. File info automatically displays (name, size, type)
5. Preview audio in player (optional)
6. Click **"Analyze Voice Sample"** to process

### 4. **Backend Integration**

#### API Endpoint
```
POST http://127.0.0.1:5000/predict
```

#### Request Format
```javascript
FormData:
  - audio: File (blob or File object)
  - filename: string (auto-generated or from file)
```

#### Response (Success)
```json
{
  "risk_score": 45.23,
  "risk_level": "Moderate Risk",
  "explanation": "Elevated pitch variation detected",
  "model_used": "ML Model",
  "vocal_features": {
    "jitter": 0.0234,
    "shimmer": 0.0145,
    "hnr": 0.75,
    "rpde": 0.423,
    "dfa": 0.612,
    "ppe": 0.234,
    "zcr": 0.145,
    "f0": 185.45
  },
  "all_features": { ... }
}
```

#### Response (Error)
```json
{
  "error": "Audio file too short. Please record at least 1 second.",
  "risk_score": 0,
  "risk_level": "Invalid"
}
```

#### Error Handling
The frontend properly handles:
- ✅ File validation errors on upload
- ✅ Audio loading errors from backend
- ✅ Feature extraction failures
- ✅ Model prediction errors
- ✅ Network/connectivity issues

All errors display user-friendly messages explaining what went wrong.

## 🎯 User Experience

### Record Mode - Step by Step
```
1. Select "Record Voice" tab
2. Click "Start Recording" button
3. Speak for 10-60 seconds
4. System shows timer counting up
5. Click "Stop Recording" button
6. Audio preview appears
7. Click "Analyze Voice Sample"
8. View results on Results page
```

### Upload Mode - Step by Step
```
Option A (Browse):
1. Select "Upload Recording" tab
2. Click "Browse Files" button
3. Select audio file from device
4. File info displays automatically
5. Preview audio (optional)
6. Click "Analyze Voice Sample"
7. View results on Results page

Option B (Drag & Drop):
1. Select "Upload Recording" tab
2. Drag audio file onto highlighted area
3. Drop file in the zone
4. File info displays automatically
5. Preview audio (optional)
6. Click "Analyze Voice Sample"
7. View results on Results page
```

## 💻 Technical Implementation

### State Management
```javascript
const [file, setFile] = useState(null);                    // Uploaded file
const [isRecording, setIsRecording] = useState(false);     // Recording status
const [recordingTime, setRecordingTime] = useState(0);     // Timer count
const [audioURL, setAudioURL] = useState(null);            // Audio preview URL
const [isAnalyzing, setIsAnalyzing] = useState(false);     // Analysis status
const [recordedBlob, setRecordedBlob] = useState(null);    // Audio data
const [fileSize, setFileSize] = useState(null);            // File size in bytes
const [uploadMode, setUploadMode] = useState("record");    // Active mode
const [dragActive, setDragActive] = useState(false);       // Drag hover state
```

### Key Functions

#### `startRecording()`
- Requests microphone access via getUserMedia
- Sets up MediaRecorder with WebM/WAV format
- Starts timer interval
- Sets recording state

#### `stopRecording()`
- Stops the MediaRecorder
- Stops timer
- Creates Blob from audio chunks
- Generates playable URL

#### `processFile(uploadedFile)`
- Validates file type and extension
- Checks file size (max 50MB)
- Creates object URL for preview
- Creates Blob for sending to backend

#### `handleFileUpload(e)`
- Triggered by file input change
- Calls processFile with selected file

#### `handleDrag/handleDrop()`
- Handles drag enter/leave/over events
- Processes dropped files
- Updates visual feedback

#### `handleAnalyze()`
- Creates FormData with audio
- Sends POST request to /predict endpoint
- Handles success/error responses
- Navigates to results page or shows error

### Supported MIME Types
```javascript
'audio/wav'      // WAV
'audio/mpeg'     // MP3
'audio/webm'     // WebM
'audio/ogg'      // OGG
'audio/aac'      // AAC
'audio/flac'     // FLAC
'audio/x-wav'    // WAV (alternate)
'audio/mp4'      // M4A
```

## 🔒 Security & Privacy

### Data Handling
- ✅ Audio files are NOT stored permanently on server
- ✅ Files are deleted after analysis if error occurs
- ✅ CORS properly configured
- ✅ File size limits prevent resource exhaustion
- ✅ Format validation prevents malicious files

### Client-Side Validation
- File type validation (MIME + extension)
- File size limits (50MB max)
- Format support checking
- User-friendly error messages

## 📊 Quality Metrics

### Recording Quality Guidelines
For optimal analysis results:
- **Duration**: 10-60 seconds (longer = better)
- **Microphone**: Good quality microphone recommended
- **Environment**: Quiet room with minimal background noise
- **Speaking Style**: Normal pace, clear pronunciation
- **Volume**: Comfortable speaking volume (not too loud/soft)

### File Quality Requirements
- **Format**: One of the supported formats
- **Bit Rate**: Minimum 64 kbps (320 kbps+ recommended)
- **Sample Rate**: 8 kHz to 48 kHz
- **Duration**: Minimum 1 second, optimal 10-60 seconds
- **Size**: Less than 50MB

## 🎨 User Interface

### Color Scheme
- **Primary**: Sky Blue and Cyan gradient
- **Recording Mode**: Red accents (#ef4444)
- **Upload Mode**: Blue accents (#3b82f6)
- **Success**: Green (#22c55e)
- **Error**: Red (#ef4444)

### Responsive Breakpoints
- **Mobile** (< 1024px): Single column layout
- **Desktop** (≥ 1024px): Two-column side-by-side layout

### Interactive Elements
- Tab buttons with active state visualization
- Drag & drop area with hover effects
- File input with custom styling
- Audio player with browser controls
- Loading spinner during analysis
- Status messages and icons

## 🚀 Deployment Checklist

- [x] Frontend code complete and tested
- [x] Backend API endpoints working
- [x] File validation implemented
- [x] Error handling comprehensive
- [x] Responsive design verified
- [x] Audio playback tested
- [x] Drag & drop functionality working
- [x] File size validation active
- [x] Format support verified
- [x] Results page properly displays analysis

## 📝 Browser Compatibility

### Recording Feature
- ✅ Chrome/Chromium 49+
- ✅ Firefox 55+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ❌ Internet Explorer (not supported)

### File Upload
- ✅ All modern browsers
- ✅ File API support required
- ✅ Drag & drop (optional enhancement)

### Audio Formats
- ✅ WebM: Chrome, Firefox, Edge
- ✅ MP3: All modern browsers
- ✅ WAV: All modern browsers
- ✅ ODD/FLAC: Firefox, Chrome

## 🔧 Configuration

### Backend Settings (app.py)
```python
UPLOAD_FOLDER = "uploads"          # Where files are temporarily stored
MAX_FILE_SIZE = 50 * 1024 * 1024   # 50MB limit
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'webm', 'ogg', 'm4a', 'aac', 'flac'}
```

### Frontend Settings (Upload.js)
```javascript
MAX_FILE_SIZE = 50 * 1024 * 1024                    // 50MB
SUPPORTED_EXTENSIONS = ['wav', 'mp3', 'webm', ...]
API_ENDPOINT = "http://127.0.0.1:5000/predict"
MIN_DURATION = 1  // second
OPTIMAL_DURATION = 10  // seconds
```

## 🐛 Troubleshooting

### Recording Issues

**Problem**: "Unable to access microphone"
- **Solution**: Check browser permissions, allow microphone access

**Problem**: Recording doesn't stop
- **Solution**: Click stop button again, or refresh page

**Problem**: Audio plays with noise/distortion
- **Solution**: Use microphone echo cancellation feature (enabled by default), record in quieter environment

### Upload Issues

**Problem**: "Unsupported file format"
- **Solution**: Ensure file is in supported format (WAV, MP3, WebM, OGG, M4A, AAC, FLAC)

**Problem**: "File is too large"
- **Solution**: Use a shorter recording or compress audio file

**Problem**: Drag & drop not working
- **Solution**: Not all browsers support drag & drop, use "Browse Files" button instead

### Analysis Issues

**Problem**: "Audio file too short"
- **Solution**: Record or upload audio that's at least 1 second long

**Problem**: 400 error on analyze
- **Solution**: Check backend server is running, file is valid audio

**Problem**: Results page doesn't load
- **Solution**: Wait a moment for analysis to complete, check browser console for errors

## 📚 Additional Resources

- [MediaRecorder API Docs](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [File API Docs](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [Audio Formats Support](https://en.wikipedia.org/wiki/Audio_format)

## 🎓 Future Enhancements

Potential improvements for future versions:
- [ ] Real-time audio waveform visualization
- [ ] Audio level meter during recording
- [ ] Multiple file upload support
- [ ] Batch analysis of multiple files
- [ ] Audio enhancement filters
- [ ] Real-time noise reduction
- [ ] Speaker verification/identification
- [ ] Historical analysis comparison
- [ ] Mobile app native integration
- [ ] Direct integration with patient EHR

---

**Last Updated**: March 28, 2026
**Version**: 2.0
**Status**: ✅ Production Ready
