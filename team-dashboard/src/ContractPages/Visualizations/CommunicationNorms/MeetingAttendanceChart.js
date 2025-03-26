// src/ContractPages/Visualizations/CommunicationNorms/MeetingAttendanceChart.js
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

/**
 * Data Format (dummy example):
 * [
 *   { meeting: 'Meeting 1', onTime: 2, late: 1, missing: 1, userStatus: 'onTime' },
 *   { meeting: 'Meeting 2', onTime: 1, late: 2, missing: 1, userStatus: 'late' },
 *   ...
 * ]
 * userStatus => which category the current user belongs to, for "Show my data" highlight
 */

const dummyData = [
  { meeting: 'Meeting 1', onTime: 2, late: 1, missing: 1, userStatus: 'onTime' },
  { meeting: 'Meeting 2', onTime: 1, late: 2, missing: 1, userStatus: 'late' },
  { meeting: 'Meeting 3', onTime: 3, late: 0, missing: 1, userStatus: 'missing' },
  { meeting: 'Meeting 4', onTime: 2, late: 2, missing: 0, userStatus: 'late' },
];

export default function MeetingAttendanceChart() {
  // In practice, you might pass in real data as props or from parent state
  const [data] = useState(dummyData);

  // "Show my data" => highlight the user segment for each bar
  const [showMyData, setShowMyData] = useState(false);

  // Colors for each category
  const colorOnTime = '#82ca9d';   // green
  const colorLate   = '#ffbb28';   // yellow
  const colorMissing= '#8884d8';   // purple

  // Red stroke for highlight
  const highlightStroke = '#f44336';
  const highlightStrokeWidth = 2;

  // For each category, we define a function that returns <Cell> for each data item
  // If showMyData && userStatus= that category => highlight stroke, else normal
  function renderOnTimeCells() {
    return data.map((entry, i) => {
      const highlight = (showMyData && entry.userStatus === 'onTime');
      return (
        <Cell
          key={`onTime-${i}`}
          stroke={highlight ? highlightStroke : '#fff'}
          strokeWidth={highlight ? highlightStrokeWidth : 1}
          fill={colorOnTime}
        />
      );
    });
  }
  function renderLateCells() {
    return data.map((entry, i) => {
      const highlight = (showMyData && entry.userStatus === 'late');
      return (
        <Cell
          key={`late-${i}`}
          stroke={highlight ? highlightStroke : '#fff'}
          strokeWidth={highlight ? highlightStrokeWidth : 1}
          fill={colorLate}
        />
      );
    });
  }
  function renderMissingCells() {
    return data.map((entry, i) => {
      const highlight = (showMyData && entry.userStatus === 'missing');
      return (
        <Cell
          key={`missing-${i}`}
          stroke={highlight ? highlightStroke : '#fff'}
          strokeWidth={highlight ? highlightStrokeWidth : 1}
          fill={colorMissing}
        />
      );
    });
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* <h3 style={{ marginBottom: '1rem' }}>Meeting Attendance &amp; Punctuality</h3> */}

      {/* Horizontal Stacked Bar Chart (layout="vertical") */}
      <BarChart
        width={600}
        height={300}
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis dataKey="meeting" type="category" />
        <XAxis type="number" domain={[0, 4]} />
        <Tooltip />
        <Legend />

        {/* Each bar segment has a fill for the legend color, and uses <Cell> for per-entry logic */}
        <Bar dataKey="onTime" stackId="a" name="On-Time" fill={colorOnTime} isAnimationActive={false}>
          {renderOnTimeCells()}
        </Bar>
        <Bar dataKey="late"   stackId="a" name="Late"    fill={colorLate}   isAnimationActive={false}>
          {renderLateCells()}
        </Bar>
        <Bar dataKey="missing"stackId="a" name="Missing" fill={colorMissing}isAnimationActive={false}>
          {renderMissingCells()}
        </Bar>
      </BarChart>

      {/* "Show my data" below the chart */}
      <div style={{ marginTop: '1rem' }}>
        <label style={{ fontSize: '1rem', color: '#333' }}>
          <input
            type="checkbox"
            checked={showMyData}
            onChange={(e) => setShowMyData(e.target.checked)}
            style={{ marginRight: '0.5rem' }}
          />
          Show my data
        </label>
      </div>
    </div>
  );
}
