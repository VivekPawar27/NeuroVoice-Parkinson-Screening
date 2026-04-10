import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function History() {
  const navigate = useNavigate();
  const [sessionHistory, setSessionHistory] = useState([]);
  const [selected, setSelected] = useState(null);

  // Load session history from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("neurovoice_history");
      const parsed = raw ? JSON.parse(raw) : [];
      setSessionHistory(parsed);
      if (parsed.length > 0) setSelected(parsed[0]);
    } catch (e) {
      setSessionHistory([]);
    }
  }, []);

  const clearHistory = () => {
    sessionStorage.removeItem("neurovoice_history");
    setSessionHistory([]);
    setSelected(null);
  };

  const riskColor = (score) =>
    score >= 60 ? "#ef4444" : score >= 30 ? "#f59e0b" : "#10b981";

  const riskBg = (score) =>
    score >= 60 ? "bg-red-50 border-red-300" : score >= 30 ? "bg-yellow-50 border-yellow-300" : "bg-green-50 border-green-300";

  const trendData = sessionHistory.map((r, i) => ({
    test: `Test ${sessionHistory.length - i}`,
    "Risk Score": parseFloat((r.risk_score ?? 0).toFixed(1)),
    "PD Probability": parseFloat(((r.aggregate_stats?.mean_probability ?? 0) * 100).toFixed(1)),
  })).reverse();

  const segData = selected?.segment_predictions?.map(s => ({
    name: `Seg ${s.segment}`,
    "PD %": parseFloat((s.probability_parkinsons * 100).toFixed(1)),
    "Healthy %": parseFloat(((1 - s.probability_parkinsons) * 100).toFixed(1)),
  })) ?? [];

  const vf = selected?.vocal_features ?? {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800">📋 Session History</h1>
            <p className="text-gray-400 text-sm mt-1">
              {sessionHistory.length} test{sessionHistory.length !== 1 ? "s" : ""} recorded this session · clears on page refresh
            </p>
          </div>
          <div className="flex gap-3">
            {sessionHistory.length > 0 && (
              <button onClick={clearHistory}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition text-sm">
                🗑️ Clear History
              </button>
            )}
            <button onClick={() => navigate("/upload")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm">
              + New Analysis
            </button>
          </div>
        </div>

        {sessionHistory.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow border border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg font-semibold mb-2">No tests recorded yet</p>
            <p className="text-gray-400 text-sm mb-6">Run a voice analysis to see results here</p>
            <button onClick={() => navigate("/upload")}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
              Start Analysis
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT: Test list ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <p className="font-bold text-gray-700">All Tests ({sessionHistory.length})</p>
                </div>
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {sessionHistory.map((r, i) => (
                    <button key={r._id} onClick={() => setSelected(r)}
                      className={`w-full text-left p-4 hover:bg-blue-50 transition ${selected?._id === r._id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {r.patientInfo?.name || r.patient_name || `Test ${sessionHistory.length - i}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(r._timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-lg font-black" style={{ color: riskColor(r.risk_score ?? 0) }}>
                          {(r.risk_score ?? 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2 items-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${riskBg(r.risk_score ?? 0)}`}>
                          {r.risk_level ?? "—"}
                        </span>
                        <span className="text-xs text-gray-400">{r.segments_analyzed ?? 0} segs</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Selected test detail ── */}
            <div className="lg:col-span-2 space-y-6">
              {selected && (
                <>
                  {/* Summary cards */}
                  <div className={`rounded-2xl p-6 border-2 ${riskBg(selected.risk_score ?? 0)}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-black text-gray-800">
                          {selected.patientInfo?.name || selected.patient_name || "Analysis Result"}
                        </h2>
                        <p className="text-gray-400 text-xs">{new Date(selected._timestamp).toLocaleString()}</p>
                      </div>
                      <button onClick={() => navigate("/result", { state: selected })}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
                        View Full Report →
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Risk Score",  val: `${(selected.risk_score ?? 0).toFixed(1)}%`, color: "text-red-600" },
                        { label: "Risk Level",  val: selected.risk_level ?? "—",                  color: "text-orange-600" },
                        { label: "Confidence",  val: `${((selected.confidence ?? 0)*100).toFixed(1)}%`, color: "text-blue-600" },
                        { label: "Duration",    val: `${(selected.audio_duration ?? 0).toFixed(1)}s`,   color: "text-gray-700" },
                      ].map((c, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                          <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                          <p className={`text-lg font-black ${c.color}`}>{c.val}</p>
                        </div>
                      ))}
                    </div>
                    {/* Gauge */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, selected.risk_score ?? 0)}%`, backgroundColor: riskColor(selected.risk_score ?? 0) }} />
                      </div>
                    </div>
                  </div>

                  {/* Patient info */}
                  {(selected.patientInfo?.name || selected.patient_name) && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-700 mb-3">👤 Patient Details</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                          ["Name",     selected.patientInfo?.name || selected.patient_name],
                          ["Age",      selected.patientInfo?.age  || selected.patient_age || "—"],
                          ["DOB",      selected.patientInfo?.dateOfBirth || selected.patient_dob || "—"],
                          ["History",  selected.patientInfo?.medicalHistory || selected.patient_history || "—"],
                        ].map(([l, v]) => (
                          <div key={l} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">{l}</p>
                            <p className="font-semibold text-gray-800">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Segment chart */}
                  {segData.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-700 mb-3">Segment Analysis</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={segData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={v => `${v}%`} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="PD %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Healthy %" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Vocal features */}
                  {Object.keys(vf).length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-700 mb-3">Vocal Features</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(vf).map(([k, v]) => (
                          <div key={k} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-400 uppercase">{k}</span>
                            <span className="text-sm font-bold text-blue-700">{typeof v === "number" ? v.toFixed(4) : v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk trend across all tests */}
                  {trendData.length > 1 && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-gray-700 mb-3">Risk Score Trend (All Tests)</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="test" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={v => `${v}%`} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="Risk Score" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
