from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import joblib
from werkzeug.utils import secure_filename
from services.predict_service_ml import predict_audio, load_model
import shutil

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = "uploads"
MODELS_FOLDER = "models"
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac', 'wma'}
ALLOWED_MODEL_EXTENSIONS = {'pkl', 'joblib'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(MODELS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size


def allowed_file(filename, allowed_extensions):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


@app.route("/", methods=["GET"])
def home():
    """Health check endpoint"""
    return jsonify({
        "message": "NeuroVoice Backend Running",
        "version": "2.0.0",
        "features": [
            "Audio-based Parkinson's disease detection",
            "ML model-based predictions",
            "Model upload and management",
            "Comprehensive feature extraction"
        ]
    })


@app.route("/health", methods=["GET"])
def health():
    """Health check with model status"""
    model_status = check_model_status()
    return jsonify({
        "status": "healthy",
        "model_loaded": model_status['loaded'],
        "model_type": model_status.get('model_type', 'Not loaded'),
        "model_accuracy": model_status.get('accuracy', None)
    })


def check_model_status():
    """Check if models are loaded"""
    try:
        features_path = os.path.join(MODELS_FOLDER, 'parkinsons_features.json')
        model_path = os.path.join(MODELS_FOLDER, 'parkinsons_model.pkl')
        
        if os.path.exists(features_path) and os.path.exists(model_path):
            with open(features_path, 'r') as f:
                config = json.load(f)
            return {
                'loaded': True,
                'model_type': config.get('model_type', 'Unknown'),
                'accuracy': config.get('accuracy', None),
                'f1_score': config.get('f1_score', None)
            }
        else:
            return {'loaded': False}
    except Exception as e:
        print(f"Error checking model status: {e}")
        return {'loaded': False}


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict Parkinson's disease risk from audio file
    
    Expected: POST request with audio file
    Returns: JSON with risk_score, risk_level, explanation, and detailed features
    """
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

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

        # Make prediction using ML model
        result = predict_audio(filepath)
        
        # Return result with HTTP 200
        response_code = 400 if "error" in result else 200
        return jsonify(result), response_code

    except Exception as e:
        print(f"Error in predict endpoint: {e}")
        return jsonify({
            "error": f"Prediction failed: {str(e)}",
            "risk_score": 0,
            "risk_level": "Error"
        }), 500


@app.route("/predict/batch", methods=["POST"])
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
                
                prediction = predict_audio(filepath)
                prediction['filename'] = filename
                results.append(prediction)
        
        if not results:
            return jsonify({"error": "No valid audio files processed"}), 400
        
        return jsonify({
            "total_processed": len(results),
            "predictions": results
        }), 200

    except Exception as e:
        print(f"Error in batch predict: {e}")
        return jsonify({"error": f"Batch prediction failed: {str(e)}"}), 500


@app.route("/model/upload", methods=["POST"])
def upload_model():
    """
    Upload trained model files (model, scaler, features config)
    
    Expected: POST request with files:
    - model: parkinsons_model.pkl (trained ML model)
    - scaler: parkinsons_scaler.pkl (fitted scaler)
    - config: parkinsons_features.json (feature configuration)
    """
    try:
        required_files = ['model', 'scaler', 'config']
        uploaded = {}
        
        # Check all required files are present
        for file_type in required_files:
            if file_type not in request.files:
                return jsonify({
                    "error": f"Missing required file: {file_type}",
                    "required_files": required_files
                }), 400
        
        # Process model file
        model_file = request.files['model']
        if model_file.filename == '':
            return jsonify({"error": "Model file not selected"}), 400
        if not allowed_file(model_file.filename, ALLOWED_MODEL_EXTENSIONS):
            return jsonify({"error": "Invalid model file extension"}), 400
        
        model_path = os.path.join(MODELS_FOLDER, 'parkinsons_model.pkl')
        model_file.save(model_path)
        uploaded['model'] = model_path
        
        # Process scaler file
        scaler_file = request.files['scaler']
        if scaler_file.filename == '':
            return jsonify({"error": "Scaler file not selected"}), 400
        if not allowed_file(scaler_file.filename, ALLOWED_MODEL_EXTENSIONS):
            return jsonify({"error": "Invalid scaler file extension"}), 400
        
        scaler_path = os.path.join(MODELS_FOLDER, 'parkinsons_scaler.pkl')
        scaler_file.save(scaler_path)
        uploaded['scaler'] = scaler_path
        
        # Process config file
        config_file = request.files['config']
        if config_file.filename == '':
            return jsonify({"error": "Config file not selected"}), 400
        
        config_path = os.path.join(MODELS_FOLDER, 'parkinsons_features.json')
        config_file.save(config_path)
        uploaded['config'] = config_path
        
        # Verify and reload model
        try:
            test_model = joblib.load(model_path)
            test_scaler = joblib.load(scaler_path)
            
            with open(config_path, 'r') as f:
                test_config = json.load(f)
            
            # Reload in the service
            load_model()
            
            return jsonify({
                "status": "success",
                "message": "Model uploaded and loaded successfully",
                "uploaded_files": uploaded,
                "model_info": {
                    "type": test_config.get('model_type', 'Unknown'),
                    "accuracy": test_config.get('accuracy'),
                    "f1_score": test_config.get('f1_score'),
                    "roc_auc": test_config.get('roc_auc'),
                    "features_count": len(test_config.get('features', []))
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                "error": f"Model validation failed: {str(e)}",
                "uploaded_files": uploaded
            }), 400
    
    except Exception as e:
        print(f"Error uploading model: {e}")
        return jsonify({"error": f"Model upload failed: {str(e)}"}), 500


@app.route("/model/status", methods=["GET"])
def model_status():
    """Get current model status and information"""
    try:
        status = check_model_status()
        
        if status['loaded']:
            return jsonify({
                "status": "loaded",
                "model_type": status.get('model_type'),
                "accuracy": status.get('accuracy'),
                "f1_score": status.get('f1_score'),
                "message": "ML model is ready for predictions"
            }), 200
        else:
            return jsonify({
                "status": "not_loaded",
                "message": "ML model not found. Using heuristic-based predictions.",
                "instructions": "Upload a trained model using /model/upload endpoint"
            }), 200
            
    except Exception as e:
        print(f"Error getting model status: {e}")
        return jsonify({"error": f"Failed to get model status: {str(e)}"}), 500


@app.route("/model/info", methods=["GET"])
def model_info():
    """Get detailed information about loaded model"""
    try:
        features_path = os.path.join(MODELS_FOLDER, 'parkinsons_features.json')
        
        if not os.path.exists(features_path):
            return jsonify({
                "error": "Model configuration not found",
                "message": "No trained model is currently loaded"
            }), 404
        
        with open(features_path, 'r') as f:
            config = json.load(f)
        
        return jsonify({
            "model_type": config.get('model_type'),
            "accuracy": config.get('accuracy'),
            "f1_score": config.get('f1_score'),
            "roc_auc": config.get('roc_auc'),
            "features": config.get('features', []),
            "feature_count": len(config.get('features', []))
        }), 200
        
    except Exception as e:
        print(f"Error getting model info: {e}")
        return jsonify({"error": f"Failed to get model info: {str(e)}"}), 500


@app.route("/model/delete", methods=["DELETE"])
def delete_model():
    """Delete currently loaded model (revert to heuristic mode)"""
    try:
        model_path = os.path.join(MODELS_FOLDER, 'parkinsons_model.pkl')
        scaler_path = os.path.join(MODELS_FOLDER, 'parkinsons_scaler.pkl')
        config_path = os.path.join(MODELS_FOLDER, 'parkinsons_features.json')
        
        deleted_files = []
        
        for filepath in [model_path, scaler_path, config_path]:
            if os.path.exists(filepath):
                os.remove(filepath)
                deleted_files.append(filepath)
        
        # Reload to reset
        load_model()
        
        if deleted_files:
            return jsonify({
                "status": "success",
                "message": "Model files deleted successfully",
                "deleted_files": deleted_files,
                "prediction_mode": "heuristic"
            }), 200
        else:
            return jsonify({
                "message": "No model files found to delete"
            }), 200
            
    except Exception as e:
        print(f"Error deleting model: {e}")
        return jsonify({"error": f"Failed to delete model: {str(e)}"}), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({
        "error": "File too large",
        "message": "Maximum file size is 50MB"
    }), 413


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "Not found",
        "message": "The requested endpoint does not exist"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred"
    }), 500


if __name__ == "__main__":
    print("NeuroVoice Backend Server Starting...")
    print(f"Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"Models folder: {os.path.abspath(MODELS_FOLDER)}")
    model_status_info = check_model_status()
    if model_status_info['loaded']:
        print(f"✓ ML Model loaded: {model_status_info.get('model_type')}")
    else:
        print("⚠ ML Model not loaded. Using heuristic-based predictions.")
    app.run(debug=True, host="0.0.0.0", port=5000)
