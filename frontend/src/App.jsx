import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Destinations from "./pages/Destinations";
import DestinationForm from "./pages/DestinationForm"; // Import from separate file
import DestinationDetail from "./pages/DestinationDetail";
import Quizzes from "./pages/Quizzes";
import QuizTaking from "./pages/QuizTaking";
import Progress from "./pages/Progress";
import Leaderboard from "./pages/Leaderboard";
import AdminPanel from "./pages/AdminPanel";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/dashboard" />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Destinations Routes */}
        <Route path="destinations" element={<Destinations />} />
        <Route path="destinations/new" element={<DestinationForm />} />
        <Route path="destinations/:id/edit" element={<DestinationForm />} />
        <Route path="destinations/:id" element={<DestinationDetail />} />

        {/* Other Routes */}
        <Route path="quizzes" element={<Quizzes />} />
        <Route path="quiz/:id" element={<QuizTaking />} />
        <Route path="progress" element={<Progress />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="admin" element={<AdminPanel />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
