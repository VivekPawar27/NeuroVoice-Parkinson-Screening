import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    { feature: "Jitter", value: 35, fill: "#4ade80" },
    { feature: "Tremor", value: 42, fill: "#36b9cc" },
    { feature: "Speech", value: 48, fill: "#fbbf24" },
    { feature: "Pitch", value: 38, fill: "#f87171" },
    { feature: "Other", value: 30, fill: "#c084fc" },
  ];

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
      className="min-h-screen bg-gradient-to-br from-sky-200 via-sky-100 to-cyan-100 px-4 py-8"
      style={{
        backgroundImage: "radial-gradient(circle at 20% 50%, rgba(191, 219, 254, 0.4), transparent), radial-gradient(circle at 80% 80%, rgba(165, 243, 252, 0.4), transparent), linear-gradient(135deg, #d0e7f9 0%, #e0f2fe 50%, #cffafe 100%)"
      }}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* SECTION 1: NeuroVoice Info + Patient Form */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50 hover:shadow-3xl transition mb-6">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-sky-900 mb-2">NeuroVoice</h1>
            <p className="text-2xl text-sky-800 font-semibold">Early Parkinson's Risk Screening</p>
          </div>

          <div className="border-t border-sky-200 pt-8">
            <h2 className="text-2xl font-bold text-sky-900 mb-6">📋 Patient Information</h2>
            
            {(formError || analysisError) && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {formError || analysisError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-sky-900 mb-2">Name *</label>
                <input 
                  type="text" 
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name" 
                  className="w-full px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500 text-sky-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-sky-900 mb-2">Age</label>
                <input 
                  type="number" 
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Age" 
                  className="w-full px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500 text-sky-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-sky-900 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  value={patientDOB}
                  onChange={(e) => setPatientDOB(e.target.value)}
                  className="w-full px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500 text-sky-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-sky-900 mb-2">Medical History</label>
                <input 
                  type="text" 
                  value={patientMedicalHistory}
                  onChange={(e) => setPatientMedicalHistory(e.target.value)}
                  placeholder="Any relevant medical history" 
                  className="w-full px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500 text-sky-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Voice Recording Interface */}
        {!showAnalysisSection && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50 hover:shadow-3xl transition mb-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-6">🎤 Recording Guidelines</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-4 text-center border border-sky-100">
                <p className="text-3xl mb-2">🔤</p>
                <p className="text-sm font-semibold text-sky-900">Clear Speech</p>
              </div>
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-4 text-center border border-sky-100">
                <p className="text-3xl mb-2">🔇</p>
                <p className="text-sm font-semibold text-sky-900">Quiet Environment</p>
              </div>
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-4 text-center border border-sky-100">
                <p className="text-3xl mb-2">⏱️</p>
                <p className="text-sm font-semibold text-sky-900">Duration: 15-30 sec</p>
              </div>
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-4 text-center border border-sky-100">
                <p className="text-3xl mb-2">🎙️</p>
                <p className="text-sm font-semibold text-sky-900">6-8 Inches Away</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
              <p className="text-blue-900 font-semibold">⏱️ Duration: MINIMUM 15 seconds - MAXIMUM 30 seconds</p>
            </div>

            <div className="flex flex-col items-center">
              {/* Microphone Circle with Timer */}
              <div className="relative w-40 h-40 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border-4 border-sky-300">
                  {isRecording ? (
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎤</div>
                      <p className="text-2xl font-bold text-sky-900">{formatTime(recordingTime)}</p>
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
                  <p className="text-red-600 font-semibold text-lg">Record voice to minimum of 15 sec</p>
                </div>
              )}

              {/* Progress Bar */}
              {isRecording && (
                <div className="w-full max-w-xs mb-6">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-100"
                      style={{width: `${Math.min((recordingTime / 30) * 100, 100)}%`}}
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
                      className="w-2 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full"
                      style={{
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
                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition transform hover:scale-105 shadow-lg"
                  >
                    ▶️ Start Recording
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    disabled={!canStopRecording}
                    className={`px-8 py-3 font-bold rounded-xl transition transform hover:scale-105 shadow-lg ${
                      canStopRecording
                        ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                    title={!canStopRecording ? "Minimum 15 seconds required" : ""}
                  >
                    ⏹️ Stop Recording
                  </button>
                )}

                {audioURL && !isRecording && (
                  <>
                    <button
                      onClick={resetRecording}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition transform hover:scale-105 shadow-lg"
                    >
                      🔄 Record Again
                    </button>
                    <button
                      onClick={submitAnalysis}
                      disabled={isAnalyzing}
                      className="px-8 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold rounded-xl hover:from-sky-700 hover:to-cyan-700 transition transform hover:scale-105 shadow-lg disabled:opacity-50"
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
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50 hover:shadow-3xl transition mb-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-8">📊 Analysis Results - {patientName}</h2>

            {/* Risk Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center border border-red-200">
                <p className="text-6xl font-bold text-red-600 mb-2">
                  {Math.round((predictionResult.probability_parkinsons || 0.5) * 100)}%
                </p>
                <p className="text-red-900 font-semibold">Risk Score</p>
              </div>

              <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-6 text-center border border-sky-200">
                <p className="text-xl font-bold text-sky-900 mb-4">Risk Level</p>
                {predictionResult.risk_level && (
                  <div className={`px-4 py-2 rounded-lg font-bold text-white ${
                    predictionResult.probability_parkinsons > 0.7 ? "bg-red-600" :
                    predictionResult.probability_parkinsons > 0.4 ? "bg-yellow-600" :
                    "bg-green-600"
                  }`}>
                    {predictionResult.risk_level}
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border border-cyan-200">
                <div className="text-sm text-gray-700 space-y-2">
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
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-6 mb-8 border border-sky-200">
              <h3 className="text-xl font-bold text-sky-900 mb-4">Voice Analysis Results</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={voiceAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="name" stroke="#0369a1" />
                  <YAxis stroke="#0369a1" />
                  <Tooltip contentStyle={{ backgroundColor: "#f0f9ff", border: "1px solid #0369a1", borderRadius: "8px" }} />
                  <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Feature Importance */}
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-6 mb-8 border border-sky-200">
              <h3 className="text-xl font-bold text-sky-900 mb-6">Feature Importance</h3>
              <div className="space-y-3">
                {shapData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-20 font-semibold text-sky-900">{item.feature}</div>
                    <div className="flex-1 bg-gray-200 rounded-full overflow-hidden h-6">
                      <div 
                        className="h-full transition-all" 
                        style={{width: `${item.value}%`, backgroundColor: item.fill}}
                      ></div>
                    </div>
                    <div className="w-12 text-right font-semibold text-sky-900">{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Features */}
            {predictionResult.features && (
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-6 mb-8 border border-sky-200">
                <h3 className="text-xl font-bold text-sky-900 mb-4">Voice Features Extracted</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(predictionResult.features).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg p-4 border border-sky-100">
                      <p className="text-sm text-gray-600">{key}</p>
                      <p className="text-lg font-bold text-sky-900">{typeof value === 'number' ? value.toFixed(3) : value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={recordAgain}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition transform hover:scale-105 shadow-lg"
              >
                🔄 Record Another Voice
              </button>
              <button
                onClick={() => navigate('/result', { state: { prediction: predictionResult, patientInfo: { name: patientName, age: patientAge, dob: patientDOB, medicalHistory: patientMedicalHistory } } })}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold rounded-xl hover:from-sky-700 hover:to-cyan-700 transition transform hover:scale-105 shadow-lg"
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