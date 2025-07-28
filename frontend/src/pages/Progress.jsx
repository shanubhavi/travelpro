import React from "react";
import { TrendingUp, Award, BookOpen, Target, CheckCircle } from "lucide-react";

const Progress = () => {
  const progressData = {
    totalPoints: 2450,
    completedQuizzes: 12,
    averageScore: 87,
    badges: 8,
    rank: 1,
  };

  const badges = [
    { id: 1, name: "First Steps", icon: "🎯", earned: true },
    { id: 2, name: "Quiz Master", icon: "🎓", earned: true },
    { id: 3, name: "High Performer", icon: "🏆", earned: true },
    { id: 4, name: "Perfectionist", icon: "⭐", earned: false },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Progress</h1>
        <p className="text-gray-600">
          Track your learning journey and achievements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-indigo-600">
                {progressData.totalPoints.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quizzes Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {progressData.completedQuizzes}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {progressData.averageScore}%
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Badges Earned</p>
              <p className="text-2xl font-bold text-purple-600">
                {progressData.badges}
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Badges Collection ({badges.filter((b) => b.earned).length}/
          {badges.length})
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                badge.earned
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="font-medium text-gray-900 text-sm mb-1">
                  {badge.name}
                </div>
                {badge.earned && (
                  <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Progress;
