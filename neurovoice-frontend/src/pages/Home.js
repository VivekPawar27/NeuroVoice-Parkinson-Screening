import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-100 via-teal-50 to-teal-100 flex items-center justify-center px-4 py-10">
      <div className="text-center max-w-3xl">
        {/* Decorative Element */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-teal-300 rounded-full opacity-20 blur-3xl"></div>
        
        {/* Header Section */}
        <div className="mb-12 relative z-10">
          {/* Logo Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-28 h-28 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-7xl">🎤</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-teal-900 mb-3">
            NeuroVoice
          </h1>

          {/* Subtitle */}
          <p className="text-2xl text-teal-700 mb-6 font-semibold">
            Early Parkinson's Risk Screening
          </p>

          {/* Description */}
          <p className="text-lg text-teal-600 leading-relaxed mb-10 max-w-lg mx-auto">
            Advanced AI voice analysis for early detection of Parkinson's disease. Get comprehensive screening with detailed analysis and risk assessment.
          </p>
        </div>

        {/* Main CTA Button */}
        <button
          onClick={() => navigate("/form")}
          className="mb-12 px-12 py-4 text-xl font-bold rounded-full bg-teal-600 text-white hover:bg-teal-700 transition duration-300 transform hover:scale-105 shadow-lg"
        >
          Start Screening
        </button>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition border-l-4 border-teal-600">
            <div className="text-5xl mb-4">🎙️</div>
            <h3 className="text-xl font-bold text-teal-800 mb-2">Voice Recording</h3>
            <p className="text-teal-600">Simple voice recording & analysis interface</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition border-l-4 border-teal-500">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-teal-800 mb-2">Live Analytics</h3>
            <p className="text-teal-600">Real-time voice feature analysis & metrics</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition border-l-4 border-teal-400">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-teal-800 mb-2">Risk Assessment</h3>
            <p className="text-teal-600">Comprehensive AI-powered risk evaluation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;