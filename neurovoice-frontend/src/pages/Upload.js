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
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

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
        setRecordingTime(prev => prev + 1);
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
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const url = URL.createObjectURL(uploadedFile);
      setAudioURL(url);
      const blob = new Blob([uploadedFile], { type: uploadedFile.type });
      setRecordedBlob(blob);
    }
  };

  const handleAnalyze = async () => {
    const audioToAnalyze = recordedBlob || file;
    
    if (!audioToAnalyze) {
      alert("Please record or upload an audio file");
      return;
    }

    const formData = new FormData();
    const fileName = recordedBlob 
      ? `recording_${Date.now()}.webm` 
      : file.name;
    formData.append("audio", audioToAnalyze, fileName);

    setIsAnalyzing(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      navigate("/result", { state: response.data });
    } catch (error) {
      console.error("Error analyzing audio:", error);
      alert("Error analyzing audio. Please try again.");
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
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "linear-gradient(135deg, #d0e7f9 0%, #e0f2fe 50%, #cffafe 100%)"
      }}
    >
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-sky-200/50">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-2 text-center">
          Voice Recording
        </h2>
        <p className="text-sky-700 text-center mb-8 font-medium">
          Record your voice or upload an audio file for analysis
        </p>

        <div className="bg-gradient-to-br from-sky-50 to-cyan-50 p-8 rounded-2xl mb-8 border border-sky-200">
          <div className="text-center mb-6">
            {isRecording && (
              <div className="inline-block mb-4">
                <div className="text-lg font-semibold text-sky-700">
                  Recording: {formatTime(recordingTime)}
                </div>
                <div className="flex justify-center gap-2 mt-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                </div>
              </div>
            )}
            {!isRecording && !audioURL && (
              <p className="text-sky-700 font-medium mb-4">
                Click below to start recording
              </p>
            )}
            {audioURL && (
              <p className="text-green-700 font-medium mb-4">
                ✓ Audio ready for analysis
              </p>
            )}
          </div>

          <div className="flex gap-4 justify-center mb-6 flex-wrap">
            {!isRecording && !audioURL && (
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

            {audioURL && (
              <>
                <button
                  onClick={resetRecording}
                  className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold rounded-xl transition"
                >
                  🔄 Record Again
                </button>
              </>
            )}
          </div>

          {audioURL && (
            <div className="bg-white p-6 rounded-xl">
              <p className="text-sm font-semibold text-sky-700 mb-4">Playback:</p>
              <audio
                src={audioURL}
                controls
                className="w-full mb-4 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="border-2 border-dashed border-sky-300 rounded-2xl p-8 bg-sky-50 mb-8">
          <p className="text-center text-sky-700 mb-4 font-medium">
            Or upload an existing recording
          </p>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="w-full p-3 border-2 border-sky-200 rounded-xl focus:outline-none focus:border-sky-600 cursor-pointer"
          />
          {file && (
            <p className="text-sm text-green-700 mt-3 font-medium">
              ✓ File selected: {file.name}
            </p>
          )}
        </div>

        {(audioURL || file) && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full py-4 px-6 text-lg font-bold rounded-xl transition transform ${
              isAnalyzing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white hover:scale-105"
            }`}
          >
            {isAnalyzing ? "⏳ Analyzing..." : "🔍 Analyze Voice"}
          </button>
        )}

        <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-xl">
          <p className="font-semibold text-blue-900 mb-3">📋 Recording Tips:</p>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Record in a quiet environment</li>
            <li>✓ Speak clearly and at normal volume</li>
            <li>✓ Recording should be 10-60 seconds long</li>
            <li>✓ Ensure good microphone quality for better analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Upload;
