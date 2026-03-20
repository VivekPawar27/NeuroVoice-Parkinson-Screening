import numpy as np
import librosa
import joblib
import json
import os
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Global model variables
model = None
scaler = None
features_config = None
MODEL_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')


def load_model():
    """Load the trained ML model, scaler, and feature configuration"""
    global model, scaler, features_config
    
    try:
        model_path = os.path.join(MODEL_FOLDER, 'parkinsons_model.pkl')
        scaler_path = os.path.join(MODEL_FOLDER, 'parkinsons_scaler.pkl')
        config_path = os.path.join(MODEL_FOLDER, 'parkinsons_features.json')
        
        if os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(config_path):
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            
            with open(config_path, 'r') as f:
                features_config = json.load(f)
            
            print("ML model loaded successfully")
            return True
        else:
            print("Model files not found. Will use heuristic predictions.")
            return False
            
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None
        scaler = None
        features_config = None
        return False


def extract_oxford_features(y, sr):
    """Extract the 22 features from Oxford Parkinson's Dataset"""
    try:
        features_dict = {}
        
        # MFCC features (1-13)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)
        for i in range(13):
            features_dict[f'MFCC_{i+1}'] = float(mfcc_mean[i])
        
        # Fundamental frequency (F0) - feature 14
        f0 = librosa.yin(y, fmin=75, fmax=300, sr=sr)
        f0_voiced = f0[f0 > 0]
        if len(f0_voiced) > 0:
            features_dict['F0'] = float(np.mean(f0_voiced))
        else:
            features_dict['F0'] = 0.0
        
        # Jitter (pitch variation) - feature 15
        if len(f0_voiced) > 1:
            f0_diff = np.abs(np.diff(f0_voiced))
            jitter = np.mean(f0_diff) / np.mean(f0_voiced) if np.mean(f0_voiced) > 0 else 0
            features_dict['Jitter'] = float(jitter)
        else:
            features_dict['Jitter'] = 0.0
        
        # Shimmer (amplitude variation) - feature 16
        frame_length = 2048
        hop_length = 512
        frames = librosa.util.frame(y, frame_length=frame_length, hop_length=hop_length)
        frame_energy = np.sqrt(np.mean(frames**2, axis=0))
        
        if len(frame_energy) > 1:
            energy_diff = np.abs(np.diff(frame_energy))
            shimmer = np.mean(energy_diff) / np.mean(frame_energy) if np.mean(frame_energy) > 0 else 0
            features_dict['Shimmer'] = float(shimmer)
        else:
            features_dict['Shimmer'] = 0.0
        
        # Non-vocal frames ratio - feature 17
        S = librosa.magphase(librosa.stft(y, n_fft=2048))[0]
        energy = np.sqrt(np.mean(S**2, axis=0))
        threshold = np.mean(energy) * 0.1
        non_vocal = np.sum(energy < threshold) / len(energy) if len(energy) > 0 else 0
        features_dict['NHR'] = float(non_vocal)
        
        # HNR (Harmonics-to-Noise Ratio) - feature 18
        harmonic_frames = np.sum(energy >= threshold)
        hnr = harmonic_frames / len(energy) if len(energy) > 0 else 0
        features_dict['HNR'] = float(hnr)
        
        # RPDE (Recurrence Period Density Entropy) - feature 19
        # Simplified calculation
        rpde = float(np.std(y) / (np.mean(np.abs(y)) + 1e-10))
        features_dict['RPDE'] = min(float(rpde), 1.0)
        
        # DFA (Detrended Fluctuation Analysis) - feature 20
        # Simplified calculation using autocorrelation
        if len(y) > 100:
            autocorr = np.correlate(y - np.mean(y), y - np.mean(y), mode='full')
            autocorr = autocorr[len(autocorr)//2:]
            dfa = float(np.log(autocorr[50]) / np.log(50)) if autocorr[50] > 0 else 0
            features_dict['DFA'] = min(abs(dfa), 1.0)
        else:
            features_dict['DFA'] = 0.0
        
        # PPE (Pitch Period Entropy) - feature 21
        if len(f0_voiced) > 1:
            f0_normalized = (f0_voiced - np.mean(f0_voiced)) / (np.std(f0_voiced) + 1e-10)
            ppe = float(-np.sum(f0_normalized**2 * np.log(np.abs(f0_normalized) + 1e-10)) / len(f0_normalized))
            features_dict['PPE'] = min(abs(ppe), 1.0)
        else:
            features_dict['PPE'] = 0.0
        
        # Status (target variable, not used for prediction) - feature 22
        features_dict['Status'] = 0.0
        
        return features_dict
        
    except Exception as e:
        print(f"Error extracting features: {e}")
        return {}


def predict_with_ml_model(features_dict):
    """Make prediction using the loaded ML model"""
    global model, scaler, features_config
    
    if model is None or scaler is None or features_config is None:
        return None
    
    try:
        # Get feature names in the correct order from config
        feature_names = features_config.get('features', [])
        
        # Extract features in the correct order
        feature_values = []
        for feature_name in feature_names:
            if feature_name in features_dict:
                feature_values.append(features_dict[feature_name])
            else:
                feature_values.append(0.0)
        
        # Scale features
        X = np.array([feature_values])
        X_scaled = scaler.transform(X)
        
        # Make prediction
        prediction = model.predict(X_scaled)[0]
        probability = model.predict_proba(X_scaled)[0]
        
        return {
            'prediction': int(prediction),
            'probability_healthy': float(probability[0]),
            'probability_parkinsons': float(probability[1])
        }
        
    except Exception as e:
        print(f"Error in ML prediction: {e}")
        return None


def calculate_parkinsons_risk_heuristic(features_dict):
    """
    Fallback heuristic-based risk calculation when ML model is not available
    """
    risk_score = 0.0
    
    # Weighted feature importance for Parkinson's detection
    jitter = features_dict.get('Jitter', 0)
    risk_score += min(jitter * 100, 30) * 1.5  # Higher weight for jitter
    
    shimmer = features_dict.get('Shimmer', 0)
    risk_score += min(shimmer * 100, 20) * 1.2
    
    # NHR (higher non-vocal ratio indicates issues)
    nhr = features_dict.get('NHR', 0)
    risk_score += min(nhr * 50, 15) * 1.3
    
    # RPDE (recurrence analysis)
    rpde = features_dict.get('RPDE', 0)
    risk_score += min(rpde * 30, 15) * 0.8
    
    # DFA (fluctuation analysis)
    dfa = features_dict.get('DFA', 0)
    risk_score += min(dfa * 30, 15) * 0.9
    
    # PPE (pitch period entropy)
    ppe = features_dict.get('PPE', 0)
    risk_score += min(ppe * 30, 15) * 0.7
    
    # Normalize to 0-100
    risk_score = max(0, min(100, risk_score))
    
    return risk_score


def predict_audio(filepath):
    """
    Main prediction function for audio analysis using ML model or heuristic fallback
    
    Args:
        filepath: Path to audio file
        
    Returns:
        Dictionary with prediction results
    """
    try:
        # Load audio file
        y, sr = librosa.load(filepath, sr=None, mono=True)
        
        # Ensure minimum audio length
        if len(y) < sr:
            return {
                "error": "Audio file too short. Please record at least 1 second.",
                "risk_score": 0,
                "risk_level": "Invalid",
            }
        
        # Extract Oxford features
        features_dict = extract_oxford_features(y, sr)
        
        if not features_dict:
            return {
                "error": "Failed to extract audio features",
                "risk_score": 0,
                "risk_level": "Error"
            }
        
        # Try ML model prediction first
        ml_result = predict_with_ml_model(features_dict)
        
        if ml_result is not None:
            # Use ML model prediction
            parkinsons_probability = ml_result['probability_parkinsons']
            risk_score = parkinsons_probability * 100
            
            model_used = True
        else:
            # Fall back to heuristic
            risk_score = calculate_parkinsons_risk_heuristic(features_dict)
            model_used = False
        
        risk_score = round(risk_score, 2)
        
        # Determine risk level
        if risk_score < 30:
            risk_level = "Low Risk"
        elif risk_score < 60:
            risk_level = "Moderate Risk"
        else:
            risk_level = "High Risk"
        
        # Generate explanation based on features
        explanations = []
        
        jitter = features_dict.get('Jitter', 0)
        if jitter > 0.01:
            explanations.append(f"Elevated pitch variation (jitter: {jitter:.4f}) detected")
        
        shimmer = features_dict.get('Shimmer', 0)
        if shimmer > 0.01:
            explanations.append(f"Amplitude irregularities (shimmer: {shimmer:.4f}) detected")
        
        nhr = features_dict.get('NHR', 0)
        if nhr > 0.3:
            explanations.append(f"Noise-related issues detected (NHR: {nhr:.2f})")
        
        rpde = features_dict.get('RPDE', 0)
        if rpde > 0.5:
            explanations.append(f"Abnormal recurrence patterns detected")
        
        if not explanations:
            explanations = ["Relatively stable vocal patterns detected"]
        
        explanation = "; ".join(explanations[:3])
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "explanation": explanation,
            "model_used": "ML Model" if model_used else "Heuristic",
            "vocal_features": {
                "jitter": round(features_dict.get('Jitter', 0), 4),
                "shimmer": round(features_dict.get('Shimmer', 0), 4),
                "nhr": round(features_dict.get('NHR', 0), 2),
                "hnr": round(features_dict.get('HNR', 0), 2),
                "rpde": round(features_dict.get('RPDE', 0), 4),
                "dfa": round(features_dict.get('DFA', 0), 4),
                "ppe": round(features_dict.get('PPE', 0), 4),
                "f0": round(features_dict.get('F0', 0), 2)
            },
            "all_features": features_dict
        }
        
    except Exception as e:
        print(f"Error in predict_audio: {e}")
        return {
            "error": f"Prediction failed: {str(e)}",
            "risk_score": 0,
            "risk_level": "Error"
        }


# Load model on module import
load_model()
