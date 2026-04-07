// Backend API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * Send audio file to backend for Parkinson's prediction
 * @param {Blob} audioBlob - The audio blob from recording
 * @param {Object} patientInfo - Patient details {name, age, dateOfBirth, medicalHistory}
 * @returns {Promise<Object>} - Prediction results with risk scores and features
 */
export const predictAudio = async (audioBlob, patientInfo = {}) => {
  try {
    const formData = new FormData();
    
    // Determine file extension based on MIME type
    let filename = "voice_recording.wav";
    if (audioBlob.type === "audio/webm") {
      filename = "voice_recording.webm";
    } else if (audioBlob.type === "audio/ogg") {
      filename = "voice_recording.ogg";
    } else if (audioBlob.type === "audio/mp4") {
      filename = "voice_recording.m4a";
    }
    
    // Add audio file
    formData.append("audio", audioBlob, filename);
    
    // Add patient info if provided
    if (patientInfo.name) formData.append("patient_name", patientInfo.name);
    if (patientInfo.age) formData.append("patient_age", patientInfo.age);
    if (patientInfo.dateOfBirth) formData.append("patient_dob", patientInfo.dateOfBirth);
    if (patientInfo.medicalHistory) formData.append("patient_history", patientInfo.medicalHistory);

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type header - fetch will set it automatically for FormData
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Backend prediction error:", error);
    return {
      success: false,
      error: error.message || "Failed to get prediction from backend",
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Check if backend is running
 * @returns {Promise<Boolean>}
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
};

/**
 * Get prediction with enhanced error handling and retry logic
 * @param {Blob} audioBlob
 * @param {Object} patientInfo
 * @param {number} maxRetries
 * @returns {Promise<Object>}
 */
export const predictAudioWithRetry = async (audioBlob, patientInfo = {}, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await predictAudio(audioBlob, patientInfo);
      if (result.success) {
        return result;
      }
      lastError = result.error;
    } catch (error) {
      lastError = error.message;
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  
  return {
    success: false,
    error: lastError || "Failed after multiple attempts",
    timestamp: new Date().toISOString(),
  };
};

export default {
  predictAudio,
  checkBackendHealth,
  predictAudioWithRetry,
};
