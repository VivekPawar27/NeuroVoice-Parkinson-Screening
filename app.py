import os
import tempfile
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import librosa
import soundfile as sf

app = Flask(__name__)
CORS(app)

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'webm', 'ogg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_features(audio, sr, segment_duration=3):
    """Extract features from audio in 3-second segments"""
    segment_samples = int(sr * segment_duration)
    segments = []
    features = {
        'mfcc_mean': [],
        'zero_crossing_rate': [],
        'spectral_centroid': [],
        'rms_energy': []
    }
    
    # Process 3-second segments
    for i in range(0, len(audio), segment_samples):
        segment = audio[i:i+segment_samples]
        if len(segment) < sr:  # Skip if less than 1 second
            continue
        
        # MFCC (Mel-Frequency Cepstral Coefficients)
        mfcc = librosa.feature.mfcc(y=segment, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1).tolist()
        
        # Zero Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(segment)[0]
        zcr_mean = np.mean(zcr)
        
        # Spectral Centroid
        spec_cent = librosa.feature.spectral_centroid(y=segment, sr=sr)[0]
        spec_cent_mean = np.mean(spec_cent)
        
        # RMS Energy
        rms = librosa.feature.rms(y=segment)[0]
        rms_mean = np.mean(rms)
        
        segment_data = {
            'segment_start': i / sr,
            'segment_end': min((i + segment_samples) / sr, len(audio) / sr),
            'mfcc_mean': mfcc_mean,
            'zero_crossing_rate': float(zcr_mean),
            'spectral_centroid': float(spec_cent_mean),
            'rms_energy': float(rms_mean)
        }
        segments.append(segment_data)
        
        features['mfcc_mean'].append(np.mean(mfcc_mean))
        features['zero_crossing_rate'].append(float(zcr_mean))
        features['spectral_centroid'].append(float(spec_cent_mean))
        features['rms_energy'].append(float(rms_mean))
    
    return segments, {k: np.mean(v) for k, v in features.items()}

def load_audio_file(file_storage):
    if not file_storage or file_storage.filename == '':
        raise ValueError('No file provided')
    
    filename = secure_filename(file_storage.filename)
    if not allowed_file(filename):
        raise ValueError('File type not allowed. Use .wav, .mp3, .webm, or .ogg')
    
    ext = os.path.splitext(filename)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        file_storage.save(tmp.name)
        tmp_path = tmp.name
    
    try:
        audio, sr = librosa.load(tmp_path, sr=None, mono=True)
        if audio.size == 0:
            raise ValueError('Audio file is empty')
        return audio, sr
    except Exception as e:
        raise ValueError(f'Failed to load audio: {str(e)}')
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file received'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        audio, sr = load_audio_file(file)
        duration = len(audio) / sr
        
        # Extract features from 3-second segments
        segments, features = extract_features(audio, sr, segment_duration=3)
        
        return jsonify({
            'status': 'success',
            'sample_rate': int(sr),
            'duration_seconds': round(duration, 2),
            'num_segments': len(segments),
            'segments': segments,
            'features': {
                'mfcc_mean': float(features['mfcc_mean']),
                'zero_crossing_rate': float(features['zero_crossing_rate']),
                'spectral_centroid': float(features['spectral_centroid']),
                'rms_energy': float(features['rms_energy'])
            },
            'message': 'Audio analyzed successfully'
        })
    except Exception as error:
        return jsonify({'error': str(error)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)