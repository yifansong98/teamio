// src/ContractPages/Visualizations/CommunicationNorms/BarVizWrapper.js
import React, { useState } from 'react';
import CommunicationBar from './CommunicationBar';

export default function BarVizWrapper() {
  // For bar chart: "messages" or "words"
  const [selectedMode, setSelectedMode] = useState('messages');
  const [showMyData, setShowMyData] = useState(false);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ marginRight: '0.5rem' }}>View:</label>
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
        >
          <option value="messages"># of messages</option>
          <option value="words"># of words</option>
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
        <CommunicationBar mode={selectedMode} showMyData={showMyData} />
      </div>
    </div>
  );
}
