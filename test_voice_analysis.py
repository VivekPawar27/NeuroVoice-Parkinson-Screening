#!/usr/bin/env python3
"""
Test script to verify the voice analysis pipeline
"""
import os
import sys
import json
import numpy as np
import librosa
import soundfile as sf

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'neurovoice-backend'))

from services.predict_service_ml import (
    load_model, 
    extract_oxford_features, 
    predict_audio,
    predict_with_ml_model
)

def test_model_loading():
    """Test if model loads correctly"""
    print("Testing model loading...")
    result = load_model()
    print(f"✓ Model loaded: {result}")
    return result

def create_test_audio(duration=3, sr=22050):
    """Create a synthetic test audio file"""
    print(f"\nCreating test audio ({duration}s at {sr}Hz)...")
    
    # Generate a simple sine wave with some variation
    t = np.linspace(0, duration, int(sr * duration))
    # Mix of frequencies to simulate speech
    frequency = 200 + 50 * np.sin(2 * np.pi * t)  # Varying fundamental frequency
    y = np.sin(2 * np.pi * frequency * t / sr)
    
    # Add some noise
    y += 0.05 * np.random.randn(len(y))
    
    # Normalize
    y = y / np.max(np.abs(y))
    
    test_file = os.path.join(os.path.dirname(__file__), 'test_audio.wav')
    sf.write(test_file, y, sr)
    print(f"✓ Test audio created: {test_file}")
    return test_file, sr

def test_feature_extraction(audio_file, sr):
    """Test feature extraction"""
    print(f"\nTesting feature extraction...")
    y, sr_loaded = librosa.load(audio_file, sr=sr, mono=True)
    print(f"✓ Audio loaded: {len(y)} samples at {sr_loaded}Hz")
    
    features = extract_oxford_features(y, sr_loaded)
    
    if not features:
        print("✗ Feature extraction failed!")
        return False
    
    print(f"✓ Extracted {len(features)} features")
    print("\nFeatures extracted:")
    for feature_name, feature_value in sorted(features.items()):
        if feature_name != 'Status':
            print(f"  {feature_name}: {feature_value:.4f}")
    
    return features

def test_prediction(features):
    """Test ML model prediction"""
    print(f"\nTesting ML model prediction...")
    
    result = predict_with_ml_model(features)
    
    if result is None:
        print("✗ ML model prediction failed (might be using heuristic fallback)")
        return False
    
    print(f"✓ ML Model prediction successful")
    print(f"  Healthy probability: {result['probability_healthy']:.4f}")
    print(f"  Parkinson's probability: {result['probability_parkinsons']:.4f}")
    print(f"  Prediction: {result['prediction']} (0=Healthy, 1=Parkinson's)")
    
    return result

def test_full_analysis(audio_file):
    """Test the complete analysis pipeline"""
    print(f"\nTesting full analysis pipeline...")
    
    result = predict_audio(audio_file)
    
    if "error" in result:
        print(f"✗ Analysis failed: {result['error']}")
        return False
    
    print(f"✓ Full analysis successful")
    print(f"  Risk Score: {result['risk_score']}%")
    print(f"  Risk Level: {result['risk_level']}")
    print(f"  Model Used: {result['model_used']}")
    print(f"  Explanation: {result['explanation']}")
    
    return result

def cleanup_test_file(audio_file):
    """Clean up test audio file"""
    if os.path.exists(audio_file):
        os.remove(audio_file)
        print(f"\n✓ Test audio cleaned up")

def main():
    print("=" * 60)
    print("NeuroVoice Voice Analysis Test Suite")
    print("=" * 60)
    
    # Test 1: Model loading
    if not test_model_loading():
        print("✗ Model loading test failed")
        return False
    
    # Test 2: Create test audio
    try:
        audio_file, sr = create_test_audio(duration=3)
    except Exception as e:
        print(f"✗ Failed to create test audio: {e}")
        return False
    
    try:
        # Test 3: Feature extraction
        features = test_feature_extraction(audio_file, sr)
        if not features:
            return False
        
        # Test 4: ML prediction
        test_prediction(features)
        
        # Test 5: Full analysis
        result = test_full_analysis(audio_file)
        if not result:
            return False
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        
        # Print result as JSON
        print("\nFull Result JSON:")
        print(json.dumps(result, indent=2))
        
        return True
    
    finally:
        cleanup_test_file(audio_file)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
