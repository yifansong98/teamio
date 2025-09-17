import React from "react";
import ReactDOM from "react-dom/client"; // Import from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LinkToolsPage from "./LinkToolsPage";
import AttributeContributionsPage from "./AttributeContributionsPage"; 
import ReflectionsPage from "./ReflectionsPage";
import './index.css';

const root = ReactDOM.createRoot(document.getElementById("root")); // Use createRoot
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/teamio" element={<LinkToolsPage />} />
      <Route path="/teamio/attribution" element={<AttributeContributionsPage />} />
      <Route path="/teamio/reflections" element={<ReflectionsPage />} />
    </Routes>
  </BrowserRouter>
);