// src/ContractPages/Visualizations/WorkNorms/DoubleCommentSankey.js
import React, { useState } from 'react';
import SankeyChart from './SankeyChart';

/* ---------------- helper: coloured legend item ---------------- */
function LegendItem({ colour, label, isYou }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginRight: 18 }}>
      <span
        style={{
          width: 14,
          height: 14,
          background: colour,
          display: 'inline-block',
          marginRight: 6,
          borderRadius: 2,
        }}
      />
      <span style={{ fontSize: 14, fontWeight: isYou ? 'bold' : 'normal' }}>
        {label}
      </span>
    </div>
  );
}

export default function DoubleCommentSankey() {
  /* ------------ fake link data (unchanged) ------------ */
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

  /* ------------ state ------------ */
  const [activeTab, setActiveTab] = useState('google'); // google | github
  const [showMyData, setShowMyData] = useState(false);

  const rawLinks =
    activeTab === 'google' ? googleDocsRawLinks : gitHubRawLinks;

  /* ------------ current‑user info ------------ */
  const storedId = localStorage.getItem('TeamIO_CurrentUserId') || '1'; // '1'..'4'
  const currentIdx = parseInt(storedId, 10) - 1;                      // 0‑based
  const currentLeft  = currentIdx;        // node 0‑3
  const currentRight = currentIdx + 4;    // node 4‑7

  /* ------------ colours & labels ------------ */
  const memberColours = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const baseLabels    = ['Member 1', 'Member 2', 'Member 3', 'Member 4'];

  return (
    <div style={{ textAlign: 'center' }}>
      {/* -------- Tabs -------- */}
      <div style={{ marginBottom: '1rem' }}>
        {['google', 'github'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              marginRight: tab === 'google' ? '1rem' : 0,
              background: activeTab === tab ? '#3182ce' : '#ccc',
              color: activeTab === tab ? '#fff' : '#000',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {tab === 'google' ? 'Google Docs (Comments)' : 'GitHub (Pull Request Reviews)'}
          </button>
        ))}
      </div>

      {/* -------- Chart -------- */}
      <SankeyChart
        width={500}
        height={350}
        rawLinks={rawLinks}
        showMyData={showMyData}
        currentUserLeftIndex={currentLeft}
        currentUserRightIndex={currentRight}
      />

      {/* -------- Show‑my‑data -------- */}
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 15 }}>
          <input
            type="checkbox"
            checked={showMyData}
            onChange={() => setShowMyData(!showMyData)}
            style={{ marginRight: 6 }}
          />
          Show my data
        </label>
      </div>

      {/* -------- Legend -------- */}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {baseLabels.map((lbl, idx) => {
          const isYou = idx === currentIdx && showMyData;
          const labelText = isYou ? `${lbl} (You)` : lbl;
          return (
            <LegendItem
              key={idx}
              colour={memberColours[idx]}
              label={labelText}
              isYou={isYou}
            />
          );
        })}
      </div>

    </div>
  );
}
