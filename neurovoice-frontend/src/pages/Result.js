import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
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
    { name: "Pitch Variability", value: 35, fill: "#6EA89E" },
    { name: "Speech Rate", value: 25, fill: "#8FC6B7" },
    { name: "Tremor Index", value: 20, fill: "#A6D2C8" },
    { name: "Other", value: 20, fill: "#B8D6B2" },
  ];

  const featureDependenceData = Array.from({ length: 50 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100 + (i % 2) * 20,
  }));

  const downloadReport = () => {
    if (!data) return;

    const reportContent = `NeuroVoice Screening Report
====================================
Generated: ${new Date().toLocaleString()}

PATIENT INFORMATION:
Name: ${data.patientInfo?.name || "N/A"}
Age: ${data.patientInfo?.age || "N/A"}

SCREENING RESULTS:
Risk Score: ${data?.risk_score}%
Risk Level: ${data?.risk_level}
Analysis Date: ${new Date().toLocaleString()}

RISK FACTORS ANALYZED:
- Voice Tremor
- Speech Rate
- Pitch Variability
- Articulation Quality
- Loudness Control

RECOMMENDATIONS:
1. Consult with a healthcare professional for proper medical evaluation
2. Keep track of any voice changes over time
3. Follow up with periodic screenings as recommended

IMPORTANT DISCLAIMER:
This screening tool is for informational purposes only.
The results should not be considered as a medical diagnosis.
Always consult a qualified healthcare professional.
    `;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(reportContent));
    element.setAttribute("download", `NeuroVoice_Report_${new Date().getTime()}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2" style={{
            backgroundImage: "linear-gradient(135deg, #1F4F47 0%, #2D5A4F 50%, #3A6B63 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Screening Results
          </h1>
          <p style={{ color: "#1F4F47", fontSize: "16px", fontWeight: "500" }}>
            Comprehensive voice analysis and risk assessment
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 mb-8 border-2 shadow-2xl" style={{ borderColor: "#CFE5D5" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-sm font-semibold mb-3" style={{ color: "#6EA89E" }}>RISK SCORE</p>
              <p className="text-6xl font-bold" style={{ color: "#6EA89E" }}>{data?.risk_score}%</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="inline-block px-6 py-3 rounded-full text-lg font-bold mb-2" style={{
                backgroundColor: data?.risk_level === "High Risk" ? "#fee2e2" : 
                                 data?.risk_level === "Medium Risk" ? "#fef3c7" : "#dcfce7",
                color: data?.risk_level === "High Risk" ? "#991b1b" : 
                       data?.risk_level === "Medium Risk" ? "#92400e" : "#166534"
              }}>
                {data?.risk_level}
              </div>
              <p style={{ color: "#6EA89E", fontSize: "14px", fontWeight: "500" }}>Risk Classification</p>
            </div>
            <div className="text-left">
              <h4 className="font-bold mb-3" style={{ color: "#1F4F47" }}>Key Indicators:</h4>
              <ul className="text-sm space-y-1" style={{ color: "#2D5A4F" }}>
                <li>✓ Voice Tremor Detected</li>
                <li>✓ Slight Speech Rate Reduction</li>
                <li>✓ Minor Pitch Variability</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-2" style={{ borderColor: "#CFE5D5" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1F4F47" }}>Risk Score Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#A6D2C8" />
                <XAxis dataKey="month" stroke="#6EA89E" />
                <YAxis stroke="#6EA89E" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "2px solid #A6D2C8",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#6EA89E"
                  strokeWidth={2}
                  dot={{ fill: "#8FC6B7", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-2" style={{ borderColor: "#CFE5D5" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1F4F47" }}>Risk Factors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskFactorsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#A6D2C8" />
                <XAxis dataKey="factor" stroke="#6EA89E" />
                <YAxis stroke="#6EA89E" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "2px solid #A6D2C8",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#8FC6B7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-2" style={{ borderColor: "#CFE5D5" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1F4F47" }}>SHAP Summary Plot</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shapDataData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#A6D2C8" />
                <XAxis dataKey="feature" stroke="#6EA89E" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6EA89E" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "2px solid #A6D2C8",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#A6D2C8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-2" style={{ borderColor: "#CFE5D5" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1F4F47" }}>Feature Importance</h3>
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

        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl mb-8 border-2" style={{ borderColor: "#CFE5D5" }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: "#1F4F47" }}>Feature Dependence Plot</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#A6D2C8" />
              <XAxis dataKey="x" stroke="#6EA89E" />
              <YAxis dataKey="y" stroke="#6EA89E" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "2px solid #A6D2C8",
                  borderRadius: "8px",
                }}
              />
              <Scatter name="Features" data={featureDependenceData} fill="#8FC6B7" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {data?.patientInfo && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl mb-8 border-l-4 border-2" style={{ borderColor: "#CFE5D5", borderLeftColor: "#6EA89E", borderLeftWidth: "4px" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1F4F47" }}>👤 Patient Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#6EA89E" }}>Name</p>
                <p className="font-bold" style={{ color: "#1F4F47" }}>{data.patientInfo.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#6EA89E" }}>Age</p>
                <p className="font-bold" style={{ color: "#1F4F47" }}>{data.patientInfo.age}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#6EA89E" }}>Date of Birth</p>
                <p className="font-bold text-sm" style={{ color: "#1F4F47" }}>{data.patientInfo.dateOfBirth || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#6EA89E" }}>Medical History</p>
                <p className="font-bold text-sm" style={{ color: "#1F4F47" }}>{data.patientInfo.medicalHistory || "None"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl p-6 mb-8 border-l-4 border-2" style={{ 
          backgroundColor: "rgba(184, 214, 178, 0.15)", 
          borderColor: "#B8D6B2",
          borderLeftColor: "#6EA89E",
          borderLeftWidth: "4px"
        }}>
          <p className="text-sm leading-relaxed" style={{ color: "#1F4F47" }}>
            <span className="font-bold">⚠️ Important Disclaimer:</span> This screening tool is for informational purposes only. 
            The results should not be considered as a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 rounded-xl font-semibold transition duration-300"
            style={{
              backgroundColor: "#F5F5F5",
              color: "#1F4F47",
              border: "2px solid #CFE5D5"
            }}
          >
            Home
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 rounded-xl text-white font-semibold transition duration-300 transform hover:scale-105"
            style={{
              backgroundImage: "linear-gradient(135deg, #6EA89E, #8FC6B7)"
            }}
          >
            New Screening
          </button>
          <button
            onClick={downloadReport}
            className="px-8 py-3 rounded-xl text-white font-semibold transition duration-300"
            style={{
              backgroundImage: "linear-gradient(135deg, #8FC6B7, #A6D2C8)"
            }}
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;
