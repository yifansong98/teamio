// src/ContractPages/Visualizations/CommunicationPanel.js
import React, { useState } from 'react';
import CommunicationBar from './CommunicationBar';
import CommunicationHeatmap from './CommunicationHeatmap';
import CommunicationTimeChart from './CommunicationTimeChart';

export default function CommunicationPanel() {
  // activePanel: 'bar', 'heatmap', or 'time'
  const [activePanel, setActivePanel] = useState('bar');
  const [showMyData, setShowMyData] = useState(false);
  // Dropdown selection: 
  // For 'bar': "messages" or "words"
  // For 'heatmap': "conversations" or "feedback"
  // For 'time': "response" or "turnaround"
  const [selectedOption, setSelectedOption] = useState('messages');

  const handlePanelChange = (panel) => {
    setActivePanel(panel);
    if (panel === 'bar') {
      setSelectedOption('messages');
    } else if (panel === 'heatmap') {
      setSelectedOption('conversations');
    } else if (panel === 'time') {
      setSelectedOption('response');
    }
  };

  let dropdownOptions = [];
  if (activePanel === 'bar') {
    dropdownOptions = [
      { value: 'messages', label: '# of messages' },
      { value: 'words', label: '# of words' },
    ];
  } else if (activePanel === 'heatmap') {
    dropdownOptions = [
      { value: 'conversations', label: 'Conversations' },
      { value: 'feedback', label: 'Feedback' },
    ];
  } else if (activePanel === 'time') {
    dropdownOptions = [
      { value: 'response', label: 'Conversation Response' },
      { value: 'turnaround', label: 'Feedback Turnaround' },
    ];
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Panel Switch Buttons */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => handlePanelChange('bar')}
          style={{
            marginRight: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: 'none',
            background: activePanel === 'bar' ? '#3182ce' : '#ccc',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Bar Chart
        </button>
        <button
          onClick={() => handlePanelChange('heatmap')}
          style={{
            marginRight: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: 'none',
            background: activePanel === 'heatmap' ? '#3182ce' : '#ccc',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Heatmap
        </button>
        <button
          onClick={() => handlePanelChange('time')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: 'none',
            background: activePanel === 'time' ? '#3182ce' : '#ccc',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Time Chart
        </button>
      </div>

      {/* Dropdown Menu (visible for bar, heatmap, and time panels) */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '0.5rem', fontSize: '1rem', color: '#333' }}>
          View:
        </label>
        <select
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
          style={{ fontSize: '1rem', padding: '0.3rem' }}
        >
          {dropdownOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Render the selected panel */}
      {activePanel === 'bar' && (
        <CommunicationBar showMyData={showMyData} mode={selectedOption} />
      )}
      {activePanel === 'heatmap' && (
        <CommunicationHeatmap showMyData={showMyData} mode={selectedOption} />
      )}
      {activePanel === 'time' && (
        <CommunicationTimeChart showMyData={showMyData} mode={selectedOption} />
      )}

      {/* Shared "Show my data" Checkbox */}
      <div style={{ marginTop: '1rem' }}>
        <label style={{ fontSize: '1rem', color: '#333' }}>
          <input
            type="checkbox"
            checked={showMyData}
            onChange={() => setShowMyData(!showMyData)}
            style={{ marginRight: '0.5rem' }}
          />
          Show my data
        </label>
      </div>
    </div>
  );
}
