// src/pages/WorkProgression/WorkProgressionChartSection.js

import React, { useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
} from 'recharts';
import { CustomBoxPlot } from './CustomBoxPlot'; // from the same folder
import styles from './WorkProgression.module.css';

/** Team's daily progress, 0-100% */
const myTeamData = [
  { date: 'Oct 1', progress: 0 },
  { date: 'Oct 2', progress: 10 },
  { date: 'Oct 3', progress: 20 },
  { date: 'Oct 4', progress: 35 },
  { date: 'Oct 5', progress: 40 },
  { date: 'Oct 6', progress: 60 },
  { date: 'Oct 7', progress: 100 },
];

/** Class stats for each day: min, q1, median, q3, max */
const classBoxData = [
  { date: 'Oct 1', min: 0, q1: 5, median: 10, q3: 15, max: 20 },
  { date: 'Oct 2', min: 5, q1: 20, median: 40, q3: 50, max: 60 },
  { date: 'Oct 3', min: 15, q1: 25, median: 35, q3: 45, max: 65 },
  { date: 'Oct 4', min: 30, q1: 40, median: 50, q3: 55, max: 70 },
  { date: 'Oct 5', min: 35, q1: 45, median: 55, q3: 65, max: 75 },
  { date: 'Oct 6', min: 40, q1: 50, median: 60, q3: 70, max: 85 },
  { date: 'Oct 7', min: 50, q1: 65, median: 80, q3: 90, max: 100 },
];

export default function WorkProgressionChartSection() {
  // Show/hide class comparison
  const [showClassComparison, setShowClassComparison] = useState(false);
  // The ref for the Y-axis to pass scale to CustomBoxPlot
  const yAxisRef = useRef(null);

  return (
    <div className={styles.mainContent}>
      {/* Left text: "Your team started on Oct 4..." or any custom info */}
      <div className={styles.leftSection}>
        <p className={styles.paragraph}>
          <strong>Your team started on Oct 4</strong>, whereas the average start
          date of the class is Oct 2. <br />
          80% of your commits are made in the last day, whereas the class average
          is 30%.
        </p>
      </div>

      {/* Right side => Chart + controls */}
      <div className={styles.rightSection}>
        <div className={styles.controls}>
          {/* Tool / Metric dropdowns, placeholders for now */}
          <select className={styles.select}>
            <option value="GitHub">GitHub</option>
            <option value="GitLab">GitLab</option>
          </select>
          <select className={styles.select}>
            <option value="Commits">Commits</option>
            <option value="Lines">Lines of Code</option>
          </select>

          {/* Show class comparison checkbox */}
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="classComparison"
              checked={showClassComparison}
              onChange={(e) => setShowClassComparison(e.target.checked)}
            />
            <label htmlFor="classComparison">Show class comparison</label>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <LineChart width={600} height={300} data={myTeamData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            {/* We put a ref on the YAxis to get scale */}
            <YAxis
              ref={yAxisRef}
              domain={[0, 100]}
              label={{ value: 'Progress', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />

            {/* Team progress line */}
            <Line
              type="monotone"
              dataKey="progress"
              stroke="#3182ce"
              strokeWidth={3}
              dot={{ r: 5 }}
              name="My Team"
            />

            {/* If showClassComparison => overlay box plots */}
            {showClassComparison && (
              <Scatter
                data={classBoxData}
                name="Class Stats"
                fill="none"
                shape={(props) => (
                  <CustomBoxPlot
                    {...props}
                    yAxis={{ scale: yAxisRef.current?.scale }}
                  />
                )}
              />
            )}
          </LineChart>
        </div>
      </div>
    </div>
  );
}
