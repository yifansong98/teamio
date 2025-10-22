import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainDashboardPage from "./pages/MainDashboardPage";
import LinkToolsPage from "./pages/LinkToolsPage";
import MappingLoginsPage from "./pages/MappingLoginsPage";
import AnnotateContributionsPage from "./pages/AnnotateContributionsPage";
import ReflectionsPage from "./pages/ReflectionsPage";
import LoginPage from "./pages/LoginPage";
import StreamlinedDashboard from "./pages/StreamlinedDashboard";
import GoogleDocsStepper from "./pages/GoogleDocsStepper";
import ScrapeDocumentsPage from "./pages/ScrapeDocumentsPage";
import LinkDocsPage from "./pages/LinkDocsPage";
import { StepsCompletionProvider } from "./contexts/StepsCompletionContext";
import { AuthContextProvider } from "./contexts/AuthContext";
import { TeamContextProvider } from "./contexts/TeamContext";
import ProtectedRoute from "./utils/ProtectedRoute";
import "./index.css";

// Only clear localStorage if no user data exists (for fresh starts)
if (!localStorage.getItem("userData")) {
  localStorage.clear();
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthContextProvider>
    <TeamContextProvider>
      <StepsCompletionProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Main Dashboard */}
          <Route path="/home" element={
            <ProtectedRoute>
              <MainDashboardPage />
            </ProtectedRoute>
          } />
          
          {/* Step 1: Scrape Google Docs */}
          <Route path="/home/scrape-documents" element={
            <ProtectedRoute>
              <GoogleDocsStepper />
            </ProtectedRoute>
          } />
          
          {/* Step 2: Map All Logins to UserIDs */}
          <Route path="/home/map-logins" element={
            <ProtectedRoute>
              <MappingLoginsPage />
            </ProtectedRoute>
          } />
          
          {/* Step 3: Annotate Contributions */}
          <Route path="/home/annotate-contributions" element={
            <ProtectedRoute>
              <AnnotateContributionsPage />
            </ProtectedRoute>
          } />
          
          {/* Step 4: Team Reflection */}
          <Route path="/home/reflections" element={
            <ProtectedRoute>
              <ReflectionsPage />
            </ProtectedRoute>
          } />
          
          {/* Additional routes for compatibility */}
          <Route path="/home/link-docs" element={<LinkDocsPage />} />
          <Route path="/home/results" element={<ReflectionsPage />} />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        </BrowserRouter>
      </StepsCompletionProvider>
    </TeamContextProvider>
  </AuthContextProvider>
);