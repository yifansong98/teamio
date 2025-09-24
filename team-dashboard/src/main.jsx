import React from "react";
import ReactDOM from "react-dom/client"; // Import from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LinkToolsPage from "./LinkToolsPage";
import MappingLoginsPage from "./MappingLoginsPage";
import AnnotateContributionsPage from "./AnnotateContributionsPage"; 
import ReflectionsPage from "./ReflectionsPage";
import './index.css';

const root = ReactDOM.createRoot(document.getElementById("root")); // Use createRoot
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/teamio" element={<LinkToolsPage />} />
      <Route path="/teamio/mapping" element={<MappingLoginsPage />} />
      <Route path="/teamio/annotation" element={<AnnotateContributionsPage />} />
      <Route path="/teamio/reflections" element={<ReflectionsPage />} />
    </Routes>
  </BrowserRouter>
);