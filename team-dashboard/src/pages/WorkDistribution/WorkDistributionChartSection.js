// src/pages/WorkDistribution/WorkDistributionChartSection.js
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
} from 'recharts';

import styles from './WorkDistribution.module.css';

// Actual data from your existing code
const chartDataMap = {
  '': {
    '': [],
  },
  GoogleDocs: {
    edits: [
      { name: 'Anna', value: 18 },
      { name: 'Harry', value: 12 },
      { name: 'Daniel', value: 8 },
      { name: 'Sarah', value: 22 },
    ],
    words: [
      { name: 'Anna', value: 400 },
      { name: 'Harry', value: 200 },
      { name: 'Daniel', value: 300 },
      { name: 'Sarah', value: 100 },
    ],
    comments: [
      { name: 'Anna', value: 5 },
      { name: 'Harry', value: 3 },
      { name: 'Daniel', value: 2 },
      { name: 'Sarah', value: 4 },
    ],
  },
  GitHub: {
    commits: [
      { name: 'Anna', value: 20 },
      { name: 'Harry', value: 16 },
      { name: 'Daniel', value: 12 },
      { name: 'Sarah', value: 10 },
    ],
    lines: [
      { name: 'Anna', value: 1000 },
      { name: 'Harry', value: 500 },
      { name: 'Daniel', value: 750 },
      { name: 'Sarah', value: 300 },
    ],
    reviews: [
      { name: 'Anna', value: 3 },
      { name: 'Harry', value: 7 },
      { name: 'Daniel', value: 5 },
      { name: 'Sarah', value: 2 },
    ],
  },
};

// Helper for available metrics
function getMetricsForTool(tool) {
  if (!tool || !chartDataMap[tool]) {
    return [];
  }
  return Object.keys(chartDataMap[tool]);
}

export default function WorkDistributionChartSection({ contractDataMap }) {
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [showPercentage, setShowPercentage] = useState(false);

  // Update the metric dropdown if tool changes
  useEffect(() => {
    if (!selectedTool) {
      setSelectedMetric('');
      return;
    }
    const metrics = getMetricsForTool(selectedTool);
    if (metrics.length > 0) {
      setSelectedMetric(metrics[0]);
    } else {
      setSelectedMetric('');
    }
  }, [selectedTool]);

  // Actual data
  const baseData = (() => {
    const dataForTool = chartDataMap[selectedTool] || {};
    return dataForTool[selectedMetric] || [];
  })();

  // Possibly convert actual data to percentage if showPercentage is on
  const actualData = (() => {
    if (!showPercentage || baseData.length === 0) return baseData;
    const total = baseData.reduce((sum, item) => sum + item.value, 0);
    if (!total) return baseData;
    return baseData.map((item) => ({
      ...item,
      value: Math.round((item.value / total) * 100),
    }));
  })();

  // Contract data for the selected tool (if any)
  const plannedData = contractDataMap[selectedTool] || [];

  // Possibly also convert planned data to percentage
  const plannedDataPercent = (() => {
    if (!showPercentage || plannedData.length === 0) return plannedData;
    const total = plannedData.reduce((sum, item) => sum + item.value, 0);
    if (!total) return plannedData;
    return plannedData.map((item) => ({
      ...item,
      value: Math.round((item.value / total) * 100),
    }));
  })();

  // Merge actual + planned for side-by-side bars
  const mergedData = actualData.map((act) => {
    const plan = plannedDataPercent.find((p) => p.name === act.name) || {
      value: 0,
      errorVal: 0,
    };
    return {
      name: act.name,
      actualVal: act.value,
      plannedVal: plan.value,
      errorVal: plan.errorVal,
    };
  });

  // Check if team meets contract: actualVal in [plannedVal - errorVal, plannedVal + errorVal]
  const meetsContract = mergedData.every((item) => {
    const lower = Math.max(0, item.plannedVal - item.errorVal);
    const upper = item.plannedVal + item.errorVal;
    return item.actualVal >= lower && item.actualVal <= upper;
  });

  const subscriptionText = meetsContract
    ? 'The team meets their contract.'
    : 'The team does NOT meet their contract.';

  return (
    <div className={styles.mainContent}>
      {/* Left side: Gini or other explanation */}
      <div className={styles.leftSection}>
        <p className={styles.paragraph}>
          <b>Your Team Gini: 0.302</b> <br />
          Class Average Team Gini: 0.5
        </p>
        <p className={styles.paragraph}>
          {subscriptionText}
        </p>
      </div>

      {/* Right side: controls + chart */}
      <div className={styles.rightSection}>
        <div className={styles.controls}>
          <select
            className={styles.select}
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
          >
            <option value="">Select Tool</option>
            <option value="GoogleDocs">GoogleDocs</option>
            <option value="GitHub">GitHub</option>
          </select>

          {selectedTool ? (
            <select
              className={styles.select}
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              {getMetricsForTool(selectedTool).map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <select className={styles.select} disabled>
              <option>(No metrics)</option>
            </select>
          )}

          <button
            className={styles.button}
            onClick={() => {
              /* just a no-op placeholder */
            }}
          >
            Annotate
          </button>

          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="percentage"
              checked={showPercentage}
              onChange={(e) => setShowPercentage(e.target.checked)}
            />
            <label htmlFor="percentage">Percentage</label>
          </div>
        </div>

        {/* Side-by-side bar chart with error bar on planned distribution */}
        <BarChart width={600} height={300} data={mergedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={showPercentage ? [0, 100] : ['auto', 'auto']} />
          <Tooltip />
          {/* Actual bar */}
          <Bar dataKey="actualVal" fill="#3182ce" name="Actual" radius={[4, 4, 0, 0]} />
          {/* Planned bar + error range */}
          <Bar dataKey="plannedVal" fill="#48bb78" name="Contract" radius={[4, 4, 0, 0]}>
            <ErrorBar
              dataKey="errorVal"
              stroke="red"
              strokeWidth={2}
              width={4}
            />
          </Bar>
        </BarChart>
      </div>
    </div>
  );
}
