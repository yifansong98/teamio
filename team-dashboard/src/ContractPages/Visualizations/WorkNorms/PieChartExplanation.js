import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import styles from './WorkExplanation.module.css';   // reuse the same CSS module

/* ------------------------------------------------------------------ */
/*  Fixed colour palette keyed by member name                         */
/* ------------------------------------------------------------------ */
const COLOR_MAP = {
  'Member 1': '#0088FE', // blue
  'Member 2': '#00C49F', // green
  'Member 3': '#FFBB28', // yellow
  'Member 4': '#FF8042', // orange
};
const COLORS = Object.values(COLOR_MAP);

/* ------------------------------------------------------------------ */
/*  Example‑1 : equal distribution (all 4 members on both tools)      */
/* ------------------------------------------------------------------ */
const equalPie = [
  { name: 'Member 1', value: 25 },
  { name: 'Member 2', value: 25 },
  { name: 'Member 3', value: 25 },
  { name: 'Member 4', value: 25 },
];

/* ------------------------------------------------------------------ */
/*  Example‑2 : role / task‑based distribution                         */
/*  ─ Google Docs  →  Member 1, 2 ;   GitHub  →  Member 3, 4           */
/*  We keep 0‑value slices so colours stay consistent.                */
/* ------------------------------------------------------------------ */
const roleGoogleDocs = [
  { name: 'Member 1', value: 40 },
  { name: 'Member 2', value: 10},
  { name: 'Member 3', value: 40 },
  { name: 'Member 4', value: 10 },
];
const roleGitHub = [
  { name: 'Member 1', value: 10 },
  { name: 'Member 2', value: 40 },
  { name: 'Member 3', value: 10 },
  { name: 'Member 4', value: 40 },
];

/* ------------------------------------------------------------------ */
/*  Reusable legend that always shows all team members in order.      */
/* ------------------------------------------------------------------ */
function FixedLegend() {
  return (
    <div className={styles.legendRow}>
      {Object.entries(COLOR_MAP).map(([member, colour]) => (
        <span key={member} className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ backgroundColor: colour }}
          />
          {member}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable pie‑chart block                                          */
/* ------------------------------------------------------------------ */
function PieBlock({ title, googleData, githubData }) {
  return (
    <div className={styles.chartBlock}>
      <h4 className={styles.blockTitle}>{title}</h4>

      <div className={styles.rowOfPies}>
        {/* Google Docs */}
        <div className={styles.singlePie}>
          <PieChart width={210} height={200}>
            <Pie
              data={googleData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label
            >
              {googleData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLOR_MAP[entry.name]}
                  stroke="#ffffff"
                />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} />
          </PieChart>
          <p className={styles.pieCaption}>Google Docs</p>
        </div>

        {/* GitHub */}
        <div className={styles.singlePie}>
          <PieChart width={210} height={200}>
            <Pie
              data={githubData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label
            >
              {githubData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLOR_MAP[entry.name]}
                  stroke="#ffffff"
                />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} />
          </PieChart>
          <p className={styles.pieCaption}>GitHub</p>
        </div>
      </div>

      {/* Shared legend underneath both pies */}
      <FixedLegend />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal component exported                                           */
/* ------------------------------------------------------------------ */
export default function PieChartExplanation({ onClose }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContentLarge}>
        <h3>Equitable Working Patterns</h3>
        <p className={styles.introText} align="left">
          Equitable working patterns include (but are not limited to):{' '}
          <strong>fair work distribution on all aspects</strong> and{' '}
          <strong>role/task‑based distribution</strong>.
        </p>

        {/* Example 1 */}
        <PieBlock
          title="Example equal distribution across tools"
          googleData={equalPie}
          githubData={equalPie}
        />

        {/* Example 2 */}
        <PieBlock
          title="Example role/task‑based distribution"
          googleData={roleGoogleDocs}
          githubData={roleGitHub}
        />

        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
