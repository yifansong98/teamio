// src/ContractPages/ContractReflection/ContractReflection.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerUpLeft } from 'lucide-react';

import CommunicationReflection from './CommunicationReflection';
import WorkReflection from './WorkReflection';

import styles from './ContractReflection.module.css';

export default function ContractReflection() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('work');

  const handleReturn = () => {
    navigate('/teamio');
  };

  return (
    <div className={styles.pageContainer}>
      {/* Fixed Header */}
      <header className={styles.fixedHeader}>
        {/* Return button on the left */}
        <button className={styles.returnButton} onClick={handleReturn}>
          <CornerUpLeft size={20} />
        </button>

        {/* Two big reflection selection buttons in the center */}
        <div className={styles.headerCenter}>
          <button
            className={
              activePage === 'work'
                ? styles.activeHeaderButton
                : styles.headerSwitchButton
            }
            onClick={() => setActivePage('work')}
          >
            Work Reflection
          </button>
          <button
            className={
              activePage === 'communication'
                ? styles.activeHeaderButton
                : styles.headerSwitchButton
            }
            onClick={() => setActivePage('communication')}
          >
            Communication Reflection
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {activePage === 'communication' ? (
          <CommunicationReflection onNextPage={() => setActivePage('work')} />
        ) : (
          <WorkReflection onPrevPage={() => setActivePage('communication')} />
        )}
      </div>
    </div>
  );
}
