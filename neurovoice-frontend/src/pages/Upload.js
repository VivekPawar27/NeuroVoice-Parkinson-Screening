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
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-teal-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-teal-800 mb-2 text-center">
          Voice Recording
        </h2>
        <p className="text-teal-600 text-center mb-8">
          Record your voice or upload an audio file for analysis
        </p>

        {/* Recording Section */}
        <div className="bg-teal-50 p-8 rounded-xl mb-8">
          <div className="text-center mb-6">
            {isRecording && (
              <div className="inline-block mb-4">
                <div className="text-lg font-semibold text-teal-700">
                  Recording: {formatTime(recordingTime)}
                </div>
                <div className="flex justify-center gap-2 mt-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
            {!isRecording && !audioURL && (
              <p className="text-teal-700 font-medium mb-4">
                Click below to start recording
              </p>
            )}
            {audioURL && (
              <p className="text-green-700 font-medium mb-4">
                ✓ Audio ready for analysis
              </p>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex gap-4 justify-center mb-6 flex-wrap">
            {!isRecording && !audioURL && (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition transform hover:scale-105"
              >
                🎙️ Start Recording
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition"
              >
                ⏹️ Stop Recording
              </button>
            )}

            {audioURL && (
              <>
                <button
                  onClick={resetRecording}
                  className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition"
                >
                  🔄 Record Again
                </button>
              </>
            )}
          </div>

          {/* Audio Playback */}
          {audioURL && (
            <div className="bg-white p-6 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-4">Playback:</p>
              <audio
                src={audioURL}
                controls
                className="w-full mb-4 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="border-2 border-dashed border-teal-300 rounded-xl p-8 bg-teal-50 mb-8">
          <p className="text-center text-gray-700 mb-4 font-medium">
            Or upload an existing recording
          </p>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="w-full p-3 border-2 border-teal-200 rounded-lg focus:outline-none focus:border-teal-600 cursor-pointer"
          />
          {file && (
            <p className="text-sm text-green-700 mt-3 font-medium">
              ✓ File selected: {file.name}
            </p>
          )}
        </div>

        {/* Analyze Button */}
        {(audioURL || file) && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full py-4 px-6 text-lg font-bold rounded-lg transition transform ${
              isAnalyzing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 text-white hover:scale-105"
            }`}
          >
            {isAnalyzing ? "⏳ Analyzing..." : "🔍 Analyze Voice"}
          </button>
        )}

        {/* Recording Tips */}
        <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded">
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