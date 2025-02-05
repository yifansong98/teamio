// src/components/BehaviorCard/BehaviorCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BehaviorCard.module.css';
import clsx from 'clsx';

export default function BehaviorCard({ 
  title, 
  description, 
  icon, 
  status = 'success', 
  route 
}) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (route) navigate(route);
  };

  return (
    <div 
      onClick={handleCardClick} 
      className={clsx(styles.dashboardCard, {
        [styles.warning]: status === 'warning',
        [styles.success]: status === 'success',
      })}
    >
      <div className={styles.cardContent}>
        <div 
          className={clsx(styles.iconWrapper, {
            [styles.iconWarning]: status === 'warning',
            [styles.iconSuccess]: status === 'success',
          })}
        >
          {icon}
        </div>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </div>
    </div>
  );
}
