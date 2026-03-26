import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { predictAudioWithRetry } from "../services/api";

function Home() {
  const navigate = useNavigate();
  
  // ===== PATIENT INFO STATE =====
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientDOB, setPatientDOB] = useState("");
  const [patientMedicalHistory, setPatientMedicalHistory] = useState("");
  const [formError, setFormError] = useState("");
  
  // ===== RECORDING STATE =====
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [canStopRecording, setCanStopRecording] = useState(false);
  const [showMinimumWarning, setShowMinimumWarning] = useState(false);
  
  // ===== ANALYSIS STATE =====
  const [showAnalysisSection, setShowAnalysisSection] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  
  // ===== REFS =====
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  
  // ===== DATA FOR CHARTS =====
  const voiceAnalysisData = [
    { name: "Jitter", value: 55 },
    { name: "Shimmer", value: 70 },
    { name: "Jott", value: 40 },
    { name: "RAP", value: 35 },
    { name: "PPQ", value: 45 },
    { name: "DDP", value: 50 },
  ];

  const shapData = [
    { feature: "Jitter", value: 35, fill: "#6EA89E" },
    { feature: "Tremor", value: 42, fill: "#8FC6B7" },
    { feature: "Speech", value: 48, fill: "#A6D2C8" },
    { feature: "Pitch", value: 38, fill: "#B8D6B2" },
    { feature: "Other", value: 30, fill: "#CFE5D5" },
  ];

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      audioChunks.current = [];
      setRecordingTime(0);
      setCanStopRecording(false);
      setShowMinimumWarning(true);
      setAnalysisError("");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
      streamRef.current = stream;
      
      const options = { mimeType: "audio/wav" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "audio/webm";
      }

      mediaRecorder.current = new MediaRecorder(stream, options);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mediaRecorder.current.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      
      // Timer to track recording duration
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // At 15 seconds: hide warning message and enable stop button
          if (newTime >= 15) {
            setCanStopRecording(true);
            setShowMinimumWarning(false);
          }
          
          // At 30 seconds: auto-stop recording
          if (newTime >= 30) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            clearInterval(timerIntervalRef.current);
          }
          
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setFormError("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (recordingTime < 15) {
      setFormError("Recording must be at least 15 seconds long.");
      return;
    }
    
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setCanStopRecording(false);
      setShowMinimumWarning(false);
    }
  };

  const submitAnalysis = async () => {
    // Validate patient name
    if (!patientName.trim()) {
      setFormError("Please enter patient name before analyzing.");
      return;
    }
    
    if (!audioBlob) {
      setFormError("Please record voice first.");
      return;
    }

    if (recordingTime < 15) {
      setFormError("Recording must be at least 15 seconds long.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError("");
      setFormError("");

      const patientInfo = {
        name: patientName,
        age: patientAge,
        dateOfBirth: patientDOB,
        medicalHistory: patientMedicalHistory,
      };

      const result = await predictAudioWithRetry(audioBlob, patientInfo);

      if (result.success) {
        // Save patient data to backend
        try {
          await fetch(`${API_BASE_URL}/patients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: patientName,
              age: patientAge,
              dob: patientDOB,
              medical_history: patientMedicalHistory
            })
          });

          // Save screening record to backend
          await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(patientName)}/records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              risk_score: result.data.risk_score || Math.round((result.data.probability_parkinsons || 0.5) * 100),
              risk_level: result.data.risk_level,
              probability_healthy: result.data.probability_healthy,
              probability_parkinsons: result.data.probability_parkinsons,
              audio_file: "recording.wav"
            })
          });
        } catch (err) {
          console.error("Error saving patient data:", err);
        }

        setPredictionResult(result.data);
        setShowAnalysisSection(true);
      } else {
        setAnalysisError(result.error || "Failed to analyze voice.");
      }
    } catch (error) {
      setAnalysisError("Error analyzing voice: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
    setCanStopRecording(false);
    setShowMinimumWarning(false);
    setFormError("");
  };

  const recordAgain = () => {
    resetRecording();
    setShowAnalysisSection(false);
    setPredictionResult(null);
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: "radial-gradient(circle at 10% 30%, rgba(207, 229, 213, 0.5), transparent), radial-gradient(circle at 90% 70%, rgba(166, 210, 200, 0.4), transparent), radial-gradient(circle at 50% 100%, rgba(184, 214, 178, 0.3), transparent), linear-gradient(135deg, #f9fefb 0%, #CFE5D5 35%, #A6D2C8 70%, #CFE5D5 100%)"
      }}
    >
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* SECTION 1: NeuroVoice Title & Info */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-2 mb-6" style={{ borderColor: "#CFE5D5" }}>
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-2" style={{
              backgroundImage: "linear-gradient(135deg, #1F4F47 0%, #2D5A4F 50%, #3A6B63 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              🧠 NeuroVoice
            </h1>
            <p style={{ 
              backgroundImage: "linear-gradient(135deg, #1F4F47 0%, #3A6B63 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "24px",
              fontWeight: "600"
            }}>
              Early Parkinson's Risk Screening
            </p>
          </div>

          {/* NeuroVoice Info Section */}
          <div className="bg-gradient-to-r rounded-2xl p-6 mb-8" style={{
            backgroundImage: "linear-gradient(135deg, rgba(207, 229, 213, 0.3), rgba(166, 210, 200, 0.2))",
            borderLeft: "4px solid #6EA89E"
          }}>
            <h3 style={{ color: "#1F4F47", fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
              ℹ️ About NeuroVoice
            </h3>
            <p style={{ color: "#2D5A4F", fontSize: "14px", lineHeight: "1.7" }}>
              NeuroVoice is an advanced AI-powered screening tool designed to detect early signs of Parkinson's disease through voice analysis. 
              Our proprietary machine learning model analyzes voice patterns, tremor characteristics, and speech features to provide a preliminary risk assessment. 
              <strong> This tool is for informational purposes only and should not replace professional medical evaluation.</strong>
            </p>
          </div>

          {/* Section 2: Patient Form */}
          <div className="border-t" style={{ borderColor: "#CFE5D5", paddingTop: "24px" }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#1F4F47" }}>📋 Patient Information</h2>
            
            {(formError || analysisError) && (
              <div className="mb-4 p-4 rounded-xl text-red-700" style={{
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                borderLeft: "4px solid #dc2626"
              }}>
                {formError || analysisError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1F4F47" }}>Name *</label>
                <input 
                  type="text" 
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name" 
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition"
                  style={{
                    backgroundColor: "rgba(207, 229, 213, 0.4)",
                    borderColor: "#A6D2C8",
                    borderWidth: "2px",
                    color: "#1F4F47",
                    focusRingColor: "#6EA89E"
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1F4F47" }}>Age</label>
                <input 
                  type="number" 
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Age" 
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition"
                  style={{
                    backgroundColor: "rgba(207, 229, 213, 0.4)",
                    borderColor: "#A6D2C8",
                    borderWidth: "2px",
                    color: "#1F4F47"
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1F4F47" }}>Date of Birth</label>
                <input 
                  type="date" 
                  value={patientDOB}
                  onChange={(e) => setPatientDOB(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition"
                  style={{
                    backgroundColor: "rgba(207, 229, 213, 0.4)",
                    borderColor: "#A6D2C8",
                    borderWidth: "2px",
                    color: "#1F4F47"
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1F4F47" }}>Medical History</label>
                <input 
                  type="text" 
                  value={patientMedicalHistory}
                  onChange={(e) => setPatientMedicalHistory(e.target.value)}
                  placeholder="Any relevant medical history" 
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition"
                  style={{
                    backgroundColor: "rgba(207, 229, 213, 0.4)",
                    borderColor: "#A6D2C8",
                    borderWidth: "2px",
                    color: "#1F4F47"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Voice Recording Interface */}
        {!showAnalysisSection && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-2 mb-6" style={{ borderColor: "#CFE5D5" }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#1F4F47" }}>🎤 Recording Guidelines</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl p-4 text-center border-2" style={{
                backgroundColor: "rgba(207, 229, 213, 0.2)",
                borderColor: "#CFE5D5"
              }}>
                <p className="text-3xl mb-2">🔤</p>
                <p className="text-sm font-semibold" style={{ color: "#1F4F47" }}>Clear Speech</p>
              </div>
              <div className="rounded-xl p-4 text-center border-2" style={{
                backgroundColor: "rgba(166, 210, 200, 0.2)",
                borderColor: "#A6D2C8"
              }}>
                <p className="text-3xl mb-2">🔇</p>
                <p className="text-sm font-semibold" style={{ color: "#1F4F47" }}>Quiet Environment</p>
              </div>
              <div className="rounded-xl p-4 text-center border-2" style={{
                backgroundColor: "rgba(143, 198, 183, 0.2)",
                borderColor: "#8FC6B7"
              }}>
                <p className="text-3xl mb-2">⏱️</p>
                <p className="text-sm font-semibold" style={{ color: "#1F4F47" }}>Duration: 15-30 sec</p>
              </div>
              <div className="rounded-xl p-4 text-center border-2" style={{
                backgroundColor: "rgba(110, 168, 158, 0.2)",
                borderColor: "#6EA89E"
              }}>
                <p className="text-3xl mb-2">🎙️</p>
                <p className="text-sm font-semibold" style={{ color: "#1F4F47" }}>6-8 Inches Away</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-8 border-l-4" style={{
              backgroundColor: "rgba(207, 229, 213, 0.3)",
              borderColor: "#6EA89E",
              color: "#1F4F47"
            }}>
              <p className="font-semibold">⏱️ Duration: MINIMUM 15 seconds - MAXIMUM 30 seconds</p>
            </div>

            <div className="flex flex-col items-center">
              {/* Microphone Circle with Timer */}
              <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full animate-pulse" style={{
                  backgroundImage: "linear-gradient(135deg, #6EA89E, #8FC6B7)"
                }}></div>
                <div className="absolute inset-2 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border-4" style={{ borderColor: "#A6D2C8" }}>
                  {isRecording ? (
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎤</div>
                      <p className="text-2xl font-bold" style={{ color: "#1F4F47" }}>{formatTime(recordingTime)}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl">🎤</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Star Mark and Message */}
              {isRecording && showMinimumWarning && (
                <div className="text-center mb-6">
                  <p className="text-4xl mb-2">⭐</p>
                  <p className="font-semibold text-lg" style={{ color: "#dc2626" }}>Record voice to minimum of 15 sec</p>
                </div>
              )}

              {/* Progress Bar */}
              {isRecording && (
                <div className="w-full max-w-xs mb-6">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(207, 229, 213, 0.5)" }}>
                    <div 
                      className="h-full transition-all duration-100"
                      style={{
                        width: `${Math.min((recordingTime / 30) * 100, 100)}%`,
                        backgroundImage: "linear-gradient(90deg, #6EA89E, #A6D2C8)"
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Recording Visualization */}
              {isRecording && (
                <div className="flex gap-1 mb-8 h-12 items-center">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 rounded-full"
                      style={{
                        backgroundImage: "linear-gradient(to top, #6EA89E, #A6D2C8)",
                        height: `${30 + Math.random() * 70}%`,
                        animation: `pulse 0.3s ease-in-out infinite`,
                        animationDelay: `${i * 0.04}s`
                      }}
                    ></div>
                  ))}
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-4 flex-wrap justify-center mb-6">
                {!isRecording && !audioURL && (
                  <button
                    onClick={startRecording}
                    className="px-8 py-3 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #dc2626, #991b1b)"
                    }}
                  >
                    ▶️ Start Recording
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    disabled={!canStopRecording}
                    className="px-8 py-3 font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
                    style={{
                      backgroundImage: canStopRecording ? "linear-gradient(135deg, #6EA89E, #8FC6B7)" : "none",
                      backgroundColor: canStopRecording ? undefined : "#D1D5DB",
                      color: canStopRecording ? "white" : "#6B7280",
                      cursor: canStopRecording ? "pointer" : "not-allowed"
                    }}
                    title={!canStopRecording ? "Minimum 15 seconds required" : ""}
                  >
                    ⏹️ Stop Recording
                  </button>
                )}

                {audioURL && !isRecording && (
                  <>
                    <button
                      onClick={resetRecording}
                      className="px-8 py-3 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
                      style={{
                        backgroundImage: "linear-gradient(135deg, #f97316, #ea580c)"
                      }}
                    >
                      🔄 Record Again
                    </button>
                    <button
                      onClick={submitAnalysis}
                      disabled={isAnalyzing}
                      className="px-8 py-3 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
                      style={{
                        backgroundImage: isAnalyzing ? "none" : "linear-gradient(135deg, #6EA89E, #8FC6B7)",
                        backgroundColor: isAnalyzing ? "#CFE5D5" : undefined,
                        opacity: isAnalyzing ? 0.6 : 1
                      }}
                    >
                      {isAnalyzing ? "⏳ Analyzing..." : "📊 Analyze Voice"}
                    </button>
                  </>
                )}
              </div>

              {/* Audio Playback */}
              {audioURL && !isRecording && (
                <div className="w-full">
                  <audio src={audioURL} controls className="w-full rounded-lg focus:outline-none" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: Analysis Results */}
        {showAnalysisSection && predictionResult && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-2 mb-6" style={{ borderColor: "#CFE5D5" }}>
            <h2 className="text-2xl font-bold mb-8" style={{ color: "#1F4F47" }}>📊 Analysis Results - {patientName}</h2>

            {/* Risk Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="rounded-xl p-6 text-center border-2" style={{
                backgroundColor: "rgba(220, 38, 38, 0.1)",
                borderColor: "#dc2626"
              }}>
                <p className="text-6xl font-bold mb-2" style={{ color: "#dc2626" }}>
                  {Math.round((predictionResult.probability_parkinsons || 0.5) * 100)}%
                </p>
                <p style={{ color: "#dc2626", fontWeight: "600" }}>Risk Score</p>
              </div>

              <div className="rounded-xl p-6 text-center border-2" style={{
                backgroundColor: "rgba(166, 210, 200, 0.1)",
                borderColor: "#A6D2C8"
              }}>
                <p className="text-xl font-bold mb-4" style={{ color: "#1F4F47" }}>Risk Level</p>
                {predictionResult.risk_level && (
                  <div className="px-4 py-2 rounded-lg font-bold text-white" style={{
                    backgroundColor: predictionResult.probability_parkinsons > 0.7 ? "#dc2626" :
                                     predictionResult.probability_parkinsons > 0.4 ? "#f59e0b" :
                                     "#16a34a"
                  }}>
                    {predictionResult.risk_level}
                  </div>
                )}
              </div>

              <div className="rounded-xl p-6 border-2" style={{
                backgroundColor: "rgba(184, 214, 178, 0.1)",
                borderColor: "#B8D6B2"
              }}>
                <div className="text-sm space-y-2" style={{ color: "#1F4F47" }}>
                  <div className="flex justify-between">
                    <span className="font-semibold">Healthy:</span>
                    <span>{Math.round((predictionResult.probability_healthy || 0.5) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Parkinson's:</span>
                    <span>{Math.round((predictionResult.probability_parkinsons || 0.5) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Duration:</span>
                    <span>{formatTime(recordingTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Analysis Chart */}
            <div className="rounded-xl p-6 mb-8 border-2" style={{
              backgroundColor: "rgba(207, 229, 213, 0.1)",
              borderColor: "#CFE5D5"
            }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: "#1F4F47" }}>Voice Analysis Results</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={voiceAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#A6D2C8" />
                  <XAxis dataKey="name" stroke="#6EA89E" />
                  <YAxis stroke="#6EA89E" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "2px solid #A6D2C8", borderRadius: "8px" }} />
                  <Bar dataKey="value" fill="#8FC6B7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Feature Importance */}
            <div className="rounded-xl p-6 mb-8 border-2" style={{
              backgroundColor: "rgba(166, 210, 200, 0.1)",
              borderColor: "#A6D2C8"
            }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: "#1F4F47" }}>Feature Importance</h3>
              <div className="space-y-3">
                {shapData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-20 font-semibold" style={{ color: "#1F4F47" }}>{item.feature}</div>
                    <div className="flex-1 rounded-full overflow-hidden h-6" style={{ backgroundColor: "rgba(207, 229, 213, 0.5)" }}>
                      <div 
                        className="h-full transition-all" 
                        style={{width: `${item.value}%`, backgroundColor: item.fill}}
                      ></div>
                    </div>
                    <div className="w-12 text-right font-semibold" style={{ color: "#1F4F47" }}>{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Features */}
            {predictionResult.features && (
              <div className="rounded-xl p-6 mb-8 border-2" style={{
                backgroundColor: "rgba(184, 214, 178, 0.1)",
                borderColor: "#B8D6B2"
              }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: "#1F4F47" }}>Voice Features Extracted</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(predictionResult.features).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="rounded-lg p-4 border-2" style={{
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      borderColor: "#CFE5D5"
                    }}>
                      <p className="text-sm" style={{ color: "#6EA89E" }}>{key}</p>
                      <p className="text-lg font-bold" style={{ color: "#1F4F47" }}>{typeof value === 'number' ? value.toFixed(3) : value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={recordAgain}
                className="flex-1 px-6 py-3 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
                style={{
                  backgroundImage: "linear-gradient(135deg, #f97316, #ea580c)"
                }}
              >
                🔄 Record Another Voice
              </button>
              <button
                onClick={() => navigate('/result', { state: { 
                  ...predictionResult,
                  risk_score: Math.round((predictionResult.probability_parkinsons || 0.5) * 100),
                  patientInfo: { name: patientName, age: patientAge, dateOfBirth: patientDOB, medicalHistory: patientMedicalHistory } 
                }})}
                className="flex-1 px-6 py-3 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
                style={{
                  backgroundImage: "linear-gradient(135deg, #6EA89E, #8FC6B7)"
                }}
              >
                📊 View Detailed Report
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default Home;