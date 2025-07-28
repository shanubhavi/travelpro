import React from "react";
import {
  MapPin,
  BookOpen,
  Award,
  TrendingUp,
  Zap,
  Flame,
  Trophy,
  Target,
  Clock,
  Star,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  const stats = {
    points: 850,
    badges: 4,
    streak: 12,
    rank: 1,
    completedQuizzes: 8,
    averageScore: 87,
  };

  const recentAchievements = [
    {
      id: 1,
      type: "badge",
      title: "Quiz Master",
      description: "Completed 5 quizzes",
      points: 200,
      icon: "🎓",
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      type: "quiz",
      title: "Tokyo Travel Expert",
      description: "Scored 95%",
      points: 150,
      icon: "⭐",
      timestamp: "1 day ago",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}! 🎉
        </h1>
        <p className="text-gray-600 mt-2">
          Continue your learning journey and climb the leaderboard
        </p>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">
                Total Points
              </p>
              <p className="text-3xl font-bold">
                {stats.points.toLocaleString()}
              </p>
            </div>
            <Zap className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Badges Earned
              </p>
              <p className="text-3xl font-bold">{stats.badges}</p>
            </div>
            <Award className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-400 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">
                Learning Streak
              </p>
              <p className="text-3xl font-bold">{stats.streak} days</p>
            </div>
            <Flame className="h-12 w-12 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Company Rank</p>
              <p className="text-3xl font-bold">#{stats.rank}</p>
            </div>
            <Trophy className="h-12 w-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Learning Hub
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
              <div className="bg-blue-600 p-3 rounded-full mb-3">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Destinations
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Explore travel guides
              </span>
            </div>
            <div className="flex flex-col items-center p-6 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer">
              <div className="bg-green-600 p-3 rounded-full mb-3">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Take Quiz
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Test your knowledge
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Achievements
          </h3>
          <div className="space-y-4">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
              >
                <span className="text-2xl mr-3">{achievement.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {achievement.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {achievement.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    {achievement.timestamp}
                  </div>
                </div>
                <div className="text-green-600 font-bold">
                  +{achievement.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
