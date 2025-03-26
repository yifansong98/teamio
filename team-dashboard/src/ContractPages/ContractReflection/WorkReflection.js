// src/ContractPages/ContractReflection/WorkReflection.js
import React, { useState } from 'react';
import WorkPieCharts from '../Visualizations/WorkNorms/WorkPieCharts';
import WorkTimelineCharts from '../Visualizations/WorkNorms/WorkTimelineCharts';
import DoubleCommentSankey from '../Visualizations/WorkNorms/DoubleCommentSankey';
import ReflectionEditor from '../Components/ReflectionEditor';
import WorkDataModal from '../Components/WorkDataModal';
import styles from './ContractReflection.module.css';

const workStatements = [
  {
    id: 'work1',
    text: 'We agree to divide work equitably across all project deliverables and catch up on missing work if a significant imbalance arises.',
    caption:
      'An edit in Google Docs is a change to a document, such as adding text, changing the font, or inserting an image. You can review them from the "Version History".\nA Commit in GitHub records changes to one or more files in your branch, for more information: [link].',
    vizType: 'pie', // Renders WorkPieCharts
  },
  {
    id: 'work2',
    text: 'We agree to work in a timely manner such as starting early or making steady progress throughout the project.',
    caption:
      'Timeline visualization showing the cumulative percentage of contributions, where the final day represents 100% of the total contributions.\nIt will display the actual contribution count based on the metric you selected when hovering.',
    vizType: 'timeline', // Renders WorkTimelineCharts
  },
  {
    id: 'work3',
    text: "We agree to review each other's work and provide constructive feedback.",
    caption:
      'Sankey diagram showing the flow of comments: which member left how many comments on another member’s work. When hovering, the link displays "Member X leaves N comments to Member Y."\nThe data',
    vizType: 'comment', // Renders DoubleCommentSankey
  },
];

export default function WorkReflection({ onPrevPage }) {
  // Reflection checkboxes
  const [reflectFlags, setReflectFlags] = useState(
    workStatements.reduce((acc, st) => ({ ...acc, [st.id]: false }), {})
  );

  const handleCheckboxChange = (id) => {
    setReflectFlags((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Gather selected statements for reflection prompt
  const selectedStatements = workStatements.filter((st) => reflectFlags[st.id]);
  const reflectionPrompt =
    selectedStatements.length > 0
      ? `You have chosen to reflect on the following work dimensions:\n${selectedStatements
          .map((st, i) => `${i + 1}. ${st.text}`)
          .join('\n')}\n\nPlease provide your overall reflection below:`
      : 'Please provide your overall reflection for Work:';

  return (
    <div>
      {/* Top instruction */}
      <div style={{ marginBottom: '1rem', textAlign: 'left', padding: '0 1rem' }}>
        Please select at least one dimension you would like to reflect about your team's work. <br />
        We are collecting data only from your Google Drive folder [link] and GitHub repo [link] from [startDate] to [endDate]. <br />
        There will be more work that may not be fully represented in this data visualization, such as paper prototyping or brainstorming.
        <br />
        <br />
        {/* The new "Enter your work" button, triggers the WorkDataModal */}
        <WorkDataModal />
      </div>

      <hr style={{ marginBottom: '1rem' }} />

      {workStatements.map((st) => (
        <div key={st.id} className={styles.subSection}>
          <div className={styles.leftSubSection}>
            <div className={styles.subSectionTitle}>On your contract:</div>
            <div
              className={styles.subSectionStatement}
              style={{ whiteSpace: 'pre-line' }}
            >
              {st.text}
            </div>
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
                onChange={() => setReflectFlags((prev) => ({ ...prev, [st.id]: !prev[st.id] }))}
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

      {/* Reflection prompt */}
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
    </div>
  );
}
