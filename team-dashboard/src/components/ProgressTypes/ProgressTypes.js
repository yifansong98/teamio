// src/components/ProgressTypes/ProgressTypes.js
import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import BehaviorCard from '../BehaviorCard/BehaviorCard';
import styles from './ProgressTypes.module.css';

export default function ProgressTypes() {
  const sections = [
    {
      title: 'Work Distribution',
      description: 'The team demonstrated fair distribution of work.',
      icon: <Check size={24} color="white" />,
      status: 'success',
      route: '/workDistribution',
    },
    {
      title: 'Work Progression',
      description: "Some team members didn't start early or provide steady progress",
      icon: <AlertTriangle size={24} color="white" />,
      status: 'warning',
      route: '/WorkProgression',
    },
    {
      title: 'Interaction',
      description: "The team commented and revised each other's work",
      icon: <Check size={24} color="white" />,
      status: 'success',
      route: '/interaction', // Not yet implemented
    },
    {
      title: 'Communication',
      description: 'Some team members were not responsive or productive in communication',
      icon: <AlertTriangle size={24} color="white" />,
      status: 'warning',
      route: '/communication', // Not yet implemented
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Team I/O</h1>
        
        {/* New "Team Contract" button (top-right) */}
        <Link to="/teamContract" className={styles.teamContractButton}>
          Team Contract
        </Link>
      </header>

      <div className={styles.dashboardGrid}>
        {sections.map((section) => (
          <BehaviorCard
            key={section.title}
            title={section.title}
            description={section.description}
            icon={section.icon}
            status={section.status}
            route={section.route}
          />
        ))}
      </div>
    </div>
  );
}
