// src/pages/WorkDistribution/WorkDistribution.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import WorkDistributionHeader from './WorkDistributionHeader';
import WorkDistributionChartSection from './WorkDistributionChartSection';
import TeamContractModal from './TeamContractModal';

import styles from './WorkDistribution.module.css';

export default function WorkDistribution() {
  const navigate = useNavigate();

  const [showTeamContract, setShowTeamContract] = useState(false);

  // This object holds the user’s planned distribution for each tool
  // e.g. { GoogleDocs: [...], GitHub: [...] }
  const [contractDataMap, setContractDataMap] = useState({});

  const handleReturnClick = () => {
    navigate('/');
  };

  // Called by the modal on Save
  const handleSaveContract = (tool, plannedArray) => {
    setContractDataMap((prev) => ({
      ...prev,
      [tool]: plannedArray,
    }));
  };

  return (
    <div className={styles.container}>
      {/* Top heading and description */}
      <WorkDistributionHeader />

      {/* Extra descriptive text */}
      <h1 className={styles.subTitle}>Incredibles - Revised Functional Prototype</h1>
      <p className={styles.subDescription}>
        The team demonstrated fair distribution of work.
      </p>

      {/* Explanation of desired behavior */}
      <div className={styles.desiredBehavior}>
        <h2 className={styles.behaviorTitle}>Desired Behavior</h2>
        <p className={styles.behaviorText}>
          Team members should contribute equally to the project, demonstrating a
          balanced workload across all phases. Each member should take ownership
          of their tasks while supporting others when needed.
        </p>
      </div>

      {/* Chart area, Gini info, and controls */}
      <WorkDistributionChartSection contractDataMap={contractDataMap} />

      {/* Return button at bottom-left */}
      <div className={styles.returnButtonContainer}>
        <button className={styles.backButton} onClick={handleReturnClick}>
          <ArrowLeft size={16} /> Return
        </button>
      </div>

      {/* Button to open Team Contract Modal - top-level for convenience */}
      <div className={styles.topRightContainer}>
        <button
          className={styles.button}
          onClick={() => setShowTeamContract(true)}
        >
          Team Contract
        </button>
      </div>

      {/* Conditionally render the contract modal */}
      {showTeamContract && (
        <TeamContractModal
          onClose={() => setShowTeamContract(false)}
          onSaveContract={handleSaveContract}
        />
      )}
    </div>
  );
}
