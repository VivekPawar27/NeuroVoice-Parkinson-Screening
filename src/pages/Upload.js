import { useNavigate } from "react-router-dom";

function Upload() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Upload Audio File</h1>
      <p>Upload your audio file here.</p>
      <button onClick={() => navigate("/result")}>Upload & Analyze</button>
    </div>
  );
}

export default Upload;