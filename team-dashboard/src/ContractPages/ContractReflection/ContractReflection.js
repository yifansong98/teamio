// src/ContractPages/ContractReflection/ContractReflection.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, CornerUpLeft } from 'lucide-react';

// Updated: Import our new communication panel component
import CommunicationPanel from '../Visualizations/CommunicationPanel';
import WorkViz from '../Visualizations/WorkViz';

import styles from './ContractReflection.module.css';

export default function ContractReflection() {
  const navigate = useNavigate();

  // Load saved contract data from localStorage
  const [contractData, setContractData] = useState({
    teamName: '',
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
        dayOfWeek: parsed.dayOfWeek || '',
        startTime: parsed.startTime || '',
        endTime: parsed.endTime || '',
        place: parsed.place || '',
      });
    }
  }, []);

  // Refs for each section (for menu navigation)
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

  // Return to home
  const handleReturn = () => {
    navigate('/');
  };

  return (
    <div className={styles.pageContainer}>
      {/* Fixed Header */}
      <header className={styles.fixedHeader}>
        {/* Return button with curved arrow icon */}
        <button className={styles.headerButton} onClick={handleReturn}>
          <CornerUpLeft size={18} />
        </button>

        {/* Menu button with hamburger icon */}
        <button
          className={styles.headerButton}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MenuIcon size={18} />
        </button>

        {menuOpen && (
          <div className={styles.menuDropdown}>
            <button
              onClick={() => {
                scrollToSection(meetingsRef);
                setMenuOpen(false);
              }}
            >
              Meetings
            </button>
            <button
              onClick={() => {
                scrollToSection(communicationRef);
                setMenuOpen(false);
              }}
            >
              Communication Norms
            </button>
            <button
              onClick={() => {
                scrollToSection(workNormsRef);
                setMenuOpen(false);
              }}
            >
              Work Norms
            </button>
          </div>
        )}
      </header>

      {/* Scrollable Main Content */}
      <div className={styles.mainContent}>
        {/* Section: Meetings */}
        <section ref={meetingsRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Meetings</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.leftColumn}>
              <h3 className={styles.contractSubheader}>On your team contract:</h3>
              <ul className={styles.sectionPoints}>
                <li>
                  We agree to meet every week on{' '}
                  {contractData.dayOfWeek || '_____'} from{' '}
                  {contractData.startTime || '_____'} to{' '}
                  {contractData.endTime || '_____'} at{' '}
                  {contractData.place || '_____'}.
                </li>
                <li>
                  We agree to arrive on time for all team meetings and notify team
                  members in advance when running late or unable to attend.
                </li>
              </ul>
            </div>
            <div className={styles.rightColumn}>
              {/* No visualization for Meetings, just a placeholder */}
              <div className={styles.noVisualization}>No visualization for Meetings</div>
            </div>
          </div>
          <div className={styles.reflectionArea}>
            <textarea placeholder="Reflect on your meetings performance here..."></textarea>
          </div>
        </section>

        {/* Section: Communication Norms */}
        <section ref={communicationRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Communication Norms</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.leftColumn}>
              <h3 className={styles.contractSubheader}>On your team contract:</h3>
              <ul className={styles.sectionPoints}>
                <li>We agree to communicate in a timely, respectful, and professional manner.</li>
                <li>We agree to be inclusive so that everyone can participate in discussions and decision-making.</li>
                <li>We agree to review each other’s work and provide constructive feedback.</li>
              </ul>
            </div>
            <div className={styles.rightColumn}>
              {/* Updated: Render the new CommunicationPanel which includes both bar chart and network graph */}
              <CommunicationPanel />
            </div>
          </div>
          <div className={styles.reflectionArea}>
            <textarea placeholder="Reflect on your communication performance here..."></textarea>
          </div>
        </section>

        {/* Section: Work Norms */}
        <section ref={workNormsRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Work Norms</h2>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.leftColumn}>
              <h3 className={styles.contractSubheader}>On your team contract:</h3>
              <ul className={styles.sectionPoints}>
                <li>We agree to divide work equitably across all project deliverables and catch up on missing work if a significant imbalance arises.</li>
                <li>We agree to make plans for every project deliverable and inform team members in advance if assigned tasks cannot be completed on time.</li>
                <li>We agree to maintain good work quality and revise based on each other’s feedback.</li>
              </ul>
            </div>
            <div className={styles.rightColumn}>
              {/* Inline chart (centered) */}
              <WorkViz />
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
