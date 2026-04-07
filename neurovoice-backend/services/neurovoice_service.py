"""
NeuroVoice CNN-LSTM Keras Model Prediction Service
Handles 15-second audio files by splitting into three 3-second segments
and processing with the trained CNN-LSTM model for Parkinson's detection
"""

import numpy as np
import librosa
import tensorflow as tf
import os
import warnings
warnings.filterwarnings('ignore')

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


def load_keras_model():
    """Load the trained CNN-LSTM Keras model"""
    global model
    
    try:
        model_path = os.path.join(MODEL_FOLDER, MODEL_FILE)
        
        if os.path.exists(model_path):
            model = tf.keras.models.load_model(model_path)
            print(f"✓ Keras model '{MODEL_FILE}' loaded successfully.")
            return True
        else:
            print(f"! Model file not found at {model_path}")
            print(f"Available models: {os.listdir(MODEL_FOLDER) if os.path.exists(MODEL_FOLDER) else 'No models folder'}")
            model = None
            return False
            
    except Exception as e:
        print(f"Error loading Keras model: {e}")
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
    
    Args:
        audio_file_path: Path to the audio file
        
    Returns:
        Dictionary with predictions and analysis
    """
    global model
    
    if model is None:
        if not load_keras_model():
            return {
                "error": "Model not loaded. Please upload the trained model.",
                "status": "Healthy",
                "risk_score": 0,
                "risk_level": "Unknown",
                "model_available": False
            }
    
    try:
        # Load audio file
        audio_signal, sr = librosa.load(audio_file_path, sr=SR)
        
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
            "message": "Model not loaded"
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
