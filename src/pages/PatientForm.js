import { useNavigate } from "react-router-dom";

function PatientForm() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Patient Information</h1>
      <p>Enter patient details here.</p>
      <button onClick={() => navigate("/upload")}>Next</button>
    </div>
  );
}

export default PatientForm;