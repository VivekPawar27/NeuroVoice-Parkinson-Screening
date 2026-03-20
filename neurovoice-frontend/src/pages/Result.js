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
        return { bg: "bg-teal-50", border: "border-teal-500", text: "text-teal-700", badge: "bg-teal-100 text-teal-800" };
    }
  };

  const colors = getRiskColor(data?.risk_level);

  // Mock data for graphs
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
    { name: "Pitch Variability", value: 35, fill: "#14b8a6" },
    { name: "Speech Rate", value: 25, fill: "#0d9488" },
    { name: "Tremor Index", value: 20, fill: "#06b6d4" },
    { name: "Other", value: 20, fill: "#2dd4bf" },
  ];

  const featureDependenceData = Array.from({ length: 50 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100 + (i % 2) * 20,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-teal-900 mb-2">Screening Results</h1>
          <p className="text-teal-600">Comprehensive voice analysis and risk assessment</p>
        </div>

        {/* Risk Score Card */}
        <div className={`card-shadow ${colors.bg} rounded-2xl p-8 mb-8 border-l-4 ${colors.border}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Risk Score */}
            <div className="text-center">
              <p className={`text-sm font-semibold mb-3 ${colors.text}`}>RISK SCORE</p>
              <p className={`text-6xl font-bold ${colors.text}`}>{data?.risk_score}%</p>
            </div>
            {/* Risk Level */}
            <div className="flex flex-col items-center justify-center">
              <div className={`inline-block ${colors.badge} px-6 py-3 rounded-full text-lg font-bold mb-2`}>
                {data?.risk_level}
              </div>
              <p className={`text-sm ${colors.text}`}>Risk Classification</p>
            </div>
            {/* Key Indicators */}
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Score Over Time */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-teal-800 mb-4">Risk Score Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f0f9f8",
                    border: "1px solid #0d9488",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ fill: "#14b8a6", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Factors */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-teal-800 mb-4">Risk Factors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskFactorsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="factor" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f0f9f8",
                    border: "1px solid #0d9488",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* SHAP Summary Plot */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-teal-800 mb-4">SHAP Summary Plot</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shapDataData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="feature" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f0f9f8",
                    border: "1px solid #0d9488",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Feature Importance */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-teal-800 mb-4">Feature Importance</h3>
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

        {/* Feature Dependence Plot */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-8">
          <h3 className="text-lg font-bold text-teal-800 mb-4">Feature Dependence Plot</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="x" stroke="#64748b" />
              <YAxis dataKey="y" stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#f0f9f8",
                  border: "1px solid #0d9488",
                  borderRadius: "8px",
                }}
              />
              <Scatter name="Features" data={featureDependenceData} fill="#14b8a6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Info Box */}
        {data?.patientInfo && (
          <div className="bg-white rounded-2xl p-6 shadow-md mb-8 border-l-4 border-teal-500">
            <h3 className="text-lg font-bold text-teal-800 mb-4">👤 Patient Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-teal-600 text-sm font-semibold">Name</p>
                <p className="text-teal-900 font-bold">{data.patientInfo.name}</p>
              </div>
              <div>
                <p className="text-teal-600 text-sm font-semibold">Age</p>
                <p className="text-teal-900 font-bold">{data.patientInfo.age}</p>
              </div>
              <div>
                <p className="text-teal-600 text-sm font-semibold">Gender</p>
                <p className="text-teal-900 font-bold">{data.patientInfo.gender}</p>
              </div>
              <div>
                <p className="text-teal-600 text-sm font-semibold">Audio File</p>
                <p className="text-teal-900 font-bold text-sm truncate">{data?.filename}</p>
              </div>
            </div>
          </div>
        )}

        {/* Medical Disclaimer */}
        <div className="bg-amber-50 rounded-2xl p-6 mb-8 border-l-4 border-amber-500">
          <p className="text-amber-900 text-sm leading-relaxed">
            <span className="font-bold">⚠️ Important Disclaimer:</span> This screening tool is for informational purposes only. 
            The results should not be considered as a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 rounded-lg bg-gray-300 text-gray-900 font-semibold hover:bg-gray-400 transition duration-300"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/form")}
            className="px-8 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition duration-300 transform hover:scale-105"
          >
            New Screening
          </button>
          <button
            className="px-8 py-3 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition duration-300"
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;
