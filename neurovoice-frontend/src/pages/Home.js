import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function Home() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const [selectedFeatures, setSelectedFeatures] = useState({
    "Pitch Variability": true,
    "Speech Rate": true,
    "Tremor Index": true,
    "Pleural misk": true,
    "Start olah": true,
    "Start Beat": true,
    "Tremor Index": true,
    "Curnout": false,
  });

  const voiceAnalysisData = [
    { name: "Joun", value: 25 },
    { name: "Sub", value: 40 },
    { name: "Mou", value: 35 },
    { name: "Jul", value: 45 },
    { name: "Cun", value: 50 },
    { name: "Nuk", value: 20 },
  ];

  const shapData = [
    { feature: "Voci", value: 35, fill: "#4ade80" },
    { feature: "Tremor", value: 42, fill: "#36b9cc" },
    { feature: "Speech", value: 48, fill: "#fbbf24" },
    { feature: "Pitch", value: 38, fill: "#f87171" },
    { feature: "Other", value: 30, fill: "#c084fc" },
  ];

  const featureImportanceData = [
    { name: "Jitter", value: 30 },
    { name: "Shimmer", value: 25 },
    { name: "F0_mean", value: 20 },
    { name: "HNR", value: 15 },
    { name: "RPDE", value: 10 },
  ];

  const startRecording = async () => {
    try {
      audioChunks.current = [];
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
        setAudioURL(url);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const toggleFeature = (featureName) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [featureName]: !prev[featureName]
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-sky-200 via-sky-100 to-cyan-100 px-4 py-8"
      style={{
        backgroundImage: "radial-gradient(circle at 20% 50%, rgba(191, 219, 254, 0.4), transparent), radial-gradient(circle at 80% 80%, rgba(165, 243, 252, 0.4), transparent), linear-gradient(135deg, #d0e7f9 0%, #e0f2fe 50%, #cffafe 100%)"
      }}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-sky-900 mb-2">NeuroVoice</h1>
          <p className="text-2xl text-sky-800 font-semibold">Early Parkinson's Risk Screening</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Voice Recording Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50 hover:shadow-3xl transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl">🎤</div>
              <h2 className="text-2xl font-bold text-sky-900">Start Recording</h2>
            </div>

            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-8 text-center">
              <div className="mb-6">
                {isRecording ? (
                  <div>
                    <p className="text-lg font-semibold text-sky-700 mb-4">
                      Recording: {formatTime(recordingTime)}
                    </p>
                    <div className="flex justify-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                    </div>
                  </div>
                ) : audioURL ? (
                  <p className="text-lg font-semibold text-green-600 mb-4">✓ Audio Ready</p>
                ) : (
                  <p className="text-lg font-semibold text-sky-700 mb-4">Click to Record</p>
                )}
              </div>

              <div className="flex gap-3 justify-center flex-wrap mb-6">
                {!isRecording && !audioURL && (
                  <button
                    onClick={startRecording}
                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition transform hover:scale-105 shadow-lg"
                  >
                    🎙️ Start Recording
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-xl hover:from-gray-700 hover:to-gray-800 transition transform hover:scale-105 shadow-lg"
                  >
                    ⏹️ Stop Recording
                  </button>
                )}
              </div>

              {audioURL && (
                <div className="mt-6">
                  <audio src={audioURL} controls className="w-full mb-4 rounded-lg focus:outline-none" />
                </div>
              )}
            </div>
          </div>

          {/* Voice Features Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50 hover:shadow-3xl transition">
            <h3 className="text-2xl font-bold text-sky-900 mb-6">Voice Features</h3>
            <div className="space-y-3">
              {Object.entries(selectedFeatures).map(([feature, selected]) => (
                <div
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                  className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition ${
                    selected
                      ? "bg-gradient-to-r from-sky-100 to-cyan-100 border border-sky-300"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  <span className={`font-semibold ${selected ? "text-sky-900" : "text-gray-600"}`}>
                    {feature}
                  </span>
                  <div className={`w-12 h-6 rounded-full transition ${
                    selected ? "bg-sky-500" : "bg-gray-400"
                  }`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Voice Analysis Results */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50 hover:shadow-3xl transition">
            <h3 className="text-xl font-bold text-sky-900 mb-4">Voice Analysis Results</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={voiceAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="name" stroke="#0369a1" />
                <YAxis stroke="#0369a1" />
                <Tooltip contentStyle={{ backgroundColor: "#f0f9ff", border: "1px solid #0369a1", borderRadius: "8px" }} />
                <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <button className="w-full mt-4 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold rounded-xl hover:from-sky-700 hover:to-cyan-700 transition">
              📥 Download Report
            </button>
          </div>

          {/* SHAP Visualization */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50 hover:shadow-3xl transition">
            <h3 className="text-xl font-bold text-sky-900 mb-4">SHAP Visualization</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={shapData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="feature" stroke="#0369a1" />
                <YAxis stroke="#0369a1" />
                <Tooltip contentStyle={{ backgroundColor: "#f0f9ff", border: "1px solid #0369a1", borderRadius: "8px" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {shapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50 hover:shadow-3xl transition mb-6">
          <h3 className="text-xl font-bold text-sky-900 mb-6">Feature Importance</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-sky-100 to-sky-50 p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-sky-700">Jitter</p>
              <p className="text-sky-600 text-sm mt-2">1000m</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-cyan-700">Shimmer</p>
              <p className="text-cyan-600 text-sm mt-2">20m</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-blue-700">Ponth</p>
              <p className="text-blue-600 text-sm mt-2">30m</p>
            </div>
            <div className="bg-gradient-to-br from-sky-100 to-sky-50 p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-sky-700">Cermy</p>
              <p className="text-sky-600 text-sm mt-2">80m</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-cyan-700">Resats</p>
              <p className="text-cyan-600 text-sm mt-2">Tricrinnal</p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50 hover:shadow-3xl transition">
          <h3 className="text-xl font-bold text-sky-900 mb-6">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input type="text" placeholder="Name" className="px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500 text-sky-900" />
            <input type="text" placeholder="Age" className="px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500 text-sky-900" />
            <input type="text" placeholder="Date of Birth" className="px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500 text-sky-900" />
          </div>
          <div className="flex gap-4 items-center mb-6">
            <input type="text" placeholder="Medical History" className="flex-1 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500 text-sky-900" />
            <button className="px-6 py-3 bg-sky-200 text-sky-900 rounded-xl hover:bg-sky-300 transition font-semibold">
              📎
            </button>
          </div>
          <button 
            onClick={() => navigate("/form")}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold rounded-xl hover:from-sky-700 hover:to-cyan-700 transition transform hover:scale-105"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;