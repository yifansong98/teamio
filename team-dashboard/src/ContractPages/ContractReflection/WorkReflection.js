// src/ContractPages/ContractReflection/WorkReflection.js
import React, { useState } from 'react';
import WorkPieCharts from '../Visualizations/WorkNorms/WorkPieCharts';
import WorkTimelineCharts from '../Visualizations/WorkNorms/WorkTimelineCharts';
import DoubleCommentSankey from '../Visualizations/WorkNorms/DoubleCommentSankey';
import ReflectionEditor from '../Components/ReflectionEditor';
import TimelineExplanation from '../Visualizations/WorkNorms/TimelineExplanation';
import PieChartExplanation from '../Visualizations/WorkNorms/PieChartExplanation';

import styles from './ContractReflection.module.css';

const workStatements = [
  {
    id: 'work1',
    text: 'We agree to divide work equitably.',
    caption:
      'Pie Chart: showing each member’s share of total contributions for the selected tool (Google Docs edits or GitHub commits), displaying the row contribution count when hovering.',
    vizType: 'pie', 
  },
  {
    id: 'work2',
    text: 'We agree to work in a timely manner.',
    caption:
      'Timeline Plot: showing the cumulative percentage of contributions based on the metric you selected, where the final day represents 100% of the total contributions, displaying the row contribution count when hovering.',
    vizType: 'timeline', 
  },
  {
    id: 'work3',
    text: 'We agree to review each other’s work and provide constructive feedback.',
    caption:
      'Sankey diagram showing the flow of comments: which member left how many comments on another member’s work. When hovering, the link displays "Member X leaves N comments to Member Y."',
    vizType: 'comment', 
  },
];

export default function WorkReflection({ onPrevPage }) {
  const [reflectFlags, setReflectFlags] = useState(
    workStatements.reduce((acc, st) => ({ ...acc, [st.id]: false }), {})
  );

  // For reflection prompt
  const selectedStatements = workStatements.filter((st) => reflectFlags[st.id]);
  const reflectionPrompt =
    selectedStatements.length > 0
      ? `You have chosen to reflect on the following work dimensions:\n${selectedStatements
          .map((st, i) => `${i + 1}. ${st.text}`)
          .join('\n')}\n\nPlease provide your overall reflection below:`
      : 'Please provide your overall reflection for Work:';

  const [showTimelyModal, setShowTimelyModal] = useState(false);
  const [showEquitableModal, setShowEquitableModal] = useState(false);


  // Handler for the clickable question text
  function handleOpenEquitableModal() {
    setShowEquitableModal(true);
  }  
  function handleOpenTimelyModal() {
    setShowTimelyModal(true);
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem', textAlign: 'left', padding: '0 1rem' }}>
        Please select at least one dimension you would like to reflect about your team's work.
        <br />We are collecting data only from your Google Drive folder [link] and GitHub repo [link] 
        from [startDate] to [endDate]. There will be more work that may not be fully represented 
        in this data visualization, such as paper prototyping or brainstorming.
      </div>
      <hr style={{ marginBottom: '1rem' }} />

      {workStatements.map((st) => (
        <div key={st.id} className={styles.subSection}>
          <div className={styles.leftSubSection}>
            <div className={styles.subSectionTitle}>Desired Teamwork Behavior (from your team contract):</div>

            {/* If this is statement #2, show the clickable question text */}
            {st.id === 'work1' ? (
              <div
                className={styles.subSectionStatement}
                style={{ whiteSpace: 'pre-line' }}
              >
                {st.text}{'\n'}
                <span
                  className={styles.clickableQuestion}
                  onClick={handleOpenEquitableModal}
                >
                  What are equitable working patterns?
                </span>
              </div>
            ) : st.id === 'work2' ? (
              <div
                className={styles.subSectionStatement}
                style={{ whiteSpace: 'pre-line' }}
              >
                {st.text}{'\n'}
                <span
                  className={styles.clickableQuestion}
                  onClick={handleOpenTimelyModal}
                >
                  What are timely working patterns?
                </span>
              </div>
            ) : (
              <div
                className={styles.subSectionStatement}
                style={{ whiteSpace: 'pre-line' }}
              >
                {st.text}
              </div>
            )}

            <div
              className={styles.subSectionCaption}
              style={{ whiteSpace: 'pre-line' }}
            >
              {st.caption}
            </div>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={reflectFlags[st.id]}
                onChange={() =>
                  setReflectFlags((prev) => ({
                    ...prev,
                    [st.id]: !prev[st.id],
                  }))
                }
              />
              I would like to reflect on this dimension
            </label>
          </div>
          <div className={styles.rightSubSection}>
            {st.vizType === 'pie' ? (
              <WorkPieCharts />
            ) : st.vizType === 'timeline' ? (
              <WorkTimelineCharts />
            ) : st.vizType === 'comment' ? (
              <DoubleCommentSankey />
            ) : null}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: '1rem', textAlign: 'left', padding: '0 1rem' }}>
        {selectedStatements.length === 0 ? (
          <div style={{ color: 'red' }}>
            You need to at least reflect on one dimension of your work.
          </div>
        ) : (
          <div>
            <p style={{ fontWeight: 'bold' }}>
              You have chosen to reflect on the following dimensions:
            </p>
            <ul style={{ marginLeft: '1.5rem' }}>
              {selectedStatements.map((st) => (
                <li key={st.id}>{st.text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.finalReflectionSection}>
        <ReflectionEditor sectionName="Work" prompt={reflectionPrompt} />
      </div>

      <div className={styles.pageNavButtons}>
        <button className={styles.prevPageButton} onClick={onPrevPage}>
          &laquo; Previous Page
        </button>
      </div>

      {/* CHANGED: The popup modal for timely explanation */}
      {showEquitableModal && (
        <PieChartExplanation onClose={() => setShowEquitableModal(false)} />
      )}
      {showTimelyModal && (
        <TimelineExplanation onClose={() => setShowTimelyModal(false)} />
      )}
    </div>
  );
}
