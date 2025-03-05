// src/ContractPages/Visualizations/WorkNorms/WorkPieCharts.js
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const currentUser = "Member 3";

// Dummy data for Google Docs
const googleDocsEditsData = [
  { name: 'Member 1', value: 40 },
  { name: 'Member 2', value: 35 },
  { name: 'Member 3', value: 25 },
  { name: 'Member 4', value: 15 },
];
const googleDocsWordsData = [
  { name: 'Member 1', value: 420 },
  { name: 'Member 2', value: 320 },
  { name: 'Member 3', value: 280 },
  { name: 'Member 4', value: 180 },
];

// Dummy data for GitHub
const githubCommitsData = [
  { name: 'Member 1', value: 20 },
  { name: 'Member 2', value: 30 },
  { name: 'Member 3', value: 15 },
  { name: 'Member 4', value: 25 },
];
const githubLOCData = [
  { name: 'Member 1', value: 210 },
  { name: 'Member 2', value: 340 },
  { name: 'Member 3', value: 170 },
  { name: 'Member 4', value: 260 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const HIGHLIGHT_STROKE = '#000'; // black stroke for current user

// A label function to show percentages on each slice
const renderPercentageLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#000"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="12px"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// A custom legend to bold the current user's label if "Show my data" is checked
// and display the items horizontally with wrapping.
function CustomLegend({ payload, showMyData }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',       // allow items to wrap to a new line if needed
        gap: '1rem',
        justifyContent: 'center',
        margin: '0 auto',
      }}
    >
      {payload.map((entry, index) => {
        const isCurrent = showMyData && entry.value === currentUser;
        return (
          <div
            key={`item-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: isCurrent ? 'bold' : 'normal',
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                backgroundColor: entry.color,
                marginRight: 8,
              }}
            />
            {entry.value}
          </div>
        );
      })}
    </div>
  );
}

export default function WorkPieCharts() {
  // Local dropdown states for each chart
  const [googleOption, setGoogleOption] = useState('edits');  // 'edits' or 'words'
  const [githubOption, setGithubOption] = useState('commits'); // 'commits' or 'loc'
  // "Show my data" for highlighting current user
  const [showMyData, setShowMyData] = useState(false);

  // Choose data based on dropdown
  const googleData = googleOption === 'edits' ? googleDocsEditsData : googleDocsWordsData;
  const githubData = githubOption === 'commits' ? githubCommitsData : githubLOCData;

  // Render each slice with a thicker black border if it's the current user and showMyData is true
  const renderCell = (entry, index) => {
    const isCurrent = showMyData && entry.name === currentUser;
    return (
      <Cell
        key={`cell-${index}`}
        fill={COLORS[index % COLORS.length]}
        stroke={isCurrent ? HIGHLIGHT_STROKE : "#fff"}
        strokeWidth={isCurrent ? 3 : 1}
      />
    );
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Container for the two charts side by side */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'flex-start',
          marginBottom: '1rem',
        }}
      >
        {/* Left Column: Google Docs */}
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>Google Docs</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '0.5rem', fontSize: '1rem' }}>View:</label>
            <select
              value={googleOption}
              onChange={(e) => setGoogleOption(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.3rem' }}
            >
              <option value="edits">Edits</option>
              <option value="words">Words</option>
            </select>
          </div>
          <PieChart width={320} height={320}>
            <Pie
              data={googleData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={renderPercentageLabel}
            >
              {googleData.map((entry, index) => renderCell(entry, index))}
            </Pie>
            <Tooltip formatter={(value) => `${value}`} />
            <Legend content={<CustomLegend showMyData={showMyData} />} />
          </PieChart>
        </div>

        {/* Right Column: GitHub */}
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>GitHub</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '0.5rem', fontSize: '1rem' }}>View:</label>
            <select
              value={githubOption}
              onChange={(e) => setGithubOption(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.3rem' }}
            >
              <option value="commits">Commits</option>
              <option value="loc">Lines of Code</option>
            </select>
          </div>
          <PieChart width={320} height={320}>
            <Pie
              data={githubData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={renderPercentageLabel}
            >
              {githubData.map((entry, index) => renderCell(entry, index))}
            </Pie>
            <Tooltip formatter={(value) => `${value}`} />
            <Legend content={<CustomLegend showMyData={showMyData} />} />
          </PieChart>
        </div>
      </div>

      {/* Show my data checkbox below the charts */}
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
