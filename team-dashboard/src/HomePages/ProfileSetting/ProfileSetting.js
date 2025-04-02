// src/HomePages/ProfileSetting/ProfileSetting.js
import React, { useState } from 'react';
import styles from './ProfileSetting.module.css';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetting() {
  // We'll read the existing chosen user ID from localStorage if present
  const storedUserId = localStorage.getItem('TeamIO_CurrentUserId') || '1';

  const [teamName, setTeamName] = useState('');
  const [dummyUserId, setDummyUserId] = useState(storedUserId);

  const navigate = useNavigate();

  // Handle changes to dummy user selection
  function handleDummyUserChange(e) {
    const newVal = e.target.value;
    setDummyUserId(newVal);
    // store in local storage
    localStorage.setItem('TeamIO_CurrentUserId', newVal);
  }

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.pageTitle}>Profile Settings</h2>

      <div className={styles.infoLine}>
        You&apos;re logged in as: <strong>xxx@illinois.edu</strong>
      </div>
      <div className={styles.infoLine}>
        Based on our data, you&apos;re enrolled in Section <strong>N</strong>.
      </div>
      <div className={styles.infoLine}>
        Your teammates are <strong>YYY (yyy@illinois.edu)</strong> and 
        <strong> ZZZ (zzz@illinois.edu)</strong>.
      </div>
      <div className={styles.infoLine}>
        Please let us know as soon as possible if any of the above information is incorrect.
      </div>

      <div className={styles.infoLine}>
        Your team doesn&apos;t have a team name yet. Please create one:
      </div>
      <input
        type="text"
        className={styles.inputBox}
        placeholder="Team Name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
      />

      <div className={styles.infoLine}>
        For testing purposes, please enter your dummy user id:
      </div>
      <select
        className={styles.selectBox}
        value={dummyUserId}
        onChange={handleDummyUserChange}
      >
        <option value="1">Member 1</option>
        <option value="2">Member 2</option>
        <option value="3">Member 3</option>
        <option value="4">Member 4</option>
        <option value="5">Member 5</option>
        <option value="6">Member 6</option>
      </select>

      <button
        className={styles.returnButton}
        onClick={() => navigate('/teamio')}
      >
        Return to Home
      </button>
    </div>
  );
}
