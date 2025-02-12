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

  // Holds planned data
  const [contractDataMap, setContractDataMap] = useState({});

  const handleReturnClick = () => {
    navigate('/');
  };

  const handleSaveContract = (tool, plannedArray) => {
    setContractDataMap((prev) => ({
      ...prev,
      [tool]: plannedArray,
    }));
  };

  return (
    <div className={styles.container}>
      {/* Pass a callback so the header's button can open the modal */}
      <WorkDistributionHeader
        onTeamContractClick={() => setShowTeamContract(true)}
      />

      <h1 className={styles.subTitle}>Team Name - Assignment X</h1>
      <p className={styles.subDescription}>
        The team demonstrated fair distribution of work.
      </p>

      <div className={styles.desiredBehavior}>
        <h2 className={styles.behaviorTitle}>Desired Behavior</h2>
        <p className={styles.behaviorText}>
          Team members should contribute equally to the project, demonstrating a
          balanced workload across phases...
        </p>
      </div>

      <WorkDistributionChartSection contractDataMap={contractDataMap} />

      <div className={styles.returnButtonContainer}>
        <button className={styles.backButton} onClick={handleReturnClick}>
          <ArrowLeft size={16} /> Return
        </button>
      </div>

      {showTeamContract && (
        <TeamContractModal
          onClose={() => setShowTeamContract(false)}
          onSaveContract={handleSaveContract}
        />
      )}
    </div>
  );
}
