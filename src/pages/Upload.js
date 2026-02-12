import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function Upload() {
  const location = useLocation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  const handleUpload = () => {
    navigate("/result", {
      state: {
        risk_score: 72,
        risk_level: "High Risk",
        explanation: "Increased pitch micro-variation detected.",
      },
    });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Upload Voice Recording</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={handleUpload}>Analyze</button>
    </div>
  );
}

export default Upload;