import { useLocation, useNavigate } from "react-router-dom";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line, Bar, BarChart, Cell, ResponsiveContainer
} from "recharts";

function SHAPVisualization() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state || {};

  const shapValues = [
    { feature: "RPDE", shap: 0.35, abs_shap: 0.35 },
    { feature: "Shimmer", shap: -0.28, abs_shap: 0.28 },
    { feature: "Jitter", shap: 0.32, abs_shap: 0.32 },
    { feature: "DFA", shap: 0.26, abs_shap: 0.26 },
    { feature: "HNR", shap: -0.22, abs_shap: 0.22 },
    { feature: "PPE", shap: 0.18, abs_shap: 0.18 },
  ];

  const featureContribution = [
    { feature: "RPDE", contribution: 35, direction: "Increases Risk" },
    { feature: "Shimmer", contribution: 28, direction: "Decreases Risk" },
    { feature: "Jitter", contribution: 32, direction: "Increases Risk" },
    { feature: "DFA", contribution: 26, direction: "Increases Risk" },
    { feature: "HNR", contribution: 22, direction: "Decreases Risk" },
    { feature: "PPE", contribution: 18, direction: "Increases Risk" },
  ];

  const dependenceData = [
    { value: 10, shap: 0.15 },
    { value: 15, shap: 0.22 },
    { value: 20, shap: 0.28 },
    { value: 25, shap: 0.32 },
    { value: 30, shap: 0.35 },
    { value: 35, shap: 0.38 },
    { value: 40, shap: 0.40 },
  ];

  const modelExplanation = [
    {
      feature: "RPDE",
      value: 0.32,
      explanation: "Relative Measure of Pitch Deviations from One Cycle to Next - Strong indicator of voice regularity changes in Parkinson's"
    },
    {
      feature: "Shimmer",
      value: 0.28,
      explanation: "Variation in voice amplitude cycles - Detects tremor patterns characteristic of Parkinson's disease"
    },
    {
      feature: "Jitter",
      value: 0.32,
      explanation: "Perturbation in fundamental frequency - Reflects vocal cord instability in neurological conditions"
    },
  ];

  const getColor = (value) => {
    if (value > 0) return "#f59e0b";
    return "#06b6d4";
  };

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
            SHAP Value Visualization
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">SHAP Value Magnitudes</h3>
              <span className="text-white/60 text-2xl">📊</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={shapValues.sort((a, b) => b.abs_shap - a.abs_shap)} layout="vertical">
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
                <Bar dataKey="abs_shap" fill="#0ea5e9" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-white/60 mt-4">Higher magnitude = Stronger influence on prediction</p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Feature Contribution Direction</h3>
              <span className="text-white/60 text-2xl">📊</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={featureContribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                  content={({ payload }) => (
                    payload && payload[0]
                      ? (
                        <div className="bg-white p-2 border border-sky-300 rounded">
                          <p className="font-semibold text-sky-900">{payload[0].payload.feature}</p>
                          <p className="text-sm text-orange-600">{payload[0].value}% - {payload[0].payload.direction}</p>
                        </div>
                      )
                      : null
                  )}
                />
                <Bar dataKey="contribution" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 lg:col-span-2 hover:bg-white/20 transition">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">RPDE Dependence Plot</h3>
              <span className="text-white/60 text-2xl">📈</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="value" name="RPDE Value" stroke="rgba(255,255,255,0.6)" />
                <YAxis dataKey="shap" name="SHAP Value" stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "white"
                  }}
                />
                <Scatter name="SHAP Dependence" data={dependenceData} fill="#06b6d4" />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-white/60 mt-4">Shows how SHAP values change with feature value - Positive correlation indicates increasing risk</p>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 mb-6 hover:bg-white/20 transition">
          <h3 className="text-xl font-bold text-white mb-4">What is SHAP?</h3>
          <p className="text-white/90 mb-4">
            SHAP (SHapley Additive exPlanations) values provide a way to understand how each feature contributes to the model's prediction. 
            They show the impact of each feature on the final decision, making the AI model more transparent and interpretable.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-500/20 p-4 rounded-xl border border-blue-400/30">
              <p className="font-semibold text-blue-300 mb-2">✓ Positive SHAP Values:</p>
              <p className="text-blue-100 text-sm">Higher values increase likelihood of Parkinson's diagnosis</p>
            </div>
            <div className="bg-cyan-500/20 p-4 rounded-xl border border-cyan-400/30">
              <p className="font-semibold text-cyan-300 mb-2">✓ Negative SHAP Values:</p>
              <p className="text-cyan-100 text-sm">Lower values decrease likelihood of Parkinson's diagnosis</p>
            </div>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 mb-6 hover:bg-white/20 transition">
          <h3 className="text-xl font-bold text-white mb-4">Top Feature Explanations</h3>
          <div className="space-y-4">
            {modelExplanation.map((item, idx) => (
              <div key={idx} className="p-4 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-white">{item.feature}</p>
                  <span className="px-3 py-1 bg-cyan-500 text-white rounded-full text-xs font-bold">
                    {(item.value * 100).toFixed(0)}% Impact
                  </span>
                </div>
                <p className="text-white/80 text-sm">{item.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border-2 border-white/30 mb-6 hover:bg-white/20 transition">
          <h3 className="text-xl font-bold text-white mb-4">🧠 Model Interpretation</h3>
          <ul className="space-y-2 text-white/90">
            <li>• <strong>RPDE (0.35 SHAP)</strong>: Most influential - captures voice instability patterns</li>
            <li>• <strong>Jitter (0.32 SHAP)</strong>: High weight on frequency perturbations indicating neurological impact</li>
            <li>• <strong>Shimmer (0.28 SHAP)</strong>: Amplitude variations critical for Parkinson's detection</li>
            <li>• Other features support the prediction with varying degrees of influence</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/feature-importance", { state: data })}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-white font-semibold hover:from-cyan-500 hover:to-teal-500 transition transform hover:scale-105"
          >
            ← Feature Importance
          </button>
          <button
            onClick={() => navigate("/result", { state: data })}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-blue-400 text-white font-semibold hover:from-teal-500 hover:to-blue-500 transition transform hover:scale-105"
          >
            Back to Results →
          </button>
        </div>
      </div>
    </div>
  );
}

export default SHAPVisualization;
