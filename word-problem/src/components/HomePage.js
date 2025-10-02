import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BookOpen,
  Check,
  X,
  Trophy,
  Sparkles,
  Loader,
  TrendingUp,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBookOpenReader } from "react-icons/fa6";
import { GiTrophy } from "react-icons/gi";
import { SlBadge } from "react-icons/sl";

const API_URL = "http://localhost:5000/api";

const WordProblemsApp = () => {
  const [view, setView] = useState("home");
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userId] = useState(`user_${Date.now()}`); // Simple user ID
  const [startTime, setStartTime] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [detailedExplanation, setDetailedExplanation] = useState(null);

  const VisualRepresentation = ({ problem }) => {
  if (!problem) return null;

  // Ensure numbers
  const initialCount = Number(problem.initialCount ?? 0);
  const addCount = Number(problem.addCount ?? 0);
  const removeCount = Number(problem.removeCount ?? 0);
  const operation = problem.operation ?? "";

  // Pick correct emoji
  const getEmoji = () => {
    switch (problem.visualType) {
      case "apples": return "🍎";
      case "cookies": return "🍪";
      case "cars": return "🚗";
      case "gifts": return "🎁";
      default: return "❓";
    }
  };
  const emoji = getEmoji();

  return (
    <div className="my-8 p-6 bg-gradient-to-r from-white to-purple-50 rounded-3xl shadow-xl">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        ✨ Visual Representation
      </h3>

      <div className="flex flex-col items-center gap-6">
        {/* Main items */}
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: initialCount }).map((_, idx) => (
            <motion.span
              key={idx}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`text-4xl ${
                operation === "subtraction" && idx < removeCount
                  ? "animate-blink"
                  : ""
              }`}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {/* If addition */}
        {operation === "addition" && addCount > 0 && (
          <div className="flex flex-col items-center">
            <p className="text-lg font-semibold text-green-600">
              + {addCount} more
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {Array.from({ length: addCount }).map((_, idx) => (
                <motion.span
                  key={`add-${idx}`}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.15 }}
                  className="text-4xl"
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Subtraction caption */}
        {operation === "subtraction" && removeCount > 0 && (
          <p className="text-lg font-semibold text-red-600 mt-4">
            
          </p>
        )}
      </div>
    </div>
  );
};


  // Fetch all problems on mount
  useEffect(() => {
    fetchProblems();
    fetchUserProgress();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/problems`);
      setProblems(response.data.data);
    } catch (error) {
      console.error("Error fetching problems:", error);
      alert(
        "Failed to load problems. Make sure the backend server is running!"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/progress/${userId}`);
      setUserStats(response.data.data.stats);
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const selectProblem = (problem) => {
    setSelectedProblem(problem);
    setView("problem");
    setAnswer("");
    setResult(null);
    setShowExplanation(false);
    setStartTime(Date.now());
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000); // in seconds

      const response = await axios.post(`${API_URL}/submit`, {
        problemId: selectedProblem._id,
        userAnswer: answer,
        userId: userId,
        timeTaken: timeTaken,
      });

      setResult(response.data.data);
      await fetchUserProgress();
    } catch (error) {
      console.error("Error submitting answer:", error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Failed to submit answer. Check if the server is running!");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedExplanation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/explain/${selectedProblem._id}`
      );
      setDetailedExplanation(response.data.data);
      setShowExplanation(true);
    } catch (error) {
      console.error("Error fetching explanation:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const HomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaBookOpenReader className="w-16 h-16 text-blue-600 animate-bounce" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
              Word Problems
            </h1>
          </div>
          <p className="text-2xl text-gray-600 mb-6">
            Learn Math Through Fun Stories!
          </p>

          {/* Stats Card */}
          {userStats && (
            <div className="bg-white px-8 py-4 rounded-full shadow-lg inline-flex items-center gap-6">
              <div className="flex items-center gap-2">
                <GiTrophy  className="w-8 h-8 text-yellow-500" />
                <span className="text-3xl font-bold text-blue-600">
                  {userStats.totalScore}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span className="text-lg font-semibold text-gray-700">
                  {userStats.accuracy}% Accuracy
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SlBadge  className="w-6 h-6 text-blue-500" />
                <span className="text-lg font-semibold text-gray-700">
                  {userStats.totalCorrect} Solved
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && problems.length === 0 ? (
          <div className="text-center py-20">
            <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-xl text-gray-600">
              Loading problems from server...
            </p>
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-xl">
            <p className="text-2xl text-red-600 mb-4">⚠️ No problems found!</p>
            <p className="text-gray-600">
              Make sure the Node.js backend server is running on port 5000
            </p>
            <button
              onClick={fetchProblems}
              className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          /* Problems Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {problems.map((problem, idx) => (
              <div
                key={problem._id}
                className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer animate-slideIn"
                style={{ animationDelay: `${idx * 150}ms` }}
                onClick={() => selectProblem(problem)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {problem.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(
                      problem.difficulty
                    )}`}
                  >
                    {problem.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {problem.story}
                </p>
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  <span>Start Problem</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const ProblemView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setView("home")}
          className="mb-6 px-6 py-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-blue-600"
        >
          ← Back to Problems
        </button>

        <div className="bg-white rounded-3xl p-10 shadow-2xl animate-fadeIn">
          {/* Problem Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-4xl font-bold text-gray-800">
                {selectedProblem.title}
              </h2>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(
                  selectedProblem.difficulty
                )}`}
              >
                {selectedProblem.difficulty}
              </span>
            </div>
          </div>

          {/* Problem Story */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-2xl p-8 mb-8">
            <p className="text-xl text-gray-700 leading-relaxed">
              {selectedProblem.story}
            </p>
          </div>
          <VisualRepresentation problem={selectedProblem} />

          {/* Answer Section */}
          {!result ? (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Your Answer:
                </label>
                <input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-6 py-4 text-2xl border-4 border-blue-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-all"
                  placeholder="Enter your answer..."
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!answer || loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-500 text-white text-xl font-bold rounded-2xl hover:from-blue-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader className="w-6 h-6 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Submit Answer"
                )}
              </button>
            </div>
          ) : (
            /* Result Section */
            <div className="space-y-6 animate-fadeIn">
              {/* Result Card */}
              <div
                className={`p-8 rounded-2xl ${
                  result.isCorrect
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 border-4 border-green-400"
                    : "bg-gradient-to-r from-red-100 to-pink-100 border-4 border-red-400"
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {result.isCorrect ? (
                    <>
                      <Check className="w-12 h-12 text-green-600 animate-bounce" />
                      <h3 className="text-3xl font-bold text-green-700">
                        {result.explanation.message}
                      </h3>
                    </>
                  ) : (
                    <>
                      <X className="w-12 h-12 text-red-600 animate-pulse" />
                      <h3 className="text-3xl font-bold text-red-700">
                        {result.explanation.message}
                      </h3>
                    </>
                  )}
                </div>
                <p className="text-xl text-gray-700 mb-2">
                  {result.explanation.reasoning}
                </p>
                <p className="text-lg text-gray-600 italic">
                  {result.explanation.encouragement}
                </p>

                {!result.isCorrect && (
                  <div className="mt-4 p-4 bg-white rounded-xl">
                    <p className="text-lg">
                      <span className="font-bold">Your answer:</span>{" "}
                      {result.userAnswer}
                    </p>
                    <p className="text-lg">
                      <span className="font-bold">Correct answer:</span>{" "}
                      {result.correctAnswer}
                    </p>
                  </div>
                )}
              </div>

              {/* Step-by-Step Solution */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-150 rounded-2xl p-8">
                <h4 className="text-2xl font-bold text-gray-800 mb-4">
                  📚 Step-by-Step Solution:
                </h4>
                <ol className="space-y-3">
                  {result.steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 animate-fadeIn"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-lg text-gray-700 pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Detailed Explanation Button */}
              <button
                onClick={fetchDetailedExplanation}
                disabled={loading}
                className="w-full py-4 bg-blue-500 text-white text-lg font-bold rounded-2xl hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Get Detailed Explanation from Server
                  </>
                )}
              </button>

              {/* Detailed Explanation */}
              {showExplanation && detailedExplanation && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 animate-fadeIn">
                  <h4 className="text-2xl font-bold text-gray-800 mb-4">
                    💡 Hints & Tips:
                  </h4>
                  <ul className="space-y-2 mb-4">
                    {detailedExplanation.hints.map((hint, idx) => (
                      <li key={idx} className="text-lg text-gray-700">
                        • {hint}
                      </li>
                    ))}
                  </ul>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    Related Concepts:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailedExplanation.relatedConcepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-blue-600"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Try Another Problem */}
              <button
                onClick={() => setView("home")}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-500 text-white text-xl font-bold rounded-2xl hover:from-blue-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Try Another Problem →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      {view === "home" ? <HomeView /> : <ProblemView />}
    </>
  );
};

export default WordProblemsApp;
