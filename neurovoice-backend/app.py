from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from services.predict_service_ml import predict_audio, load_model

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load ML model on startup
load_model()

@app.route("/")
def home():
    return jsonify({"message": "NeuroVoice Backend Running"})


@app.route("/predict", methods=["POST"])
def predict():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files["audio"]
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    result = predict_audio(filepath)

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)