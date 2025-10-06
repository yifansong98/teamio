import React from "react";
import ReactDOM from "react-dom/client"; // Import from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainDashboardPage from "./MainDashboardPage";
import StreamlinedDashboard from "./StreamlinedDashboard";
import LinkToolsPage from "./LinkToolsPage";
import MappingLoginsPage from "./MappingLoginsPage";
import AnnotateContributionsPage from "./AnnotateContributionsPage"; 
import ReflectionsPage from "./ReflectionsPage";
import ProveAuthPage from "./ProveAuthPage";
import GoogleDocsStepper from "./GoogleDocsStepper";
import { StepsCompletionProvider } from "./StepsCompletionContext"; // Import the provider
import './index.css';

// Only clear localStorage if no team ID exists (for fresh starts)
if (!localStorage.getItem("teamId")) {
  localStorage.clear();
}

const root = ReactDOM.createRoot(document.getElementById("root")); // Use createRoot
root.render(
  <StepsCompletionProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/teamio" element={<StreamlinedDashboard />} />
        <Route path="/teamio/dashboard" element={<StreamlinedDashboard />} />
        <Route path="/teamio/link" element={<LinkToolsPage />} />
        <Route path="/teamio/map-logins" element={<MappingLoginsPage />} />
        <Route path="/teamio/annotate-contributions" element={<AnnotateContributionsPage />} />
        <Route path="/teamio/reflections" element={<ReflectionsPage />} />
        <Route path="/teamio/auth" element={<ProveAuthPage />} />
        <Route path="/teamio/scrape-documents" element={<GoogleDocsStepper />} />
        <Route path="/teamio/results" element={<ReflectionsPage />} />
      </Routes>
    </BrowserRouter>
  </StepsCompletionProvider>
);