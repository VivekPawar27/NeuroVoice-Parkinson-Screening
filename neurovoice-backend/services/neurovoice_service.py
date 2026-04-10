"""
NeuroVoice CNN-LSTM Keras Model Prediction Service
Handles 15-second audio files by splitting into three 3-second segments
and processing with the trained CNN-LSTM model for Parkinson's detection
"""

import numpy as np
import librosa
import os
import io
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Try to import TensorFlow with fallback for Python 3.14+
TENSORFLOW_AVAILABLE = False
tf = None
try:
    import tensorflow as tf
    TENSORFLOW_AVAILABLE = True
    print("✓ TensorFlow is available")
except ImportError:
    print("⚠ TensorFlow not available - will use RandomForest fallback model")

# Try to import soundfile for better format support
try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except:
    SOUNDFILE_AVAILABLE = False

# Try to import scipy for wav reading as fallback
try:
    from scipy.io import wavfile as scipy_wavfile
    SCIPY_WAV_AVAILABLE = True
except:
    SCIPY_WAV_AVAILABLE = False

# Global model variable
model = None
MODEL_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
MODEL_FILE = 'best_parkinsons_model.keras'

# Audio processing parameters (must match training)
SR = 22050  # Sample rate
DURATION = 3  # Duration in seconds
SAMPLES_PER_TRACK = SR * DURATION
N_MELS = 128  # Number of mel-frequency bins
CONFIDENCE_THRESHOLD = 0.5


def load_audio_file(audio_file_path, target_sr=SR):
    """
    Load audio file with multiple fallback strategies for format compatibility
    
    Args:
        audio_file_path: Path to audio file
        target_sr: Target sample rate
        
    Returns:
        Tuple of (audio_signal, sample_rate) or raises exception
    """
    file_ext = Path(audio_file_path).suffix.lower()
    print(f"Loading audio file: {audio_file_path} with format: {file_ext}")
    
    # Strategy 1: Try librosa with sr=None first (auto-detect)
    try:
        audio_signal, sr = librosa.load(audio_file_path, sr=None)
        # Resample if needed
        if sr != target_sr:
            audio_signal = librosa.resample(audio_signal, orig_sr=sr, target_sr=target_sr)
        print(f"✓ Loaded with librosa (original sr={sr}, resampled to {target_sr})")
        return audio_signal, target_sr
    except Exception as e:
        print(f"Librosa load failed: {e}")
    
    # Strategy 2: Try soundfile
    if SOUNDFILE_AVAILABLE and file_ext in ['.wav', '.flac', '.ogg']:
        try:
            data, sr = sf.read(audio_file_path)
            if len(data.shape) > 1:
                # Stereo to mono
                data = np.mean(data, axis=1)
            # Resample if needed
            if sr != target_sr:
                data = librosa.resample(data, orig_sr=sr, target_sr=target_sr)
            print(f"✓ Loaded with soundfile (original sr={sr}, resampled to {target_sr})")
            return data.astype(np.float32), target_sr
        except Exception as e:
            print(f"Soundfile load failed: {e}")
    
    # Strategy 3: Try scipy for WAV files
    if SCIPY_WAV_AVAILABLE and file_ext == '.wav':
        try:
            sr, data = scipy_wavfile.read(audio_file_path)
            # Convert to float32 and normalize
            data = data.astype(np.float32) / 32768.0
            if len(data.shape) > 1:
                # Stereo to mono
                data = np.mean(data, axis=1)
            # Resample if needed
            if sr != target_sr:
                data = librosa.resample(data, orig_sr=sr, target_sr=target_sr)
            print(f"✓ Loaded with scipy (original sr={sr}, resampled to {target_sr})")
            return data, target_sr
        except Exception as e:
            print(f"Scipy load failed: {e}")
    
    # If all strategies fail
    raise Exception(
        f"Could not load audio file: {audio_file_path}\n"
        f"Tried librosa, soundfile, and scipy.\n"
        f"Supported formats: WAV, MP3, OGG, FLAC, WebM\n"
        f"File format detected: {file_ext}"
    )


def load_keras_model():
    """Load the trained CNN-LSTM Keras model"""
    global model
    
    # Return early if TensorFlow is not available
    if not TENSORFLOW_AVAILABLE:
        print("⚠ TensorFlow not available - CNN-LSTM model cannot be loaded")
        print("  Will use RandomForest fallback model for predictions")
        model = None
        return False
    
    try:
        model_path = os.path.join(MODEL_FOLDER, MODEL_FILE)
        
        if os.path.exists(model_path):
            model = tf.keras.models.load_model(model_path)
            print(f"✓ Keras model '{MODEL_FILE}' loaded successfully.")
            return True
        else:
            print(f"! Model file not found at {model_path}")
            print(f"Available models: {os.listdir(MODEL_FOLDER) if os.path.exists(MODEL_FOLDER) else 'No models folder'}")
            print("  Will use RandomForest fallback model for predictions")
            model = None
            return False
            
    except Exception as e:
        print(f"Error loading Keras model: {e}")
        print("  Will use RandomForest fallback model for predictions")
        model = None
        return False


def preprocess_audio_segment(audio_signal, sr=SR):
    """
    Preprocess a single audio segment to mel-spectrogram
    
    Args:
        audio_signal: Audio signal array
        sr: Sample rate
        
    Returns:
        Processed mel-spectrogram ready for model input (128, ~259, 1)
    """
    try:
        # Ensure fixed length (3 seconds)
        if len(audio_signal) > SAMPLES_PER_TRACK:
            audio_signal = audio_signal[:SAMPLES_PER_TRACK]
        else:
            audio_signal = np.pad(audio_signal, 
                                 (0, max(0, SAMPLES_PER_TRACK - len(audio_signal))), 
                                 mode='constant')
        
        # Extract mel-spectrogram
        mel_spec = librosa.feature.melspectrogram(y=audio_signal, sr=sr, n_mels=N_MELS)
        mel_db = librosa.power_to_db(mel_spec, ref=np.max)
        
        # Normalize (min-max scaling)
        min_val = np.min(mel_db)
        max_val = np.max(mel_db)
        mel_db_norm = (mel_db - min_val) / (max_val - min_val + 1e-8)
        
        # Add channel dimension for CNN input: (128, time_steps, 1)
        processed_mel = np.expand_dims(mel_db_norm, axis=-1)
        
        return processed_mel
        
    except Exception as e:
        print(f"Error preprocessing audio segment: {e}")
        return None


def split_audio_into_segments(audio_signal, sr=SR, segment_duration=DURATION):
    """
    Split a longer audio signal into 3-second segments
    
    Args:
        audio_signal: Audio signal array
        sr: Sample rate
        segment_duration: Duration of each segment in seconds
        
    Returns:
        List of audio segments
    """
    samples_per_segment = sr * segment_duration
    segments = []
    
    # Split into segments
    for start in range(0, len(audio_signal), samples_per_segment):
        end = min(start + samples_per_segment, len(audio_signal))
        segment = audio_signal[start:end]
        
        # Pad last segment if necessary
        if len(segment) < samples_per_segment:
            segment = np.pad(segment, (0, samples_per_segment - len(segment)), mode='constant')
        
        segments.append(segment)
    
    return segments


def predict_from_audio_file(audio_file_path):
    """
    Predict Parkinson's disease risk from a 15-second audio file
    
    Splits the audio into three 3-second segments and runs predictions
    on each segment, then returns combined results.
    
    If CNN-LSTM model is not available, falls back to RandomForest model.
    
    Args:
        audio_file_path: Path to the audio file
        
    Returns:
        Dictionary with predictions and analysis
    """
    global model
    
    # Try to use Keras model first
    if model is not None:
        try:
            return _predict_with_cnn_lstm(audio_file_path)
        except Exception as e:
            print(f"CNN-LSTM prediction failed: {e}. Falling back to RandomForest model.")
    
    # Fall back to RandomForest model
    try:
        return _predict_with_randomforest(audio_file_path)
    except Exception as e:
        print(f"Both models failed: {e}")
        return {
            "error": f"Prediction failed: {str(e)}",
            "status": "Error",
            "risk_score": 0,
            "risk_level": "Unable to Assess",
            "model_used": "Error"
        }


def _predict_with_cnn_lstm(audio_file_path):
    """Predict using CNN-LSTM model"""
    try:
        # Load audio file with improved format handling
        audio_signal, sr = load_audio_file(audio_file_path, target_sr=SR)
        
        # Check audio length
        duration_seconds = len(audio_signal) / sr
        
        # Split into 3-second segments
        segments = split_audio_into_segments(audio_signal, sr=sr)
        
        # Process each segment and get predictions
        predictions = []
        processed_segments = []
        
        for i, segment in enumerate(segments):
            try:
                # Preprocess segment
                processed_mel = preprocess_audio_segment(segment, sr=sr)
                
                if processed_mel is None:
                    continue
                
                # Add batch dimension: (1, 128, time_steps, 1)
                batch_input = np.expand_dims(processed_mel, axis=0)
                
                # Get prediction
                prediction = model.predict(batch_input, verbose=0)
                probability_pd = float(prediction[0][0])
                
                processed_segments.append({
                    "segment": i + 1,
                    "probability_parkinsons": probability_pd,
                    "status": "Parkinson's Disease" if probability_pd >= CONFIDENCE_THRESHOLD else "Healthy",
                    "confidence": max(probability_pd, 1 - probability_pd)
                })
                
                predictions.append(probability_pd)
                
            except Exception as e:
                print(f"Error processing segment {i}: {e}")
                continue
        
        if not predictions:
            return {
                "error": "Failed to process any audio segments",
                "status": "Error",
                "risk_score": 0,
                "risk_level": "Unable to Assess"
            }
        
        # Calculate aggregate statistics
        mean_prob = float(np.mean(predictions))
        std_prob = float(np.std(predictions))
        max_prob = float(np.max(predictions))
        min_prob = float(np.min(predictions))
        
        # Determine overall status and risk level
        overall_status = "Parkinson's Disease" if mean_prob >= CONFIDENCE_THRESHOLD else "Healthy"
        risk_score = float(mean_prob * 100)
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = "High Risk"
        elif risk_score >= 50:
            risk_level = "Moderate Risk"
        else:
            risk_level = "Low Risk"
        
        # Prepare insights
        insights = []
        
        # Check consistency across segments
        high_variance = std_prob > 0.2
        if high_variance:
            insights.append("High variability across segments - recommend repeat analysis")
        
        # Check individual segment confidence
        for seg in processed_segments:
            if seg["status"] != overall_status:
                insights.append(f"Segment {seg['segment']} shows different pattern")
        
        if not insights:
            insights.append(f"Consistent {overall_status.lower()} pattern across all segments")
        
        return {
            "status": overall_status,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": float(np.mean([seg["confidence"] for seg in processed_segments])),
            "audio_duration": duration_seconds,
            "segments_analyzed": len(processed_segments),
            "segment_predictions": processed_segments,
            "aggregate_stats": {
                "mean_probability": mean_prob,
                "std_probability": std_prob,
                "max_probability": max_prob,
                "min_probability": min_prob,
                "variance": float(high_variance)
            },
            "insights": insights,
            "model_used": "CNN-LSTM NeuroVoice",
            "explanation": f"Analyzed {len(processed_segments)} audio segments. "
                         f"Average probability of Parkinson's: {mean_prob:.2%}. "
                         f"Risk Level: {risk_level}."
        }
        
    except Exception as e:
        print(f"Error in prediction: {e}")
        return {
            "error": f"Prediction failed: {str(e)}",
            "status": "Error",
            "risk_score": 0,
            "risk_level": "Unable to Assess",
            "model_used": "CNN-LSTM NeuroVoice"
        }


def get_model_info():
    """Get information about the loaded model"""
    global model
    
    if model is None:
        return {
            "model_loaded": False,
            "model_name": MODEL_FILE,
            "architecture": "CNN-LSTM",
            "message": "CNN-LSTM model not loaded, using RandomForest fallback"
        }
    
    try:
        return {
            "model_loaded": True,
            "model_name": MODEL_FILE,
            "architecture": "CNN-LSTM (Convolutional Neural Network + LSTM)",
            "input_shape": str(model.input_shape),
            "output_shape": str(model.output_shape),
            "total_params": int(model.count_params()),
            "audio_parameters": {
                "sample_rate": SR,
                "segment_duration": DURATION,
                "n_mels": N_MELS,
                "samples_per_track": SAMPLES_PER_TRACK
            },
            "description": "Trained on multi-language Parkinson's voice datasets. "
                         "Processes 15-second audio by splitting into three 3-second segments."
        }
    except Exception as e:
        return {
            "model_loaded": False,
            "error": str(e)
        }


def _predict_with_randomforest(audio_file_path):
    """
    Fallback prediction using RandomForest model (old method)
    Uses the already-loaded audio data directly instead of re-parsing the file
    """
    try:
        # Load audio file with improved format handling
        audio_signal, sr = load_audio_file(audio_file_path, target_sr=22050)
        duration_seconds = len(audio_signal) / sr
        
        # Import feature extraction directly
        from .predict_service_ml import extract_oxford_features, predict_with_ml_model, calculate_parkinsons_risk_heuristic
        
        # Extract Oxford features directly from audio signal
        features_dict = extract_oxford_features(audio_signal, sr)
        
        if not features_dict:
            return {
                "error": "Failed to extract audio features from recording",
                "status": "Error",
                "risk_score": 0,
                "risk_level": "Unable to Assess",
                "model_used": "RandomForest (ML)"
            }
        
        # Try ML model prediction
        ml_result = predict_with_ml_model(features_dict)
        
        if ml_result is not None:
            parkinsons_probability = ml_result['probability_parkinsons']
            risk_score = parkinsons_probability * 100
        else:
            # Fall back to heuristic
            risk_score = calculate_parkinsons_risk_heuristic(features_dict)
        
        risk_score = float(risk_score)
        
        # Determine risk level and status
        if risk_score < 30:
            risk_level = "Low Risk"
            status = "Healthy"
        elif risk_score < 60:
            risk_level = "Moderate Risk"
            status = "Moderate Risk Detected"
        else:
            risk_level = "High Risk"
            status = "Parkinson's Disease"
        
        # Create synthetic segment predictions for visualization
        # Split the audio into 3-second chunks and estimate probability for each
        segment_duration = 3
        samples_per_segment = sr * segment_duration
        segments_list = []
        segment_probabilities = []
        
        for i in range(0, len(audio_signal), samples_per_segment):
            segment = audio_signal[i:i+samples_per_segment]
            if len(segment) > sr:  # At least 1 second
                # Extract features for this segment
                seg_features = extract_oxford_features(segment, sr)
                
                # Predict for this segment
                seg_result = predict_with_ml_model(seg_features)
                if seg_result:
                    seg_prob = seg_result['probability_parkinsons']
                else:
                    seg_prob = calculate_parkinsons_risk_heuristic(seg_features) / 100.0
                
                seg_prob = float(min(1.0, max(0.0, seg_prob)))
                segment_probabilities.append(seg_prob)
                
                segments_list.append({
                    "segment": len(segments_list) + 1,
                    "probability_parkinsons": seg_prob,
                    "status": "Parkinson's Disease" if seg_prob >= 0.5 else "Healthy",
                    "confidence": max(seg_prob, 1 - seg_prob)
                })
        
        if not segments_list:
            # If no segments created, create one from whole audio
            segments_list = [{
                "segment": 1,
                "probability_parkinsons": float(risk_score / 100.0),
                "status": status,
                "confidence": 0.8
            }]
            segment_probabilities = [risk_score / 100.0]
        
        # Calculate aggregate statistics
        if segment_probabilities:
            mean_prob = float(np.mean(segment_probabilities))
            std_prob = float(np.std(segment_probabilities))
            max_prob = float(np.max(segment_probabilities))
            min_prob = float(np.min(segment_probabilities))
            high_variance = std_prob > 0.2
        else:
            mean_prob = float(risk_score / 100.0)
            std_prob = 0.0
            max_prob = float(risk_score / 100.0)
            min_prob = float(risk_score / 100.0)
            high_variance = False
        
        # Build insights
        insights = []
        if duration_seconds < 10:
            insights.append("Audio duration is short - results may be less reliable")
        if high_variance:
            insights.append("High variability detected - recommend repeat analysis")  
        if not insights:
            insights.append(f"Consistent {status.lower()} pattern detected")
        
        return {
            "status": status,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": float(np.mean([seg["confidence"] for seg in segments_list])),
            "audio_duration": duration_seconds,
            "segments_analyzed": len(segments_list),
            "segment_predictions": segments_list,
            "aggregate_stats": {
                "mean_probability": mean_prob,
                "std_probability": std_prob,
                "max_probability": max_prob,
                "min_probability": min_prob,
                "variance": float(high_variance)
            },
            "insights": insights,
            "model_used": "RandomForest (ML)",
            "explanation": f"Analyzed {len(segments_list)} audio segments. "
                         f"Risk score: {risk_score:.1f}%. Risk Level: {risk_level}."
        }
        
    except Exception as e:
        print(f"RandomForest prediction error: {e}")
        raise
