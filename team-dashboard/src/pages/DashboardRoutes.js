// src/pages/DashboardRoutes.js (example)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProgressTypes from '../components/ProgressTypes/ProgressTypes';
import WorkDistribution from './WorkDistribution/WorkDistribution';
import WorkProgression from './WorkProgression/WorkProgression';
import Communication from './Communication/Communication';
import TeamContract from './TeamContract/TeamContract'; // import new page

export default function DashboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProgressTypes />} />
      <Route path="/workDistribution" element={<WorkDistribution />} />
      <Route path="/workProgression" element={<WorkProgression />} />
      <Route path="/communication" element={<Communication />} />
      <Route path="/teamContract" element={<TeamContract />} /> {/* new route */}
    </Routes>
  );
}
