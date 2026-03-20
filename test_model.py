#!/usr/bin/env python3
"""
NeuroVoice Parkinson's Detection - Standalone Testing Script

This script allows you to:
1. Test the trained ML model locally without Flask
2. Make predictions on audio files
3. Inspect extracted features
4. Validate model performance

Usage:
    python test_model.py <path_to_audio_file.wav>
    python test_model.py --batch patient1.wav patient2.wav patient3.wav
"""

import sys
import os
import argparse
import json
import joblib
import numpy as np
import librosa
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from neurovoice_backend.services.predict_service_ml import (
    extract_voice_features, 
    predict_audio,
    load_model
)


class ModelTester:
    """Test utility for Parkinson's detection model"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.config = None
        self.load_models()
    
    def load_models(self):
        """Load model, scaler, and configuration"""
        models_dir = Path(__file__).parent / 'neurovoice-backend' / 'models'
        
        model_path = models_dir / 'parkinsons_model.pkl'
        scaler_path = models_dir / 'parkinsons_scaler.pkl'
        config_path = models_dir / 'parkinsons_features.json'
        
        if not all(p.exists() for p in [model_path, scaler_path, config_path]):
            print("⚠ Model files not found. Run training in Google Colab first.")
            print(f"Expected location: {models_dir}/")
            print("Files needed:")
            print("  - parkinsons_model.pkl")
            print("  - parkinsons_scaler.pkl")
            print("  - parkinsons_features.json")
            return False
        
        try:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            with open(config_path, 'r') as f:
                self.config = json.load(f)
            
            print("✓ Model loaded successfully")
            print(f"  Type: {self.config.get('model_type')}")
            print(f"  Accuracy: {self.config.get('accuracy', 'N/A')}")
            print(f"  F1 Score: {self.config.get('f1_score', 'N/A')}")
            print(f"  ROC AUC: {self.config.get('roc_auc', 'N/A')}")
            return True
            
        except Exception as e:
            print(f"✗ Error loading models: {e}")
            return False
    
    def predict(self, audio_file):
        """Predict from audio file"""
        if not os.path.exists(audio_file):
            print(f"✗ Audio file not found: {audio_file}")
            return None
        
        try:
            # Use the predict_audio function from service
            result = predict_audio(audio_file)
            return result
        except Exception as e:
            print(f"✗ Error during prediction: {e}")
            return None
    
    def extract_and_display_features(self, audio_file):
        """Extract and display voice features"""
        try:
            y, sr = librosa.load(audio_file, sr=None, mono=True)
            features = extract_voice_features(y, sr)
            
            print("\n📊 Extracted Voice Features:")
            print("=" * 60)
            
            # Group features by category
            categories = {
                'Pitch': ['MDVP:Fo(Hz)', 'MDVP:Fhi(Hz)', 'MDVP:Flo(Hz)'],
                'Jitter': ['MDVP:Jitter(%)', 'MDVP:Jitter(Abs)', 'MDVP:RAP', 'MDVP:PPQ', 'Jitter:DDP'],
                'Shimmer': ['MDVP:Shimmer', 'MDVP:Shimmer(dB)', 'Shimmer:APQ3', 'Shimmer:APQ5', 'MDVP:APQ', 'Shimmer:DDA'],
                'Noise': ['NHR', 'HNR'],
                'Nonlinear': ['RPDE', 'D2', 'DFA'],
                'Spread': ['spread1', 'spread2', 'PPE']
            }
            
            for category, feature_list in categories.items():
                print(f"\n{category}:")
                for feature in feature_list:
                    if feature in features:
                        value = features[feature]
                        print(f"  {feature}: {value:.4f}")
            
            return features
            
        except Exception as e:
            print(f"✗ Error extracting features: {e}")
            return None
    
    def compare_predictions(self, audio_files):
        """Compare predictions across multiple audio files"""
        if not audio_files:
            print("✗ No audio files provided")
            return
        
        results = []
        
        print("\n🎯 Batch Prediction Results:")
        print("=" * 80)
        
        for idx, audio_file in enumerate(audio_files, 1):
            print(f"\n[{idx}/{len(audio_files)}] Processing: {audio_file}")
            
            result = self.predict(audio_file)
            if result:
                results.append({
                    'file': audio_file,
                    'risk_score': result.get('risk_score'),
                    'risk_level': result.get('risk_level'),
                    'confidence': result.get('model_confidence')
                })
                
                self._display_result(result)
        
        # Summary
        if results:
            self._display_summary(results)
        
        return results
    
    def _display_result(self, result):
        """Display prediction result"""
        if 'error' in result:
            print(f"  ✗ Error: {result['error']}")
            return
        
        # Color coding for risk level
        risk_level = result.get('risk_level')
        score = result.get('risk_score', 0)
        confidence = result.get('model_confidence', 0)
        
        # Risk level symbols
        if risk_level == "High Risk":
            symbol = "🔴"
        elif risk_level == "Moderate Risk":
            symbol = "🟡"
        else:
            symbol = "🟢"
        
        print(f"  {symbol} Risk Level: {risk_level}")
        print(f"  📊 Risk Score: {score}%")
        print(f"  🎯 Model Confidence: {confidence}%")
        print(f"  💬 {result.get('explanation', 'N/A')}")
        
        # Display key features
        features = result.get('vocal_features', {})
        if features:
            print(f"  📈 Key Features:")
            print(f"      Jitter: {features.get('jitter', 'N/A')}%")
            print(f"      Shimmer: {features.get('shimmer', 'N/A')}")
            print(f"      F0 Mean: {features.get('f0_mean', 'N/A')} Hz")
            print(f"      HNR: {features.get('hnr', 'N/A')} dB")
            print(f"      RPDE: {features.get('rpde', 'N/A')}")
    
    def _display_summary(self, results):
        """Display summary of batch results"""
        print("\n" + "=" * 80)
        print("📋 SUMMARY")
        print("=" * 80)
        
        high_risk = sum(1 for r in results if r['risk_level'] == "High Risk")
        moderate_risk = sum(1 for r in results if r['risk_level'] == "Moderate Risk")
        low_risk = len(results) - high_risk - moderate_risk
        
        print(f"Total Files Processed: {len(results)}")
        print(f"  🔴 High Risk: {high_risk}")
        print(f"  🟡 Moderate Risk: {moderate_risk}")
        print(f"  🟢 Low Risk: {low_risk}")
        
        # Average scores
        avg_score = np.mean([r['risk_score'] for r in results])
        avg_confidence = np.mean([r['confidence'] for r in results])
        
        print(f"\nAverage Risk Score: {avg_score:.2f}%")
        print(f"Average Confidence: {avg_confidence:.2f}%")
        
        # List high risk cases
        if high_risk > 0:
            print(f"\n⚠️  High Risk Cases:")
            for r in results:
                if r['risk_level'] == "High Risk":
                    print(f"   - {r['file']}: {r['risk_score']}% confidence {r['confidence']}%")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='NeuroVoice Parkinson\'s Detection Model Tester',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single file prediction
  python test_model.py patient_voice.wav
  
  # Batch prediction
  python test_model.py --batch patient1.wav patient2.wav patient3.wav
  
  # Extract and display features
  python test_model.py patient_voice.wav --features
  
  # Full analysis
  python test_model.py patient_voice.wav --verbose
        """
    )
    
    parser.add_argument('files', nargs='*', help='Audio file(s) to process')
    parser.add_argument('--batch', action='store_true', help='Process multiple files')
    parser.add_argument('--features', action='store_true', help='Extract and display features')
    parser.add_argument('--verbose', action='store_true', help='Show detailed output')
    parser.add_argument('--model-info', action='store_true', help='Display model information and exit')
    
    args = parser.parse_args()
    
    # Initialize tester
    tester = ModelTester()
    
    # Display model info and exit
    if args.model_info:
        return
    
    # Get audio files from command line
    audio_files = args.files
    
    if not audio_files and not args.model_info:
        print("No audio files provided.")
        print("\nUsage: python test_model.py <audio_file.wav> [options]")
        print("       python test_model.py --batch file1.wav file2.wav file3.wav")
        print("\nFor more help: python test_model.py --help")
        return
    
    # Process single file with feature extraction
    if len(audio_files) == 1 and args.features:
        print(f"\n🎵 Analyzing: {audio_files[0]}")
        print("=" * 60)
        
        # Extract features
        features = tester.extract_and_display_features(audio_files[0])
        
        # Make prediction
        result = tester.predict(audio_files[0])
        if result and 'error' not in result:
            print("\n🎯 Prediction Results:")
            print("=" * 60)
            tester._display_result(result)
    
    # Batch processing
    elif args.batch or len(audio_files) > 1:
        tester.compare_predictions(audio_files)
    
    # Single file processing
    elif len(audio_files) == 1:
        print(f"\n🎵 Analyzing: {audio_files[0]}")
        print("=" * 60)
        
        result = tester.predict(audio_files[0])
        if result and 'error' not in result:
            tester._display_result(result)
            
            if args.verbose:
                print("\n📊 Verbose Output:")
                print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
