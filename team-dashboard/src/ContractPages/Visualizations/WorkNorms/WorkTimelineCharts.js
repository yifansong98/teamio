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

/* 
  -----------------------
    Raw Daily Data
  -----------------------
  Each array has 7 values for days 1..7.
  We'll transform them into cumulative ratio (0..100%) plus a cumulative count.
*/

// Google Docs "Edits" (Team & User)
const GD_EDITS_TEAM_RAW = [10, 20, 15, 30, 25, 20, 10]; // sum=130
const GD_EDITS_USER_RAW = [2, 5, 3, 8, 6, 4, 1];        // sum=29

// Google Docs "Words" (Team & User)
const GD_WORDS_TEAM_RAW = [100, 120, 80, 130, 90, 110, 70]; // sum=700
const GD_WORDS_USER_RAW = [25, 30, 20, 32, 22, 28, 18];     // sum=175

// GitHub "Commits" (Team & User)
const GH_COMMITS_TEAM_RAW = [5, 10, 8, 12, 10, 15, 10]; // sum=70
const GH_COMMITS_USER_RAW = [1, 2, 2, 3, 2, 4, 1];      // sum=15

// GitHub "Lines of Code" (Team & User)
const GH_LOC_TEAM_RAW = [150, 180, 120, 200, 160, 190, 100]; // sum=1100
const GH_LOC_USER_RAW = [35, 40, 25, 48, 38, 45, 22];        // sum=253

// A function to transform daily raw data -> cumulative ratio data
// Return an array of { day: "Day i", progress: <0..100>, count: <cumulative> }.
function transformDailyRawToLineData(dailyRaw) {
  const total = dailyRaw.reduce((sum, val) => sum + val, 0);
  let cumulative = 0;
  return dailyRaw.map((val, i) => {
    cumulative += val;
    const progress = (cumulative / total) * 100; // 0..100
    return {
      day: `Day ${i + 1}`,
      progress: +progress.toFixed(2), // store up to 2 decimals if you like
      count: cumulative,
    };
  });
}

// We'll define a dictionary to pick the correct raw arrays
// for each combination of tool + metric.
const googleDocsDataMap = {
  edits: {
    teamRaw: GD_EDITS_TEAM_RAW,
    userRaw: GD_EDITS_USER_RAW,
  },
  words: {
    teamRaw: GD_WORDS_TEAM_RAW,
    userRaw: GD_WORDS_USER_RAW,
  },
};

const githubDataMap = {
  commits: {
    teamRaw: GH_COMMITS_TEAM_RAW,
    userRaw: GH_COMMITS_USER_RAW,
  },
  loc: {
    teamRaw: GH_LOC_TEAM_RAW,
    userRaw: GH_LOC_USER_RAW,
  },
};

export default function WorkTimelineCharts() {
  // local dropdown states
  const [googleOption, setGoogleOption] = useState('edits');   // 'edits' or 'words'
  const [githubOption, setGithubOption] = useState('commits'); // 'commits' or 'loc'
  // show my data
  const [showMyData, setShowMyData] = useState(false);

  // Transform the daily raw arrays into cumulative ratio arrays
  const googleTeamLineData = transformDailyRawToLineData(googleDocsDataMap[googleOption].teamRaw);
  const googleUserLineData = transformDailyRawToLineData(googleDocsDataMap[googleOption].userRaw);

  const githubTeamLineData = transformDailyRawToLineData(githubDataMap[githubOption].teamRaw);
  const githubUserLineData = transformDailyRawToLineData(githubDataMap[githubOption].userRaw);

  // A tooltip formatter that shows "X contributions"
  const tooltipFormatter = (value, name, props) => {
    // 'value' is the 'progress' (0..100)
    // 'props.payload.count' is the cumulative count for that day
    return [`${props.payload.count} contributions`, name];
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Container for the two timeline charts side by side */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'flex-start',
          marginBottom: '1rem',
        }}
      >
        {/* Google Docs timeline */}
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>Google Docs</h3>
          <div style={{ marginBottom: '0.5rem' }}>
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
          <LineChart
            width={400}
            height={300}
            data={googleTeamLineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            {/* Team progress line (purple) */}
            <Line
              type="monotone"
              dataKey="progress"
              name="Team progress"
              stroke="#8884d8"
              strokeWidth={2}
            />
            {/* My progress line (green), only if showMyData */}
            {showMyData && (
              <Line
                type="monotone"
                data={googleUserLineData}
                dataKey="progress"
                name="My progress"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </div>

        {/* GitHub timeline */}
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>GitHub</h3>
          <div style={{ marginBottom: '0.5rem' }}>
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
          <LineChart
            width={400}
            height={300}
            data={githubTeamLineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            {/* Team progress line (purple) */}
            <Line
              type="monotone"
              dataKey="progress"
              name="Team progress"
              stroke="#8884d8"
              strokeWidth={2}
            />
            {/* My progress line (green), only if showMyData */}
            {showMyData && (
              <Line
                type="monotone"
                data={githubUserLineData}
                dataKey="progress"
                name="My progress"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            )}
          </LineChart>
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
