// src/ContractPages/ContractReflection/CommunicationReflection.js
import React, { useState } from 'react';
import ReflectionEditor from '../Components/ReflectionEditor';
import CommunicationBarChart from '../Visualizations/CommunicationNorms/CommunicationBarChart';
import CommunicationHeatmap from '../Visualizations/CommunicationNorms/CommunicationHeatmap';
import MeetingDataModal from '../Components/MeetingDataModal';
import styles from './ContractReflection.module.css';

const commStatements = [
  {
    id: 'comm1',
    text: 'We agree to communicate actively and treat each other with respect.',
    caption:
      'The current "polite message classification" is based on the algorithm proposed in [link], and may not be perfect.\nWhile politeness may not be exactly the same as respectfulness, using more "polite strategies [link]" in your conversation will help pay more respect.',
    VizComponent: CommunicationBarChart, // Bar Chart
  },
  {
    id: 'comm2',
    text: 'We agree to be responsive and inclusive so that everyone can participate in discussions and decision-making.',
    caption:
      'The heatmap shows how many team members are involved in each of your conversations.\nA conversation is defined as a chunk of messages segmented by a 6-hour gap.',
    VizComponent: CommunicationHeatmap, // Heatmap
  },
  {
    id: 'comm3',
    text: 'We agree to arrive on time for all team meetings and notify team members in advance when running late or unable to attend.',
    caption:
      'Enter your meeting data to track attendance and punctuality. Use the "Enter Your Data" button below to add meeting records.',
    VizComponent: null, // No visualization component for this dimension
  },
];

export default function CommunicationReflection({ onNextPage }) {
  const instruction =
    "Please select at least one dimension you would like to reflect about your team's communication.";

  // Track which statements are checked for reflection.
  const [reflectFlags, setReflectFlags] = useState(
    commStatements.reduce((acc, st) => ({ ...acc, [st.id]: false }), {})
  );

  const handleCheckboxChange = (id) => {
    setReflectFlags((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Gather selected statements
  const selectedStatements = commStatements.filter((st) => reflectFlags[st.id]);

  return (
    <div>
      {/* Top instruction and divider */}
      <div style={{ marginBottom: '1rem', textAlign: 'left', padding: '0 1rem' }}>
        {instruction}
      </div>
      <hr style={{ marginBottom: '1rem' }} />

      {commStatements.map((st) => {
        const VizWrapper = st.VizComponent;
        return (
          <div key={st.id} className={styles.subSection}>
            <div className={styles.leftSubSection}>
              <div className={styles.subSectionTitle}>On your contract:</div>
              <div className={styles.subSectionStatement} style={{ whiteSpace: 'pre-line' }}>
                {st.text}
              </div>
              <div className={styles.subSectionCaption} style={{ whiteSpace: 'pre-line' }}>
                {st.caption}
              </div>
              {/* For meeting data (comm3), include the MeetingDataModal button */}
              {st.id === 'comm3' && <MeetingDataModal />}
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
              {VizWrapper ? <VizWrapper /> : <p>No data to visualize for now.</p>}
            </div>
          </div>
        );
      })}

      {/* Display selected statements or warning */}
      <div style={{ marginBottom: '1rem', textAlign: 'left', padding: '0 1rem' }}>
        {selectedStatements.length === 0 ? (
          <div style={{ color: 'red' }}>
            You need to at least reflect on one dimension of your communication.
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
        <ReflectionEditor
          sectionName="Communication"
          prompt="Please provide your overall reflection below:"
        />
      </div>

      <div className={styles.pageNavButtons}>
        <button className={styles.nextPageButton} onClick={onNextPage}>
          Next Page &raquo;
        </button>
      </div>
    </div>
  );
}
