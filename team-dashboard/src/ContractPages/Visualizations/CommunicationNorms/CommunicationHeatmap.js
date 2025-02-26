// src/ContractPages/Visualizations/CommunicationHeatmap.js
import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis
} from 'recharts';

// 6 members
const keys = [
  'Member 1',
  'Member 2',
  'Member 3',
  'Member 4',
  'Member 5',
  'Member 6',
];

/** 
 * Symmetrical matrix for "Conversations" 
 * (Member i and Member j were both in N conversations)
 */
const matrixConversations = [
  [0, 3, 2, 1, 2, 3],
  [3, 0, 2, 2, 1, 2],
  [2, 2, 0, 1, 2, 3],
  [1, 2, 1, 0, 3, 1],
  [2, 1, 2, 3, 0, 2],
  [3, 2, 3, 1, 2, 0],
];

/**
 * Single-direction matrix for "Feedback" 
 * (Member i gave N pieces of feedback to Member j)
 */
const matrixFeedback = [
  [0, 1, 2, 0, 2, 0], // M1 gave 1 feedback to M2, 2 to M3, 2 to M5
  [0, 0, 3, 1, 0, 0], // M2 gave 3 to M3, 1 to M4
  [1, 0, 0, 2, 0, 2], // M3 gave 1 to M1, 2 to M4, 2 to M6
  [0, 0, 0, 0, 3, 1], // M4 gave 3 to M5, 1 to M6
  [1, 1, 0, 0, 0, 2], // M5 gave 1 to M2, 2 to M6
  [0, 0, 1, 0, 0, 0], // M6 gave 1 to M3
];

// Current user: "Member 3" => index=2
const currentUserIndex = 2;

// Build data from a matrix, flattening and tracking row/col.
function buildDataFromMatrix(matrix) {
  const data = [];
  let maxVal = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const value = matrix[i][j];
      data.push({
        x: j + 0.5,
        y: i + 0.5,
        row: i,
        col: j,
        value,
      });
      if (value > maxVal) maxVal = value;
    }
  }
  return { data, maxVal };
}

// Color scale from white to dark green
function getColor(value, maxVal) {
  if (maxVal === 0) return '#fff';
  const startColor = [255, 255, 255];
  const endColor = [46, 125, 50];
  const ratio = value / maxVal;
  const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio);
  const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio);
  const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio);
  return `rgb(${r},${g},${b})`;
}

// Custom axis tick: bold the user’s row/column label
const renderAxisTick = (showMyData) => ({ x, y, payload, verticalAnchor, textAnchor, ...rest }) => {
  const idx = Math.floor(payload.value);
  const isUser = idx === currentUserIndex; // currentUserIndex should be defined in your scope
  const label = keys[idx] || '';
  return (
    <text
      x={x}
      y={y}
      fill="#666"
      textAnchor={textAnchor}
      dominantBaseline={verticalAnchor}
      fontWeight={showMyData && isUser ? 'bold' : 'normal'}
      {...rest}
    >
      {label}
    </text>
  );
};

function renderCell({ cx, cy, payload }, maxVal, showMyData) {
  const cellSize = 45;
  const color = getColor(payload.value, maxVal);
  const isUserRelated = payload.row === currentUserIndex || payload.col === currentUserIndex;
  const strokeWidth = showMyData && isUserRelated ? 2 : 1;
  const strokeColor = showMyData && isUserRelated ? '#f44336' : '#ccc';

  return (
    <rect
      x={cx - cellSize / 2}
      y={cy - cellSize / 2}
      width={cellSize}
      height={cellSize}
      fill={color}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
}

// Custom tooltip: text depends on "mode" (conversations vs. feedback)
function CustomTooltip({ active, payload, mode }) {
  if (!active || !payload || !payload.length) return null;
  const cellData = payload[0].payload; 
  const rowName = keys[cellData.row];
  const colName = keys[cellData.col];
  const val = cellData.value || 0;

  if (mode === 'feedback') {
    // "Member X gave N pieces of feedback to Member Y"
    return (
      <div style={{ backgroundColor: '#fff', padding: '6px', border: '1px solid #ccc' }}>
        {`${rowName} gave ${val} pieces of feedback to ${colName}`}
      </div>
    );
  }
  // "Member X and Member Y were both in N conversations"
  return (
    <div style={{ backgroundColor: '#fff', padding: '6px', border: '1px solid #ccc' }}>
      {`${rowName} and ${colName} were both in ${val} conversations`}
    </div>
  );
}

export default function CommunicationHeatmap({ showMyData, mode }) {
  // Pick the matrix based on mode
  const chosenMatrix = mode === 'feedback' ? matrixFeedback : matrixConversations;
  const { data, maxVal } = buildDataFromMatrix(chosenMatrix);

  return (
    <div style={{ textAlign: 'center' }}>
      <ScatterChart
        width={800}    // Make it wider so labels don't overlap
        height={400}
        margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        {/* X-axis */}
        <XAxis 
          type="number"
          dataKey="x"
          domain={[0, keys.length]}
          ticks={[0.5, 1.5, 2.5, 3.5, 4.5, 5.5]}
          tick={renderAxisTick(showMyData)}
          tickLine={false}
        />

        {/* Y-axis (reversed so Member 1 is top) */}
        <YAxis 
          type="number"
          dataKey="y"
          domain={[0, keys.length]}
          ticks={[0.5, 1.5, 2.5, 3.5, 4.5, 5.5]}
          tick={renderAxisTick(showMyData)}
          tickLine={false}
          reversed-={true}
        />

        <ZAxis dataKey="value" range={[0, 100]} />

        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }} 
          content={<CustomTooltip mode={mode} />} 
        />

        <Scatter
          data={data}
          shape={(props) => renderCell(props, maxVal, showMyData)}
        />
      </ScatterChart>
    </div>
  );
}
