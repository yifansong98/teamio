// src/ContractPages/Visualizations/WorkNorms/WorkTimelineCharts.js
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Google Docs "Edits" (Team & User)
const GD_EDITS_TEAM_RAW = [10, 20, 15, 30, 25, 20, 10]; // sum=130
const GD_EDITS_USER_RAW = [2, 5, 3, 8, 6, 4, 1];        // sum=29

// GitHub "Commits" (Team & User)
const GH_COMMITS_TEAM_RAW = [5, 10, 8, 12, 10, 15, 10]; // sum=70
const GH_COMMITS_USER_RAW = [1, 2, 2, 3, 2, 4, 1];      // sum=15

// We unify the scale so 100% always = team's final total.
// For day i, the "Team progress" = (teamCumulative / teamTotal) * 100
// The "User progress" = (userCumulative / teamTotal) * 100

function buildUnifiedLineData(teamDaily, userDaily) {
  // 1) Calculate team total
  const teamTotal = teamDaily.reduce((sum, val) => sum + val, 0);

  // 2) Build an array of length N for each day
  let teamCumulative = 0;
  let userCumulative = 0;

  return teamDaily.map((teamVal, i) => {
    // for each day i
    teamCumulative += teamVal;
    userCumulative += userDaily[i];

    const teamPct = (teamCumulative / teamTotal) * 100;
    const userPct = (userCumulative / teamTotal) * 100; 
    // userPct might be less or equal to teamPct 
    // if user's total is a subset of the team's total

    return {
      day: `Day ${i + 1}`,
      teamProgress: +teamPct.toFixed(2),
      userProgress: +userPct.toFixed(2),
      teamCount: teamCumulative,
      userCount: userCumulative,
    };
  });
}

// Build the "Google Docs" unified data
const googleEditsLineData = buildUnifiedLineData(GD_EDITS_TEAM_RAW, GD_EDITS_USER_RAW);

// Build the "GitHub" unified data
const githubCommitsLineData = buildUnifiedLineData(GH_COMMITS_TEAM_RAW, GH_COMMITS_USER_RAW);

// For the tooltip, we can show the day, team’s cumulative, user’s cumulative, etc.
function customTooltipFormatter(value, name, props) {
  // We'll rely on the data itself to figure out if it's teamProgress or userProgress
  // e.g. props.dataKey = "teamProgress" or "userProgress"
  // The data object is in props.payload
  const dayObj = props.payload;
  if (name === 'Team progress') {
    // dayObj.teamCount => the team cumulative at that day
    return [`${dayObj.teamCount} contributions`, name];
  } else {
    // dayObj.userCount => the user cumulative
    return [`${dayObj.userCount} contributions`, name];
  }
}

export default function WorkTimelineCharts() {
  // Tab: 'google' or 'github'
  const [activeTab, setActiveTab] = useState('google');
  // Show my data => user line
  const [showMyData, setShowMyData] = useState(false);

  // pick the correct line data
  const lineData = (activeTab === 'google') ? googleEditsLineData : githubCommitsLineData;

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Tabs for Google Docs vs GitHub */}
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
          Google Docs (Edits)
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

      {/* Single line chart for whichever tab is active */}
      <LineChart
        width={500}
        height={300}
        data={lineData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        {/* Domain 0..100% */}
        <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
        <Tooltip formatter={customTooltipFormatter} />
        <Legend />
        {/* Team line => "teamProgress" */}
        <Line
          type="monotone"
          dataKey="teamProgress"
          name="Team progress"
          stroke="#8884d8"
          strokeWidth={2}
        />
        {/* user line => "userProgress", only if showMyData */}
        {showMyData && (
          <Line
            type="monotone"
            dataKey="userProgress"
            name="My progress"
            stroke="#82ca9d"
            strokeWidth={2}
          />
        )}
      </LineChart>

      {/* "Show my data" below the chart */}
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
