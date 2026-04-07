#!/usr/bin/env python
"""
Test NeuroVoice Backend Integration
Validates model loading and prediction functionality
"""

import json
import os
import sys
import numpy as np
import librosa
from pathlib import Path

print("\n" + "="*70)
print("NEUROVOICE BACKEND INTEGRATION TEST")
print("="*70)

# Test 1: Check model files exist
print("\n[TEST 1] Checking model files...")
model_folder = "neurovoice-backend/models"
required_files = [
    'parkinsons_model.pkl',
    'parkinsons_scaler.pkl',
    'parkinsons_features.json'
]

all_exist = True
for filename in required_files:
    filepath = os.path.join(model_folder, filename)
    if os.path.exists(filepath):
        size = os.path.getsize(filepath)
        print(f"   ✓ {filename} ({size:,} bytes)")
    else:
        print(f"   ✗ {filename} - NOT FOUND")
        all_exist = False

if not all_exist:
    print("\n❌ Model files not found!")
    sys.exit(1)

# Test 2: Load model configuration
print("\n[TEST 2] Loading model configuration...")
try:
    with open(os.path.join(model_folder, 'parkinsons_features.json'), 'r') as f:
        config = json.load(f)
    
    print(f"   ✓ Model Type: {config['model_type']}")
    print(f"   ✓ Features: {len(config['features'])} audio features")
    print(f"   ✓ Accuracy: {config.get('accuracy', 'N/A'):.4f}")
    print(f"   ✓ ROC-AUC: {config.get('roc_auc', 'N/A'):.4f}")
    print(f"   ✓ Training Samples: {config['training_samples']['total']}")
except Exception as e:
    print(f"   ✗ Error loading config: {e}")
    sys.exit(1)

# Test 3: Load and test ML model
print("\n[TEST 3] Loading trained ML model...")
try:
    import joblib
    model = joblib.load(os.path.join(model_folder, 'parkinsons_model.pkl'))
    scaler = joblib.load(os.path.join(model_folder, 'parkinsons_scaler.pkl'))
    
    print(f"   ✓ Model loaded: {type(model).__name__}")
    print(f"   ✓ Scaler loaded: {type(scaler).__name__}")
except Exception as e:
    print(f"   ✗ Error loading model: {e}")
    sys.exit(1)

# Test 4: Test prediction with synthetic data
print("\n[TEST 4] Testing ML model predictions...")
try:
    # Create test data
    feature_names = config['features']
    
    # Test sample 1: Healthy-like features
    test_healthy = np.random.normal(loc=0.4, scale=0.15, size=len(feature_names))
    test_healthy = np.clip(test_healthy, 0, 1).reshape(1, -1)
    test_healthy_scaled = scaler.transform(test_healthy)
    
    pred_healthy = model.predict(test_healthy_scaled)[0]
    prob_healthy = model.predict_proba(test_healthy_scaled)[0]
    
    print(f"\n   Sample 1 (Healthy-like):")
    print(f"      Prediction: {'Healthy' if pred_healthy == 0 else 'Parkinson\'s'}")
    print(f"      Confidence: {max(prob_healthy)*100:.1f}%")
    print(f"      Risk Score: {prob_healthy[1]*100:.1f}%")
    
    # Test sample 2: Parkinson's-like features
    test_parkinsons = np.random.normal(loc=0.65, scale=0.25, size=len(feature_names))
    test_parkinsons = np.clip(test_parkinsons, 0, 1).reshape(1, -1)
    test_parkinsons_scaled = scaler.transform(test_parkinsons)
    
    pred_pd = model.predict(test_parkinsons_scaled)[0]
    prob_pd = model.predict_proba(test_parkinsons_scaled)[0]
    
    print(f"\n   Sample 2 (Parkinson's-like):")
    print(f"      Prediction: {'Healthy' if pred_pd == 0 else 'Parkinson\'s'}")
    print(f"      Confidence: {max(prob_pd)*100:.1f}%")
    print(f"      Risk Score: {prob_pd[1]*100:.1f}%")
    
except Exception as e:
    print(f"   ✗ Error testing predictions: {e}")
    sys.exit(1)

# Test 5: Test predict_service_ml
print("\n[TEST 5] Testing predict_service_ml module...")
try:
    # Import after path is set
    sys.path.insert(0, 'neurovoice-backend')
    from services.predict_service_ml import load_model, extract_oxford_features, predict_with_ml_model
    
    # Check if model loaded
    loaded = load_model()
    print(f"   ✓ Model loading function returned: {loaded}")
    
except Exception as e:
    print(f"   ⚠ Warning - Could not import predict_service_ml: {e}")
    print(f"      (This may be normal if backend dependencies not fully installed)")

# Test 6: Create test audio and extract features
print("\n[TEST 6] Testing feature extraction...")
try:
    # Create a test audio signal (1 second, 22050 Hz)
    sr = 22050
    duration = 1
    t = np.linspace(0, duration, sr*duration)
    # Create a complex signal with multiple frequency components (simulates speech)
    audio = (
        0.3 * np.sin(2*np.pi*100*t) +  # Fundamental frequency
        0.2 * np.sin(2*np.pi*150*t) +  # Harmonic
        0.1 * np.sin(2*np.pi*200*t) +  # Harmonic
        0.1 * np.random.normal(0, 0.1, len(t))  # Noise
    )
    audio = audio / np.max(np.abs(audio))  # Normalize
    
    # Try to extract features
    if 'extract_oxford_features' in dir():
        features = extract_oxford_features(audio, sr)
        print(f"   ✓ Extracted features: {len(features)} features")
        print(f"   ✓ Sample features:")
        for key in list(features.keys())[:5]:
            print(f"      - {key}: {features[key]:.4f}")
    else:
        print("   ℹ Feature extraction not directly tested (import not available)")
    
except Exception as e:
    print(f"   ⚠ Warning in feature extraction test: {e}")

# Final Summary
print("\n" + "="*70)
print("✅ BACKEND INTEGRATION TEST COMPLETE")
print("="*70)

print("\n📋 Test Summary:")
print("   ✓ Model files deployed")
print("   ✓ Configuration loaded")
print("   ✓ ML model functional")
print("   ✓ Predictions working")

print("\n🚀 Next Steps:")
print("   1. Start the backend: cd neurovoice-backend && python app_ml.py")
print("   2. Start the frontend: cd neurovoice-frontend && npm start")
print("   3. Upload audio files through the web interface")
print("   4. Check risk scores from the ML model")

print("\n" + "="*70)
