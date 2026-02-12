import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>NeuroVoice</h1>
      <p>AI-Based Early Parkinson’s Risk Screening Using Speech</p>
      <button onClick={() => navigate("/form")}>
        Start Screening
      </button>
    </div>
  );
}

export default Home;