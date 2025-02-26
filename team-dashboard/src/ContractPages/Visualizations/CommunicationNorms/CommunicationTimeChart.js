// src/ContractPages/Visualizations/CommunicationTimeChart.js
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ErrorBar,
} from 'recharts';

// Dummy aggregated data for Conversation Response (in minutes)
const aggregatedResponseData = [
  { day: 'Day 1', avg: 60, errorY: [10, 10] },
  { day: 'Day 2', avg: 45, errorY: [5, 10] },
  { day: 'Day 3', avg: 55, errorY: [5, 10] },
  { day: 'Day 4', avg: 65, errorY: [5, 10] },
  { day: 'Day 5', avg: 50, errorY: [5, 5] },
  { day: 'Day 6', avg: 70, errorY: [5, 10] },
  { day: 'Day 7', avg: 60, errorY: [5, 5] },
];

const responseUserData = [
  { day: 'Day 1', value: 65 },
  { day: 'Day 2', value: 40 },
  { day: 'Day 3', value: 50 },
  { day: 'Day 4', value: 70 },
  { day: 'Day 5', value: 55 },
  { day: 'Day 6', value: 75 },
  { day: 'Day 7', value: 62 },
];

// Dummy aggregated data for Feedback Turnaround (in minutes)
const aggregatedFeedbackData = [
  { day: 'Day 1', avg: 120, errorY: [20, 30] },
  { day: 'Day 2', avg: 100, errorY: [15, 25] },
  { day: 'Day 3', avg: 110, errorY: [10, 20] },
  { day: 'Day 4', avg: 130, errorY: [15, 30] },
  { day: 'Day 5', avg: 105, errorY: [10, 15] },
  { day: 'Day 6', avg: 140, errorY: [20, 25] },
  { day: 'Day 7', avg: 115, errorY: [10, 20] },
];

const feedbackUserData = [
  { day: 'Day 1', value: 125 },
  { day: 'Day 2', value: 95 },
  { day: 'Day 3', value: 105 },
  { day: 'Day 4', value: 135 },
  { day: 'Day 5', value: 110 },
  { day: 'Day 6', value: 145 },
  { day: 'Day 7', value: 120 },
];

// Merge function to combine aggregated data with user data.
function mergeData(aggregated, user) {
  return aggregated.map((item, index) => ({
    ...item,
    user: user[index]?.value,
  }));
}

export default function CommunicationTimeChart({ showMyData, mode }) {
  // Select dataset based on mode:
  // "response" for Conversation Response, "turnaround" for Feedback Turnaround.
  const mergedData = useMemo(() => {
    if (mode === 'turnaround') {
      return mergeData(aggregatedFeedbackData, feedbackUserData);
    }
    return mergeData(aggregatedResponseData, responseUserData);
  }, [mode]);

  return (
    <div style={{ textAlign: 'center' }}>
      <LineChart
        width={800}
        height={400}
        data={mergedData}
        margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis
          label={{
            value: mode === 'turnaround' ? 'Feedback Turnaround (min)' : 'Response Time (min)',
            angle: -90,
            position: 'insideLeft',
          }}
        />
        <Tooltip />
        <Legend />
        {/* Place ErrorBar as a child of the Line for team average */}
        <Line type="monotone" dataKey="avg" name="Team Avg" stroke="#8884d8" strokeWidth={2}>
          <ErrorBar dataKey="errorY" width={4} stroke="#8884d8" />
        </Line>
        {showMyData && (
          <Line type="monotone" dataKey="user" name="My Time" stroke="#82ca9d" strokeWidth={2} />
        )}
      </LineChart>
    </div>
  );
}
