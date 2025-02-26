import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Minimal dummy data
const data = [
  { name: 'Oct 1', contribution: 10 },
  { name: 'Oct 2', contribution: 30 },
  { name: 'Oct 3', contribution: 20 },
  { name: 'Oct 4', contribution: 40 },
  { name: 'Oct 5', contribution: 60 },
  { name: 'Oct 6', contribution: 55 },
  { name: 'Oct 7', contribution: 75 },
];

export default function WorkViz() {
  return (
    <div style={{ marginTop: '1rem' }}>
      <LineChart
        width={500}
        height={300}
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="contribution" stroke="#8884d8" strokeWidth={2} />
      </LineChart>
    </div>
  );
}
