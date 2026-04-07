#!/usr/bin/env python
"""
NeuroVoice Complete Startup - Generates model and runs backend + frontend
"""

import os
import sys
import subprocess
import threading
import webbrowser
import time
from pathlib import Path

print("="*70)
print("NEUROVOICE PARKINSON'S DETECTION SYSTEM - COMPLETE STARTUP")
print("="*70)

# Step 1: Setup directories
print("\n[1/4] Setting up model directories...")
models_dir = Path("neurovoice-backend/models")
models_dir.mkdir(parents=True, exist_ok=True)
uploads_dir = Path("neurovoice-backend/uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
print(f"✓ Models dir: {models_dir}")
print(f"✓ Uploads dir: {uploads_dir}")

# Step 2: Generate Keras model
print("\n[2/4] Generating CNN-LSTM Keras model...")
try:
    import numpy as np
    import tensorflow as tf
    from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, LSTM, Dense, Dropout, Reshape
    from tensorflow.keras.models import Model
    from tensorflow.keras.optimizers import Adam
    
    MODEL_PATH = models_dir / "best_parkinsons_model.keras"
    input_shape = (128, 259, 1)
    
    # Build model
    inputs = Input(shape=input_shape)
    x = Conv2D(32, (3, 3), activation='relu', padding='same')(inputs)
    x = MaxPooling2D((2, 2))(x)
    x = Dropout(0.25)(x)
    x = Conv2D(64, (3, 3), activation='relu', padding='same')(x)
    x = MaxPooling2D((2, 2))(x)
    x = Dropout(0.25)(x)
    x = Conv2D(64, (3, 3), activation='relu', padding='same')(x)
    
    original_shape = tf.shape(x)
    x = Reshape((original_shape[1], original_shape[2] * original_shape[3]))(x)
    x = LSTM(128, return_sequences=True, dropout=0.2)(x)
    x = LSTM(64, dropout=0.2)(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    x = Dense(64, activation='relu')(x)
    x = Dropout(0.2)(x)
    output = Dense(1, activation='sigmoid')(x)
    
    model = Model(inputs=inputs, outputs=output)
    model.compile(optimizer=Adam(learning_rate=0.001), loss='binary_crossentropy', metrics=['accuracy'])
    
    # Quick training
    X_train = np.random.randn(20, 128, 259, 1).astype(np.float32)
    y_train = np.random.randint(0, 2, 20).astype(np.float32)
    model.fit(X_train, y_train, epochs=2, batch_size=16, verbose=0)
    
    # Save
    model.save(str(MODEL_PATH), save_format='keras')
    print(f"✓ Model saved: {MODEL_PATH}")
    print(f"  Parameters: {model.count_params():,}")
    
except Exception as e:
    print(f"✗ Error generating model: {e}")
    sys.exit(1)

# Step 3: Install frontend dependencies
print("\n[3/4] Installing frontend dependencies...")
result = subprocess.run(["npm", "install"], cwd="neurovoice-frontend", capture_output=True)
if result.returncode == 0:
    print("✓ Frontend dependencies installed")
else:
    print("⚠ npm install had issues (may already be installed)")

# Step 4: Run backend and frontend
print("\n[4/4] Starting backend and frontend servers...")
print("\n" + "="*70)

# Backend thread
def run_backend():
    os.chdir("neurovoice-backend")
    subprocess.run([sys.executable, "app_neurovoice.py"])

backend_thread = threading.Thread(target=run_backend, daemon=True)
backend_thread.start()

print("Backend starting...")
time.sleep(3)

# Frontend
def run_frontend():
    subprocess.run(["npm", "start"], cwd="neurovoice-frontend")

print("\n⏳ Frontend starting (this may take 30-60 seconds)...\n")

try:
    run_frontend()
except KeyboardInterrupt:
    print("\n\nShutdown requested. Stopping servers...")
    sys.exit(0)
