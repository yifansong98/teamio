import React, { useState } from 'react';
import WorkPieCharts from '../Visualizations/WorkNorms/WorkPieCharts';
import WorkTimelineCharts from '../Visualizations/WorkNorms/WorkTimelineCharts';
import DoubleCommentSankey from '../Visualizations/WorkNorms/DoubleCommentSankey';
import ReflectionEditor from '../Components/ReflectionEditor';
import TimelineExplanation from '../Visualizations/WorkNorms/TimelineExplanation';
import PieChartExplanation from '../Visualizations/WorkNorms/PieChartExplanation';

import styles from './ContractReflection.module.css';

/* ────────────────────────────────────────────────────────────────────────── */

const workStatements = [
  {
    id: 'work1',
    text: 'We agree to divide work equitably.',
    caption:
      'Pie Chart: displays each member’s share of total contributions for the selected tool, hovering to see the raw counts.',
    vizType: 'pie',
  },
  {
    id: 'work2',
    text: 'We agree to work in a timely manner.',
    caption:
      'Timeline Plot: shows cumulative % of contributions, where the final day equals 100%, hovering to inspect daily totals.',
    vizType: 'timeline',
  },
  {
    id: 'work3',
    text: 'We agree to review and provide feedback to each other’s work.',
    caption:
      'Sankey diagram: visualises comment flows (Member X → Member Y, N comments). Hover a link for details.',
    vizType: 'comment',
  },
];

/* ────────────────────────────────────────────────────────────────────────── */

export default function WorkReflection({ onPrevPage }) {
  /* reflection check‑boxes */
  const [reflectFlags, setReflectFlags] = useState(
    workStatements.reduce((acc, st) => ({ ...acc, [st.id]: false }), {})
  );

  const selected = workStatements.filter((st) => reflectFlags[st.id]);
  const reflectionPrompt =
    selected.length > 0
      ? `You have chosen to reflect on the following work dimensions:\n${selected
          .map((st, i) => `${i + 1}. ${st.text}`)
          .join('\n')}\n\nPlease provide your overall reflection below:`
      : 'Please provide your overall reflection for Work:';

  /* pop‑up modals */
  const [showEquitableModal, setShowEquitableModal] = useState(false);
  const [showTimelyModal, setShowTimelyModal] = useState(false);

  /* helpers */
  const toggleFlag = (id) =>
    setReflectFlags((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className={styles.pageInner}>
      {/* instruction banner */}
      <div className={styles.topInstruction}>
        Please select at least one dimension you would like to reflect on for your
        team’s work. Data covers your Google Drive folder [link] and GitHub repo [link]
        from [startDate] to [endDate].
      </div>

      <hr className={styles.sectionDivider} />

      {/* ───────────  CARD PER STATEMENT  ─────────── */}
      {workStatements.map((st) => (
        <section key={st.id} className={styles.card}>
        {/* statement + (new‑line) question link */}
        <h3 className={styles.statement}>{st.text}</h3>
        {st.id === 'work1' && (
          <button
            className={styles.questionLinkBlock}
            onClick={() => setShowEquitableModal(true)}
          >
            What are equitable working patterns?
          </button>
        )}
        {st.id === 'work2' && (
          <button
            className={styles.questionLinkBlock}
            onClick={() => setShowTimelyModal(true)}
          >
            What are timely working patterns?
          </button>
        )}
        {st.id === 'work3' && (
          <button
            className={styles.questionLinkBlock}
            onClick={() => setShowTimelyModal(true)}
          >
            Why interacting with each other's work is important?
          </button>
        )}


          {/* visualisation */}
          <div className={styles.vizWrapper}>
            {st.vizType === 'pie' && <WorkPieCharts />}
            {st.vizType === 'timeline' && <WorkTimelineCharts />}
            {st.vizType === 'comment' && <DoubleCommentSankey />}
          </div>

          {/* caption */}
          <p className={styles.vizCaption}>{st.caption}</p>

          {/* checkbox */}
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={reflectFlags[st.id]}
              onChange={() => toggleFlag(st.id)}
            />
            I would like to reflect on this dimension
          </label>
        </section>
      ))}

      {/* summary + editor */}
      <div className={styles.summaryBox}>
        {selected.length === 0 ? (
          <span className={styles.warnText}>
            You need to select at least one work dimension.
          </span>
        ) : (
          <>
            <p><strong>You have chosen to reflect on:</strong></p>
            <ul>
              {selected.map((st) => (
                <li key={st.id}>{st.text}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ReflectionEditor sectionName="Work" prompt={reflectionPrompt} />

      {/* nav buttons */}
      <div className={styles.pageNavButtons}>
        <button className={styles.prevPageButton} onClick={onPrevPage}>
          &laquo; Previous Page
        </button>
      </div>

      {/* pop‑ups */}
      {showEquitableModal && (
        <PieChartExplanation onClose={() => setShowEquitableModal(false)} />
      )}
      {showTimelyModal && (
        <TimelineExplanation onClose={() => setShowTimelyModal(false)} />
      )}
    </div>
  );
}
