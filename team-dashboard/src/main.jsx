// filepath: /Users/rohan/teamio-2/team-dashboard/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainDashboardPage from "./pages/MainDashboardPage";
import LinkToolsPage from "./pages/LinkToolsPage";
import MappingLoginsPage from "./pages/MappingLoginsPage";
import AnnotateContributionsPage from "./pages/AnnotateContributionsPage";
import ReflectionsPage from "./pages/ReflectionsPage";
import LoginPage from "./pages/LoginPage";
import { StepsCompletionProvider } from "./contexts/StepsCompletionContext";
import { AuthContextProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./utils/ProtectedRoute";
import "./index.css";

localStorage.clear(); // Clear localStorage on page load for fresh start

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthContextProvider>
    <StepsCompletionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/teamio"
            element={
              <ProtectedRoute>
                <MainDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teamio/link"
            element={
              <ProtectedRoute>
                <LinkToolsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teamio/mapping"
            element={
              <ProtectedRoute>
                <MappingLoginsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teamio/annotation"
            element={
              <ProtectedRoute>
                <AnnotateContributionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teamio/reflections"
            element={
              <ProtectedRoute>
                <ReflectionsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </StepsCompletionProvider>
  </AuthContextProvider>
);