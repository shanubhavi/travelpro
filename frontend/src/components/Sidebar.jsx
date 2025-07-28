import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MapPin,
  BookOpen,
  TrendingUp,
  Trophy,
  BarChart3,
  Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "Destinations", href: "/destinations", icon: MapPin },
    { name: "Quizzes", href: "/quizzes", icon: BookOpen },
    { name: "My Progress", href: "/progress", icon: TrendingUp },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  const adminItems = [{ name: "Admin Panel", href: "/admin", icon: Settings }];

  const items = isAdmin ? [...navigationItems, ...adminItems] : navigationItems;

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">TravelPro</h1>
            <p className="text-sm text-gray-500">Academy</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    isActive
                      ? "text-indigo-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="bg-indigo-100 rounded-full h-8 w-8 flex items-center justify-center">
            <span className="text-sm font-medium text-indigo-600">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.company}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
