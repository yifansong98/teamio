// src/pages/WorkDistribution/WorkDistributionHeader.js
import React from 'react';
import { Check } from 'lucide-react';
import styles from './WorkDistribution.module.css';

export default function WorkDistributionHeader({ onTeamContractClick }) {
  return (
    <header className={styles.header}>
      <div className={styles.leftHeading}>
        <div className={styles.iconwrapper} style={{ backgroundColor: '#48bb78' }}>
          <Check size={20} color="white" />
        </div>
        <h1 className={styles.title}>Work Distribution</h1>
      </div>

      {/* Button on the right, more salient style */}
      <button
        className={styles.teamContractButton}
        onClick={onTeamContractClick}
      >
        Team Contract
      </button>
    </header>
  );
}
