"""
NeuroVoice Backend (Test Mode) - Works without TensorFlow
Provides full API functionality with mock predictions for testing
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import numpy as np
from pathlib import Path
import librosa
import io
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
MODELS_FOLDER = 'models'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'webm', 'ogg', 'flac', 'm4a', 'aac'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(MODELS_FOLDER, exist_ok=True)

app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def mock_predict_from_audio(audio_path):
    """
    Mock prediction function for testing without TensorFlow
    Performs real audio analysis and returns realistic predictions
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=22050)
        duration = len(y) / sr
        
        # Validate duration
        if duration < 3:
            return {
                'status': 'error',
                'message': 'Audio too short. Minimum 3 seconds required.',
                'audio_duration': duration
            }
        
        # Split into 3-second segments
        segment_duration = 3
        segment_samples = segment_duration * sr
        num_segments = int(np.ceil(duration / segment_duration))
        if num_segments > 10:
            num_segments = 10  # Cap at 10 segments
        
        segment_predictions = []
        
        for i in range(num_segments):
            start_sample = i * segment_samples
            end_sample = min((i + 1) * segment_samples, len(y))
            segment = y[start_sample:end_sample]
            
            if len(segment) == 0:
                continue
            
            # Extract features for more realistic predictions
            mfcc = librosa.feature.mfcc(y=segment, sr=sr, n_mfcc=13)
            zero_crossing_rate = librosa.feature.zero_crossing_rate(segment)
            spectral_centroid = librosa.feature.spectral_centroid(y=segment, sr=sr)
            
            # Calculate probability based on features
            mfcc_variance = np.var(mfcc)
            zcr_variance = np.var(zero_crossing_rate)
            sc_variance = np.var(spectral_centroid)
            
            # Combine features for prediction (simplified model)
            feature_score = (mfcc_variance * 0.5 + zcr_variance * 0.3 + sc_variance * 0.2) / 100
            probability_pd = float(min(0.95, max(0.05, feature_score)))
            
            # Add some randomness for variation across segments
            probability_pd += np.random.normal(0, 0.05)
            probability_pd = float(np.clip(probability_pd, 0.01, 0.99))
            
            confidence = float(np.clip(0.85 + np.random.normal(0, 0.05), 0.7, 0.99))
            status = "Parkinson's Disease" if probability_pd >= 0.5 else "Healthy"
            
            segment_predictions.append({
                'segment': i + 1,
                'probability_parkinsons': probability_pd,
                'confidence': confidence,
                'status': status,
                'duration_seconds': len(segment) / sr
            })
        
        # Calculate aggregate statistics
        probabilities = [p['probability_parkinsons'] for p in segment_predictions]
        mean_prob = float(np.mean(probabilities))
        std_prob = float(np.std(probabilities))
        
        overall_status = "Parkinson's Disease" if mean_prob >= 0.5 else "Healthy"
        risk_score = int(mean_prob * 100)
        
        if risk_score < 40:
            risk_level = "Low Risk"
        elif risk_score < 70:
            risk_level = "Moderate Risk"
        else:
            risk_level = "High Risk"
        
        return {
            'status': overall_status,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'confidence': float(np.mean([p['confidence'] for p in segment_predictions])),
            'audio_duration': float(duration),
            'segments_analyzed': len(segment_predictions),
            'segment_predictions': segment_predictions,
            'aggregate_stats': {
                'mean_probability': mean_prob,
                'std_probability': std_prob,
                'max_probability': float(np.max(probabilities)),
                'min_probability': float(np.min(probabilities)),
                'variance': float(std_prob) > 0.15
            },
            'insights': [
                f"Analyzed {len(segment_predictions)} voice segments",
                f"Average Parkinson's probability: {mean_prob*100:.1f}%",
                f"Consistency score: {'High' if std_prob < 0.15 else 'Variable'}"
            ],
            'model_used': 'CNN-LSTM NeuroVoice (Test Mode)',
            'explanation': f'Test mode analysis complete. Mean prediction: {mean_prob:.2f}'
        }
        
    except Exception as e:
        return {'status': 'error', 'message': str(e)}


# Health / Status Endpoints
@app.route('/', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'NeuroVoice Backend (TEST MODE)'})


@app.route('/health', methods=['GET'])
def health_detailed():
    return jsonify({
        'status': 'running',
        'service': 'NeuroVoice Parkinson\'s Detection Backend',
        'mode': 'TEST MODE - Using mock predictions',
        'version': '3.0.0'
    })


@app.route('/api/status', methods=['GET'])
def api_status():
    return jsonify({
        'status': 'operational',
        'backend_version': '3.0.0',
        'model_status': 'test_mode',
        'api_endpoints': ['GET /api/model/info', 'POST /api/predict', 'POST /api/predict/batch'],
        'note': 'Running in TEST MODE with mock predictions'
    })


@app.route('/api/model/info', methods=['GET'])
def model_info():
    return jsonify({
        'model_name': 'CNN-LSTM NeuroVoice',
        'version': 'test_mode',
        'architecture': 'CNN (Conv2D + LSTM)',
        'input_shape': [128, 259, 1],
        'input_description': 'Mel-spectrogram (128 frequency bins, ~259 time frames)',
        'output': 'Binary Classification (Healthy vs Parkinson\'s)',
        'training_datasets': ['Italian Parkinson\'s Voice Dataset', 'Multi-language recordings'],
        'expected_accuracy': '95%+',
        'sampling_rate': 22050,
        'mel_bins': 128,
        'note': 'Running in TEST MODE'
    })


# Prediction Endpoints
@app.route('/api/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    print(f"[DEBUG] Received POST request to /api/predict")
    print(f"[DEBUG] Request files keys: {request.files.keys()}")
    print(f"[DEBUG] Request form keys: {request.form.keys()}")
    
    # Check for audio file (accept both 'audio' and 'file' field names)
    audio_file = request.files.get('audio') or request.files.get('file')
    
    if not audio_file:
        error_msg = f'No audio file provided. Available fields: {list(request.files.keys())}'
        print(f"[ERROR] {error_msg}")
        return jsonify({'error': error_msg}), 400
    
    print(f"[DEBUG] Found audio file: {audio_file.filename}")
    
    if audio_file.filename == '':
        print(f"[ERROR] Empty filename")
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(audio_file.filename):
        error_msg = f'File type not allowed. Allowed: {ALLOWED_EXTENSIONS}'
        print(f"[ERROR] {error_msg}")
        return jsonify({'error': error_msg}), 400
    
    # Save temporarily
    filename = secure_filename(audio_file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    print(f"[DEBUG] Saving file to: {filepath}")
    audio_file.save(filepath)
    
    try:
        print(f"[DEBUG] Analyzing audio file: {filename}")
        result = mock_predict_from_audio(filepath)
        
        if 'error' in result:
            print(f"[ERROR] Analysis error: {result['error']}")
            return jsonify(result), 400
        
        print(f"[DEBUG] Analysis complete, returning results")
        return jsonify(result), 200
    
    except Exception as e:
        error_msg = f'Error during analysis: {str(e)}'
        print(f"[ERROR] {error_msg}")
        return jsonify({'error': error_msg}), 500
    
    finally:
        # Cleanup
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"[DEBUG] Cleaned up temporary file: {filepath}")


@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """Batch prediction endpoint"""
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    results = []
    
    for file in files:
        if not allowed_file(file.filename):
            results.append({
                'filename': file.filename,
                'error': 'File type not allowed'
            })
            continue
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            result = mock_predict_from_audio(filepath)
            result['filename'] = filename
            results.append(result)
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
    
    return jsonify({'results': results}), 200


# Error handlers
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large. Maximum 100MB allowed.'}), 413


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


if __name__ == '__main__':
    print("\n" + "="*70)
    print("NEUROVOICE BACKEND - TEST MODE (No TensorFlow Required)")
    print("="*70)
    print("\nRunning on: http://127.0.0.1:5000")
    print("API Endpoints:")
    print("  GET  /                 - Health check")
    print("  GET  /health           - Detailed status")
    print("  GET  /api/status       - API status")
    print("  GET  /api/model/info   - Model information")
    print("  POST /api/predict      - Single prediction")
    print("  POST /api/predict/batch - Batch predictions")
    print("\nNote: Running in TEST MODE with realistic mock predictions")
    print("="*70 + "\n")
    
    app.run(debug=False, host='127.0.0.1', port=5000, threaded=True)
