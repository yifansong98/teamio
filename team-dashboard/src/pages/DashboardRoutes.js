// src/pages/DashboardRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import the landing or home page:
import ProgressTypes from '../components/ProgressTypes/ProgressTypes';
// Import the WorkDistribution page
import WorkDistribution from './WorkDistribution/WorkDistribution';
import Communication from './Communication/Communication';
import WorkProgression from './WorkProgression/WorkProgression';

//defining paths and associated components
function DashboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProgressTypes />} />
      <Route path="/workDistribution" element={<WorkDistribution />} />
      <Route path="/communication" element={<Communication/>} />
      <Route path="/workProgression" element={<WorkProgression />} />
    </Routes>
  );
}

export default DashboardRoutes;
