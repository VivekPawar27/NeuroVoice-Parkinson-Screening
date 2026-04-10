import { useEffect, useRef, useState } from 'react';
import './App.css';

const MAX_SECONDS = 15;

function App() {
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState('Ready to record or upload');
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setSelectedFile(null);
        setPreviewUrl(URL.createObjectURL(blob));
        setStatus('Recording complete (15 seconds). Click Analyze.');
      };

      mediaRecorder.start();
      setRecording(true);
      setStatus('Recording... 15 seconds maximum');
      setSeconds(0);

      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            stopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      setStatus('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state === 'inactive') return;

    recorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setRecording(false);
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowed = /\.(wav|mp3|webm)$/i;
    if (!allowed.test(file.name)) {
      alert('Only .wav, .mp3, or .webm files accepted.');
      event.target.value = '';
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setRecordedBlob(null);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus(`File selected: ${file.name}`);
  };

  const handleAnalyze = async () => {
    const file = selectedFile || recordedBlob;

    if (!file) {
      alert('Record audio or upload a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);

    setStatus('Analyzing audio... splitting into 3-second segments...');
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();
      setResult(json);
      setStatus(json.error ? `Error: ${json.error}` : 'Analysis complete.');
      setLoading(false);
    } catch (error) {
      setStatus(`Server error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        <h1>Parkinson's Voice Screening</h1>
        <div className="guidelines">
          <div>✓ Clear speech</div>
          <div>✓ Quiet environment</div>
          <div>✓ Exactly 15 seconds maximum</div>
          <div>✓ Upload .wav, .mp3, or .webm</div>
        </div>

        <div className="controls">
          <button className="primary" onClick={startRecording} disabled={recording}>
            Start Recording
          </button>
          <button className="secondary" onClick={stopRecording} disabled={!recording}>
            Stop Recording
          </button>
        </div>

        <div className="upload-row">
          <label className="file-label">
            Or upload audio file
            <input type="file" accept=".wav,.mp3,.webm" onChange={handleFileChange} />
          </label>
        </div>

        <div className="status">
          <strong>Status:</strong> {status} {recording ? `(${seconds}s / ${MAX_SECONDS}s)` : ''}
        </div>

        {previewUrl && (
          <div className="preview">
            <audio controls src={previewUrl} />
          </div>
        )}

        <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>

        {result && (
          <div className="result-box">
            <h2>Analysis Results</h2>
            {result.error ? (
              <div className="error">{result.error}</div>
            ) : (
              <div>
                <p><strong>Duration:</strong> {result.duration_seconds}s</p>
                <p><strong>Sample Rate:</strong> {result.sample_rate} Hz</p>
                {result.segments && (
                  <div>
                    <h3>Segments (3-second chunks)</h3>
                    <pre>{JSON.stringify(result.segments, null, 2)}</pre>
                  </div>
                )}
                {result.features && (
                  <div>
                    <h3>Extracted Features</h3>
                    <pre>{JSON.stringify(result.features, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;