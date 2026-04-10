import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Header from "../components/Header";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  LineChart, Line
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;
  const reportRef = useRef(null);

  // ── Save to session history on mount ──
  useEffect(() => {
    if (!data || data.error) return;
    try {
      const existing = JSON.parse(sessionStorage.getItem("neurovoice_history") || "[]");
      const entry = {
        ...data,
        _timestamp: new Date().toISOString(),
        _id: Date.now(),
      };
      // Avoid duplicates within same second
      const isDup = existing.some(e => e._id === entry._id);
      if (!isDup) {
        existing.unshift(entry); // newest first
        sessionStorage.setItem("neurovoice_history", JSON.stringify(existing));
      }
    } catch (e) {
      console.warn("Could not save to session history:", e);
    }
  }, [data]);

  useEffect(() => { if (!data) navigate("/"); }, [data, navigate]);

  if (!data) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  if (data.error) return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="bg-white border-2 border-red-400 rounded-2xl p-10 max-w-md text-center shadow-xl">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-red-700 mb-3">Analysis Failed</h2>
        <p className="text-red-600 mb-6">{data.error}</p>
        <button onClick={() => navigate("/upload")} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">
          Try Again
        </button>
      </div>
    </div>
  );

  const riskScore   = data.risk_score   ?? 0;
  const riskLevel   = data.risk_level   ?? "Unknown";
  const status      = data.status       ?? "Unknown";
  const confidence  = data.confidence   ?? 0;
  const segments    = data.segment_predictions ?? [];
  const aggStats    = data.aggregate_stats ?? {};
  const vf          = data.vocal_features ?? {};
  const patient     = data.patientInfo  ?? {};

  const riskColor = riskLevel.includes("High")
    ? { bg: "from-red-50 to-red-100", border: "border-red-400", text: "text-red-700", fill: "#ef4444", badge: "bg-red-100 text-red-800" }
    : riskLevel.includes("Moderate")
    ? { bg: "from-yellow-50 to-orange-50", border: "border-yellow-400", text: "text-yellow-700", fill: "#f59e0b", badge: "bg-yellow-100 text-yellow-800" }
    : { bg: "from-green-50 to-emerald-50", border: "border-green-400", text: "text-green-700", fill: "#10b981", badge: "bg-green-100 text-green-800" };

  const segmentChartData = segments.map(s => ({
    name: `Seg ${s.segment}`,
    "PD %": parseFloat((s.probability_parkinsons * 100).toFixed(1)),
    "Healthy %": parseFloat(((1 - s.probability_parkinsons) * 100).toFixed(1)),
  }));

  const lineData = segments.map(s => ({
    seg: `S${s.segment}`,
    probability: parseFloat((s.probability_parkinsons * 100).toFixed(1)),
    threshold: 50,
  }));

  const radarData = [
    { f: "Jitter",  v: Math.min(100, (vf.jitter  ?? 0) * 5000) },
    { f: "Shimmer", v: Math.min(100, (vf.shimmer  ?? 0) * 2000) },
    { f: "NHR",     v: Math.min(100, (vf.nhr      ?? 0) * 100)  },
    { f: "HNR",     v: Math.min(100, (vf.hnr      ?? 0) * 100)  },
    { f: "RPDE",    v: Math.min(100, (vf.rpde     ?? 0) * 100)  },
    { f: "DFA",     v: Math.min(100, (vf.dfa      ?? 0) * 100)  },
    { f: "PPE",     v: Math.min(100, (vf.ppe      ?? 0) * 100)  },
    { f: "ZCR",     v: Math.min(100, (vf.zcr      ?? 0) * 1000) },
  ];

  // ── PDF Download ──
  const downloadPDF = async () => {
    const el = reportRef.current;
    if (!el) return;

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableW = pageW - margin * 2;
      const imgH = (canvas.height * usableW) / canvas.width;

      let yPos = margin;
      let remaining = imgH;

      while (remaining > 0) {
        const sliceH = Math.min(remaining, pageH - margin * 2);
        const srcY = (imgH - remaining) * (canvas.height / imgH);
        const srcH = sliceH * (canvas.height / imgH);

        // Crop canvas slice
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, yPos, usableW, sliceH);
        remaining -= sliceH;
        if (remaining > 0) { pdf.addPage(); yPos = margin; }
      }

      pdf.save(`NeuroVoice_Report_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      {/* Action bar — outside the PDF capture area */}
      <div className="max-w-6xl mx-auto px-4 pt-6 flex gap-3 justify-end">
        <button onClick={downloadPDF}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow transition flex items-center gap-2">
          📄 Download PDF Report
        </button>
        <button onClick={() => navigate("/upload")}
          className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold shadow transition">
          🔄 New Analysis
        </button>
        <button onClick={() => navigate("/history")}
          className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow transition">
          📋 History
        </button>
      </div>

      {/* ── Everything inside reportRef gets captured into PDF ── */}
      <div ref={reportRef} className="max-w-6xl mx-auto px-4 py-6 bg-white">

        {/* Report Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-200">
          <h1 className="text-3xl font-black text-gray-800">🧠 NeuroVoice Analysis Report</h1>
          <p className="text-gray-400 text-sm mt-1">Generated: {new Date().toLocaleString()}</p>
        </div>

        {/* Patient Info (if available) */}
        {(patient.name || data.patient_name) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <h2 className="font-bold text-blue-900 mb-3 text-lg">👤 Patient Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                ["Name",            patient.name || data.patient_name],
                ["Age",             patient.age  || data.patient_age || "—"],
                ["Date of Birth",   patient.dateOfBirth || data.patient_dob || "—"],
                ["Medical History", patient.medicalHistory || data.patient_history || "—"],
              ].map(([label, val]) => (
                <div key={label} className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-blue-500 text-xs font-semibold">{label}</p>
                  <p className="text-blue-900 font-bold mt-1">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RISK SUMMARY ── */}
        <div className={`bg-gradient-to-br ${riskColor.bg} border-2 ${riskColor.border} rounded-2xl p-6 mb-6`}>
          <div className={`${riskColor.badge} text-center py-2 px-4 rounded-xl font-bold text-lg mb-4`}>{status}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <p className="text-gray-400 text-xs mb-1">Risk Score</p>
              <p className={`text-4xl font-black ${riskColor.text}`}>{riskScore.toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <p className="text-gray-400 text-xs mb-1">Risk Level</p>
              <p className={`text-xl font-bold ${riskColor.text}`}>{riskLevel}</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <p className="text-gray-400 text-xs mb-1">Confidence</p>
              <p className="text-xl font-bold text-blue-700">{(confidence * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow">
              <p className="text-gray-400 text-xs mb-1">Duration</p>
              <p className="text-xl font-bold text-gray-700">{(data.audio_duration ?? 0).toFixed(1)}s</p>
            </div>
          </div>
          {/* Gauge */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>0% Healthy</span><span>50%</span><span>100% High Risk</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className={`h-full rounded-full ${riskScore >= 60 ? "bg-red-500" : riskScore >= 30 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(100, riskScore)}%` }} />
            </div>
          </div>
        </div>

        {/* ── SEGMENT ANALYSIS ── */}
        {segments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Segment-by-Segment Analysis</h2>
            <p className="text-gray-400 text-sm mb-4">
              Audio split into {segments.length} × 3-second segments · Model: {data.model_used ?? "ML"}
            </p>

            {/* Segment cards */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
              {segments.map((seg, i) => {
                const pct = (seg.probability_parkinsons * 100).toFixed(1);
                const hi = seg.probability_parkinsons >= 0.5;
                return (
                  <div key={i} className={`rounded-xl p-3 text-center border-2 ${hi ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"}`}>
                    <p className="text-xs text-gray-400">Seg {seg.segment}</p>
                    <p className={`text-xl font-black ${hi ? "text-red-600" : "text-green-600"}`}>{pct}%</p>
                    <p className={`text-xs font-medium ${hi ? "text-red-400" : "text-green-400"}`}>{seg.status}</p>
                  </div>
                );
              })}
            </div>

            {/* Bar chart */}
            <h3 className="font-semibold text-gray-600 mb-2 text-sm">Parkinson's Probability per Segment</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={segmentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="PD %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Healthy %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Line chart */}
            {lineData.length > 1 && (
              <>
                <h3 className="font-semibold text-gray-600 mb-2 mt-4 text-sm">Probability Trend</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="seg" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="probability" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="PD %" />
                    <Line type="monotone" dataKey="threshold" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" dot={false} name="50% Threshold" />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}

        {/* ── VOCAL FEATURES ── */}
        {Object.keys(vf).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Vocal Feature Analysis</h2>
            <p className="text-gray-400 text-sm mb-4">Acoustic features extracted from your voice recording</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar */}
              <div>
                <h3 className="font-semibold text-gray-600 text-sm mb-2">Feature Radar</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="f" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar name="Voice" dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Feature values */}
              <div>
                <h3 className="font-semibold text-gray-600 text-sm mb-2">Feature Values</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(vf).map(([key, val]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
                      <span className="text-xs font-semibold text-gray-400 uppercase">{key}</span>
                      <span className="text-sm font-bold text-blue-700">{typeof val === "number" ? val.toFixed(4) : val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AGGREGATE STATS ── */}
        {Object.keys(aggStats).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Statistical Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Mean Probability", val: aggStats.mean_probability, color: "bg-blue-50 text-blue-700" },
                { label: "Std Deviation",    val: aggStats.std_probability,  color: "bg-purple-50 text-purple-700" },
                { label: "Max Probability",  val: aggStats.max_probability,  color: "bg-red-50 text-red-700" },
                { label: "Min Probability",  val: aggStats.min_probability,  color: "bg-green-50 text-green-700" },
              ].map((s, i) => (
                <div key={i} className={`${s.color} rounded-xl p-4 text-center`}>
                  <p className="text-xs opacity-60 mb-1">{s.label}</p>
                  <p className="text-2xl font-bold">{((s.val ?? 0) * 100).toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INSIGHTS ── */}
        {data.insights?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
            <h2 className="font-bold text-blue-900 mb-2">🔍 Analysis Insights</h2>
            <ul className="space-y-1">
              {data.insights.map((ins, i) => (
                <li key={i} className="text-blue-800 text-sm flex gap-2"><span>•</span>{ins}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── DISCLAIMER ── */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-5">
          <p className="font-bold text-yellow-900 mb-1">⚠️ Medical Disclaimer</p>
          <p className="text-yellow-800 text-sm">
            This tool is for screening purposes only and does not constitute a medical diagnosis.
            Results should be reviewed by a qualified healthcare professional.
          </p>
        </div>

      </div>{/* end reportRef */}

      <div className="max-w-6xl mx-auto px-4 pb-10" />
    </div>
  );
}

export default Result;
