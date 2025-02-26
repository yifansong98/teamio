// src/ContractPages/Visualizations/CommunicationPanel.js
import React, { useState } from 'react';
import CommunicationBar from './CommunicationBar';
import CommunicationHeatmap from './CommunicationHeatmap';

export default function CommunicationPanel() {
  const [activePanel, setActivePanel] = useState('bar');
  const [showMyData, setShowMyData] = useState(false);
  const [selectedOption, setSelectedOption] = useState('messages');

  // Update panel and set default dropdown value based on panel
  const handlePanelChange = (panel) => {
    setActivePanel(panel);
    if (panel === 'bar') {
      setSelectedOption('messages');
    } else if (panel === 'heatmap') {
      setSelectedOption('conversations');
    }
  };

  // Define dropdown options based on the active panel
  const dropdownOptions =
    activePanel === 'bar'
      ? [
          { value: 'messages', label: '# of messages' },
          { value: 'words', label: '# of words' },
        ]
      : [
          { value: 'conversations', label: 'Conversations' },
          { value: 'feedback', label: 'Feedback' },
        ];

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
      </div>

      {/* Dropdown Menu (always visible, but options change based on active panel) */}
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
      {activePanel === 'bar' ? (
        <CommunicationBar showMyData={showMyData} mode={selectedOption} />
      ) : (
        <CommunicationHeatmap showMyData={showMyData} mode={selectedOption} />
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
