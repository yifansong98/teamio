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

const currentUser = "Member 1";

// We build a function that given an array of {day, count} for the team
// and an array of {day, count} for the user, we produce a list of
// objects like: { day: "2025-03-01", teamProgress, userProgress, teamCount, userCount }
function buildUnifiedLineData(teamArray, userArray) {
  // Sort both arrays by day, just in case
  const sortedTeam = [...teamArray].sort((a, b) => (a.day > b.day ? 1 : -1));
  const sortedUser = [...userArray].sort((a, b) => (a.day > b.day ? 1 : -1));

  // We need a dictionary for user by day
  const userMap = {};
  sortedUser.forEach(item => {
    userMap[item.day] = item.count;
  });

  // We'll accumulate day by day
  let teamCumulative = 0;
  let userCumulative = 0;
  let totalTeam = sortedTeam.reduce((sum, x) => sum + x.count, 0);

  const result = [];
  for (let i = 0; i < sortedTeam.length; i++) {
    const tItem = sortedTeam[i];
    const day = tItem.day;
    teamCumulative += tItem.count;
    const userVal = userMap[day] ? userMap[day] : 0;
    userCumulative += userVal;

    let teamPct = 0;
    let userPct = 0;
    if (totalTeam > 0) {
      teamPct = (teamCumulative / totalTeam) * 100;
      userPct = (userCumulative / totalTeam) * 100;
    }

    result.push({
      day, // e.g. "2025-03-01"
      teamProgress: +teamPct.toFixed(2),
      userProgress: +userPct.toFixed(2),
      teamCount: teamCumulative,
      userCount: userCumulative,
    });
  }
  return result;
}

function customTooltipFormatter(value, name, props) {
  const dayObj = props.payload;
  if (name === 'Team progress') {
    return [`${dayObj.teamCount} contributions`, name];
  } else {
    return [`${dayObj.userCount} contributions`, name];
  }
}

export default function WorkTimelineCharts() {
  // Tab: 'google' or 'github'
  const [activeTab, setActiveTab] = useState('google');
  // Show my data => user line
  const [showMyData, setShowMyData] = useState(false);

  // We'll read from localStorage => timeline.google_docs / timeline.github
  let googleTeam = [];
  let googleUser = [];
  let githubTeam = [];
  let githubUser = [];

  const raw = localStorage.getItem('TeamIO_ProcessedData');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.timeline) {
        // google docs
        if (parsed.timeline.google_docs && parsed.timeline.google_docs.team) {
          // e.g. [ {day, count}, ... ]
          googleTeam = parsed.timeline.google_docs.team;
        }
        if (parsed.timeline.google_docs && parsed.timeline.google_docs.userMap) {
          // we assume currentUser = "Member 1"
          googleUser = parsed.timeline.google_docs.userMap[currentUser] || [];
        }
        // github
        if (parsed.timeline.github && parsed.timeline.github.team) {
          githubTeam = parsed.timeline.github.team;
        }
        if (parsed.timeline.github && parsed.timeline.github.userMap) {
          githubUser = parsed.timeline.github.userMap[currentUser] || [];
        }
      }
    } catch (err) {
      console.warn('Failed to parse timeline data from localStorage', err);
    }
  }

  // Build line data for google & github
  const googleLineData = buildUnifiedLineData(googleTeam, googleUser);
  const githubLineData = buildUnifiedLineData(githubTeam, githubUser);

  const lineData = (activeTab === 'google') ? googleLineData : githubLineData;

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

      <LineChart
        width={500}
        height={300}
        data={lineData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        {/* X-axis with actual date strings from "day" */}
        <XAxis dataKey="day" />
        {/* Y-axis domain 0..100% */}
        <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
        <Tooltip formatter={customTooltipFormatter} />
        <Legend />
        {/* Team progress line */}
        <Line
          type="monotone"
          dataKey="teamProgress"
          name="Team progress"
          stroke="#8884d8"
          strokeWidth={2}
        />
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
