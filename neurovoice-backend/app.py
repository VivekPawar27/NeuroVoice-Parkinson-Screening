from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
from services.predict_service_ml import predict_audio, load_model

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
DATA_FOLDER = "data"
PATIENTS_FILE = os.path.join(DATA_FOLDER, "patients.json")
NOTIFICATIONS_FILE = os.path.join(DATA_FOLDER, "notifications.json")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# Load ML model on startup
load_model()

# ===== UTILITY FUNCTIONS =====
def load_patients():
    if os.path.exists(PATIENTS_FILE):
        with open(PATIENTS_FILE, 'r') as f:
            return json.load(f)
    return {"patients": []}

def save_patients(data):
    with open(PATIENTS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def load_notifications():
    if os.path.exists(NOTIFICATIONS_FILE):
        with open(NOTIFICATIONS_FILE, 'r') as f:
            return json.load(f)
    return {"notifications": []}

def save_notifications(data):
    with open(NOTIFICATIONS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# ===== ROUTES =====
@app.route("/")
def home():
    return jsonify({"message": "NeuroVoice Backend Running"})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        file = request.files["audio"]
        
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file extension
        allowed_extensions = {'wav', 'mp3', 'webm', 'ogg', 'm4a', 'aac', 'flac'}
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            return jsonify({"error": "Invalid audio format. Allowed: wav, mp3, webm, ogg, m4a, aac, flac"}), 400
        
        filepath = os.path.join(UPLOAD_FOLDER, f"{datetime.now().timestamp()}_{file.filename}")
        file.save(filepath)

        if not os.path.exists(filepath):
            return jsonify({"error": "Failed to save audio file"}), 400

        result = predict_audio(filepath)
        
        # Check if prediction had an error
        if "error" in result:
            # Clean up the file
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify(result), 400
        
        return jsonify(result), 200
    
    except Exception as e:
        print(f"Error in /predict endpoint: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# ===== PATIENT MANAGEMENT =====
@app.route("/patients", methods=["GET"])
def get_patients():
    data = load_patients()
    return jsonify(data)

@app.route("/patients", methods=["POST"])
def create_patient():
    patient_data = request.json
    patients_data = load_patients()
    
    patient_name = patient_data.get("name", "").strip()
    if not patient_name:
        return jsonify({"error": "Patient name is required"}), 400
    
    # Check if patient exists
    existing = next((p for p in patients_data["patients"] if p["name"].lower() == patient_name.lower()), None)
    
    if existing:
        # Update existing patient
        existing.update({
            "age": patient_data.get("age"),
            "dob": patient_data.get("dob"),
            "medical_history": patient_data.get("medical_history"),
            "last_updated": datetime.now().isoformat()
        })
    else:
        # Create new patient
        new_patient = {
            "name": patient_name,
            "age": patient_data.get("age"),
            "dob": patient_data.get("dob"),
            "medical_history": patient_data.get("medical_history"),
            "records": [],
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        patients_data["patients"].append(new_patient)
    
    save_patients(patients_data)
    return jsonify({"message": "Patient saved successfully"}), 201

@app.route("/patients/<patient_name>", methods=["GET"])
def get_patient(patient_name):
    patients_data = load_patients()
    patient = next((p for p in patients_data["patients"] if p["name"].lower() == patient_name.lower()), None)
    
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    
    return jsonify(patient)

@app.route("/patients/<patient_name>/records", methods=["POST"])
def add_patient_record(patient_name):
    record_data = request.json
    patients_data = load_patients()
    
    patient = next((p for p in patients_data["patients"] if p["name"].lower() == patient_name.lower()), None)
    
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    
    new_record = {
        "timestamp": datetime.now().isoformat(),
        "risk_score": record_data.get("risk_score"),
        "risk_level": record_data.get("risk_level"),
        "probability_healthy": record_data.get("probability_healthy"),
        "probability_parkinsons": record_data.get("probability_parkinsons"),
        "audio_file": record_data.get("audio_file")
    }
    
    patient["records"].append(new_record)
    patient["last_updated"] = datetime.now().isoformat()
    
    save_patients(patients_data)
    
    # Create notification
    notifications_data = load_notifications()
    notification = {
        "id": len(notifications_data["notifications"]) + 1,
        "patient_name": patient_name,
        "message": f"New screening completed for {patient_name}: {record_data.get('risk_level')} Risk",
        "timestamp": datetime.now().isoformat(),
        "read": False
    }
    notifications_data["notifications"].append(notification)
    save_notifications(notifications_data)
    
    return jsonify({"message": "Record added successfully"}), 201

# ===== NOTIFICATIONS =====
@app.route("/notifications", methods=["GET"])
def get_notifications():
    data = load_notifications()
    return jsonify(data)

@app.route("/notifications/unread", methods=["GET"])
def get_unread_count():
    data = load_notifications()
    unread = sum(1 for notif in data["notifications"] if not notif.get("read", False))
    return jsonify({"unread_count": unread})

@app.route("/notifications/<int:notification_id>/read", methods=["PUT"])
def mark_notification_read(notification_id):
    data = load_notifications()
    notif = next((n for n in data["notifications"] if n["id"] == notification_id), None)
    
    if notif:
        notif["read"] = True
        save_notifications(data)
        return jsonify({"message": "Notification marked as read"})
    
    return jsonify({"error": "Notification not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)