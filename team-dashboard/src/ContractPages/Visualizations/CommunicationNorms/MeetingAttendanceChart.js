// src/ContractPages/Visualizations/CommunicationNorms/MeetingAttendanceChart.js
import React, { useEffect, useState } from 'react';
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
 * We'll read from localStorage "TeamIO_Meetings" => an array of rows:
 * e.g. [
 *   { date, startTime, endTime, mode, isSaved, presentList:[], onTimeList:[] },
 *   ...
 * ]
 * We'll convert each row to an object: { meeting, onTime, late, missing, userStatus }
 * userStatus => 'onTime'|'late'|'missing'
 */

export default function MeetingAttendanceChart() {
  // We store the final chart data
  const [data, setData] = useState([]);
  const [showMyData, setShowMyData] = useState(false);

  // On mount, read local storage and transform
  useEffect(() => {
    // read local storage
    const raw = localStorage.getItem('TeamIO_Meetings');
    let rows = [];
    if (raw) {
      try {
        rows = JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse TeamIO_Meetings from localStorage:', err);
      }
    }
    // filter only isSaved rows
    const savedRows = rows.filter(r => r.isSaved);

    // transform
    const userId = localStorage.getItem('TeamIO_CurrentUserId') || '1';
    const userName = `Member ${userId}`;

    const finalData = savedRows.map((row, i) => {
      // we can label the meeting by date or "Meeting #"
      const dateStr = row.date || `Meeting ${i+1}`;

      const presentCount = row.presentList.length;
      // # not present => 4 - presentCount
      const missingCount = 4 - presentCount;
      const onTimeCount = row.onTimeList.length;
      const lateCount = presentCount - onTimeCount;

      // figure out userStatus
      let userStatus = 'missing';
      if (row.presentList.includes(userName)) {
        // user is present
        if (row.onTimeList.includes(userName)) {
          userStatus = 'onTime';
        } else {
          userStatus = 'late';
        }
      } else {
        userStatus = 'missing';
      }

      return {
        meeting: dateStr,
        onTime: onTimeCount,
        late: lateCount,
        missing: missingCount,
        userStatus,
      };
    });

    setData(finalData);
  }, []);

  // Colors for each category
  const colorOnTime = '#82ca9d';   // green
  const colorLate   = '#ffbb28';   // yellow
  const colorMissing= '#8884d8';   // purple

  // Red stroke for highlight
  const highlightStroke = '#f44336';
  const highlightStrokeWidth = 2;

  // For each category, we define a function that returns <Cell> for each data item
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

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p>No meeting data found. Please have the scribe enter meeting data first.</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
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
