// src/ContractPages/ContractReflection/WorkReflection.js
import React, { useState } from 'react';
import WorkPieCharts from '../Visualizations/WorkNorms/WorkPieCharts';
import WorkTimelineCharts from '../Visualizations/WorkNorms/WorkTimelineCharts';
import WorkViz from '../Visualizations/WorkNorms/WorkViz';
import ReflectionEditor from '../Components/ReflectionEditor';
import styles from './ContractReflection.module.css';

const workStatements = [
  {
    id: 'work1',
    text: 'We agree to divide work equitably across all project deliverables and catch up on missing work if a significant imbalance arises.',
    behavior: 'Desired Behavior - Every member of the team should make a sufficient and balanced contribution to the project.',
    caption: 'An edit in Google Docs is a change to a document, such as adding text, changing the font, or inserting an image. You can review them from the "Version History".\nA Commit in GitHub records changes to one or more files in your branch, for more information: [link].',
    vizType: 'pie',
  },
  {
    id: 'work2',
    text: 'We agree to make plans for every project deliverable and inform team members in advance if assigned tasks cannot be completed on time.',
    behavior: 'Desired Behavior - Every teammebr should work in a timely manner such as starting early and finishing their own task on time.',
    caption: 'Timeline visualization showing the percentage of contributions for the deliverable planning across days, with actual numbers on hover.',
    vizType: 'timeline',
  },
  {
    id: 'work3',
    text: 'We agree to maintain good work quality and revise based on each other’s feedback.',
    behavior: 'Desired Behavior - ',
    caption: 'Some visualization explanation...',
    vizType: 'placeholder',
  },
];

export default function WorkReflection({ onPrevPage }) {
  // Track reflection checkboxes for each statement.
  const [reflectFlags, setReflectFlags] = useState(
    workStatements.reduce((acc, st) => ({ ...acc, [st.id]: false }), {})
  );

  const handleCheckboxChange = (id) => {
    setReflectFlags((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedDims = workStatements
    .filter((st) => reflectFlags[st.id])
    .map((st, i) => `${i + 1}. ${st.text}`)
    .join('\n');

  const reflectionPrompt = selectedDims
    ? `You have chosen to reflect on the following work dimensions:\n${selectedDims}\n\nPlease provide your overall reflection below:`
    : 'Please provide your overall reflection for Work:';

  return (
    <div>
      {workStatements.map((st) => (
        <div key={st.id} className={styles.subSection}>
          <div className={styles.leftSubSection}>
            <div className={styles.subSectionTitle}>On your contract:</div>
            <div className={styles.subSectionStatement} style={{ whiteSpace: 'pre-line' }}>
              {st.text}
            </div>
            <div className={styles.subSectionDesired} style={{ whiteSpace: 'pre-line' }}>
              {st.behavior}
            </div>
            <div className={styles.subSectionCaption} style={{ whiteSpace: 'pre-line' }}>
              {st.caption}
            </div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={reflectFlags[st.id]}
                onChange={() => handleCheckboxChange(st.id)}
              />
              I would like to reflect on this dimension
            </label>
          </div>
          <div className={styles.rightSubSection}>
            {st.vizType === 'pie' ? (
              <WorkPieCharts />
            ) : st.vizType === 'timeline' ? (
              <WorkTimelineCharts />
            ) : (
              <WorkViz />
            )}
          </div>
        </div>
      ))}

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
