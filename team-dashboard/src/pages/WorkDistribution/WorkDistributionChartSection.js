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

/**
 * Full data set for each tool and its metrics.
 * We provide an empty array if tool/metric not found.
 */
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

/**
 * Returns the list of metric keys (e.g. ["edits","words","comments"]).
 * If the tool doesn't exist, we return an empty array to avoid crashes.
 */
function getMetricsForTool(tool) {
  if (!tool || !chartDataMap[tool]) {
    return [];
  }
  return Object.keys(chartDataMap[tool]);
}

export default function WorkDistributionChartSection({ contractDataMap }) {
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [showActualValue, setShowActualValue] = useState(false);

  // Whenever the tool changes, pick its first metric (if any)
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

  /**
   * Safely retrieve the base data array for the current tool+metric.
   * If anything is missing, we return an empty array to avoid .map() errors.
   */
  const baseData = (() => {
    if (!selectedTool) return [];
    const dataForTool = chartDataMap[selectedTool];
    if (!dataForTool) return [];
    const dataForMetric = dataForTool[selectedMetric];
    if (!Array.isArray(dataForMetric)) return [];
    return dataForMetric;
  })();

  /**
   * If showActualValue is false, we convert actual data to a % of the total.
   * Otherwise, we leave them as raw values.
   */
  const actualData = (() => {
    if (showActualValue || baseData.length === 0) {
      return baseData;
    }
    const total = baseData.reduce((sum, item) => sum + item.value, 0);
    if (!total) return baseData;
    return baseData.map((item) => ({
      ...item,
      value: Math.round((item.value / total) * 100),
    }));
  })();

  // The user's planned/contract distribution for the selected tool
  const plannedData = contractDataMap[selectedTool] || [];

  // Also convert planned data to % if showActualValue is false
  const plannedDataConverted = (() => {
    if (showActualValue || plannedData.length === 0) {
      return plannedData;
    }
    const total = plannedData.reduce((sum, i) => sum + i.value, 0);
    if (!total) return plannedData;
    return plannedData.map((i) => ({
      ...i,
      value: Math.round((i.value / total) * 100),
    }));
  })();

  /**
   * Merge actualData + plannedData for side-by-side bars, matching by "name".
   * If planned is missing a name, default to 0/0.
   */
  const mergedData = actualData.map((act) => {
    const plan = plannedDataConverted.find((p) => p.name === act.name) || {
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

  /**
   * Determine if the actualVal is within [plannedVal ± errorVal] for all members
   */
  const meetsContract = mergedData.every((item) => {
    const lower = Math.max(0, item.plannedVal - item.errorVal);
    const upper = item.plannedVal + item.errorVal;
    return item.actualVal >= lower && item.actualVal <= upper;
  });

  const subscriptionText = meetsContract
    ? 'The team meets their contract.'
    : 'The team does NOT meet their contract.';

  // Y-axis domain depends on whether we are showing raw values or percentages
  const yDomain = showActualValue ? ['auto', 'auto'] : [0, 100];
  const yLabel = showActualValue ? 'Value' : '%';

  return (
    <div className={styles.mainContent}>
      {/* Left (1/3) */}
      <div className={styles.leftSection}>
        <p className={styles.paragraph}>
          <b>Your Team Gini: 0.302</b> <br />
          Class Average Team Gini: 0.5
        </p>
        <p className={styles.paragraph}>{subscriptionText}</p>
      </div>

      {/* Right (2/3) */}
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

          <button className={styles.button}>
            Annotate
          </button>

          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="showActualValue"
              checked={showActualValue}
              onChange={(e) => setShowActualValue(e.target.checked)}
            />
            <label htmlFor="showActualValue">Show actual value</label>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <BarChart width={600} height={350} data={mergedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={yDomain} label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="actualVal" fill="#3182ce" name="Actual" radius={[4, 4, 0, 0]} />
            <Bar dataKey="plannedVal" fill="#48bb78" name="Contract" radius={[4, 4, 0, 0]}>
              <ErrorBar dataKey="errorVal" stroke="red" strokeWidth={2} width={4} />
            </Bar>
          </BarChart>
        </div>
      </div>
    </div>
  );
}
