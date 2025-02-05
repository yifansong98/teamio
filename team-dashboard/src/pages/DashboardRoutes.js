// src/pages/DashboardRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import the “home” or “landing” page:
import ProgressTypes from '../components/ProgressTypes/ProgressTypes';
// Import the Work Distribution “page”
import WorkDistribution from './WorkDistribution/WorkDistribution';

function DashboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProgressTypes />} />
      <Route path="/workDistribution" element={<WorkDistribution />} />
    </Routes>
  );
}

export default DashboardRoutes;
