# Multi-Dataset Training Guide for Parkinson's Voice Screening Model

## Overview

This guide provides comprehensive instructions on how to train the Parkinson's disease detection model with multiple voice datasets in Google Colab. It covers data preparation, handling multilingual datasets, model training, and integration with the NeuroVoice application.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Dataset Preparation](#dataset-preparation)
3. [Google Colab Setup](#google-colab-setup)
4. [Multi-Dataset Training](#multi-dataset-training)
5. [Model Evaluation](#model-evaluation)
6. [Model Integration](#model-integration)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Files and Tools

- **Google Colab Account** (free tier is sufficient)
- **Google Drive Account** (for dataset storage)
- **Patient Voice Recordings** (audio files in WAV, MP3, or FLAC format)
- **Feature CSV Files** (with extracted features and labels)
- **Python 3.7+**
- **Key Libraries**: librosa, scipy, numpy, scikit-learn, joblib, pandas

### Expected Dataset Structure

```
Your_Google_Drive/
├── Datasets/
│   ├── Dataset_1_English/
│   │   ├── audio/
│   │   │   ├── patient_001.wav
│   │   │   ├── patient_002.wav
│   │   │   └── ...
│   │   └── features.csv
│   ├── Dataset_2_Spanish/
│   │   ├── audio/
│   │   └── features.csv
│   └── Dataset_3_Other_Language/
│       ├── audio/
│       └── features.csv
```

---

## Dataset Preparation

### Understanding Your Datasets

Before training, understand the structure of each dataset:

#### Dataset Information Required:
1. **Number of samples**: Total audio recordings
2. **Patient distribution**: Healthy vs. Parkinson's cases
3. **Audio specifications**:
   - Sample rate (Hz) - typically 16,000-48,000 Hz
   - Duration per recording (seconds)
   - Format (WAV, MP3, FLAC)
4. **Feature format**: 
   - CSV with extracted features
   - JSON with metadata
   - Raw audio only (requires extraction)

### CSV Format for Features

Expected CSV structure:

```csv
MFCC_1,MFCC_2,MFCC_3,...,MFCC_13,F0,Jitter,Shimmer,NHR,HNR,RPDE,DFA,PPE,Status
-12.45,-5.67,3.89,...,1.23,145.7,0.0045,0.0032,0.15,21.34,0.47,0.56,0.28,1
8.90,4.56,7.23,...,2.34,155.2,0.0052,0.0038,0.18,20.12,0.52,0.61,0.32,0
...
```

**Important**: The last column should be `Status` where:
- `0` = Healthy
- `1` = Parkinson's Disease

### Data Preprocessing in Google Colab

If your datasets only have raw audio files, use this notebook cell to extract features:

```python
import librosa
import numpy as np
import pandas as pd
import os

def extract_features_from_audio(audio_path, sr=16000):
    """Extract Oxford Parkinson's Dataset features from audio file"""
    y, sr = librosa.load(audio_path, sr=sr)
    
    if len(y) < sr:
        return None  # Skip short audio
    
    features = {}
    
    # MFCC features (1-13)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    for i in range(13):
        features[f'MFCC_{i+1}'] = float(np.mean(mfcc[i]))
    
    # Fundamental frequency F0
    f0 = librosa.yin(y, fmin=75, fmax=300, sr=sr)
    f0_voiced = f0[f0 > 0]
    features['F0'] = float(np.mean(f0_voiced)) if len(f0_voiced) > 0 else 0.0
    
    # Jitter
    if len(f0_voiced) > 1:
        f0_diff = np.abs(np.diff(f0_voiced))
        features['Jitter'] = float(np.mean(f0_diff) / np.mean(f0_voiced) if np.mean(f0_voiced) > 0 else 0)
    else:
        features['Jitter'] = 0.0
    
    # Shimmer
    frame_length = 2048
    hop_length = 512
    frames = librosa.util.frame(y, frame_length=frame_length, hop_length=hop_length)
    frame_energy = np.sqrt(np.mean(frames**2, axis=0))
    if len(frame_energy) > 1:
        energy_diff = np.abs(np.diff(frame_energy))
        features['Shimmer'] = float(np.mean(energy_diff) / np.mean(frame_energy) if np.mean(frame_energy) > 0 else 0)
    else:
        features['Shimmer'] = 0.0
    
    # NHR and HNR
    S = librosa.magphase(librosa.stft(y, n_fft=2048))[0]
    energy = np.sqrt(np.mean(S**2, axis=0))
    threshold = np.mean(energy) * 0.1
    features['NHR'] = float(np.sum(energy < threshold) / len(energy) if len(energy) > 0 else 0)
    features['HNR'] = float(np.sum(energy >= threshold) / len(energy) if len(energy) > 0 else 0)
    
    # RPDE, DFA, PPE (simplified)
    features['RPDE'] = min(float(np.std(y) / (np.mean(np.abs(y)) + 1e-10)), 1.0)
    
    if len(y) > 100:
        autocorr = np.correlate(y - np.mean(y), y - np.mean(y), mode='full')
        autocorr = autocorr[len(autocorr)//2:]
        features['DFA'] = min(abs(float(np.log(autocorr[50]) / np.log(50)) if autocorr[50] > 0 else 0), 1.0)
    else:
        features['DFA'] = 0.0
    
    if len(f0_voiced) > 1:
        f0_normalized = (f0_voiced - np.mean(f0_voiced)) / (np.std(f0_voiced) + 1e-10)
        features['PPE'] = min(abs(float(-np.sum(f0_normalized**2 * np.log(np.abs(f0_normalized) + 1e-10)) / len(f0_normalized))), 1.0)
    else:
        features['PPE'] = 0.0
    
    # Add Status (placeholder - you should set this based on your dataset)
    features['Status'] = 0.0
    
    return features

def batch_extract_from_directory(audio_dir, output_csv, label):
    """Extract features from all audio files in a directory"""
    all_features = []
    
    for audio_file in os.listdir(audio_dir):
        if audio_file.endswith(('.wav', '.mp3', '.flac', '.m4a')):
            audio_path = os.path.join(audio_dir, audio_file)
            try:
                features = extract_features_from_audio(audio_path)
                if features:
                    features['Status'] = label
                    all_features.append(features)
                    print(f"✓ Extracted: {audio_file}")
            except Exception as e:
                print(f"✗ Error with {audio_file}: {str(e)}")
    
    df = pd.DataFrame(all_features)
    df.to_csv(output_csv, index=False)
    print(f"\nSaved {len(all_features)} features to {output_csv}")
    return df
```

---

## Google Colab Setup

### Step 1: Create Training Notebook

1. Go to [Google Colab](https://colab.research.google.com)
2. Create a new Python 3 notebook
3. Name it: `Parkinsons_MultiDataset_Training`

### Step 2: Mount Google Drive

Add this cell first to access your datasets:

```python
from google.colab import drive
drive.mount('/content/gdrive')

# List your drive contents
import os
os.listdir('/content/gdrive/My Drive/')
```

### Step 3: Install Required Libraries

```python
!pip install librosa scikit-learn joblib pandas numpy scipy
```

---

## Multi-Dataset Training

### Combined Dataset Training Process

#### Step 1: Load and Combine All Datasets

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
import joblib
import json

# Load datasets from multiple sources
datasets = []
dataset_names = []

# Dataset 1
path_1 = '/content/gdrive/My Drive/Datasets/Dataset_1_English/features.csv'
try:
    df1 = pd.read_csv(path_1)
    datasets.append(df1)
    dataset_names.append('English Dataset')
    print(f"✓ Loaded English Dataset: {len(df1)} samples")
except Exception as e:
    print(f"✗ Error loading Dataset 1: {e}")

# Dataset 2
path_2 = '/content/gdrive/My Drive/Datasets/Dataset_2_Spanish/features.csv'
try:
    df2 = pd.read_csv(path_2)
    datasets.append(df2)
    dataset_names.append('Spanish Dataset')
    print(f"✓ Loaded Spanish Dataset: {len(df2)} samples")
except Exception as e:
    print(f"✗ Error loading Dataset 2: {e}")

# Dataset 3 (add more as needed)
path_3 = '/content/gdrive/My Drive/Datasets/Dataset_3_Other/features.csv'
try:
    df3 = pd.read_csv(path_3)
    datasets.append(df3)
    dataset_names.append('Other Language Dataset')
    print(f"✓ Loaded Other Dataset: {len(df3)} samples")
except Exception as e:
    print(f"✗ Error loading Dataset 3: {e}")

# Combine all datasets
if datasets:
    combined_df = pd.concat(datasets, ignore_index=True)
    print(f"\n✓ Combined dataset shape: {combined_df.shape}")
    print(f"Total healthy samples: {sum(combined_df['Status'] == 0)}")
    print(f"Total Parkinson's samples: {sum(combined_df['Status'] == 1)}")
else:
    print("✗ No datasets loaded!")
```

#### Step 2: Data Preprocessing and Feature Scaling

```python
# Handle missing values
combined_df = combined_df.fillna(combined_df.mean())

# Separate features and target
X = combined_df.drop('Status', axis=1)
y = combined_df['Status']

# Get feature names for later use
feature_names = list(X.columns)
print(f"Features ({len(feature_names)}): {feature_names}")

# Normalize features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print(f"\nFeature scaling complete:")
print(f"Shape: {X_scaled.shape}")
print(f"Mean: {X_scaled.mean():.4f}")
print(f"Std: {X_scaled.std():.4f}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTrain set: {X_train.shape[0]} samples ({sum(y_train==1)} positive)")
print(f"Test set: {X_test.shape[0]} samples ({sum(y_test==1)} positive)")
```

#### Step 3: Model Training with Multiple Algorithms

```python
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, confusion_matrix, classification_report

# Train multiple models and compare
models = {}

# Random Forest (Recommended for voice features)
print("Training Random Forest...")
rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)
models['Random Forest'] = rf_model

# SVM
print("Training SVM...")
svm_model = SVC(kernel='rbf', probability=True, random_state=42)
svm_model.fit(X_train, y_train)
models['SVM'] = svm_model

# Logistic Regression
print("Training Logistic Regression...")
lr_model = LogisticRegression(max_iter=1000, random_state=42)
lr_model.fit(X_train, y_train)
models['Logistic Regression'] = lr_model

# Evaluate models
print("\n" + "="*60)
print("MODEL EVALUATION RESULTS")
print("="*60)

for model_name, model in models.items():
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    
    print(f"\n{model_name}:")
    print(f"  Accuracy: {accuracy:.4f}")
    print(f"  F1-Score: {f1:.4f}")
    print(f"  ROC-AUC: {roc_auc:.4f}")
    print(f"  Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")

# Select best model (using F1-score)
best_model_name = max(models.keys(), key=lambda x: f1_score(y_test, models[x].predict(X_test)))
best_model = models[best_model_name]

print(f"\n✓ Best Model Selected: {best_model_name}")
```

#### Step 4: Save Trained Model and Configuration

```python
# Ensure output directory exists
output_dir = '/content/gdrive/My Drive/Trained_Models/'
os.makedirs(output_dir, exist_ok=True)

# Save the model
model_path = os.path.join(output_dir, 'parkinsons_model.pkl')
joblib.dump(best_model, model_path)
print(f"✓ Model saved to {model_path}")

# Save the scaler
scaler_path = os.path.join(output_dir, 'parkinsons_scaler.pkl')
joblib.dump(scaler, scaler_path)
print(f"✓ Scaler saved to {scaler_path}")

# Save configuration
config = {
    'model_type': best_model_name,
    'features': feature_names,
    'accuracy': float(accuracy_score(y_test, best_model.predict(X_test))),
    'f1_score': float(f1_score(y_test, best_model.predict(X_test))),
    'roc_auc': float(roc_auc_score(y_test, best_model.predict_proba(X_test)[:, 1])),
    'training_samples': len(X_train),
    'test_samples': len(X_test),
    'total_samples': len(combined_df),
    'datasets_used': dataset_names,
    'feature_count': len(feature_names)
}

config_path = os.path.join(output_dir, 'parkinsons_features.json')
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print(f"✓ Configuration saved to {config_path}")
print(f"\nModel Configuration:")
print(json.dumps(config, indent=2))
```

---

## Model Evaluation

### Cross-Validation and Performance Metrics

```python
from sklearn.model_selection import cross_validate, StratifiedKFold

# Perform 5-fold cross-validation
cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_results = cross_validate(best_model, X_scaled, y, cv=cv_strategy, 
                            scoring=['accuracy', 'f1', 'roc_auc', 'precision', 'recall'],
                            n_jobs=-1)

print("Cross-Validation Results (5-Fold):")
print(f"Accuracy:  {cv_results['test_accuracy'].mean():.4f} (+/- {cv_results['test_accuracy'].std():.4f})")
print(f"F1-Score:  {cv_results['test_f1'].mean():.4f} (+/- {cv_results['test_f1'].std():.4f})")
print(f"ROC-AUC:   {cv_results['test_roc_auc'].mean():.4f} (+/- {cv_results['test_roc_auc'].std():.4f})")
print(f"Precision: {cv_results['test_precision'].mean():.4f} (+/- {cv_results['test_precision'].std():.4f})")
print(f"Recall:    {cv_results['test_recall'].mean():.4f} (+/- {cv_results['test_recall'].std():.4f})")
```

### Feature Importance Analysis

```python
# Get feature importance (works for Random Forest)
if hasattr(best_model, 'feature_importances_'):
    importances = best_model.feature_importances_
    feature_importance_df = pd.DataFrame({
        'Feature': feature_names,
        'Importance': importances
    }).sort_values('Importance', ascending=False)
    
    print("\nTop 10 Most Important Features:")
    print(feature_importance_df.head(10).to_string())
```

---

## Model Integration

### Step 1: Download Trained Files

After training completes:

1. Go to your Google Drive: `/Trained_Models/`
2. Download these three files:
   - `parkinsons_model.pkl`
   - `parkinsons_scaler.pkl`
   - `parkinsons_features.json`

### Step 2: Update Backend Model Files

Replace the files in your backend:

```bash
# On your local machine
cp parkinsons_model.pkl neurovoice-backend/models/
cp parkinsons_scaler.pkl neurovoice-backend/models/
cp parkinsons_features.json neurovoice-backend/models/
```

### Step 3: Restart Backend Server

```bash
# Stop current server (Ctrl+C in terminal)

# Start the updated backend
cd neurovoice-backend
python app_ml.py
```

### Step 4: Test the Updated Model

Use the frontend to test predictions with the new model:

```bash
# In a new terminal
cd neurovoice-frontend
npm start
```

Then navigate to http://localhost:3000 and upload an audio file to test.

---

## Troubleshooting

### Common Issues and Solutions

#### 1. **Dataset Loading Error**

```python
# Problem: FileNotFoundError
# Solution: Check the path and update accordingly
import os
print(os.listdir('/content/gdrive/My Drive/'))
# Adjust paths based on actual folder structure
```

#### 2. **Feature Mismatch Error**

```python
# Problem: Number of features doesn't match during prediction
# Solution: Ensure all datasets have the same feature columns

# Check feature columns
print(df1.columns.tolist())
print(df2.columns.tolist())

# Standardize to common features if needed
common_features = list(set(df1.columns) & set(df2.columns))
df1 = df1[common_features]
df2 = df2[common_features]
```

#### 3. **Imbalanced Dataset**

```python
# Problem: Unequal positive/negative samples
# Solution: Use class weights or resampling

from imblearn.over_sampling import SMOTE

smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)

# Train with resampled data
best_model.fit(X_train_resampled, y_train_resampled)
```

#### 4. **Memory Issues in Colab**

```python
# Solution: Process datasets in batches
chunk_size = 5000  # Process 5000 samples at a time

for chunk in pd.read_csv(large_csv_path, chunksize=chunk_size):
    # Process each chunk
    pass
```

---

## Best Practices for Multi-Dataset Training

1. **Data Quality**: 
   - Verify all audio files are properly recorded
   - Ensure consistent sample rates across datasets
   - Remove corrupted or too-short files

2. **Documentation**:
   - Document the origin and size of each dataset
   - Record preprocessing steps
   - Keep version history of trained models

3. **Validation**:
   - Always use separate test sets from new datasets
   - Perform cross-dataset validation
   - Test with samples from languages not in training

4. **Continual Improvement**:
   - Retrain periodically with new data
   - Monitor model performance over time
   - Evaluate on diverse demographic groups

5. **Security & Privacy**:
   - Use anonymized data only
   - Secure storage for sensitive information
   - Follow HIPAA/GDPR guidelines if applicable

---

## Example Full Workflow

Here's a complete end-to-end example with three datasets:

```python
# 1. Mount Drive
from google.colab import drive
drive.mount('/content/gdrive')

# 2. Install libraries
!pip install librosa scikit-learn joblib pandas numpy

# 3. Import
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
import joblib
import json

# 4. Load datasets
df1 = pd.read_csv('/content/gdrive/My Drive/Datasets/Dataset_1/features.csv')
df2 = pd.read_csv('/content/gdrive/My Drive/Datasets/Dataset_2/features.csv')
df3 = pd.read_csv('/content/gdrive/My Drive/Datasets/Dataset_3/features.csv')

# 5. Combine
df_combined = pd.concat([df1, df2, df3], ignore_index=True)
df_combined = df_combined.fillna(df_combined.mean())

# 6. Prepare
X = df_combined.drop('Status', axis=1)
y = df_combined['Status']
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# 7. Train
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# 8. Evaluate
y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")

# 9. Save
joblib.dump(model, '/content/gdrive/My Drive/Trained_Models/parkinsons_model.pkl')
joblib.dump(scaler, '/content/gdrive/My Drive/Trained_Models/parkinsons_scaler.pkl')

config = {
    'model_type': 'Random Forest',
    'features': list(X.columns),
    'accuracy': float(accuracy_score(y_test, y_pred)),
    'f1_score': float(f1_score(y_test, y_pred)),
}
with open('/content/gdrive/My Drive/Trained_Models/parkinsons_features.json', 'w') as f:
    json.dump(config, f)
```

---

## Next Steps

After successfully training and integrating your multi-dataset model:

1. ✅ Download the three model files
2. ✅ Update the backend models folder
3. ✅ Restart the backend server
4. ✅ Test with the frontend
5. ✅ Monitor performance metrics
6. ✅ Plan for future retraining cycles

For more support, refer to the main [README.md](README.md) and [BACKEND_FRONTEND_INTEGRATION.md](BACKEND_FRONTEND_INTEGRATION.md).

---

**Last Updated**: March 2026  
**Version**: 1.0.0
