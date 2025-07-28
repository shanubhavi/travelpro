import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MapPin,
  BookOpen,
  TrendingUp,
  Trophy,
  BarChart3,
  Settings,
  Users,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/helpers";

const Sidebar = ({ collapsed = false, onToggleCollapse }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      description: "Overview and stats",
      badge: null,
    },
    {
      name: "Destinations",
      href: "/destinations",
      icon: MapPin,
      description: "Travel guides",
      badge: null,
    },
    {
      name: "Quizzes",
      href: "/quizzes",
      icon: BookOpen,
      description: "Test knowledge",
      badge: "New",
    },
    {
      name: "Progress",
      href: "/progress",
      icon: TrendingUp,
      description: "Track learning",
      badge: null,
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      description: "Rankings",
      badge: null,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      description: "Account settings",
      badge: null,
    },
  ];

  const adminItems = [
    {
      name: "Admin Panel",
      href: "/admin",
      icon: Settings,
      description: "System management",
      badge: null,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      description: "Manage team",
      badge: null,
    },
    {
      name: "Content Review",
      href: "/admin/submissions",
      icon: FileText,
      description: "Review submissions",
      badge: "3",
    },
  ];

  const items = isAdmin ? [...navigationItems, ...adminItems] : navigationItems;

  const isActive = (href) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "h-screen bg-white shadow-lg flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div
        className={cn(
          "p-6 border-b border-gray-200 flex items-center",
          collapsed && "p-4 justify-center"
        )}
      >
        <div className="flex items-center">
          <div className="bg-primary-600 p-2 rounded-xl flex-shrink-0">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">TravelPro</h1>
              <p className="text-sm text-gray-500">Academy</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative",
                active
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors flex-shrink-0",
                  active
                    ? "text-primary-600"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
              />

              {!collapsed && (
                <>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {item.description}
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "ml-2 px-2 py-0.5 text-xs rounded-full font-medium",
                        item.badge === "New"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}

              {collapsed && item.badge && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              )}

              {active && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-l-full"></div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Collapse Toggle */}
      <div className="border-t border-gray-200">
        {/* Collapse Toggle */}
        <div className="p-4">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User Info */}
        <div
          className={cn("p-4 border-t border-gray-200", collapsed && "px-2")}
        >
          <div
            className={cn("flex items-center", collapsed && "justify-center")}
          >
            <div className="bg-primary-100 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary-600">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>

            {!collapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.company}
                </p>
                {isAdmin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
