// src/pages/WorkProgression/WorkProgression.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import WorkProgressionHeader from './WorkProgressionHeader';
import WorkProgressionChartSection from './WorkProgressionChartSection';
import styles from './WorkProgression.module.css';

/**
 * Main page layout for Work Progression:
 * - uses the same styling approach as WorkDistribution
 * - has a "Desired Behavior" box plus subTitle, subDescription
 * - calls <WorkProgressionChartSection> for the chart & controls
 */
export default function WorkProgression() {
  const navigate = useNavigate();

  const handleReturnClick = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      {/* Header with an alert icon and a Team Contract button */}
      <WorkProgressionHeader />

      <h1 className={styles.subTitle}>[Team Name] - [Assignment Name]</h1>
      <p className={styles.subDescription}>
        Some team members didn’t start early or provide steady progress
      </p>

      {/* Desired Behavior block */}
      <div className={styles.desiredBehavior}>
        <h2 className={styles.behaviorTitle}>Desired Behavior</h2>
        <p className={styles.behaviorText}>
          A team makes contributions in a timely manner when they start work
          early and make steady progress throughout the project.
        </p>
      </div>

      {/* Chart + text portion */}
      <WorkProgressionChartSection />

      {/* Return button at bottom-left */}
      <div className={styles.returnButtonContainer}>
        <button className={styles.backButton} onClick={handleReturnClick}>
          <ArrowLeft size={16} /> Return
        </button>
      </div>
    </div>
  );
}
