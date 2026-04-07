import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import axios from "axios";

function Upload() {
  const location = useLocation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [uploadMode, setUploadMode] = useState("record"); // "record" or "upload"
  const [dragActive, setDragActive] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      audioChunks.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
      streamRef.current = stream;
      
      const options = { mimeType: "audio/wav" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "audio/webm";
      }

      mediaRecorder.current = new MediaRecorder(stream, options);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mediaRecorder.current.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setRecordedBlob(blob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at 15 seconds
          if (newTime >= 15) {
            if (mediaRecorder.current && isRecording) {
              mediaRecorder.current.stop();
              setIsRecording(false);
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
              }
            }
            return 15;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const resetRecording = () => {
    setAudioURL(null);
    setRecordedBlob(null);
    setRecordingTime(0);
    setFile(null);
    setFileSize(null);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  };

  const processFile = (uploadedFile) => {
    // Validate file type
    const supportedFormats = ['audio/wav', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/x-wav', 'audio/mp4'];
    const supportedExtensions = ['wav', 'mp3', 'webm', 'ogg', 'aac', 'flac', 'm4a'];
    
    const fileType = uploadedFile.type;
    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
    
    if (!supportedFormats.includes(fileType) && !supportedExtensions.includes(fileExtension)) {
      alert(`Unsupported file format. Please upload: ${supportedExtensions.join(', ').toUpperCase()}`);
      return;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (uploadedFile.size > maxSize) {
      alert(`File is too large. Maximum size is 50MB. Your file is ${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setFile(uploadedFile);
    setFileSize(uploadedFile.size);
    
    const url = URL.createObjectURL(uploadedFile);
    setAudioURL(url);
    const blob = new Blob([uploadedFile], { type: uploadedFile.type });
    setRecordedBlob(blob);
    setUploadMode("upload");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes, k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleAnalyze = async () => {
    const audioToAnalyze = recordedBlob || file;
    
    if (!audioToAnalyze) {
      alert("Please record or upload an audio file");
      return;
    }

    // Validate audio duration if it's a recorded blob
    if (recordedBlob && recordingTime < 5) {
      alert("Recording is too short. Please record at least 5 seconds of audio.");
      return;
    }

    const formData = new FormData();
    let fileName;
    
    if (recordedBlob) {
      // Determine file extension based on MIME type
      let extension = "webm"; // default
      if (recordedBlob.type === "audio/wav") {
        extension = "wav";
      } else if (recordedBlob.type === "audio/ogg") {
        extension = "ogg";
      } else if (recordedBlob.type === "audio/mp4") {
        extension = "m4a";
      }
      fileName = `recording_${Date.now()}.${extension}`;
    } else {
      fileName = file.name;
    }
    
    // Send audio in 'audio' field
    formData.append("audio", audioToAnalyze, fileName);

    setIsAnalyzing(true);
    try {
      console.log("Sending audio to backend...");
      console.log("File size:", audioToAnalyze.size);
      console.log("File type:", audioToAnalyze.type);
      
      // Use the new NeuroVoice backend endpoint
      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        formData,
        { 
          timeout: 30000
        }
      );

      console.log("Backend response:", response.data);

      // Check if response has an error
      if (response.data.error) {
        console.error("Server error:", response.data.error);
        alert(`Error: ${response.data.error}`);
        setIsAnalyzing(false);
        return;
      }

      navigate("/result", { state: response.data });
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
      alert(`Error analyzing audio: ${errorMessage}`);
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      className="min-h-screen px-4 py-10"
      style={{
        backgroundImage: "linear-gradient(135deg, #d0e7f9 0%, #e0f2fe 50%, #cffafe 100%)"
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-3">
            Voice Analysis Portal
          </h1>
          <p className="text-sky-700 text-lg font-medium">
            Choose your preferred method to analyze voice for Parkinson's screening
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 justify-center mb-8 flex-wrap">
          <button
            onClick={() => { setUploadMode("record"); resetRecording(); }}
            className={`px-8 py-3 rounded-xl font-bold transition ${
              uploadMode === "record"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                : "bg-white/60 text-sky-700 hover:bg-white/80"
            }`}
          >
            🎙️ Record Voice
          </button>
          <button
            onClick={() => { setUploadMode("upload"); resetRecording(); }}
            className={`px-8 py-3 rounded-xl font-bold transition ${
              uploadMode === "upload"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                : "bg-white/60 text-sky-700 hover:bg-white/80"
            }`}
          >
            📁 Upload Recording
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recording Section */}
          <div className={`transition ${uploadMode === "record" ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-sky-200/50 h-full">
              <h2 className="text-2xl font-bold text-sky-900 mb-4">Record New Voice Sample</h2>
              <p className="text-sky-700 mb-6 font-medium">
                Record a voice sample directly using your microphone
              </p>

              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 p-8 rounded-2xl mb-6 border border-sky-200">
                <div className="text-center mb-6">
                  {isRecording && (
                    <div className="inline-block mb-4">
                      <div className={`text-lg font-semibold mb-2 ${recordingTime >= 12 ? 'text-red-600 animate-pulse' : 'text-sky-700'}`}>
                        Recording: {formatTime(recordingTime)} {recordingTime >= 12 && <span className="ml-2">⚠️</span>}
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2 mb-4 overflow-hidden">
                        <div 
                          className={`h-full transition-all ${recordingTime >= 12 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${(recordingTime / 15) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-center gap-2 mt-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                      </div>
                      <p className="text-red-600 text-sm mt-3 font-semibold">🔴 Recording in progress...</p>
                      {recordingTime >= 12 && <p className="text-red-600 text-xs mt-2">Recording will auto-stop at 15 seconds</p>}
                    </div>
                  )}
                  {!isRecording && !audioURL && !recordedBlob && (
                    <div className="text-center py-4">
                      <div className="text-5xl mb-3">🎤</div>
                      <p className="text-sky-700 font-medium">Ready to record</p>
                      <p className="text-sky-600 text-sm mt-1">Click the button below to start</p>
                    </div>
                  )}
                  {(audioURL || recordedBlob) && !isRecording && (
                    <div className="text-center py-4">
                      <div className="text-5xl mb-3">✅</div>
                      <p className="text-green-700 font-semibold">Recording captured</p>
                      <p className="text-green-600 text-sm mt-1">Ready for analysis</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-center mb-6 flex-wrap">
                  {!isRecording && !audioURL && !recordedBlob && (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
                    >
                      🎙️ Start Recording
                    </button>
                  )}

                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
                    >
                      ⏹️ Stop Recording
                    </button>
                  )}

                  {(audioURL || recordedBlob) && !isRecording && (
                    <>
                      <button
                        onClick={stopRecording}
                        className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-xl transition"
                      >
                        🔄 Record Again
                      </button>
                    </>
                  )}
                </div>

                {audioURL && recordedBlob && (
                  <div className="bg-white p-6 rounded-xl">
                    <p className="text-sm font-semibold text-sky-700 mb-3">🔊 Playback:</p>
                    <audio
                      src={audioURL}
                      controls
                      className="w-full focus:outline-none"
                      style={{ outline: "none" }}
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <p className="font-semibold text-blue-900 text-sm mb-2">📋 NeuroVoice Recording Guidelines:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>✓ Record 5-15 seconds of continuous voice (auto-stops at 15 seconds)</li>
                  <li>✓ Quiet environment (minimize background noise)</li>
                  <li>✓ Normal speaking volume and pace</li>
                  <li>✓ Clear articulation for accurate analysis</li>
                  <li>✓ Good microphone quality recommended</li>
                  <li>⚠️ Recording will be analyzed in three-second segments</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className={`transition ${uploadMode === "upload" ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-sky-200/50 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-sky-900 mb-4">Upload Voice Recording</h2>
              <p className="text-sky-700 mb-6 font-medium">
                Upload a pre-recorded voice sample from your device
              </p>

              {/* Drag and Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`flex-grow flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 mb-6 transition cursor-pointer ${
                  dragActive
                    ? "border-blue-600 bg-blue-50 shadow-lg"
                    : "border-sky-300 bg-sky-50 hover:border-sky-400 hover:bg-sky-100"
                }`}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">📁</div>
                  <p className="text-sky-900 font-bold text-lg mb-2">
                    {dragActive ? "Drop your file here" : "Drag and drop audio file"}
                  </p>
                  <p className="text-sky-700 text-sm mb-4">
                    or
                  </p>
                  <p className="text-sky-600 text-xs mb-6">
                    Supported formats: WAV, MP3, WebM, OGG, AAC, FLAC (Max 50MB)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg"
                >
                  📂 Choose File from Device
                </button>
              </div>

              {/* File Information */}
              {file && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📄</div>
                    <div className="flex-grow">
                      <p className="font-semibold text-green-900 mb-2">{file.name}</p>
                      <div className="space-y-1 text-sm text-green-800">
                        <p>📊 Size: {formatFileSize(fileSize)}</p>
                        <p>🎵 Type: {file.type || file.name.split('.').pop().toUpperCase()}</p>
                        <p>✅ Status: Ready for analysis</p>
                      </div>
                    </div>
                    <button
                      onClick={() => resetRecording()}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Audio Preview */}
              {audioURL && file && (
                <div className="bg-white p-4 rounded-xl border border-sky-200">
                  <p className="text-sm font-semibold text-sky-700 mb-3">🔊 Preview:</p>
                  <audio
                    src={audioURL}
                    controls
                    className="w-full focus:outline-none"
                    style={{ outline: "none" }}
                  />
                </div>
              )}

              {/* Info Box */}
              <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg mt-auto">
                <p className="font-semibold text-purple-900 text-sm mb-2">ℹ️ Upload Tips:</p>
                <ul className="text-xs text-purple-800 space-y-1">
                  <li>✓ Use high-quality audio recordings</li>
                  <li>✓ Ensure clear speech without heavy background noise</li>
                  <li>✓ File size should not exceed 50MB</li>
                  <li>✓ Supported: WAV, MP3, WebM, OGG, AAC, FLAC</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Button */}
        {(audioURL || file) && (
          <div className="flex justify-center mb-8">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`py-4 px-12 text-lg font-bold rounded-xl transition transform ${
                isAnalyzing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:scale-105 shadow-xl"
              }`}
            >
              {isAnalyzing ? "⏳ Analyzing... Please wait" : "🔍 Analyze Voice Sample"}
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-sky-200/50 mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-sky-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-sky-900 font-semibold text-lg mb-2">Analyzing Voice...</p>
            <p className="text-sky-700">Extracting voice features and performing assessment. This may take a moment.</p>
          </div>
        )}

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-sky-200/50">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-sky-900 mb-2">Accurate Analysis</h3>
            <p className="text-sky-700 text-sm">Advanced ML model analyzes 22 voice characteristics for Parkinson's detection</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-sky-200/50">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-bold text-sky-900 mb-2">Secure & Private</h3>
            <p className="text-sky-700 text-sm">Your audio data is processed locally and not stored permanently</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-sky-200/50">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-sky-900 mb-2">Detailed Results</h3>
            <p className="text-sky-700 text-sm">Comprehensive analysis with risk assessment and voice feature metrics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upload;
