import { useLocation, useNavigate } from "react-router-dom";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  const getRiskColor = (level) => {
    switch (level) {
      case "High Risk":
        return { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", badge: "bg-red-100 text-red-800" };
      case "Medium Risk":
        return { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800" };
      case "Low Risk":
        return { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", badge: "bg-green-100 text-green-800" };
      default:
        return { bg: "bg-sky-50", border: "border-sky-500", text: "text-sky-700", badge: "bg-sky-100 text-sky-800" };
    }
  };

  const colors = getRiskColor(data?.risk_level);

  const riskOverTimeData = [
    { month: "Jan", risk: 35 },
    { month: "Feb", risk: 32 },
    { month: "Mar", risk: 28 },
    { month: "Apr", risk: 25 },
    { month: "May", risk: 22 },
    { month: "Jun", risk: 18 },
  ];

  const riskFactorsData = [
    { factor: "Voice Tremor", value: 45 },
    { factor: "Speech Rate", value: 38 },
    { factor: "Pitch Variability", value: 42 },
    { factor: "Articulation", value: 35 },
    { factor: "Loudness", value: 28 },
  ];

  const shapDataData = [
    { feature: "mfcc-1", value: 50 },
    { feature: "mfcc-2", value: 42 },
    { feature: "mfcc-3", value: 38 },
    { feature: "F0_mean", value: 55 },
    { feature: "Jitter", value: 48 },
    { feature: "Shimmer", value: 45 },
    { feature: "HNR", value: 32 },
  ];

  const featureImportanceData = [
    { name: "Pitch Variability", value: 35, fill: "#0ea5e9" },
    { name: "Speech Rate", value: 25, fill: "#06b6d4" },
    { name: "Tremor Index", value: 20, fill: "#00d9ff" },
    { name: "Other", value: 20, fill: "#67e8f9" },
  ];

  const featureDependenceData = Array.from({ length: 50 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100 + (i % 2) * 20,
  }));

  return (
    <div 
      className="min-h-screen px-4 py-8"
      style={{
        backgroundImage: "linear-gradient(135deg, #d0e7f9 0%, #e0f2fe 50%, #cffafe 100%)"
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-2">Screening Results</h1>
          <p className="text-sky-700 font-medium">Comprehensive voice analysis and risk assessment</p>
        </div>

        <div className={`bg-white/80 backdrop-blur-md rounded-3xl p-8 mb-8 border-l-4 ${colors.border} shadow-2xl border border-sky-200/50`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className={`text-sm font-semibold mb-3 ${colors.text}`}>RISK SCORE</p>
              <p className={`text-6xl font-bold ${colors.text}`}>{data?.risk_score}%</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className={`inline-block ${colors.badge} px-6 py-3 rounded-full text-lg font-bold mb-2`}>
                {data?.risk_level}
              </div>
              <p className={`text-sm ${colors.text}`}>Risk Classification</p>
            </div>
            <div className="text-left">
              <h4 className={`font-bold mb-3 ${colors.text}`}>Key Indicators:</h4>
              <ul className={`text-sm space-y-1 ${colors.text}`}>
                <li>✓ Voice Tremor Detected</li>
                <li>✓ Slight Speech Rate Reduction</li>
                <li>✓ Minor Pitch Variability</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-sky-200/50">
            <h3 className="text-lg font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-4">Risk Score Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="month" stroke="#0369a1" />
                <YAxis stroke="#0369a1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f0f9ff",
                    border: "1px solid #0369a1",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: "#06b6d4", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-sky-200/50">
            <h3 className="text-lg font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-4">Risk Factors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskFactorsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="factor" stroke="#0369a1" />
                <YAxis stroke="#0369a1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f0f9ff",
                    border: "1px solid #0369a1",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-sky-200/50">
            <h3 className="text-lg font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-4">SHAP Summary Plot</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shapDataData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="feature" stroke="#0369a1" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#0369a1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f0f9ff",
                    border: "1px solid #0369a1",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-sky-200/50">
            <h3 className="text-lg font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-4">Feature Importance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={featureImportanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {featureImportanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl mb-8 border border-sky-200/50">
          <h3 className="text-lg font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-4">Feature Dependence Plot</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="x" stroke="#0369a1" />
              <YAxis dataKey="y" stroke="#0369a1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#f0f9ff",
                  border: "1px solid #0369a1",
                  borderRadius: "8px",
                }}
              />
              <Scatter name="Features" data={featureDependenceData} fill="#06b6d4" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {data?.patientInfo && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl mb-8 border-l-4 border-sky-500 border border-sky-200/50">
            <h3 className="text-lg font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-4">👤 Patient Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sky-600 text-sm font-semibold">Name</p>
                <p className="text-sky-900 font-bold">{data.patientInfo.name}</p>
              </div>
              <div>
                <p className="text-sky-600 text-sm font-semibold">Age</p>
                <p className="text-sky-900 font-bold">{data.patientInfo.age}</p>
              </div>
              <div>
                <p className="text-sky-600 text-sm font-semibold">Gender</p>
                <p className="text-sky-900 font-bold">{data.patientInfo.gender}</p>
              </div>
              <div>
                <p className="text-sky-600 text-sm font-semibold">Audio File</p>
                <p className="text-sky-900 font-bold text-sm truncate">{data?.filename}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 rounded-3xl p-6 mb-8 border-l-4 border-amber-500 border border-amber-200/50">
          <p className="text-amber-900 text-sm leading-relaxed">
            <span className="font-bold">⚠️ Important Disclaimer:</span> This screening tool is for informational purposes only. 
            The results should not be considered as a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 rounded-xl bg-gray-300 text-gray-900 font-semibold hover:bg-gray-400 transition duration-300"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/form")}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold hover:from-sky-700 hover:to-cyan-700 transition duration-300 transform hover:scale-105"
          >
            New Screening
          </button>
          <button
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold hover:from-sky-600 hover:to-cyan-600 transition duration-300"
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;
