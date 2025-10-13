import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute - user:", user, "loading:", loading);

  if (loading) {
    return <p>Loading...</p>;
  }

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;