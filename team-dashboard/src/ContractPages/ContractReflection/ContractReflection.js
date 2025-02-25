// src/pages/TeamReflection/TeamReflection.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CommunicationChart from '../../BehaviorPages/Communication/CommunicationChart';
import styles from './ContractReflection.module.css';

export default function TeamReflection() {
  const navigate = useNavigate();
  // Load saved contract data from localStorage
  const [contractData, setContractData] = useState({
    teamName: '',
    goals: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    place: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('teamContractData');
    if (saved) {
      const parsed = JSON.parse(saved);
      setContractData({
        teamName: parsed.teamName || '',
        goals: parsed.goals || '',
        dayOfWeek: parsed.dayOfWeek || '',
        startTime: parsed.startTime || '',
        endTime: parsed.endTime || '',
        place: parsed.place || '',
      });
    }
  }, []);

  // Refs for each section (for menu navigation)
  const goalsRef = useRef(null);
  const meetingsRef = useRef(null);
  const communicationRef = useRef(null);
  const workNormsRef = useRef(null);

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Menu state
  const [menuOpen, setMenuOpen] = useState(false);

  const handleReturn = () => {
    navigate('/');
  };

  return (
    <div className={styles.pageContainer}>
      {/* Fixed Header */}
      <header className={styles.fixedHeader}>
        <button className={styles.headerButton} onClick={handleReturn}>
          Return
        </button>
        <button
          className={styles.headerButton}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          Menu
        </button>
        {menuOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={() => { scrollToSection(goalsRef); setMenuOpen(false); }}>Goals</button>
            <button onClick={() => { scrollToSection(meetingsRef); setMenuOpen(false); }}>Meetings</button>
            <button onClick={() => { scrollToSection(communicationRef); setMenuOpen(false); }}>Communication Norms</button>
            <button onClick={() => { scrollToSection(workNormsRef); setMenuOpen(false); }}>Work Norms</button>
          </div>
        )}
      </header>

      {/* Scrollable Main Content */}
      <div className={styles.mainContent}>
        {/* Section 1: Goals */}
        <section ref={goalsRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Goals</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.leftColumn}>
              <h3>Team Contract Details</h3>
              <p>{contractData.goals || 'No goals specified.'}</p>
              <p>
                We agree to reflect together on our teamwork behaviors and data relevant to this contract.
              </p>
            </div>
            <div className={styles.rightColumn}>
              {/* No visualization for goals */}
            </div>
          </div>
          <div className={styles.reflectionArea}>
            <textarea placeholder="Reflect on your goals performance here..."></textarea>
          </div>
        </section>

        {/* Section 2: Meetings */}
        <section ref={meetingsRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Meetings</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.leftColumn}>
              <h3>Team Contract Details</h3>
              <p>
                We agree to meet every week on {contractData.dayOfWeek || '_____'} from {contractData.startTime || '_____'} to {contractData.endTime || '_____'} at {contractData.place || '_____'}.
              </p>
              <p>
                We agree to arrive on time for all team meetings and notify team members in advance when running late or unable to attend.
              </p>
            </div>
            <div className={styles.rightColumn}>
              {/* No visualization for meetings */}
            </div>
          </div>
          <div className={styles.reflectionArea}>
            <textarea placeholder="Reflect on your meetings performance here..."></textarea>
          </div>
        </section>

        {/* Section 3: Communication Norms */}
        <section ref={communicationRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Communication Norms</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.leftColumn}>
              <h3>Team Contract Details</h3>
              <ul>
                <li>We agree to communicate in a timely, respectful, and professional manner.</li>
                <li>We agree to be inclusive so that everyone can participate in discussions and decision-making.</li>
                <li>We agree to review each other’s work and provide constructive feedback.</li>
              </ul>
            </div>
            <div className={styles.rightColumn}>
              {/* Reuse the CommunicationChart as a placeholder */}
              <CommunicationChart />
            </div>
          </div>
          <div className={styles.reflectionArea}>
            <textarea placeholder="Reflect on your communication performance here..."></textarea>
          </div>
        </section>

        {/* Section 4: Work Norms */}
        <section ref={workNormsRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Work Norms</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.leftColumn}>
              <h3>Team Contract Details</h3>
              <ul>
                <li>We agree to divide work equitably across all project deliverables and catch up on missing work if a significant imbalance arises.</li>
                <li>We agree to make plans for every project deliverable and inform team members in advance if assigned tasks cannot be completed on time.</li>
                <li>We agree to maintain good work quality and revise based on each other’s feedback.</li>
              </ul>
            </div>
            <div className={styles.rightColumn}>
              {/* Placeholder for Work Norms Visualization */}
              <div className={styles.visualizationPlaceholder}>
                Placeholder for Work Norms Visualization
              </div>
            </div>
          </div>
          <div className={styles.reflectionArea}>
            <textarea placeholder="Reflect on your work norms performance here..."></textarea>
          </div>
        </section>
      </div>
    </div>
  );
}
