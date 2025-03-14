// src/ContractPages/Visualizations/WorkNorms/DoubleCommentSankey.js
import React, { useState } from 'react';
import SankeyChart from './SankeyChart';

/**
 * DoubleCommentSankey
 * Renders two two-column Sankey diagrams side by side:
 *   1) "Google Docs Comments"
 *   2) "GitHub Pull Requests"
 *
 * There's a global "Show my data" checkbox that highlights only the flows 
 * (NOT the node rectangles) if they involve the current user.
 */
export default function DoubleCommentSankey() {
  // The user to highlight => "Member 3" (left index=2, right index=6)
  const currentUserLeftIndex = 2;
  const currentUserRightIndex = 6;

  // "Show my data" toggles link highlights
  const [showMyData, setShowMyData] = useState(false);

  // Two sets of raw links: Google Docs, GitHub
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

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-evenly', gap: '2rem' }}>
        <div>
          {/* Title above the Sankey, centered */}
          <h3 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
            Google Docs Comments
          </h3>
          <SankeyChart
            width={400}
            height={350}
            rawLinks={googleDocsRawLinks}
            showMyData={showMyData}
            currentUserLeftIndex={currentUserLeftIndex}
            currentUserRightIndex={currentUserRightIndex}
          />
        </div>

        <div>
          {/* Title above the Sankey, centered */}
          <h3 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
            GitHub Pull Requests
          </h3>
          <SankeyChart
            width={400}
            height={350}
            rawLinks={gitHubRawLinks}
            showMyData={showMyData}
            currentUserLeftIndex={currentUserLeftIndex}
            currentUserRightIndex={currentUserRightIndex}
          />
        </div>
      </div>

      {/* Global "Show my data" checkbox below both Sankeys */}
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
