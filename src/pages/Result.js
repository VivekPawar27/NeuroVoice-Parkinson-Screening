import { useLocation } from "react-router-dom";

function Result() {
  const location = useLocation();
  const data = location.state;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Screening Result</h2>
      <h1>{data?.risk_score}%</h1>
      <h3>{data?.risk_level}</h3>
      <p>{data?.explanation}</p>
    </div>
  );
}

export default Result;