// src/HomePage/DashboardRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Home Page
import ProgressTypes from './ProgressTypes/ProgressTypes';
import ProfileSetting from './ProfileSetting/ProfileSetting';

// Behavior Pages
import Communication from '../BehaviorPages/Communication/Communication';
import WorkDistribution from '../BehaviorPages/WorkDistribution/WorkDistribution';
import WorkProgression from '../BehaviorPages/WorkProgression/WorkProgression';

// Contract Pages
import TeamContract from '../ContractPages/TeamContract/TeamContract';
import ContractReflection from '../ContractPages/ContractReflection/ContractReflection';

export default function DashboardRoutes() {
  return (
    <Routes>
      {/* Home Page */}
      <Route path="/teamio" element={<ProgressTypes />} />
      <Route path="/profileSetting" element={<ProfileSetting/>} />

      {/* Behavior Pages */}
      <Route path="/communication" element={<Communication />} />
      <Route path="/workDistribution" element={<WorkDistribution />} />
      <Route path="/workProgression" element={<WorkProgression />} />

      {/* Contract Pages */}
      <Route path="/teamContract" element={<TeamContract />} />
      <Route path="/contractReflection" element={<ContractReflection />} />
    </Routes>
  );
}
