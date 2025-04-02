// src/ContractPages/Visualizations/WorkNorms/DoubleCommentSankey.js
import React, { useState } from 'react';
import SankeyChart from './SankeyChart';

/**
 * DoubleCommentSankey
 * Tab-based approach:
 *  - "Google Docs Comments"
 *  - "GitHub Pull Requests"
 * "Show my data" highlights flows if they involve the current user.
 */
export default function DoubleCommentSankey() {
  // The user to highlight => "Member 3" (left index=2, right index=6)
  const currentUserLeftIndex = 2;
  const currentUserRightIndex = 6;

  // "Show my data" toggles link highlights
  const [showMyData, setShowMyData] = useState(false);

  // Tab state: 'google' or 'github'
  const [activeTab, setActiveTab] = useState('google');

  // Two sets of raw links
  const googleDocsRawLinks = [
    { i: 0, j: 1, value: 5 },
    { i: 0, j: 2, value: 2 },
    { i: 1, j: 0, value: 3 },
    { i: 1, j: 2, value: 4 },
    { i: 2, j: 1, value: 6 },
    { i: 2, j: 3, value: 2 },
    { i: 3, j: 0, value: 1 },
    { i: 3, j: 2, value: 5 },
  ];

  const gitHubRawLinks = [
    { i: 0, j: 1, value: 10 },
    { i: 0, j: 2, value: 3 },
    { i: 1, j: 2, value: 4 },
    { i: 1, j: 3, value: 2 },
    { i: 2, j: 0, value: 2 },
    { i: 2, j: 1, value: 6 },
    { i: 2, j: 3, value: 5 },
    { i: 3, j: 2, value: 3 },
  ];

  // pick the correct rawLinks based on tab
  const rawLinks = (activeTab === 'google') ? googleDocsRawLinks : gitHubRawLinks;

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Tabs for "Google Docs Comments" vs "GitHub Pull Requests" */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('google')}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '1rem',
            backgroundColor: activeTab === 'google' ? '#3182ce' : '#ccc',
            color: activeTab === 'google' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Google Docs Comments
        </button>
        <button
          onClick={() => setActiveTab('github')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeTab === 'github' ? '#3182ce' : '#ccc',
            color: activeTab === 'github' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          GitHub Reviews
        </button>
      </div>

      {/* Single SankeyChart */}
      <SankeyChart
        width={400}
        height={350}
        rawLinks={rawLinks}
        showMyData={showMyData}
        currentUserLeftIndex={currentUserLeftIndex}
        currentUserRightIndex={currentUserRightIndex}
      />

      {/* Global "Show my data" checkbox below */}
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
