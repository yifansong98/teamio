// src/ContractPages/ContractReflection/CommunicationReflection.js
import React, { useState } from 'react';
import ReflectionEditor from '../Components/ReflectionEditor';
import styles from './ContractReflection.module.css';

// We'll define minimal "VizWrapper" components for each bullet
import BarVizWrapper from '../Visualizations/CommunicationNorms/BarVizWrapper';
import HeatmapVizWrapper from '../Visualizations/CommunicationNorms/HeatmapVizWrapper';
import TimeVizWrapper from '../Visualizations/CommunicationNorms/TimeVizWrapper';

// Example communication contract statements
const commStatements = [
  {
    id: 'comm1',
    text: 'We agree to communicate in a timely, respectful, and professional manner.',
    VizComponent: BarVizWrapper,
  },
  {
    id: 'comm2',
    text: 'We agree to be inclusive so that everyone can participate in discussions and decision-making.',
    VizComponent: HeatmapVizWrapper,
  },
  {
    id: 'comm3',
    text: 'We agree to review each other’s work and provide constructive feedback.',
    VizComponent: TimeVizWrapper,
  },
];

export default function CommunicationReflection({ onNextPage }) {
  // Track which statements the user wants to reflect on
  const [reflectFlags, setReflectFlags] = useState(
    commStatements.reduce((acc, st) => ({ ...acc, [st.id]: false }), {})
  );

  const handleCheckboxChange = (id) => {
    setReflectFlags((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build reflection prompt
  const selectedDims = commStatements
    .filter((st) => reflectFlags[st.id])
    .map((st, i) => `${i + 1}. ${st.text}`)
    .join('\n');

  const reflectionPrompt = selectedDims
    ? `You have chosen to reflect on the following communication dimensions:\n${selectedDims}\n\nPlease provide your overall reflection below:`
    : 'Please provide your overall reflection for Communication:';

  return (
    <div>
      {commStatements.map((st) => {
        const VizWrapper = st.VizComponent;
        return (
          <div key={st.id} className={styles.subSection}>
            <div className={styles.leftSubSection}>
              <h3 className={styles.subSectionHeader}>{st.text}</h3>
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
              <VizWrapper />
            </div>
          </div>
        );
      })}

      {/* Reflection Editor */}
      <div className={styles.finalReflectionSection}>
        <ReflectionEditor
          sectionName="Communication"
          prompt={reflectionPrompt}
        />
      </div>

      {/* Next Page button at bottom-right */}
      <div className={styles.pageNavButtons}>
        <button className={styles.nextPageButton} onClick={onNextPage}>
          Next Page &raquo;
        </button>
      </div>
    </div>
  );
}
