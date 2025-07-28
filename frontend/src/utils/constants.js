export const APP_NAME = "TravelPro Academy";
export const VERSION = "1.0.0";

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  DESTINATIONS: "/destinations",
  DESTINATION_DETAIL: "/destinations/:id",
  QUIZZES: "/quizzes",
  QUIZ_TAKING: "/quiz/:id",
  PROGRESS: "/progress",
  LEADERBOARD: "/leaderboard",
  ADMIN: "/admin",
};

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  COMPANY_ADMIN: "company_admin",
  EMPLOYEE: "employee",
};

export const QUIZ_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  TRUE_FALSE: "true_false",
  SCENARIO: "scenario",
};

export const BADGE_RARITIES = {
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
};

export const POINT_SOURCES = {
  QUIZ_COMPLETION: "quiz_completion",
  PERFECT_SCORE: "perfect_score",
  CONTENT_CONTRIBUTION: "content_contribution",
  DAILY_LOGIN: "daily_login",
  BADGE_EARNED: "badge_earned",
};
