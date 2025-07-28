import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Flag,
  RotateCcw,
} from "lucide-react";

const QuizTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch quiz
    setTimeout(() => {
      setQuiz({
        id: id,
        title: "Tokyo Travel Expert",
        description:
          "Test your knowledge about Tokyo's attractions, culture, and travel tips",
        timeLimit: 900, // 15 minutes
        questions: [
          {
            id: 1,
            question:
              "What is the world's busiest pedestrian crossing located in Tokyo?",
            type: "multiple_choice",
            options: [
              "Shibuya Crossing",
              "Harajuku Crossing",
              "Ginza Crossing",
              "Shinjuku Crossing",
            ],
            correctAnswer: 0,
            explanation:
              "Shibuya Crossing is famous for being the world's busiest pedestrian crossing, with thousands of people crossing simultaneously during peak times.",
          },
          {
            id: 2,
            question:
              "Cash is preferred over credit cards in many Tokyo establishments.",
            type: "true_false",
            options: ["True", "False"],
            correctAnswer: 0,
            explanation:
              "While this is changing, many places in Tokyo still prefer cash payments, and it's always recommended to carry cash when visiting.",
          },
          {
            id: 3,
            question:
              "What is the best time of year to visit Tokyo for cherry blossoms?",
            type: "multiple_choice",
            options: [
              "December-February",
              "March-May",
              "June-August",
              "September-November",
            ],
            correctAnswer: 1,
            explanation:
              "March to May is spring season in Tokyo, which is when the famous cherry blossoms (sakura) bloom, typically peaking in early April.",
          },
          {
            id: 4,
            question:
              "Which of these is a traditional Japanese greeting gesture?",
            type: "multiple_choice",
            options: ["Handshake", "Bow", "Wave", "High five"],
            correctAnswer: 1,
            explanation:
              "Bowing is a traditional Japanese greeting that shows respect and is still commonly used in formal and informal situations.",
          },
          {
            id: 5,
            question: "Tokyo Skytree is the tallest structure in the world.",
            type: "true_false",
            options: ["True", "False"],
            correctAnswer: 1,
            explanation:
              "Tokyo Skytree is the second tallest structure in the world at 634 meters, after the Burj Khalifa in Dubai.",
          },
        ],
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  useEffect(() => {
    if (!quizCompleted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmitQuiz();
    }
  }, [timeRemaining, quizCompleted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: answerIndex,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = () => {
    // Calculate results
    let correctAnswers = 0;
    const questionResults = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      };
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= 70; // Assuming 70% is passing

    const pointsEarned = passed ? 200 + (score >= 90 ? 50 : 0) : 100;

    setResults({
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      passed,
      pointsEarned,
      questionResults,
    });

    setQuizCompleted(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (quizCompleted && results) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                results.passed ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {results.passed ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {results.passed ? "Congratulations!" : "Keep Learning!"}
            </h1>

            <p className="text-gray-600 mb-6">
              {results.passed
                ? "You passed the quiz successfully!"
                : "You can retake this quiz to improve your score."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-3xl font-bold text-indigo-600">
                  {results.score}%
                </div>
                <div className="text-sm text-gray-600">Final Score</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-3xl font-bold text-green-600">
                  {results.correctAnswers}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-3xl font-bold text-blue-600">
                  {results.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-3xl font-bold text-yellow-600">
                  +{results.pointsEarned}
                </div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
            </div>
          </div>

          {/* Question Review */}
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Question Review
            </h2>

            {quiz.questions.map((question, index) => {
              const result = results.questionResults[index];
              return (
                <div key={question.id} className="card">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        result.isCorrect ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {result.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-3">
                        Question {index + 1}: {question.question}
                      </h3>

                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-3 rounded-lg border ${
                              optionIndex === question.correctAnswer
                                ? "bg-green-50 border-green-200"
                                : optionIndex === result.userAnswer &&
                                  !result.isCorrect
                                ? "bg-red-50 border-red-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span>{option}</span>
                              {optionIndex === question.correctAnswer && (
                                <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                              )}
                              {optionIndex === result.userAnswer &&
                                !result.isCorrect && (
                                  <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="font-medium text-blue-900 mb-1">
                          Explanation:
                        </div>
                        <div className="text-blue-800 text-sm">
                          {question.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/quizzes")}
              className="btn-secondary flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-gray-600">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center text-red-600">
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-medium">{formatTime(timeRemaining)}</span>
            </div>
            <button
              onClick={() => navigate("/quizzes")}
              className="btn-secondary flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit Quiz
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question */}
        <div className="card mb-6">
          <h2 className="text-xl font-medium text-gray-900 mb-6">
            {currentQ.question}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  answers[currentQuestion] === index
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      answers[currentQuestion] === index
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[currentQuestion] === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {Object.keys(answers).length} of {quiz.questions.length} answered
            </span>

            {currentQuestion === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                className="btn-primary flex items-center"
                disabled={Object.keys(answers).length !== quiz.questions.length}
              >
                <Flag className="h-4 w-4 mr-2" />
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="btn-primary flex items-center"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="mt-8 card">
          <h3 className="font-medium text-gray-900 mb-4">Question Navigator</h3>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? "bg-indigo-600 text-white"
                    : answers[index] !== undefined
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;
