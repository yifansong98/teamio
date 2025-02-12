import React from 'react';
import { TriangleAlert } from 'lucide-react';
import styles from './Communication.module.css';

export default function CommunicationHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.leftHeading}>
        <div className={styles.iconWrapper} style={{ backgroundColor: '#ebbe4d' }}>
          <TriangleAlert size={30} color="white" />
        </div>
        <h1 className={styles.title}>Communication</h1>
      </div>
      <div className={styles.teamName}>
        <h1> The Incredibles
        </h1>
      </div>
    </header>
  );
}