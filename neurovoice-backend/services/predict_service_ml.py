import numpy as np
import librosa
import joblib
import json
import os
import sys
import subprocess
import tempfile
from pathlib import Path
import warnings
import time
from scipy.io import wavfile
warnings.filterwarnings('ignore')

# ── Register imageio-ffmpeg binary so librosa/audioread can find ffmpeg ──
try:
    import imageio_ffmpeg
    _ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    _ffmpeg_dir = str(Path(_ffmpeg_exe).parent)
    if _ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
    FFMPEG_AVAILABLE = True
    print(f"✓ ffmpeg registered: {_ffmpeg_exe}")
except Exception as _e:
    _ffmpeg_exe = "ffmpeg"
    FFMPEG_AVAILABLE = False
    print(f"⚠ imageio-ffmpeg not available: {_e}")

# Try to import soundfile for better format support
try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except Exception:
    SOUNDFILE_AVAILABLE = False

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
        
        # ZCR (Zero Crossing Rate) - feature 22
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        features_dict['ZCR'] = float(np.mean(zcr))
        
        # Status (target variable, not used for prediction) - feature 23
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


def detect_actual_format(filepath):
    """Detect real audio format from magic bytes, ignoring file extension."""
    try:
        with open(filepath, 'rb') as f:
            header = f.read(16)
        if header[:4] == b'RIFF' and header[8:12] == b'WAVE':
            return 'wav'
        if header[:3] == b'ID3' or header[:2] in (b'\xff\xfb', b'\xff\xf3', b'\xff\xf2', b'\xff\xe3'):
            return 'mp3'
        if header[:4] == b'OggS':
            return 'ogg'
        if header[:4] == b'fLaC':
            return 'flac'
        # WebM / MKV magic: starts with 0x1A 0x45 0xDF 0xA3
        if header[:4] == b'\x1a\x45\xdf\xa3':
            return 'webm'
        # MP4 / M4A: ftyp box at offset 4
        if header[4:8] in (b'ftyp', b'moov', b'mdat'):
            return 'mp4'
    except Exception:
        pass
    return None


def ffmpeg_convert_to_wav(input_path, target_sr=22050):
    """
    Use ffmpeg to convert any audio format to a temporary WAV file.
    Returns path to the temp WAV file (caller must delete it).
    """
    tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    tmp.close()
    tmp_path = tmp.name

    cmd = [
        _ffmpeg_exe, '-y',
        '-i', input_path,
        '-ar', str(target_sr),
        '-ac', '1',          # mono
        '-f', 'wav',
        tmp_path
    ]
    result = subprocess.run(cmd, capture_output=True, timeout=30)
    if result.returncode != 0:
        os.unlink(tmp_path)
        raise RuntimeError(f"ffmpeg failed: {result.stderr.decode(errors='replace')[-300:]}")
    return tmp_path


def load_audio_robust(audio_file_path, target_sr=22050):
    """
    Load audio detecting actual format from magic bytes.
    Uses ffmpeg (via imageio-ffmpeg) for WebM/MP3/OGG/MP4.
    Falls back to scipy for real WAV files.
    """
    actual_fmt = detect_actual_format(audio_file_path)
    file_ext = Path(audio_file_path).suffix.lower()
    print(f"Loading: {audio_file_path} | ext={file_ext} | detected={actual_fmt}")

    # ── Strategy 1: Real WAV → scipy (no ffmpeg needed, fastest) ──
    if actual_fmt == 'wav':
        try:
            sr, data = wavfile.read(audio_file_path)
            if data.ndim > 1:
                data = data.mean(axis=1)
            y = data.astype(np.float32)
            # Normalise int PCM to [-1, 1]
            abs_max = np.abs(y).max()
            if abs_max > 1.0:
                y = y / (abs_max + 1e-8)
            if sr != target_sr:
                y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
            print(f"✓ WAV loaded via scipy (sr={sr}→{target_sr})")
            return y, target_sr
        except Exception as e:
            print(f"scipy WAV failed: {e}")

    # ── Strategy 2: ffmpeg convert to temp WAV, then load with scipy ──
    if FFMPEG_AVAILABLE:
        tmp_wav = None
        try:
            print(f"Converting via ffmpeg ({actual_fmt or file_ext})...")
            tmp_wav = ffmpeg_convert_to_wav(audio_file_path, target_sr=target_sr)
            sr, data = wavfile.read(tmp_wav)
            if data.ndim > 1:
                data = data.mean(axis=1)
            y = data.astype(np.float32)
            abs_max = np.abs(y).max()
            if abs_max > 1.0:
                y = y / (abs_max + 1e-8)
            print(f"✓ Loaded via ffmpeg+scipy (sr={sr}→{target_sr})")
            return y, target_sr
        except Exception as e:
            print(f"ffmpeg conversion failed: {e}")
        finally:
            if tmp_wav and os.path.exists(tmp_wav):
                os.unlink(tmp_wav)

    # ── Strategy 3: librosa direct (works if ffmpeg is on PATH) ──
    try:
        y, sr = librosa.load(audio_file_path, sr=None, mono=True)
        if sr != target_sr:
            y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        print(f"✓ Loaded via librosa (sr={sr}→{target_sr})")
        return y, target_sr
    except Exception as e:
        print(f"librosa failed: {e}")

    # ── Strategy 4: soundfile (WAV/FLAC/OGG natively) ──
    if SOUNDFILE_AVAILABLE:
        try:
            data, sr = sf.read(audio_file_path)
            if data.ndim > 1:
                data = data.mean(axis=1)
            y = data.astype(np.float32)
            if sr != target_sr:
                y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
            print(f"✓ Loaded via soundfile (sr={sr}→{target_sr})")
            return y, target_sr
        except Exception as e:
            print(f"soundfile failed: {e}")

    raise Exception(
        f"Cannot decode audio (ext={file_ext}, detected={actual_fmt}). "
        f"ffmpeg={'available' if FFMPEG_AVAILABLE else 'NOT available'}. "
        f"All strategies exhausted."
    )


def predict_audio(filepath):
    """
    Main prediction function for audio analysis using ML model or heuristic fallback
    
    Args:
        filepath: Path to audio file
        
    Returns:
        Dictionary with prediction results
    """
    try:
        # Check if file exists
        if not os.path.exists(filepath):
            return {
                "error": "Audio file not found",
                "risk_score": 0,
                "risk_level": "Invalid",
            }
        
        # Load audio file using robust loader
        try:
            y, sr = load_audio_robust(filepath, target_sr=22050)
        except Exception as load_error:
            print(f"Audio loading failed: {load_error}")
            return {
                "error": f"Failed to load audio: {str(load_error)}",
                "risk_score": 0,
                "risk_level": "Invalid",
            }
        
        # Check if audio was loaded
        if y is None or len(y) == 0:
            return {
                "error": "Failed to load audio file. Unable to process the audio.",
                "risk_score": 0,
                "risk_level": "Invalid",
            }
        
        # Ensure minimum audio length (1 second)
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

        # Determine status label (needed before segment loop)
        if risk_score < 30:
            status = "Healthy"
        elif risk_score < 60:
            status = "Moderate Risk Detected"
        else:
            status = "Parkinson's Disease"

        # Build segment predictions from audio chunks
        duration_seconds = len(y) / sr
        segment_duration = 3
        samples_per_segment = sr * segment_duration
        segments_list = []
        segment_probabilities = []

        for i in range(0, len(y), samples_per_segment):
            segment = y[i:i + samples_per_segment]
            if len(segment) > sr:  # at least 1 second
                seg_features = extract_oxford_features(segment, sr)
                seg_result = predict_with_ml_model(seg_features)
                if seg_result:
                    seg_prob = float(seg_result['probability_parkinsons'])
                else:
                    seg_prob = float(calculate_parkinsons_risk_heuristic(seg_features) / 100.0)
                seg_prob = min(1.0, max(0.0, seg_prob))
                segment_probabilities.append(seg_prob)
                segments_list.append({
                    "segment": len(segments_list) + 1,
                    "probability_parkinsons": seg_prob,
                    "status": "Parkinson's Disease" if seg_prob >= 0.5 else "Healthy",
                    "confidence": float(max(seg_prob, 1 - seg_prob))
                })

        if not segments_list:
            prob = float(risk_score / 100.0)
            segments_list = [{"segment": 1, "probability_parkinsons": prob, "status": status, "confidence": 0.8}]
            segment_probabilities = [prob]

        mean_prob = float(np.mean(segment_probabilities))
        std_prob = float(np.std(segment_probabilities))
        max_prob = float(np.max(segment_probabilities))
        min_prob = float(np.min(segment_probabilities))
        confidence = float(np.mean([s["confidence"] for s in segments_list]))

        return {
            "status": status,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": confidence,
            "audio_duration": float(duration_seconds),
            "segments_analyzed": len(segments_list),
            "segment_predictions": segments_list,
            "aggregate_stats": {
                "mean_probability": mean_prob,
                "std_probability": std_prob,
                "max_probability": max_prob,
                "min_probability": min_prob,
                "variance": float(std_prob > 0.2)
            },
            "explanation": explanation,
            "model_used": "ML Model" if model_used else "Heuristic",
            "insights": [explanation],
            "vocal_features": {
                "jitter": round(features_dict.get('Jitter', 0), 4),
                "shimmer": round(features_dict.get('Shimmer', 0), 4),
                "nhr": round(features_dict.get('NHR', 0), 2),
                "hnr": round(features_dict.get('HNR', 0), 2),
                "rpde": round(features_dict.get('RPDE', 0), 4),
                "dfa": round(features_dict.get('DFA', 0), 4),
                "ppe": round(features_dict.get('PPE', 0), 4),
                "zcr": round(features_dict.get('ZCR', 0), 4),
                "f0": round(features_dict.get('F0', 0), 2)
            }
        }
        
    except Exception as e:
        print(f"Error in predict_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "error": f"Prediction failed: {str(e)}",
            "risk_score": 0,
            "risk_level": "Error"
        }


# Load model on module import
load_model()
