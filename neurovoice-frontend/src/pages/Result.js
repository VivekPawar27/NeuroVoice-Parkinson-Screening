import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/Header";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  useEffect(() => {
    if (!data) navigate("/");
  }, [data, navigate]);

  if (!data) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (data.error) return <div className="min-h-screen flex items-center justify-center"><div className="bg-red-50 border border-red-500 rounded p-8"><p className="text-red-600">{data.error}</p><button onClick={() => navigate("/")} className="px-4 py-2 bg-red-500 text-white rounded mt-4">Try Again</button></div></div>;

  const getRiskColor = (level) => {
    if (level?.includes("High")) return { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100" };
    if (level?.includes("Moderate")) return { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" };
    if (level?.includes("Low")) return { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100" };
    return { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100" };
  };

  const colors = getRiskColor(data?.risk_level);
  const aggStats = data?.aggregate_stats || {};
  const segmentData = (data?.segment_predictions || []).map((seg, idx) => ({
    name: `Seg ${seg.segment}`,
    probability: (seg.probability_parkinsons * 100).toFixed(1),
  }));

  const downloadReport = () => {
    const txt = `NeuroVoice Report\nDate: ${new Date().toLocaleString()}\nRisk: ${data.risk_score}%\nLevel: ${data.risk_level}\nConfidence: ${(data.confidence * 100).toFixed(1)}%`;
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    a.download = `Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className={`${colors.bg} border-2 rounded-xl p-8 mb-8`}>
          <h1 className="text-4xl font-bold text-center mb-4">Results</h1>
          <div className={`${colors.badge} inline-block px-6 py-2 rounded text-center w-full font-bold`}>{data.status}</div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded p-4"><p className="text-gray-600">Risk Score</p><p className={`text-3xl font-bold ${colors.text}`}>{data.risk_score?.toFixed(1)}%</p></div>
            <div className="bg-white rounded p-4"><p className="text-gray-600">Risk Level</p><p className={`text-2xl font-bold ${colors.text}`}>{data.risk_level}</p></div>
            <div className="bg-white rounded p-4"><p className="text-gray-600">Confidence</p><p className={`text-2xl font-bold ${colors.text}`}>{(data.confidence * 100).toFixed(1)}%</p></div>
          </div>
        </div>

        {data.segment_predictions && data.segment_predictions.length > 0 && (
          <div className="bg-white rounded-xl p-8 mb-8 shadow">
            <h2 className="text-2xl font-bold mb-4">Segment Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {data.segment_predictions.map((seg, i) => (
                <div key={i} className="bg-blue-50 rounded p-4">
                  <p className="font-bold">Segment {seg.segment}</p>
                  <p className="text-xl font-bold text-blue-700">{(seg.probability_parkinsons * 100).toFixed(1)}%</p>
                  <p className="text-sm">Confidence: {(seg.confidence * 100).toFixed(1)}%</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={segmentData}>
                <CartesianGrid />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="probability" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {aggStats && Object.keys(aggStats).length > 0 && (
          <div className="bg-white rounded-xl p-8 mb-8 shadow">
            <h2 className="text-2xl font-bold mb-4">Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded p-4"><p className="text-sm">Mean</p><p className="text-xl font-bold">{(aggStats.mean_probability * 100).toFixed(1)}%</p></div>
              <div className="bg-purple-50 rounded p-4"><p className="text-sm">Std Dev</p><p className="text-xl font-bold">{(aggStats.std_probability * 100).toFixed(1)}%</p></div>
              <div className="bg-orange-50 rounded p-4"><p className="text-sm">Max</p><p className="text-xl font-bold">{(aggStats.max_probability * 100).toFixed(1)}%</p></div>
              <div className="bg-green-50 rounded p-4"><p className="text-sm">Min</p><p className="text-xl font-bold">{(aggStats.min_probability * 100).toFixed(1)}%</p></div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-8 mb-8 shadow">
          <h2 className="text-2xl font-bold mb-4">Audio Info</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-gray-600">Duration</p><p className="text-lg font-bold">{data.audio_duration?.toFixed(2)}s</p></div>
            <div><p className="text-gray-600">Segments</p><p className="text-lg font-bold">{data.segments_analyzed}</p></div>
            <div><p className="text-gray-600">Model</p><p className="text-lg font-bold">CNN-LSTM</p></div>
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-xl p-6 mb-8">
          <p className="font-bold text-yellow-900 mb-2">⚠️ Disclaimer</p>
          <p className="text-yellow-800 text-sm">For screening only. Not a medical diagnosis. Consult professionals.</p>
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={downloadReport} className="px-6 py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-600">Download</button>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-gray-500 text-white rounded font-bold hover:bg-gray-600">Home</button>
        </div>
      </div>
    </div>
  );
}

export default Result;
