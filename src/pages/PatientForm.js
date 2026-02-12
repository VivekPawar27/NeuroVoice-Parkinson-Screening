import { useNavigate } from "react-router-dom";
import { useState } from "react";

function PatientForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    navigate("/upload", { state: formData });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Patient Details</h2>

      <input name="name" placeholder="Name" onChange={handleChange} /><br /><br />
      <input name="age" placeholder="Age" onChange={handleChange} /><br /><br />
      <input name="gender" placeholder="Gender" onChange={handleChange} /><br /><br />

      <button onClick={handleSubmit}>Continue</button>
    </div>
  );
}

export default PatientForm;
