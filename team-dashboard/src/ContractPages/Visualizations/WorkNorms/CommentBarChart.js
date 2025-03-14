// src/ContractPages/Visualizations/WorkNorms/CommentBarChart.js
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

/**
 * A custom legend that displays each team member horizontally.
 * - data: the array of { name, comments/words } for each member
 * - showMyData: boolean controlling highlight
 * - currentUser: e.g. "Member 3"
 * - colorMap: function that returns the color for a given index
 */
function CustomLegend({ data, showMyData, currentUser, colorMap }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'center',
        marginTop: '0.5rem',
      }}
    >
      {data.map((entry, index) => {
        const isCurrent = showMyData && entry.name === currentUser;
        const color = colorMap(index);
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: isCurrent ? 'bold' : 'normal',
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: color,
                marginRight: 6,
              }}
            />
            {entry.name}
          </div>
        );
      })}
    </div>
  );
}

export default function CommentBarChart() {
  const currentUser = "Member 3"; // The user who sees the highlight

  // --- DUMMY DATA ---

  // Google Docs
  const googleCommentsData = [
    { name: 'Member 1', comments: 25 },
    { name: 'Member 2', comments: 30 },
    { name: 'Member 3', comments: 15 },
    { name: 'Member 4', comments: 20 },
  ];
  const googleWordsData = [
    { name: 'Member 1', words: 250 },
    { name: 'Member 2', words: 320 },
    { name: 'Member 3', words: 150 },
    { name: 'Member 4', words: 200 },
  ];

  // GitHub
  const githubCommentsData = [
    { name: 'Member 1', comments: 20 },
    { name: 'Member 2', comments: 35 },
    { name: 'Member 3', comments: 10 },
    { name: 'Member 4', comments: 25 },
  ];
  const githubWordsData = [
    { name: 'Member 1', words: 200 },
    { name: 'Member 2', words: 310 },
    { name: 'Member 3', words: 120 },
    { name: 'Member 4', words: 220 },
  ];

  // For each chart, we have a dropdown that can be either "comments" or "words"
  const [googleOption, setGoogleOption] = useState('comments'); // "comments" or "words"
  const [githubOption, setGithubOption] = useState('comments'); // "comments" or "words"

  // The global "Show my data" checkbox
  const [showMyData, setShowMyData] = useState(false);

  // Determine the data and dataKey for each chart
  const googleData = googleOption === 'comments' ? googleCommentsData : googleWordsData;
  const googleDataKey = googleOption; // either "comments" or "words"

  const githubData = githubOption === 'comments' ? githubCommentsData : githubWordsData;
  const githubDataKey = githubOption; // either "comments" or "words"

  // Colors for up to 4 members
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // A helper to get the color for a given index
  const colorMap = (index) => COLORS[index % COLORS.length];

  // The cell renderer for each bar
  const renderCell = (entry, index) => {
    const isCurrent = showMyData && entry.name === currentUser;
    return (
      <Cell
        key={`cell-${index}`}
        fill={colorMap(index)}
        stroke={isCurrent ? "#000" : "#fff"}
        strokeWidth={isCurrent ? 3 : 1}
      />
    );
  };

  // We'll define a small reusable bar chart component for each tool
  const BarChartForTool = ({ data, dataKey, toolName, option, setOption }) => {
    return (
      <div style={{ textAlign: 'center' }}>
        <h3>{toolName}</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ marginRight: '0.5rem', fontSize: '1rem' }}>View:</label>
          <select
            value={option}
            onChange={(e) => setOption(e.target.value)}
            style={{ fontSize: '1rem', padding: '0.3rem' }}
          >
            <option value="comments"># of Comments</option>
            <option value="words"># of Words</option>
          </select>
        </div>

        <BarChart
          width={300}
          height={300}
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            label={{
              value: dataKey === 'comments' ? "# of Comments" : "# of Words",
              angle: -90,
              position: 'insideLeft',
            }}
          />
          <Tooltip formatter={(value) => value} />
          {/* We'll do a custom legend here */}
          <Bar dataKey={dataKey}>
            {data.map((entry, index) => renderCell(entry, index))}
          </Bar>
        </BarChart>

        {/* Our custom legend, matching the bar colors and highlight logic */}
        <CustomLegend
          data={data}
          showMyData={showMyData}
          currentUser={currentUser}
          colorMap={colorMap}
        />
      </div>
    );
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Container for the two bar charts side by side */}
      <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-start', marginBottom: '1rem' }}>
        {/* Google Docs */}
        <BarChartForTool
          data={googleData}
          dataKey={googleDataKey}
          toolName="Google Docs"
          option={googleOption}
          setOption={setGoogleOption}
        />
        {/* GitHub */}
        <BarChartForTool
          data={githubData}
          dataKey={githubDataKey}
          toolName="GitHub"
          option={githubOption}
          setOption={setGithubOption}
        />
      </div>

      {/* Global "Show my data" checkbox */}
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
