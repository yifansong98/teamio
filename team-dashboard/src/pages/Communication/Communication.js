import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import CommunicationHeader from './CommunicationHeader';
import CommunicationChart from './CommunicationChart';
import styles from './Communication.module.css';

export default function Communication() {
  const navigate = useNavigate();

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
      <CommunicationHeader/>
      <div className={styles.deliverableBehavior}>
      <h1 className={styles.subTitle}>Revised Functional Prototype</h1>
      <p className={styles.subDescription}>
         Some team members were not responsive or productive in communication.
      </p>
      </div>
     
      <div className={styles.mainChartSection}>
        <div>
            <h2 className={styles.behaviorTitle}><em>Desired Behavior</em></h2>
            <p className={styles.behaviorText}>
            <em>A team demonstrates effective communication with productive and active participation in the communication channels. </em>
            </p>
        </div>
        <CommunicationChart contractDataMap={contractDataMap} />

        <div className={styles.returnButtonContainer}>
          <button className={styles.backButton} onClick={handleReturnClick}>
            <ArrowLeft size={16} /> Return
          </button>
        </div>
      </div>
    </div>
  );
}
