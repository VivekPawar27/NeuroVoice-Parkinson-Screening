import { useNavigate } from "react-router-dom";

function Result() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Analysis Results</h1>
      <p>Your screening results will appear here.</p>
      <button onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
}

export default Result;