import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      className="min-h-screen px-4 py-8"
      style={{
        backgroundImage: "radial-gradient(circle at 10% 30%, rgba(207, 229, 213, 0.5), transparent), radial-gradient(circle at 90% 70%, rgba(166, 210, 200, 0.4), transparent), radial-gradient(circle at 50% 100%, rgba(184, 214, 178, 0.3), transparent), linear-gradient(135deg, #f9fefb 0%, #CFE5D5 35%, #A6D2C8 70%, #CFE5D5 100%)"
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent mb-2">📋 Patient History</h1>
          <p className="text-teal-700 font-semibold text-lg">View and manage all patient screening records</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-teal-200 sticky top-8">
              <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
                <span className="bg-teal-100 p-2 rounded-lg">👥</span> Patients ({patients.length})
              </h2>

              {loading ? (
                <div className="text-center text-teal-600">Loading patients...</div>
              ) : patients.length === 0 ? (
                <div className="text-center text-teal-600">
                  <p className="mb-4">No patient records found</p>
                  <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-lg hover:from-teal-700 hover:to-emerald-700 transition"
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
                      className={`w-full text-left p-4 rounded-lg transition border-2 ${
                        selectedPatient === patient.name
                          ? "bg-teal-100 border-teal-500 shadow-md"
                          : "bg-teal-50 border-transparent hover:bg-teal-100"
                      }`}
                    >
                      <p className="font-bold text-teal-900">{patient.name}</p>
                      <p className="text-xs text-teal-700 mt-1">Records: {patient.total_records}</p>
                      {patient.last_checked && (
                        <p className="text-xs text-teal-600 mt-1">
                          {new Date(patient.last_checked).toLocaleDateString()}
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
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-teal-200">
                  <h3 className="text-2xl font-bold text-teal-800 mb-6">📝 Patient Details</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                      <p className="text-teal-600 text-sm font-bold">Name</p>
                      <p className="text-teal-900 font-bold">{patientDetails?.name}</p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                      <p className="text-teal-600 text-sm font-bold">Age</p>
                      <p className="text-teal-900 font-bold">{patientDetails?.age || "N/A"}</p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                      <p className="text-teal-600 text-sm font-bold">DOB</p>
                      <p className="text-teal-900 font-bold">{patientDetails?.dob || "N/A"}</p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                      <p className="text-teal-600 text-sm font-bold">Records</p>
                      <p className="text-teal-900 font-bold">{patientDetails?.records?.length || 0}</p>
                    </div>
                  </div>
                  {patientDetails?.medical_history && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-700 text-sm"><span className="font-bold">Medical History:</span> {patientDetails.medical_history}</p>
                    </div>
                  )}
                </div>

                {/* Risk Trend Chart */}
                {riskTrendData.length > 0 && (
                  <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-teal-200">
                    <h3 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
                      <span className="bg-teal-100 p-2 rounded-lg">📈</span> Risk Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={riskTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#bce4d8" />
                        <XAxis dataKey="date" stroke="#0d9488" />
                        <YAxis stroke="#0d9488" />
                        <Tooltip contentStyle={{ backgroundColor: "#f0fdfa", border: "2px solid #14b8a6", borderRadius: "12px" }} />
                        <Legend />
                        <Line type="monotone" dataKey="risk" stroke="#14b8a6" strokeWidth={2} dot={{ fill: "#14b8a6" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Screening Records */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-teal-200">
                  <h3 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
                    <span className="bg-teal-100 p-2 rounded-lg">📋</span> Screening Records
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {patientDetails?.records?.map((record, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-teal-900">Screening #{idx + 1}</h4>
                          <span className="text-sm text-teal-600">{new Date(record.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-teal-600 font-semibold">Risk Score:</p>
                            <p className="text-teal-900 font-bold text-lg">{record.risk_score}%</p>
                          </div>
                          <div>
                            <p className="text-teal-600 font-semibold">Risk Level:</p>
                            <p className={`font-bold ${
                              record.risk_score > 70 ? "text-red-600" :
                              record.risk_score > 40 ? "text-amber-600" :
                              "text-green-600"
                            }`}>{record.risk_level}</p>
                          </div>
                          <div>
                            <p className="text-teal-600 font-semibold">Healthy:</p>
                            <p className="text-green-600 font-bold">{Math.round(record.probability_healthy * 100)}%</p>
                          </div>
                          <div>
                            <p className="text-teal-600 font-semibold">Parkinson's:</p>
                            <p className="text-red-600 font-bold">{Math.round(record.probability_parkinsons * 100)}%</p>
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
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition border border-gray-300"
                  >
                    ← Back Home
                  </button>
                  <button
                    onClick={downloadPatientReport}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition shadow-lg"
                  >
                    📥 Download Patient Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/85 backdrop-blur-md rounded-3xl p-12 shadow-lg border border-teal-200 text-center">
                <p className="text-teal-700 text-lg">👈 Select a patient from the list to view their history</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;
