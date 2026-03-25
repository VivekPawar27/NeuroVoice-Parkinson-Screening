import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

function FeatureImportance() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state || {};

  const featureData = [
    { feature: "Jitter", importance: 25, percentage: 18 },
    { feature: "Shimmer", importance: 28, percentage: 20 },
    { feature: "HNR", importance: 22, percentage: 16 },
    { feature: "RPDE", importance: 30, percentage: 21 },
    { feature: "DFA", importance: 26, percentage: 19 },
    { feature: "PPE", importance: 19, percentage: 14 },
  ];

  const topFeatures = [
    { name: "RPDE", value: 30, fill: "#f59e0b" },
    { name: "Shimmer", value: 28, fill: "#06b6d4" },
    { name: "Jitter", value: 25, fill: "#0ea5e9" },
    { name: "DFA", value: 26, fill: "#0284c7" },
    { name: "HNR", value: 22, fill: "#10b981" },
    { name: "PPE", value: 19, fill: "#8b5cf6" },
  ];

  const radarData = [
    { feature: "Jitter", patient: 25, healthy: 15 },
    { feature: "Shimmer", patient: 28, healthy: 18 },
    { feature: "HNR", patient: 22, healthy: 35 },
    { feature: "RPDE", patient: 30, healthy: 18 },
    { feature: "DFA", patient: 26, healthy: 20 },
    { feature: "PPE", patient: 19, healthy: 12 },
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
            Feature Importance Analysis
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Importance Ranking</h3>
              <span className="text-white/60 text-2xl">📊</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.6)" />
                <YAxis dataKey="feature" type="category" stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                />
                <Bar dataKey="importance" fill="#06b6d4" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Top Features Distribution</h3>
              <span className="text-white/60 text-2xl">🎯</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={topFeatures}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topFeatures.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 lg:col-span-2 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Patient vs Healthy Comparison</h3>
              <span className="text-white/60 text-2xl">📈</span>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis dataKey="feature" stroke="rgba(255,255,255,0.6)" />
                <PolarRadiusAxis stroke="rgba(255,255,255,0.6)" />
                <Radar name="Patient" dataKey="patient" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                <Radar name="Healthy" dataKey="healthy" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Legend wrapperStyle={{ color: "white" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 mb-6 hover:bg-white/20 transition">
          <h3 className="text-xl font-bold text-white mb-4">% Distribution of Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featureData.map((feature, idx) => (
              <div key={idx} className="bg-white/10 p-4 rounded-xl border-l-4 border-cyan-400 hover:bg-white/20 transition">
                <p className="text-white font-semibold mb-2">{feature.feature}</p>
                <p className="text-3xl font-bold text-cyan-400">{feature.percentage}%</p>
                <p className="text-xs text-white/60 mt-1">Score: {feature.importance}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 mb-6 hover:bg-white/20 transition">
          <h3 className="text-xl font-bold text-white mb-4">🔍 Risk Level Analysis</h3>
          <div className="space-y-3">
            <div className="p-4 bg-red-500/20 border border-red-400/30 border-l-4 border-l-red-500 rounded-lg">
              <p className="font-semibold text-red-300">🔴 High Risk Features (&gt;25):</p>
              <p className="text-red-200 text-sm mt-1">RPDE (30), Shimmer (28), DFA (26), Jitter (25)</p>
            </div>
            <div className="p-4 bg-yellow-500/20 border border-yellow-400/30 border-l-4 border-l-yellow-500 rounded-lg">
              <p className="font-semibold text-yellow-300">🟡 Medium Risk Features (20-25):</p>
              <p className="text-yellow-200 text-sm mt-1">HNR (22) - Lower is concerning for voice quality</p>
            </div>
            <div className="p-4 bg-green-500/20 border border-green-400/30 border-l-4 border-l-green-500 rounded-lg">
              <p className="font-semibold text-green-300">🟢 Lower Risk Features (&lt;20):</p>
              <p className="text-green-200 text-sm mt-1">PPE (19) - Pitch Period Entropy is relatively stable</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/voice-analysis", { state: data })}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-white font-semibold hover:from-cyan-500 hover:to-teal-500 transition transform hover:scale-105"
          >
            ← Voice Analysis
          </button>
          <button
            onClick={() => navigate("/shap-visualization", { state: data })}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-blue-400 text-white font-semibold hover:from-teal-500 hover:to-blue-500 transition transform hover:scale-105"
          >
            SHAP Visualization →
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeatureImportance;
