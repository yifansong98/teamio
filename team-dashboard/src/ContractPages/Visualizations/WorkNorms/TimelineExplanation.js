import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import styles from './WorkExplanation.module.css';

export default function TimelineExplanation({ onClose }) {
  // example data showing a near-diagonal progression
  // day 1..7, cumulative from 0..100
  const exampleData = [
    { day: 'Day 1', progress: 10 },
    { day: 'Day 2', progress: 20 },
    { day: 'Day 3', progress: 30 },
    { day: 'Day 4', progress: 45 },
    { day: 'Day 5', progress: 60 },
    { day: 'Day 6', progress: 80 },
    { day: 'Day 7', progress: 100 },
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Timely Working Patterns</h3>
        <p align="left">
          Timely working patterns include (but not limited to): <b>starting 
          early</b> and <b>making steady progress</b>, which often yield a 
          timeline that’s close to a diagonal.
        </p>

        <div className={styles.chartContainer}>
          <LineChart
            width={500}
            height={300}
            data={exampleData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="progress"
              stroke="#82ca9d"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
          <p className={styles.chartCaption}>Example timely working pattern</p>
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
