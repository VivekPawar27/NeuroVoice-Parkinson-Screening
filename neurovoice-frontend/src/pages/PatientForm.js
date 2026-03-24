import { useNavigate } from "react-router-dom";
import { useState } from "react";

function PatientForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.age || formData.age < 1 || formData.age > 150) newErrors.age = "Valid age is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      navigate("/upload", { state: formData });
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "linear-gradient(135deg, #d0e7f9 0%, #e0f2fe 50%, #cffafe 100%)"
      }}
    >
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-sky-200/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-sky-100 to-cyan-100 rounded-full p-4 mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-900 to-cyan-900 bg-clip-text text-transparent mb-2">Patient Information</h1>
            <p className="text-sky-700">Please enter your details to begin</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-sky-900 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition ${
                  errors.name ? "border-red-500 bg-red-50" : "border-sky-200 bg-sky-50 placeholder-sky-400"
                }`}
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">✗ {errors.name}</p>}
            </div>

            {/* Age Input */}
            <div>
              <label className="block text-sm font-semibold text-sky-900 mb-2">Age</label>
              <input
                type="number"
                name="age"
                placeholder="60"
                value={formData.age}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition ${
                  errors.age ? "border-red-500 bg-red-50" : "border-sky-200 bg-sky-50 placeholder-sky-400"
                }`}
              />
              {errors.age && <p className="text-red-600 text-sm mt-1">✗ {errors.age}</p>}
            </div>

            {/* Gender Select */}
            <div>
              <label className="block text-sm font-semibold text-sky-900 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition cursor-pointer ${
                  errors.gender ? "border-red-500 bg-red-50" : "border-sky-200 bg-sky-50"
                }`}
              >
                <option value="">Select your gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-red-600 text-sm mt-1">✗ {errors.gender}</p>}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition duration-300"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold hover:from-sky-700 hover:to-cyan-700 transition duration-300 transform hover:scale-105"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientForm;
