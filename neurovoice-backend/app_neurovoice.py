"""
NeuroVoice Flask Backend Application
Uses CNN-LSTM Keras Model for Parkinson's Disease Detection from Voice
Handles 15-second audio files with automatic 3-second segment analysis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
from services.neurovoice_service import predict_from_audio_file, load_keras_model, get_model_info
import shutil

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = "uploads"
MODELS_FOLDER = "models"
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac', 'wma', 'm4a'}
ALLOWED_MODEL_EXTENSIONS = {'keras', 'h5'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(MODELS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size


def allowed_file(filename, allowed_extensions):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


# Load model on startup
load_keras_model()


@app.route("/", methods=["GET"])
def home():
    """Health check endpoint"""
    return jsonify({
        "message": "NeuroVoice Backend Running",
        "version": "3.0.0",
        "model": "CNN-LSTM Keras",
        "features": [
            "15-second audio analysis (3-second segment processing)",
            "Multi-segment Parkinson's disease detection",
            "Deep learning CNN-LSTM predictions",
            "Individual segment analysis with aggregate insights",
            "Risk scoring and confidence metrics",
            "Model upload and management"
        ],
        "audio_specs": {
            "duration_supported": "15 seconds",
            "processing_unit": "3 seconds per segment",
            "sample_rate": 22050,
            "expected_segments": 5
        }
    })


@app.route("/health", methods=["GET"])
def health():
    """Health check with detailed model status"""
    model_info = get_model_info()
    return jsonify({
        "status": "healthy" if model_info['model_loaded'] else "degraded",
        "timestamp": str(__import__('datetime').datetime.now()),
        **model_info
    })


@app.route("/api/model/info", methods=["GET"])
def model_info():
    """Get detailed information about the loaded model"""
    try:
        info = get_model_info()
        return jsonify(info), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Predict Parkinson's disease risk from 15-second audio file
    
    Expected: POST request with audio file (minimum 15 seconds)
    Returns: JSON with segments predictions, aggregate statistics, and risk assessment
    
    Response includes:
    - status: Overall assessment (Healthy/Parkinson's Disease)
    - risk_score: 0-100 percentage score
    - risk_level: Low Risk/Moderate Risk/High Risk
    - segment_predictions: Individual 3-second segment results
    - aggregate_stats: Mean, std, min, max probabilities
    - insights: Clinical insights about the analysis
    - model_used: CNN-LSTM NeuroVoice
    """
    try:
        if "audio" not in request.files:
            return jsonify({
                "error": "No audio file provided",
                "expected": "POST with 'audio' file parameter"
            }), 400

        file = request.files["audio"]
        
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename, ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({
                "error": f"Invalid file type. Allowed types: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
            }), 400

        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            # Make prediction using CNN-LSTM model with segment analysis
            result = predict_from_audio_file(filepath)
            
            # Ensure all numeric values are serializable
            result = ensure_serializable(result)
            
            response_code = 200 if "error" not in result else 400
            return jsonify(result), response_code
            
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except:
                    pass

    except Exception as e:
        print(f"Error in predict endpoint: {e}")
        return jsonify({
            "error": f"Prediction failed: {str(e)}",
            "status": "Error",
            "risk_score": 0,
            "risk_level": "Unable to Assess"
        }), 500


@app.route("/api/predict/batch", methods=["POST"])
def predict_batch():
    """
    Batch prediction for multiple audio files
    
    Expected: POST request with multiple audio files
    Returns: JSON array with predictions for each file
    """
    try:
        if "files" not in request.files:
            return jsonify({"error": "No audio files provided"}), 400
        
        files = request.files.getlist("files")
        
        if not files:
            return jsonify({"error": "No files selected"}), 400
        
        results = []
        for file in files:
            if file and file.filename and allowed_file(file.filename, ALLOWED_AUDIO_EXTENSIONS):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                try:
                    prediction = predict_from_audio_file(filepath)
                    prediction['filename'] = filename
                    results.append(ensure_serializable(prediction))
                finally:
                    if os.path.exists(filepath):
                        try:
                            os.remove(filepath)
                        except:
                            pass
        
        if not results:
            return jsonify({"error": "No valid audio files processed"}), 400
        
        return jsonify({
            "total_processed": len(results),
            "predictions": results
        }), 200

    except Exception as e:
        print(f"Error in batch predict: {e}")
        return jsonify({"error": f"Batch prediction failed: {str(e)}"}), 500


@app.route("/api/model/upload", methods=["POST"])
def upload_model():
    """
    Upload trained Keras model file
    
    Expected: POST request with:
    - model: best_parkinsons_model.keras (trained CNN-LSTM model)
    
    Returns: Confirmation of upload and model status
    """
    try:
        if "model" not in request.files:
            return jsonify({
                "error": "Missing required file: model",
                "expected_file": "best_parkinsons_model.keras"
            }), 400
        
        model_file = request.files['model']
        
        if model_file.filename == '':
            return jsonify({"error": "Model file not selected"}), 400
        
        if not allowed_file(model_file.filename, ALLOWED_MODEL_EXTENSIONS):
            return jsonify({
                "error": f"Invalid model file extension. Allowed: {', '.join(ALLOWED_MODEL_EXTENSIONS)}"
            }), 400
        
        # Save model file
        model_path = os.path.join(MODELS_FOLDER, 'best_parkinsons_model.keras')
        model_file.save(model_path)
        
        # Try to load the model to verify it's valid
        if load_keras_model():
            model_info = get_model_info()
            return jsonify({
                "message": "Model uploaded and loaded successfully",
                "model_path": model_path,
                **model_info
            }), 201
        else:
            return jsonify({
                "warning": "Model file saved but failed to load. Check file integrity.",
                "model_path": model_path
            }), 202

    except Exception as e:
        print(f"Error uploading model: {e}")
        return jsonify({
            "error": f"Model upload failed: {str(e)}"
        }), 500


@app.route("/api/model/delete", methods=["DELETE"])
def delete_model():
    """Delete the current loaded model"""
    try:
        model_path = os.path.join(MODELS_FOLDER, 'best_parkinsons_model.keras')
        
        if os.path.exists(model_path):
            os.remove(model_path)
            return jsonify({
                "message": "Model deleted successfully",
                "deleted_file": model_path
            }), 200
        else:
            return jsonify({
                "message": "No model file found to delete"
            }), 404

    except Exception as e:
        return jsonify({"error": f"Failed to delete model: {str(e)}"}), 500


@app.route("/api/status", methods=["GET"])
def status():
    """Get detailed application status"""
    try:
        model_info = get_model_info()
        return jsonify({
            "application": "NeuroVoice Parkinson's Detection System",
            "version": "3.0.0",
            "status": "operational" if model_info['model_loaded'] else "degraded",
            "model": model_info,
            "upload_folder": os.path.abspath(UPLOAD_FOLDER),
            "models_folder": os.path.abspath(MODELS_FOLDER),
            "cors_enabled": True,
            "max_file_size_mb": 100
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def ensure_serializable(obj):
    """Recursively convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, dict):
        return {k: ensure_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [ensure_serializable(item) for item in obj]
    elif isinstance(obj, (np.integer, np.floating)):
        return float(obj) if isinstance(obj, np.floating) else int(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (bool, np.bool_)):
        return bool(obj)
    else:
        return obj


# Import numpy at the end to avoid circular imports
import numpy as np


if __name__ == "__main__":
    # Development server (use production server like Gunicorn in production)
    print("\n" + "="*60)
    print("NeuroVoice Backend Server Starting")
    print("="*60)
    print(f"Audio Upload Folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"Models Folder: {os.path.abspath(MODELS_FOLDER)}")
    print("="*60 + "\n")
    
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
        use_reloader=False
    )
