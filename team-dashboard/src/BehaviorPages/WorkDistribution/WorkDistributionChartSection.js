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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import styles from './WorkDistribution.module.css';

/** 
 * Full data for each tool & metric. 
 * Provide empty array if not found.
 */
const chartDataMap = {
  '': { '': [] },
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

/** Return metrics list for a given tool. */
function getMetricsForTool(tool) {
  if (!tool || !chartDataMap[tool]) {
    return [];
  }
  return Object.keys(chartDataMap[tool]);
}

/**
 * Displays either Bar or Pie charts depending on chartType prop.
 * The parent sets chartType = 'bar' or 'pie'.
 */
export default function WorkDistributionChartSection({
  contractDataMap,
  chartType,         // 'bar' or 'pie' from parent
}) {
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [showActualValue, setShowActualValue] = useState(false);

  // Pick first metric if tool changes
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

  // Get base data for the chosen tool & metric
  const baseData = (() => {
    if (!selectedTool) return [];
    const dataForTool = chartDataMap[selectedTool];
    if (!dataForTool) return [];
    const dataForMetric = dataForTool[selectedMetric];
    if (!Array.isArray(dataForMetric)) return [];
    return dataForMetric;
  })();

  // Convert actual data to % if showActualValue is off
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

  // Convert planned data to % similarly
  const plannedData = contractDataMap[selectedTool] || [];
  const plannedDataConverted = (() => {
    if (showActualValue || plannedData.length === 0) return plannedData;
    const total = plannedData.reduce((sum, i) => sum + i.value, 0);
    if (!total) return plannedData;
    return plannedData.map((i) => ({
      ...i,
      value: Math.round((i.value / total) * 100),
    }));
  })();

  // Merge for side-by-side bar chart
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

  // For Pie usage
  const actualPieData = actualData.map((d) => ({
    name: d.name,
    value: d.value,
  }));
  const plannedPieData = plannedDataConverted.map((d) => ({
    name: d.name,
    value: d.value,
  }));

  // Are actualVals within [planned ± errorVal] for all members?
  const meetsContract = mergedData.every((item) => {
    const lower = Math.max(0, item.plannedVal - item.errorVal);
    const upper = item.plannedVal + item.errorVal;
    return item.actualVal >= lower && item.actualVal <= upper;
  });

  const subscriptionText = meetsContract
    ? 'The team meets their contract.'
    : 'The team does NOT meet their contract.';

  // Y-axis domain for bar chart
  const yDomain = showActualValue ? ['auto', 'auto'] : [0, 100];
  const yLabel = showActualValue ? 'Value' : '%';

  // Colors for each slice in Pie
  const colors = ['#3182ce', '#48bb78', '#e53e3e', '#d53f8c'];

  return (
    <div className={styles.mainContent}>
      {/* Left section => 1/3 width */}
      <div className={styles.leftSection}>
        <p className={styles.paragraph}>
          <b>Your Team Gini: 0.302</b> <br />
          Class Average Team Gini: 0.5
        </p>
        <p className={styles.paragraph}>{subscriptionText}</p>
      </div>

      {/* Right => 2/3 width */}
      <div className={styles.rightSection}>
        {/* Controls row => tool + metric + annotate + showActualValue */}
        <div className={styles.controls}>
          {/* Tool select */}
          <select
            className={styles.select}
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
          >
            <option value="">Select Tool</option>
            <option value="GoogleDocs">GoogleDocs</option>
            <option value="GitHub">GitHub</option>
          </select>

          {/* Metric select */}
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

          <button className={styles.button}>Annotate</button>

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

        {/* The chart display => bar or pie, depending on chartType prop */}
        <div className={styles.chartContainer}>
          {chartType === 'bar' ? (
            <BarChart width={800} height={400} data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                domain={yDomain}
                label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Bar dataKey="actualVal" fill="#3182ce" name="Actual" radius={[4, 4, 0, 0]} />
              <Bar dataKey="plannedVal" fill="#48bb78" name="Contract" radius={[4, 4, 0, 0]}>
                <ErrorBar dataKey="errorVal" stroke="red" strokeWidth={2} width={4} />
              </Bar>
            </BarChart>
          ) : (
            // If chartType === 'pie'
            <div style={{ display: 'flex', gap: '2rem' }}>
              {/* Actual Pie */}
              <PieChart width={300} height={300}>
                <Tooltip />
                <Legend />
                <Pie
                  data={actualPieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {actualPieData.map((entry, index) => (
                    <Cell
                      key={`cell-actual-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
              </PieChart>

              {/* Planned Pie */}
              <PieChart width={300} height={300}>
                <Tooltip />
                <Legend />
                <Pie
                  data={plannedPieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {plannedPieData.map((entry, index) => (
                    <Cell
                      key={`cell-plan-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
