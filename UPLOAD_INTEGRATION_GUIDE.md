# Voice Upload Feature - Integration Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   NEUROVOICE FRONTEND (React)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │            Upload.js Component (Enhanced)                  │  │
│  │                                                             │  │
│  │  ┌──────────────────┐      ┌──────────────────┐           │  │
│  │  │  Record Voice    │      │ Upload Recording │           │  │
│  │  │  Tab Mode        │      │ Tab Mode         │           │  │
│  │  ├──────────────────┤      ├──────────────────┤           │  │
│  │  │ - Start Record   │      │ - Browse Files   │           │  │
│  │  │ - Stop Record    │      │ - Drag & Drop    │           │  │
│  │  │ - Timer          │      │ - File Validation│           │  │
│  │  │ - Playback       │      │ - Preview Audio  │           │  │
│  │  └──────────────────┘      └──────────────────┘           │  │
│  │           │                        │                        │  │
│  │           └────────────┬───────────┘                        │  │
│  │                        │                                     │  │
│  │                 ┌──────▼──────┐                             │  │
│  │                 │ Audio Data  │                             │  │
│  │                 │   (Blob)    │                             │  │
│  │                 └──────┬──────┘                             │  │
│  │                        │                                     │  │
│  │                 ┌──────▼──────────────┐                     │  │
│  │                 │ handleAnalyze()     │                     │  │
│  │                 │ - Create FormData   │                     │  │
│  │                 │ - Send to Backend   │                     │  │
│  │                 │ - Handle Errors     │                     │  │
│  │                 └──────┬──────────────┘                     │  │
│  │                        │                                     │  │
│  └────────────────────────┼─────────────────────────────────────┘  │
│                           │                                         │
│                    HTTP POST Request                               │
│                   (multipart/form-data)                            │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│              NEUROVOICE BACKEND (Flask/Python)                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │             /predict Endpoint (Enhanced)                 │ │
│  │                                                          │ │
│  │  1. Receive FormData with audio file                    │ │
│  │  2. Validate file:                                      │ │
│  │     - Check filename not empty                          │ │
│  │     - Validate file extension                           │ │
│  │     - Check file exists after save                      │ │
│  │  3. Process audio:                                      │ │
│  │     - Load audio with librosa                           │ │
│  │     - Check minimum duration (1 second)                 │ │
│  │  4. Extract features:                                   │ │
│  │     - MFCC (13 coefficients)                            │ │
│  │     - F0, Jitter, Shimmer                               │ │
│  │     - NHR, HNR, RPDE, DFA, PPE, ZCR                    │ │
│  │  5. Run prediction:                                     │ │
│  │     - Try ML Model first                                │ │
│  │     - Fallback to Heuristic if needed                   │ │
│  │  6. Return results:                                     │ │
│  │     - Success: Analysis results with metrics            │ │
│  │     - Error: Clear error message                        │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                        │                                        │
│  ┌─────────────────────▼──────────────────────────────────┐    │
│  │  Feature Extraction (predict_service_ml.py)            │    │
│  │                                                         │    │
│  │  extract_oxford_features(y, sr)                        │    │
│  │  ├─ MFCC Extraction                                    │    │
│  │  ├─ Fundamental Frequency (F0)                         │    │
│  │  ├─ Jitter & Shimmer                                   │    │
│  │  ├─ Harmonic-to-Noise Ratio (HNR)                      │    │
│  │  ├─ RPDE, DFA, PPE                                     │    │
│  │  └─ Zero Crossing Rate (ZCR) ← NEW!                   │    │
│  │                                                         │    │
│  └─────────────────────┬──────────────────────────────────┘    │
│                        │                                        │
│  ┌─────────────────────▼──────────────────────────────────┐    │
│  │  Prediction Models (parkinsons_model.pkl)              │    │
│  │                                                         │    │
│  │  predict_with_ml_model()                               │    │
│  │  └─ RandomForestClassifier                             │    │
│  │     ├─ probability_healthy                             │    │
│  │     └─ probability_parkinsons                          │    │
│  │                                                         │    │
│  │  calculate_parkinsons_risk_heuristic()                 │    │
│  │  └─ Fallback risk calculation                          │    │
│  │                                                         │    │
│  └─────────────────────┬──────────────────────────────────┘    │
│                        │                                        │
│         ┌──────────────┴──────────────┐                        │
│         │                             │                        │
│    Success Response              Error Response              │
│    ┌──────────────────┐         ┌──────────────────┐         │
│    │ 200 OK           │         │ 400 Bad Request  │         │
│    │ {                │         │ {                │         │
│    │  risk_score,     │         │  error: string   │         │
│    │  risk_level,     │         │ }                │         │
│    │  explanation,    │         └──────────────────┘         │
│    │  vocal_features, │                                       │
│    │  model_used      │         ┌──────────────────┐         │
│    │ }                │         │ 500 Server Error │         │
│    └──────────────────┘         │ {                │         │
│                                  │  error: string   │         │
│                                  │ }                │         │
│                                  └──────────────────┘         │
└────────────────────────────────────┬───────────────────────────┘
                                     │
                    HTTP Response (JSON)
                                     │
┌────────────────────────────────────▼───────────────────────────┐
│                   FRONTEND - Result Page                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Success Result Display                                    │ │
│  │  - Risk Score (0-100%)                                     │ │
│  │  - Risk Level (Low/Moderate/High)                          │ │
│  │  - Voice Features (Jitter, Shimmer, HNR, etc.)            │ │
│  │  - Analysis Explanation                                    │ │
│  │  - Model Information                                       │ │
│  │  - Feature Visualizations (Charts)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  OR                                                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Error Display                                             │ │
│  │  - Error Message with explanation                          │ │
│  │  - "Try Again" Button                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

## 📋 Data Flow Sequence Diagram

```
FRONTEND                          BACKEND
   │                                │
   │─────── 1. User starts -----------►│
   │        (Record or Upload)          │
   │                                    │
   │◄────────────────────────────────────│
   │     (UI ready for input)            │
   │                                    │
   │─────── 2. Audio Input ─────────────►│
   │    (File or Recording)              │
   │                                    │
   │     3. User clicks Analyze         │
   │         ↓                          │
   │     4. Prepare FormData             │
   │         ├─ audio: Blob/File         │
   │         └─ filename: string         │
   │                                    │
   │─────── 5. POST /predict ──────────►│
   │     (multipart/form-data)          │
   │                                    │
   │                         6. Validate │
   │                            - Exists │
   │                            - Format │
   │                            - Size   │
   │                                    │
   │                         7. Load    │
   │                            Audio   │
   │                                    │
   │                         8. Extract │
   │                            Features│
   │                            (22 in  │
   │                             total) │
   │                                    │
   │                         9. Predict │
   │                            - ML or │
   │                            Fallback│
   │                                    │
   │◄────── 10. JSON Response ─────────│
   │      (Success or Error)            │
   │                                    │
   │  11. Parse Response                │
   │      ├─ Check for errors           │
   │      └─ Extract data               │
   │                                    │
   │  12. Navigate to Results           │
   │      or Show Error Alert           │
   │                                    │
```

## 🔄 File Processing Pipeline

```
INPUT (Audio File or Recording)
    │
    ├─── File Validation ───┐
    │                        │
    ├─ Format Check        VALID?
    │ ├─ MIME Type          NO ─► ERROR: "Invalid Format"
    │ └─ Extension              Return error message
    │
    ├─ Size Check           VALID?
    │ └─ Max 50MB            NO ─► ERROR: "File Too Large"
    │                            Return file size info
    │
    ├─ Existence Check      VALID?
    │ └─ File saved          NO ─► ERROR: "Save Failed"
    │                            Retry or use different file
    │
    ▼
AUDIO LOADING (librosa.load)
    │
    ├─ Parse Audio           VALID?
    │ └─ Extract samples      NO ─► ERROR: "Cannot Load File"
    │                            Format not supported
    │
    ├─ Check Duration        VALID?
    │ ├─ Minimum 1 second     NO ─► ERROR: "Too Short"
    │ └─ Extract sample rate      Record longer
    │
    ▼
FEATURE EXTRACTION
    │
    ├─ MFCC (13 features)
    ├─ F0 & Pitch Features (Jitter, Shimmer)
    ├─ Harmonic Features (NHR, HNR)
    ├─ Recurrence (RPDE)
    ├─ Fluctuation (DFA)
    ├─ Entropy (PPE)
    └─ Zero Crossing (ZCR)
    │
    ▼
PREDICTION
    │
    ├─ Scale Features (StandardScaler)
    │
    ├─ Try ML Model
    │  ├─ RandomForestClassifier
    │  ├─ Predict class (Healthy/Parkinsons)
    │  └─ Get probabilities
    │
    ├─ If ML fails → Heuristic Fallback
    │  └─ Calculate based on feature values
    │
    ▼
OUTPUT JSON RESPONSE
    │
    ├─ Success Response
    │  ├─ risk_score: 0-100
    │  ├─ risk_level: Low/Moderate/High
    │  ├─ vocal_features: all extracted values
    │  └─ explanation: human-readable text
    │
    └─ Error Response
       ├─ error: error message
       └─ risk_level: "Invalid"
```

## 🛠️ Integration Checklist

- [x] Frontend: Upload.js enhanced with dual-mode interface
- [x] Frontend: Drag & drop file support
- [x] Frontend: File validation and size checking
- [x] Frontend: Audio preview functionality
- [x] Frontend: Error handling and user feedback
- [x] Backend: /predict endpoint with comprehensive validation
- [x] Backend: File format validation
- [x] Backend: Audio loading error handling
- [x] Backend: Feature extraction with ZCR
- [x] Backend: Model prediction or heuristic fallback
- [x] Backend: Proper HTTP status codes (200, 400, 500)
- [x] Result Page: Error state handling
- [x] Result Page: Display actual voice metrics
- [x] Result Page: Show analysis explanation

## 📤 Request/Response Examples

### Request (Record Mode)
```javascript
POST /predict
Content-Type: multipart/form-data

FormData:
  audio: Blob {size: 125000, type: "audio/webm"}
  filename: "recording_1711612800000.webm"
```

### Request (Upload Mode)
```javascript
POST /predict
Content-Type: multipart/form-data

FormData:
  audio: File {name: "voice_sample.wav", size: 250000, type: "audio/wav"}
  filename: "voice_sample.wav"
```

### Response (Success)
```json
{
  "risk_score": 42.5,
  "risk_level": "Moderate Risk",
  "explanation": "Elevated pitch variation (jitter: 0.0234) detected; Amplitude irregularities (shimmer: 0.0145) detected",
  "model_used": "ML Model",
  "vocal_features": {
    "jitter": 0.0234,
    "shimmer": 0.0145,
    "nhr": 0.15,
    "hnr": 0.85,
    "rpde": 0.423,
    "dfa": 0.612,
    "ppe": 0.234,
    "zcr": 0.145,
    "f0": 185.45
  },
  "all_features": { ... }
}
```

### Response (Error - Invalid Format)
```json
{
  "error": "Invalid audio format. Allowed: wav, mp3, webm, ogg, m4a, aac, flac",
  "risk_score": 0,
  "risk_level": "Invalid"
}
```

### Response (Error - File Too Large)
```json
{
  "error": "File is too large. Maximum size is 50MB. Your file is 75.50MB",
  "risk_score": 0,
  "risk_level": "Invalid"
}
```

---

**Status**: ✅ Fully Integrated and Tested
**Last Updated**: March 28, 2026
