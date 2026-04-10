import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

const MAX_SECONDS = 15;

function Upload() {
  const navigate = useNavigate();
  const [uploadMode, setUploadMode] = useState("record");

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedMime, setRecordedMime] = useState("");
  const [audioURL, setAudioURL] = useState(null);

  // Upload
  const [file, setFile] = useState(null);
  const [fileAudioURL, setFileAudioURL] = useState(null);

  // Shared
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Stop recording (called by button OR auto-stop at 15s) ──
  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mrRef.current && mrRef.current.state !== "inactive") {
      mrRef.current.stop(); // triggers onstop → blob assembled
    }
    setIsRecording(false);
  }, []);

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      setRecordedBlob(null);
      setAudioURL(null);
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;

      // Pick best MIME — prefer webm/opus, fall back to whatever browser supports
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"]
        .find(m => MediaRecorder.isTypeSupported(m)) || "";

      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      mrRef.current = mr;

      mr.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const finalMime = mr.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMime });
        console.log("Recorded blob:", blob.size, "bytes | mime:", finalMime);
        setRecordedBlob(blob);
        setRecordedMime(finalMime);
        setAudioURL(URL.createObjectURL(blob));
      };

      mr.start(200);
      setIsRecording(true);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingTime(elapsed);
        if (elapsed >= MAX_SECONDS) stopRecording();
      }, 1000);

    } catch (err) {
      console.error("Mic error:", err);
      alert("Cannot access microphone. Please allow microphone permission and try again.");
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordedMime("");
    setAudioURL(null);
    setRecordingTime(0);
    setFile(null);
    setFileAudioURL(null);
  };

  const processFile = (f) => {
    const ext = f.name.split(".").pop().toLowerCase();
    const allowed = ["wav", "mp3", "webm", "ogg", "aac", "flac", "m4a"];
    if (!allowed.includes(ext) && !f.type.startsWith("audio/")) {
      alert(`Unsupported format. Allowed: ${allowed.join(", ").toUpperCase()}`);
      return;
    }
    if (f.size > 50 * 1024 * 1024) { alert("File too large. Max 50MB."); return; }
    setFile(f);
    setFileAudioURL(URL.createObjectURL(f));
    setUploadMode("upload");
  };

  const handleFileInput = (e) => { if (e.target.files[0]) processFile(e.target.files[0]); };
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };

  const handleAnalyze = async () => {
    // Determine what to send
    let blob, filename;
    if (uploadMode === "record" && recordedBlob) {
      blob = recordedBlob;
      // Use correct extension matching actual mime type
      const ext = recordedMime.includes("ogg") ? "ogg"
        : recordedMime.includes("mp4") ? "mp4"
        : "webm";
      filename = `recording_${Date.now()}.${ext}`;
    } else if (uploadMode === "upload" && file) {
      blob = file;
      filename = file.name;
    } else {
      alert("Please record or upload audio first.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, filename);
      console.log("Sending:", filename, blob.size, "bytes, type:", blob.type);

      const response = await axios.post("http://127.0.0.1:5000/api/predict", formData, {
        timeout: 90000,
      });

      if (response.data.error) {
        alert(`Analysis error: ${response.data.error}`);
        setIsAnalyzing(false);
        return;
      }
      navigate("/result", { state: response.data });
    } catch (err) {
      console.error("Request error:", err);
      const msg = err.response?.data?.error || err.message || "Unknown error";
      alert(`Failed: ${msg}`);
      setIsAnalyzing(false);
    }
  };

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const progress = Math.min(100, (recordingTime / MAX_SECONDS) * 100);
  const nearEnd = recordingTime >= 12;
  const hasAudio = (uploadMode === "record" && recordedBlob) || (uploadMode === "upload" && file);

  return (
    <div className="min-h-screen px-4 py-10"
      style={{ backgroundImage: "linear-gradient(135deg, #d0e7f9 0%, #e0f2fe 50%, #cffafe 100%)" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-3">
            Voice Analysis Portal
          </h1>
          <p className="text-sky-700 text-lg font-medium">
            Record 15 seconds of voice for Parkinson's screening
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 justify-center mb-8">
          {[
            { key: "record", label: "🎙️ Record Voice" },
            { key: "upload", label: "📁 Upload File" },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => { setUploadMode(key); resetRecording(); }}
              className={`px-8 py-3 rounded-xl font-bold transition ${
                uploadMode === key
                  ? key === "record" ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "bg-white/60 text-sky-700 hover:bg-white/80"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* ── RECORD PANEL ── */}
          <div className={uploadMode === "record" ? "" : "opacity-40 pointer-events-none"}>
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-sky-200/50 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-sky-900 mb-1">Record Voice Sample</h2>
              <p className="text-sky-500 text-sm mb-6">Recording auto-stops at exactly 15 seconds</p>

              {/* Recorder area */}
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-6 border border-sky-200 flex-grow flex flex-col justify-center">

                {/* Idle */}
                {!isRecording && !recordedBlob && (
                  <div className="text-center py-6">
                    <div className="text-6xl mb-4">🎤</div>
                    <p className="text-sky-800 font-semibold text-lg">Ready to record</p>
                    <p className="text-sky-500 text-sm mt-1">Press Start — recording runs for 15 seconds</p>
                  </div>
                )}

                {/* Recording */}
                {isRecording && (
                  <div className="text-center py-4">
                    <div className={`text-3xl font-black mb-3 ${nearEnd ? "text-red-600 animate-pulse" : "text-sky-700"}`}>
                      {fmt(recordingTime)} <span className="text-lg font-normal">/ {fmt(MAX_SECONDS)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${nearEnd ? "bg-red-500" : "bg-blue-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-center gap-2 mb-3">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <div key={i} className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                    <p className="text-red-600 font-semibold text-sm">🔴 Recording in progress...</p>
                    {nearEnd && <p className="text-orange-500 text-xs mt-1">Almost done — keep speaking!</p>}
                  </div>
                )}

                {/* Done */}
                {!isRecording && recordedBlob && (
                  <div className="text-center py-4">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-green-700 font-bold text-lg">Recorded {fmt(recordingTime)}</p>
                    <p className="text-green-500 text-sm mt-1">Ready for analysis</p>
                    {audioURL && (
                      <div className="mt-4 bg-white p-4 rounded-xl text-left">
                        <p className="text-xs font-semibold text-sky-600 mb-2">🔊 Playback:</p>
                        <audio src={audioURL} controls className="w-full" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Record buttons */}
              <div className="flex gap-3 justify-center mt-5 mb-5">
                {!isRecording && !recordedBlob && (
                  <button onClick={startRecording}
                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105">
                    🎙️ Start Recording
                  </button>
                )}
                {isRecording && (
                  <button onClick={stopRecording}
                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-xl shadow-lg transition">
                    ⏹️ Stop Early
                  </button>
                )}
                {!isRecording && recordedBlob && (
                  <button onClick={resetRecording}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-xl transition">
                    🔄 Record Again
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg text-xs text-blue-800 space-y-1">
                <p className="font-semibold text-blue-900 text-sm mb-2">📋 How to record:</p>
                <p>✓ Recording runs for exactly <strong>15 seconds</strong> then stops automatically</p>
                <p>✓ Say "aaah" continuously or read a sentence aloud</p>
                <p>✓ Use a quiet room with minimal background noise</p>
                <p>✓ Speak at normal volume — not too loud or too soft</p>
                <p>✓ Your voice is split into 5 × 3-second segments for analysis</p>
              </div>
            </div>
          </div>

          {/* ── UPLOAD PANEL ── */}
          <div className={uploadMode === "upload" ? "" : "opacity-40 pointer-events-none"}>
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-sky-200/50 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-sky-900 mb-1">Upload Voice File</h2>
              <p className="text-sky-500 text-sm mb-6">Upload a pre-recorded audio file for analysis</p>

              <div
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-sky-300 bg-sky-50 hover:border-sky-400 hover:bg-sky-100 rounded-2xl p-8 mb-6 cursor-pointer transition"
              >
                <div className="text-5xl mb-3">📁</div>
                <p className="text-sky-900 font-bold mb-1">Drag & drop audio file</p>
                <p className="text-sky-500 text-xs mb-4">WAV, MP3, WebM, OGG, FLAC (max 50MB)</p>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileInput} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition">
                  📂 Choose File
                </button>
              </div>

              {file && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📄</span>
                    <div className="flex-grow">
                      <p className="font-semibold text-green-900 text-sm">{file.name}</p>
                      <p className="text-green-600 text-xs">{(file.size / 1024).toFixed(0)} KB · {file.type || "audio"}</p>
                    </div>
                    <button onClick={resetRecording} className="px-3 py-1 bg-red-500 text-white rounded text-xs font-bold">✕</button>
                  </div>
                  {fileAudioURL && <audio src={fileAudioURL} controls className="w-full" />}
                </div>
              )}

              <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg text-xs text-purple-800 space-y-1 mt-auto">
                <p className="font-semibold text-purple-900 text-sm mb-1">ℹ️ Upload Tips:</p>
                <p>✓ 15-second recordings give the best results</p>
                <p>✓ Clear speech with minimal background noise</p>
                <p>✓ Supported formats: WAV, MP3, WebM, OGG, FLAC</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        {hasAudio && !isRecording && (
          <div className="flex justify-center mb-8">
            <button onClick={handleAnalyze} disabled={isAnalyzing}
              className={`py-4 px-14 text-lg font-bold rounded-xl transition transform shadow-xl ${
                isAnalyzing
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:scale-105"
              }`}>
              {isAnalyzing ? "⏳ Analyzing..." : "🔍 Analyze Voice Sample"}
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-sky-200/50 mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-sky-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <p className="text-sky-900 font-semibold text-lg mb-1">Analyzing Voice...</p>
            <p className="text-sky-600 text-sm">Splitting into 3-second segments · Extracting 22 vocal features · Running ML model</p>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🎯", title: "15-Second Recording", desc: "Recording auto-stops at 15 seconds — just press Start and speak naturally" },
            { icon: "🔬", title: "Segment Analysis", desc: "Audio split into 5 × 3-second segments, each analyzed for 22 vocal features" },
            { icon: "📊", title: "Visual Results", desc: "Risk score, segment charts, radar graph, and vocal feature breakdown" },
          ].map((c, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-sky-200/50">
              <div className="text-4xl mb-3">{c.icon}</div>
              <h3 className="font-bold text-sky-900 mb-2">{c.title}</h3>
              <p className="text-sky-700 text-sm">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Upload;
