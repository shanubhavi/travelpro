import React from "react";
import { Trophy, Medal, Award, Zap, Flame, Crown } from "lucide-react";

const Leaderboard = () => {
  const leaderboard = [
    {
      id: 1,
      name: "Sarah Johnson",
      points: 2450,
      badges: 8,
      streak: 15,
      rank: 1,
      isCurrentUser: true,
    },
    { id: 2, name: "Mike Chen", points: 2180, badges: 6, streak: 12, rank: 2 },
    {
      id: 3,
      name: "Emma Rodriguez",
      points: 1950,
      badges: 7,
      streak: 8,
      rank: 3,
    },
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏆 Company Leaderboard 🏆
        </h1>
        <p className="text-gray-600">
          See how you rank against your colleagues
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rankings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Rank
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  User
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Points
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Badges
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Streak
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b border-gray-100 ${
                    user.isCurrentUser ? "bg-indigo-50" : "hover:bg-gray-50"
                  } transition-colors`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      {getRankIcon(user.rank)}
                      {user.isCurrentUser && (
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm mr-3">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-bold text-gray-900">
                        {user.points.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 text-purple-500 mr-1" />
                      <span className="text-gray-900">{user.badges}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <Flame className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-600 font-medium">
                        {user.streak}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
