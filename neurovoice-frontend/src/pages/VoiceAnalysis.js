import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function VoiceAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state || {};

  const voiceData = [
    { metric: "Jitter", value: 25, normal: 20 },
    { metric: "Shimmer", value: 30, normal: 25 },
    { metric: "HNR", value: 35, normal: 40 },
    { metric: "RPDE", value: 28, normal: 20 },
    { metric: "DFA", value: 32, normal: 30 },
    { metric: "PPE", value: 18, normal: 22 },
  ];

  const formantData = [
    { freq: "F1", formant1: 700, formant2: 1220, formant3: 2600 },
    { freq: "F2", formant1: 600, formant2: 1300, formant3: 2500 },
    { freq: "F3", formant1: 750, formant2: 1250, formant3: 2550 },
    { freq: "F4", formant1: 680, formant2: 1280, formant3: 2620 },
  ];

  const mfccData = [
    { coeff: "MFCC-1", value: 45 },
    { coeff: "MFCC-2", value: 52 },
    { coeff: "MFCC-3", value: 38 },
    { coeff: "MFCC-4", value: 48 },
    { coeff: "MFCC-5", value: 42 },
  ];

  const spectralData = [
    { time: "0s", spectral: 35 },
    { time: "1s", spectral: 42 },
    { time: "2s", spectral: 38 },
    { time: "3s", spectral: 45 },
    { time: "4s", spectral: 40 },
  ];

  return (
    <div 
      className="min-h-screen px-4 py-8"
      style={{
        backgroundImage: "linear-gradient(135deg, #5f8d8f 0%, #6fa7aa 25%, #5d9ca0 50%, #4a9199 75%, #5a8b8e 100%)"
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition border border-white/30"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white">
            Voice Analysis Report
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Voice Parameters</h3>
              <span className="text-white/60 text-2xl">📊</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={voiceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="metric" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                />
                <Legend wrapperStyle={{ color: "white" }} />
                <Bar dataKey="value" fill="#f97316" name="Patient Value" radius={[8, 8, 0, 0]} />
                <Bar dataKey="normal" fill="#10b981" name="Normal Range" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Formant Frequencies</h3>
              <span className="text-white/60 text-2xl">🎵</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={formantData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="freq" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                />
                <Legend wrapperStyle={{ color: "white" }} />
                <Line type="monotone" dataKey="formant1" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 4 }} />
                <Line type="monotone" dataKey="formant2" stroke="#14b8a6" strokeWidth={2} dot={{ fill: "#14b8a6", r: 4 }} />
                <Line type="monotone" dataKey="formant3" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">MFCC Coefficients</h3>
              <span className="text-white/60 text-2xl">📈</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={mfccData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="coeff" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Spectral Centroid</h3>
              <span className="text-white/60 text-2xl">🌊</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={spectralData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                />
                <Area type="monotone" dataKey="spectral" fill="#06b6d4" stroke="rgba(255,255,255,0.3)" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">📋 Detailed Analysis Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 p-4 rounded-xl hover:bg-white/20 transition">
              <p className="text-white/70 text-sm font-semibold mb-2">Jitter Analysis</p>
              <p className="text-white/80 text-sm">Measures pitch variation in voice. High jitter indicates irregular voicing.</p>
              <p className="text-xl font-bold text-cyan-400 mt-3">25 <span className="text-white/60 text-sm font-normal">(Normal: 20)</span></p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl hover:bg-white/20 transition">
              <p className="text-white/70 text-sm font-semibold mb-2">Shimmer Analysis</p>
              <p className="text-white/80 text-sm">Measures amplitude variation. Higher values suggest vocal instability.</p>
              <p className="text-xl font-bold text-cyan-400 mt-3">30 <span className="text-white/60 text-sm font-normal">(Normal: 25)</span></p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl hover:bg-white/20 transition">
              <p className="text-white/70 text-sm font-semibold mb-2">HNR Analysis</p>
              <p className="text-white/80 text-sm">Harmonic-to-Noise Ratio. Lower values indicate more noise in voice.</p>
              <p className="text-xl font-bold text-cyan-400 mt-3">35 <span className="text-white/60 text-sm font-normal">(Normal: 40)</span></p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={() => navigate("/feature-importance", { state: data })}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold hover:from-orange-500 hover:to-amber-500 transition transform hover:scale-105"
          >
            Feature Importance →
          </button>
          <button
            onClick={() => navigate("/shap-visualization", { state: data })}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-white font-semibold hover:from-cyan-500 hover:to-teal-500 transition transform hover:scale-105"
          >
            → SHAP Visualization
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceAnalysis;
