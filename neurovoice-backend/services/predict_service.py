import numpy as np
import librosa
import psycopg2
from config import DB_CONFIG
from scipy.signal import medfilt
from scipy.stats import skew, kurtosis
import warnings
warnings.filterwarnings('ignore')

def save_to_db(filename, risk_score, risk_level, vocal_features=None):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        cur.execute(
            "INSERT INTO patients (filename, risk_score, risk_level) VALUES (%s, %s, %s)",
            (filename, risk_score, risk_level)
        )
        
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Database error: {e}")


def extract_pitch_features(y, sr):
    """Extract fundamental frequency (F0) and pitch-related features"""
    try:
        # Estimate pitch using librosa
        f0 = librosa.yin(y, fmin=75, fmax=300, sr=sr)
        
        # Remove unvoiced frames (0 values)
        f0_voiced = f0[f0 > 0]
        
        if len(f0_voiced) == 0:
            return {
                'f0_mean': 0,
                'f0_std': 0,
                'f0_range': 0,
                'jitter': 0
            }
        
        # Calculate F0 features
        f0_mean = np.mean(f0_voiced)
        f0_std = np.std(f0_voiced)
        f0_range = np.max(f0_voiced) - np.min(f0_voiced)
        
        # Jitter: pitch variation (short-term pitch variation)
        if len(f0_voiced) > 1:
            f0_diff = np.abs(np.diff(f0_voiced))
            jitter = np.mean(f0_diff) / f0_mean if f0_mean > 0 else 0
        else:
            jitter = 0
        
        return {
            'f0_mean': float(f0_mean),
            'f0_std': float(f0_std),
            'f0_range': float(f0_range),
            'jitter': float(jitter * 100)  # Convert to percentage
        }
    except Exception as e:
        print(f"Error extracting pitch features: {e}")
        return {'f0_mean': 0, 'f0_std': 0, 'f0_range': 0, 'jitter': 0}


def extract_amplitude_features(y):
    """Extract amplitude-related features"""
    try:
        # RMS Energy
        rms = np.sqrt(np.mean(y**2))
        
        # Short-time energy for shimmer calculation
        frame_length = 2048
        hop_length = 512
        frames = librosa.util.frame(y, frame_length=frame_length, hop_length=hop_length)
        frame_energy = np.sqrt(np.mean(frames**2, axis=0))
        
        # Shimmer: amplitude variation
        if len(frame_energy) > 1:
            energy_diff = np.abs(np.diff(frame_energy))
            shimmer = np.mean(energy_diff) / np.mean(frame_energy) if np.mean(frame_energy) > 0 else 0
        else:
            shimmer = 0
        
        return {
            'rms_energy': float(rms),
            'mean_amplitude': float(np.mean(np.abs(y))),
            'shimmer': float(shimmer * 100)  # Convert to percentage
        }
    except Exception as e:
        print(f"Error extracting amplitude features: {e}")
        return {'rms_energy': 0, 'mean_amplitude': 0, 'shimmer': 0}


def extract_spectral_features(y, sr):
    """Extract spectral features (MFCC and others)"""
    try:
        # MFCC features
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)
        mfcc_std = np.std(mfcc, axis=1)
        
        # Spectral centroid
        spec_cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        
        # Spectral rolloff
        spec_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        
        return {
            'mfcc_mean': float(np.mean(mfcc_mean)),
            'mfcc_std': float(np.mean(mfcc_std)),
            'spec_centroid_mean': float(np.mean(spec_cent)),
            'spec_rolloff_mean': float(np.mean(spec_rolloff))
        }
    except Exception as e:
        print(f"Error extracting spectral features: {e}")
        return {
            'mfcc_mean': 0,
            'mfcc_std': 0,
            'spec_centroid_mean': 0,
            'spec_rolloff_mean': 0
        }


def extract_temporal_features(y, sr):
    """Extract temporal and statistical features"""
    try:
        # Zero crossing rate
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        
        # Speech rate (approximate based on ZCR)
        # More ZCR typically indicates faster speech
        speech_rate = float(np.mean(zcr) * 100)
        
        # Statistical features
        skewness = float(skew(y))
        kurt = float(kurtosis(y))
        
        return {
            'zcr_mean': float(np.mean(zcr)),
            'speech_rate': speech_rate,
            'skewness': skewness,
            'kurtosis': kurt
        }
    except Exception as e:
        print(f"Error extracting temporal features: {e}")
        return {
            'zcr_mean': 0,
            'speech_rate': 0,
            'skewness': 0,
            'kurtosis': 0
        }


def detect_tremor(y, sr):
    """Detect voice tremor (involuntary modulation of loudness/pitch)"""
    try:
        # Frame-based analysis
        frame_length = 2048
        hop_length = 512
        S = librosa.magphase(librosa.stft(y, n_fft=2048))[0]
        
        # Energy contour
        energy = np.sqrt(np.mean(S**2, axis=0))
        
        # Look for periodic modulation in the 3-8 Hz range (typical tremor)
        # Calculate the spectral centroid of the energy envelope
        if len(energy) > 1:
            energy_normalized = (energy - np.mean(energy)) / np.std(energy)
            # FFT of energy envelope
            energy_fft = np.abs(np.fft.fft(energy_normalized))
            freq_resolution = sr / len(energy_normalized)
            
            # Check for tremor in 3-8 Hz band
            tremor_band = energy_fft[int(3/freq_resolution):int(8/freq_resolution)]
            tremor_index = float(np.max(tremor_band) if len(tremor_band) > 0 else 0)
        else:
            tremor_index = 0
        
        return {'tremor_index': tremor_index}
    except Exception as e:
        print(f"Error detecting tremor: {e}")
        return {'tremor_index': 0}


def calculate_parkinsons_risk(features):
    """Calculate Parkinson's disease risk based on vocal features"""
    
    # Weighted feature importance for Parkinson's detection
    risk_score = 0.0
    
    # Jitter is a strong indicator (higher = more risk)
    jitter = features.get('jitter', 0)
    risk_score += min(jitter, 30) * 1.5  # Higher weight for jitter
    
    # Shimmer is also important
    shimmer = features.get('shimmer', 0)
    risk_score += min(shimmer, 20) * 1.2
    
    # Pitch variation (F0 std)
    f0_std = features.get('f0_std', 0)
    risk_score += min(f0_std / 2, 15) * 0.8
    
    # Tremor detection
    tremor = features.get('tremor_index', 0)
    risk_score += min(tremor * 5, 15) * 1.3
    
    # Speech rate changes
    speech_rate = features.get('speech_rate', 0)
    # Abnormal speech rates (too high variance) indicate issues
    risk_score += min(abs(speech_rate - 50) / 20, 10) * 0.6
    
    # Spectral features
    mfcc_std = features.get('mfcc_std', 0)
    risk_score += min(mfcc_std, 10) * 0.5
    
    # RMS energy (lower energy can indicate voice issues)
    rms = features.get('rms_energy', 0)
    if rms < 0.02:
        risk_score += 10
    elif rms > 0.15:
        risk_score += 5  # Very loud voice can also indicate issues
    
    # Normalize to 0-100
    risk_score = max(0, min(100, risk_score))
    
    return risk_score


def predict_audio(filepath):
    """Main prediction function for audio analysis"""
    try:
        # Load audio file
        y, sr = librosa.load(filepath, sr=None, mono=True)
        
        # Ensure minimum audio length (at least 1 second)
        if len(y) < sr:
            return {
                "error": "Audio file too short. Please record at least 1 second.",
                "risk_score": 0,
                "risk_level": "Invalid",
            }
        
        # Extract all features
        pitch_features = extract_pitch_features(y, sr)
        amplitude_features = extract_amplitude_features(y)
        spectral_features = extract_spectral_features(y, sr)
        temporal_features = extract_temporal_features(y, sr)
        tremor_features = detect_tremor(y, sr)
        
        # Combine all features
        all_features = {
            **pitch_features,
            **amplitude_features,
            **spectral_features,
            **temporal_features,
            **tremor_features
        }
        
        # Calculate risk score
        risk_score = calculate_parkinsons_risk(all_features)
        risk_score = round(risk_score, 2)
        
        # Determine risk level
        if risk_score < 30:
            risk_level = "Low Risk"
        elif risk_score < 60:
            risk_level = "Moderate Risk"
        else:
            risk_level = "High Risk"
        
        # Generate explanation
        explanations = []
        if all_features.get('jitter', 0) > 5:
            explanations.append("Elevated pitch variation (jitter) detected")
        if all_features.get('shimmer', 0) > 5:
            explanations.append("Amplitude irregularities (shimmer) detected")
        if all_features.get('tremor_index', 0) > 0.5:
            explanations.append("Voice tremor patterns identified")
        if all_features.get('f0_std', 0) > 30:
            explanations.append("High fundamental frequency variation")
        
        if not explanations:
            explanations = ["Stable vocal patterns detected"]
        
        explanation = "; ".join(explanations[:3])  # Limit to 3 main findings
        
        # Save to database
        save_to_db(filepath, risk_score, risk_level, all_features)
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "explanation": explanation,
            "vocal_features": {
                "jitter": round(all_features.get('jitter', 0), 2),
                "shimmer": round(all_features.get('shimmer', 0), 2),
                "f0_mean": round(all_features.get('f0_mean', 0), 2),
                "f0_std": round(all_features.get('f0_std', 0), 2),
                "tremor_index": round(all_features.get('tremor_index', 0), 4),
                "speech_rate": round(all_features.get('speech_rate', 0), 2),
                "rms_energy": round(all_features.get('rms_energy', 0), 4),
                "mfcc_mean": round(all_features.get('mfcc_mean', 0), 2)
            }
        }
    
    except Exception as e:
        print(f"Error in audio analysis: {e}")
        return {
            "error": f"Error analyzing audio: {str(e)}",
            "risk_score": 0,
            "risk_level": "Error"
        }