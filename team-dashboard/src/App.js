// src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import DashboardRoutes from './pages/DashboardRoutes';
import './App.css'; // Optional global styles

function App() {
  return (
    <Router>
      <div className="App">
        <DashboardRoutes />
      </div>
    </Router>
  );
}

export default App;
