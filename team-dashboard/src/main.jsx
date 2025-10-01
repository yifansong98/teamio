import React from "react";
import ReactDOM from "react-dom/client"; // Import from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainDashboardPage from "./MainDashboardPage";
import LinkToolsPage from "./LinkToolsPage";
import MappingLoginsPage from "./MappingLoginsPage";
import AnnotateContributionsPage from "./AnnotateContributionsPage"; 
import ReflectionsPage from "./ReflectionsPage";
import { StepsCompletionProvider } from "./StepsCompletionContext"; // Import the provider
import './index.css';

// Clear localStorage on app initialization
localStorage.clear();

const root = ReactDOM.createRoot(document.getElementById("root")); // Use createRoot
root.render(
  <StepsCompletionProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/teamio" element={<MainDashboardPage />} />
        <Route path="/teamio/link" element={<LinkToolsPage />} />
        <Route path="/teamio/mapping" element={<MappingLoginsPage />} />
        <Route path="/teamio/annotation" element={<AnnotateContributionsPage />} />
        <Route path="/teamio/reflections" element={<ReflectionsPage />} />
      </Routes>
    </BrowserRouter>
  </StepsCompletionProvider>
);