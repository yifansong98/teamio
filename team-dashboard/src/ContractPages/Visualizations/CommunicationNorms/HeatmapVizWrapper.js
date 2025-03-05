// src/ContractPages/Visualizations/CommunicationNorms/HeatmapVizWrapper.js
import React, { useState } from 'react';
import CommunicationHeatmap from './CommunicationHeatmap';

export default function HeatmapVizWrapper() {
  // For heatmap: "conversations" or "feedback"
  const [selectedMode, setSelectedMode] = useState('conversations');
  const [showMyData, setShowMyData] = useState(false);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ marginRight: '0.5rem' }}>View:</label>
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
        >
          <option value="conversations">Conversations</option>
          <option value="feedback">Feedback</option>
        </select>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={showMyData}
            onChange={() => setShowMyData(!showMyData)}
            style={{ marginRight: '0.3rem' }}
          />
          Show my data
        </label>
      </div>

      {/* The actual chart */}
      <div style={{ marginTop: '1rem' }}>
        <CommunicationHeatmap mode={selectedMode} showMyData={showMyData} />
      </div>
    </div>
  );
}
