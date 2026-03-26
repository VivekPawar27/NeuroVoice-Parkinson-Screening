import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function History() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/patients`);
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async (patientName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(patientName)}`);
      const data = await response.json();
      setPatientDetails(data);
      setSelectedPatient(patientName);
    } catch (error) {
      console.error("Error fetching patient history:", error);
      alert("Could not load patient history");
    }
  };

  const downloadPatientReport = () => {
    if (!patientDetails) return;

    const records = patientDetails.records || [];
    let reportContent = `NeuroVoice Patient History Report
====================================
Generated: ${new Date().toLocaleString()}

PATIENT DETAILS:
Name: ${patientDetails.name}
Age: ${patientDetails.age || "N/A"}
Date of Birth: ${patientDetails.dob || "N/A"}
Medical History: ${patientDetails.medical_history || "None"}

SCREENING RECORDS (${records.length} total):
`;

    records.forEach((record, idx) => {
      reportContent += `
Record ${idx + 1}:
  Date: ${new Date(record.timestamp).toLocaleString()}
  Risk Score: ${record.risk_score}%
  Risk Level: ${record.risk_level}
  Healthy Probability: ${Math.round(record.probability_healthy * 100)}%
  Parkinson's Probability: ${Math.round(record.probability_parkinsons * 100)}%
`;
    });

    reportContent += `
DISCLAIMER:
This is for informational purposes only. Not a medical diagnosis.
Consult a healthcare professional for proper evaluation.
    `;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(reportContent));
    element.setAttribute("download", `${patientDetails.name}_History_${new Date().getTime()}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const riskTrendData = patientDetails?.records?.map((record, idx) => ({
    date: new Date(record.timestamp).toLocaleDateString(),
    risk: record.risk_score,
    parkinson: Math.round(record.probability_parkinsons * 100)
  })) || [];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "radial-gradient(circle at 10% 30%, rgba(207, 229, 213, 0.5), transparent), radial-gradient(circle at 90% 70%, rgba(166, 210, 200, 0.4), transparent), radial-gradient(circle at 50% 100%, rgba(184, 214, 178, 0.3), transparent), linear-gradient(135deg, #f9fefb 0%, #CFE5D5 35%, #A6D2C8 70%, #CFE5D5 100%)"
      }}
    >
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-2" style={{
            backgroundImage: "linear-gradient(135deg, #1F4F47 0%, #2D5A4F 50%, #3A6B63 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            📋 Patient History
          </h1>
          <p style={{ color: "#1F4F47", fontSize: "16px", fontWeight: "500" }}>
            View and manage all patient screening records
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-lg border-2 sticky top-8" style={{ borderColor: "#CFE5D5" }}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "#1F4F47" }}>
                <span className="p-2 rounded-lg" style={{ backgroundColor: "rgba(207, 229, 213, 0.5)" }}>👥</span> 
                Patients ({patients.length})
              </h2>

              {loading ? (
                <div style={{ color: "#6EA89E", textAlign: "center" }}>Loading patients...</div>
              ) : patients.length === 0 ? (
                <div style={{ color: "#6EA89E", textAlign: "center" }}>
                  <p className="mb-4">No patient records found</p>
                  <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 text-white font-bold rounded-lg transition"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #6EA89E, #8FC6B7)"
                    }}
                  >
                    Create New Screening
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.name}
                      onClick={() => fetchPatientHistory(patient.name)}
                      className="w-full text-left p-4 rounded-lg transition border-2"
                      style={{
                        backgroundColor: selectedPatient === patient.name ? "rgba(166, 210, 200, 0.2)" : "rgba(207, 229, 213, 0.2)",
                        borderColor: selectedPatient === patient.name ? "#A6D2C8" : "#CFE5D5",
                        color: "#1F4F47"
                      }}
                    >
                      <p className="font-bold">{patient.name}</p>
                      <p className="text-xs mt-1" style={{ color: "#6EA89E" }}>Records: {patient.records?.length || 0}</p>
                      {patient.last_updated && (
                        <p className="text-xs mt-1" style={{ color: "#6EA89E" }}>
                          {new Date(patient.last_updated).toLocaleDateString()}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-6">
                {/* Patient Info */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg border-2" style={{ borderColor: "#CFE5D5" }}>
                  <h3 className="text-2xl font-bold mb-6" style={{ color: "#1F4F47" }}>📝 Patient Details</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-lg border-2" style={{
                      backgroundColor: "rgba(207, 229, 213, 0.3)",
                      borderColor: "#CFE5D5",
                      color: "#1F4F47"
                    }}>
                      <p className="text-sm font-bold" style={{ color: "#6EA89E" }}>Name</p>
                      <p className="font-bold">{patientDetails?.name}</p>
                    </div>
                    <div className="p-4 rounded-lg border-2" style={{
                      backgroundColor: "rgba(207, 229, 213, 0.3)",
                      borderColor: "#CFE5D5",
                      color: "#1F4F47"
                    }}>
                      <p className="text-sm font-bold" style={{ color: "#6EA89E" }}>Age</p>
                      <p className="font-bold">{patientDetails?.age || "N/A"}</p>
                    </div>
                    <div className="p-4 rounded-lg border-2" style={{
                      backgroundColor: "rgba(207, 229, 213, 0.3)",
                      borderColor: "#CFE5D5",
                      color: "#1F4F47"
                    }}>
                      <p className="text-sm font-bold" style={{ color: "#6EA89E" }}>DOB</p>
                      <p className="font-bold">{patientDetails?.dob || "N/A"}</p>
                    </div>
                    <div className="p-4 rounded-lg border-2" style={{
                      backgroundColor: "rgba(207, 229, 213, 0.3)",
                      borderColor: "#CFE5D5",
                      color: "#1F4F47"
                    }}>
                      <p className="text-sm font-bold" style={{ color: "#6EA89E" }}>Records</p>
                      <p className="font-bold">{patientDetails?.records?.length || 0}</p>
                    </div>
                  </div>
                  {patientDetails?.medical_history && (
                    <div className="border-2 rounded-lg p-4" style={{
                      backgroundColor: "rgba(184, 214, 178, 0.2)",
                      borderColor: "#B8D6B2",
                      color: "#1F4F47"
                    }}>
                      <p className="text-sm"><span className="font-bold">Medical History:</span> {patientDetails.medical_history}</p>
                    </div>
                  )}
                </div>

                {/* Risk Trend Chart */}
                {riskTrendData.length > 0 && (
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg border-2" style={{ borderColor: "#CFE5D5" }}>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "#1F4F47" }}>
                      <span className="p-2 rounded-lg" style={{ backgroundColor: "rgba(207, 229, 213, 0.5)" }}>📈</span> 
                      Risk Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={riskTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#A6D2C8" />
                        <XAxis dataKey="date" stroke="#6EA89E" />
                        <YAxis stroke="#6EA89E" />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "2px solid #A6D2C8", borderRadius: "12px" }} />
                        <Legend />
                        <Line type="monotone" dataKey="risk" stroke="#6EA89E" strokeWidth={2} dot={{ fill: "#8FC6B7" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Screening Records */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg border-2" style={{ borderColor: "#CFE5D5" }}>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "#1F4F47" }}>
                    <span className="p-2 rounded-lg" style={{ backgroundColor: "rgba(207, 229, 213, 0.5)" }}>📋</span> 
                    Screening Records
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {patientDetails?.records?.map((record, idx) => (
                      <div key={idx} className="p-4 rounded-lg border-2 hover:shadow-md transition" style={{
                        backgroundColor: "rgba(166, 210, 200, 0.1)",
                        borderColor: "#CFE5D5"
                      }}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold" style={{ color: "#1F4F47" }}>Screening #{idx + 1}</h4>
                          <span className="text-sm" style={{ color: "#6EA89E" }}>{new Date(record.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="font-semibold" style={{ color: "#6EA89E" }}>Risk Score:</p>
                            <p className="font-bold text-lg" style={{ color: "#6EA89E" }}>{record.risk_score}%</p>
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: "#6EA89E" }}>Risk Level:</p>
                            <p className="font-bold" style={{
                              color: record.risk_score > 70 ? "#dc2626" :
                                     record.risk_score > 40 ? "#f59e0b" :
                                     "#16a34a"
                            }}>{record.risk_level}</p>
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: "#6EA89E" }}>Healthy:</p>
                            <p className="font-bold" style={{ color: "#16a34a" }}>{Math.round(record.probability_healthy * 100)}%</p>
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: "#6EA89E" }}>Parkinson's:</p>
                            <p className="font-bold" style={{ color: "#dc2626" }}>{Math.round(record.probability_parkinsons * 100)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate("/")}
                    className="flex-1 px-6 py-3 font-bold rounded-xl transition border-2"
                    style={{
                      backgroundColor: "#F5F5F5",
                      color: "#1F4F47",
                      borderColor: "#CFE5D5"
                    }}
                  >
                    ← Back Home
                  </button>
                  <button
                    onClick={downloadPatientReport}
                    className="flex-1 px-6 py-3 text-white font-bold rounded-xl transition shadow-lg"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #6EA89E, #8FC6B7)"
                    }}
                  >
                    📥 Download Patient Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-12 shadow-lg border-2 text-center" style={{ borderColor: "#CFE5D5" }}>
                <p style={{ color: "#6EA89E", fontSize: "18px" }}>👈 Select a patient from the list to view their history</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;
