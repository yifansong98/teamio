// src/ContractPages/Visualizations/CommunicationNorms/TimeVizWrapper.js
import React, { useState } from 'react';
import CommunicationTimeChart from './CommunicationTimeChart';

export default function TimeVizWrapper() {
  // For time chart: "response" or "turnaround"
  const [selectedMode, setSelectedMode] = useState('response');
  const [showMyData, setShowMyData] = useState(false);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ marginRight: '0.5rem' }}>View:</label>
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
        >
          <option value="response">Conversation Response</option>
          <option value="turnaround">Feedback Turnaround</option>
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
        <CommunicationTimeChart mode={selectedMode} showMyData={showMyData} />
      </div>
    </div>
  );
}
