// src/pages/WorkProgression/WorkProgressionHeader.js
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './WorkProgression.module.css';

export default function WorkProgressionHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.leftHeading}>
        {/* Warning icon: #ecc94b is a typical 'warning' color */}
        <div className={styles.iconwrapper} style={{ backgroundColor: '#ecc94b' }}>
          <AlertTriangle size={20} color="white" />
        </div>
        <h1 className={styles.title}>Work Progression</h1>
      </div>

      {/* You can open a Team Contract modal from here if needed */}
      <button className={styles.teamContractButton}>
        Team Contract
      </button>
    </header>
  );
}
