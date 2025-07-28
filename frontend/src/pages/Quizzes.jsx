import React from "react";
import { BookOpen, Clock, Target, Star, Play } from "lucide-react";
import { Link } from "react-router-dom";

const Quizzes = () => {
  const quizzes = [
    {
      id: 1,
      title: "Tokyo Travel Expert",
      description:
        "Test your knowledge about Tokyo's attractions, culture, and travel tips",
      difficulty: "Intermediate",
      questions: 10,
      timeLimit: 15,
      points: 200,
      completed: true,
      score: 85,
    },
    {
      id: 2,
      title: "Paris City Guide Mastery",
      description: "Master the art of selling Paris as a romantic destination",
      difficulty: "Advanced",
      questions: 15,
      timeLimit: 20,
      points: 300,
      completed: false,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Training Quizzes
        </h1>
        <p className="text-gray-600">
          Test and improve your destination knowledge
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {quiz.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{quiz.description}</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                {quiz.difficulty}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                {quiz.questions} questions
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {quiz.timeLimit} minutes
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2" />
                {quiz.points} points
              </div>
            </div>

            {quiz.completed && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Score:</span>
                  <span className="font-bold text-green-600">
                    {quiz.score}%
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                to={`/quiz/${quiz.id}`}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium flex items-center justify-center"
              >
                <Play className="h-4 w-4 mr-2" />
                {quiz.completed ? "Retake Quiz" : "Start Quiz"}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quizzes;
