// src/pages/WorkProgression/CustomBoxPlot.js
import React from 'react';

/**
 * Draws a box plot for a single data point with shape:
 *   - whisker from min to max
 *   - box from q3 to q1
 *   - horizontal lines for min, max, median
 */
export function CustomBoxPlot(props) {
  const { cx, payload, yAxis } = props;

  if (!payload || !yAxis?.scale) return null;

  // Convert stats to pixel coords
  const minY = yAxis.scale(payload.min);
  const q1Y = yAxis.scale(payload.q1);
  const medianY = yAxis.scale(payload.median);
  const q3Y = yAxis.scale(payload.q3);
  const maxY = yAxis.scale(payload.max);

  // widths
  const boxWidth = 16;
  const halfBox = boxWidth / 2;
  const whiskerWidth = boxWidth / 2;

  return (
    <g>
      {/* line from min to max */}
      <line
        x1={cx}
        y1={minY}
        x2={cx}
        y2={maxY}
        stroke="#444"
        strokeWidth={1}
      />

      {/* min horizontal tick */}
      <line
        x1={cx - whiskerWidth / 2}
        x2={cx + whiskerWidth / 2}
        y1={minY}
        y2={minY}
        stroke="#444"
      />
      {/* max horizontal tick */}
      <line
        x1={cx - whiskerWidth / 2}
        x2={cx + whiskerWidth / 2}
        y1={maxY}
        y2={maxY}
        stroke="#444"
      />

      {/* Q1-Q3 box */}
      <rect
        x={cx - halfBox}
        y={q3Y}
        width={boxWidth}
        height={q1Y - q3Y}
        fill="#ccc"
        stroke="#444"
        strokeWidth={1}
      />

      {/* median line */}
      <line
        x1={cx - halfBox}
        x2={cx + halfBox}
        y1={medianY}
        y2={medianY}
        stroke="#444"
      />
    </g>
  );
}
