// src/ContractPages/Visualizations/WorkNorms/WorkPieCharts.js
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const storedId = localStorage.getItem('TeamIO_CurrentUserId') || '1';
const currentUser = `Member ${storedId}`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const HIGHLIGHT_STROKE = '#000'; // black stroke for current user

// A label function to show percentages on each slice
function renderPercentageLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
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
}

// A custom legend that bolds the current user's label if "Show my data" is checked
function CustomLegend({ payload, showMyData }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'center',
      }}
    >
      {payload.map((entry, index) => {
        const isUser = showMyData && entry.value === currentUser;
        if (isUser && entry.value === currentUser) {
          entry.value += " (You)"; // Highlight current user in legend
        }
        return (
          <div
            key={`legend-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: isUser ? 'bold' : 'normal',
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
  // Tab state: 'googleDocs' or 'github'
  const [activeTab, setActiveTab] = useState('googleDocs');
  // "Show my data" => highlight current user
  const [showMyData, setShowMyData] = useState(false);

  // We'll read from localStorage:
  // distribution.google_docs => array of {dummy_user, count}
  // distribution.github => array of {dummy_user, count}
  let dataGoogle = [];
  let dataGithub = [];

  // parse localStorage if it exists
  const raw = localStorage.getItem('TeamIO_ProcessedData');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.distribution) {
        if (Array.isArray(parsed.distribution.google_docs)) {
          dataGoogle = parsed.distribution.google_docs.map(item => ({
            name: item.dummy_user,
            value: item.count
          }));
        }
        if (Array.isArray(parsed.distribution.github)) {
          dataGithub = parsed.distribution.github.map(item => ({
            name: item.dummy_user,
            value: item.count
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to parse processed data from localStorage', err);
    }
  }

  // fallback if we have no data
  if (dataGoogle.length === 0) {
    // we either show some placeholders or empty array
    dataGoogle = [
      { name: 'Member 1', value: 0 },
    ];
  }
  if (dataGithub.length === 0) {
    dataGithub = [
      { name: 'Member 1', value: 0 },
    ];
  }

  const data = (activeTab === 'googleDocs') ? dataGoogle : dataGithub;

  // Render each slice with a thick black border if it's the current user and showMyData = true
  function renderCell(entry, index) {
    const isCurrent = showMyData && entry.name === currentUser;
    return (
      <Cell
        key={`cell-${index}`}
        fill={COLORS[index % COLORS.length]}
        // stroke={isCurrent ? HIGHLIGHT_STROKE : "#fff"}
        // strokeWidth={isCurrent ? 3 : 1}
      />
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Tabs for Google Docs vs GitHub */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('googleDocs')}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '1rem',
            backgroundColor: activeTab === 'googleDocs' ? '#3182ce' : '#ccc',
            color: activeTab === 'googleDocs' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Google Docs (edits)
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
          GitHub (Commits)
        </button>
      </div>

      {/* Single PieChart for the active tab */}
      <PieChart width={320} height={320}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="value"
          label={renderPercentageLabel}
        >
          {data.map((entry, index) => renderCell(entry, index))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            activeTab === 'googleDocs'
              ? `${value} edits`
              : `${value} commits`
          }
        />
        <Legend content={<CustomLegend showMyData={showMyData} />} />
      </PieChart>

      {/* "Show my data" below chart */}
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
