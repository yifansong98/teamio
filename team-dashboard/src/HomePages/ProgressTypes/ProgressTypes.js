// src/components/ProgressTypes/ProgressTypes.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './ProgressTypes.module.css';
import { Settings } from 'lucide-react';
import MeetingDataModal from '../../HomePages/ProfileSetting/MeetingDataModal';

export default function ProgressTypes() {
  const [gdocsFile, setGdocsFile] = useState(null);
  const [githubFile, setGithubFile] = useState(null);
  const [slackFile, setSlackFile] = useState(null);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  async function handleGdocsUpload(e) {
    e.preventDefault();
    if (!gdocsFile) {
      setMessage('No Google Docs file selected!');
      return;
    }
    const formData = new FormData();
    formData.append('file', gdocsFile);
    try {
      const res = await fetch(
        'https://teamio-backend-c5aefe033171.herokuapp.com/upload_gdocs',
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMessage(`Google Docs upload success: ${data.message}`);
      } else {
        setMessage(
          `Google Docs upload failed: ${data.error || JSON.stringify(data)}`
        );
      }
    } catch (error) {
      setMessage(`Google Docs upload failed: ${error.toString()}`);
    }
  }

  async function handleGithubUpload(e) {
    e.preventDefault();
    if (!githubFile) {
      setMessage('No GitHub file selected!');
      return;
    }
    const formData = new FormData();
    formData.append('file', githubFile);
    try {
      const res = await fetch(
        'https://teamio-backend-c5aefe033171.herokuapp.com/upload_github',
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMessage(`GitHub upload success: ${data.message}`);
      } else {
        setMessage(
          `GitHub upload failed: ${data.error || JSON.stringify(data)}`
        );
      }
    } catch (error) {
      setMessage(`GitHub upload failed: ${error.toString()}`);
    }
  }

  async function handleSlackUpload(e) {
    e.preventDefault();
    if (!slackFile) {
      setMessage('No Slack file selected!');
      return;
    }
    // Not implemented yet
    setMessage('Slack file selected, but no API call is currently implemented.');
  }

  async function handleReflect() {
    setMessage('Fetching processed data from backend...');
    try {
      const res = await fetch(
        'https://teamio-backend-c5aefe033171.herokuapp.com/process_data'
      );
      if (!res.ok) {
        const errData = await res.json();
        setMessage(`Failed to fetch data: ${errData.error || JSON.stringify(errData)}`);
        return;
      }
      const jsonData = await res.json();
      // Store so reflection pages can see
      localStorage.setItem('TeamIO_ProcessedData', JSON.stringify(jsonData));
      setMessage('Data fetched successfully! Going to reflection page...');
      navigate('/contractReflection');
    } catch (error) {
      setMessage(`Failed to fetch data: ${error.toString()}`);
    }
  }

  function handleReattribute() {
    // Navigate to a separate Reattribute page
    navigate('/reattribute');
  }

  // Check current user
  const storedId = localStorage.getItem('TeamIO_CurrentUserId') || '1';
  const isTeamScribe = storedId === '1';

  return (
    <div className={styles.dashboardContainer}>
      {/* Top row */}
      <header className={styles.dashboardHeader}>
        <div className={styles.leftHeaderSection}>
          <Link to="/profileSetting" className={styles.settingsIconLink}>
            <Settings size={24} />
          </Link>
        </div>

        <h1 className={styles.dashboardTitle}>Team I/O</h1>

        <Link to="/teamContract" className={styles.teamContractButton}>
          Team Contract
        </Link>
      </header>

      <div className={styles.uploadSection}>
        <h2>Upload Your Data</h2>
        <h4>Google Docs File:</h4>
        <form className={styles.uploadForm} onSubmit={handleGdocsUpload}>
          <label className={styles.uploadLabel}>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setGdocsFile(e.target.files[0])}
            />
          </label>
          <button type="submit" className={styles.uploadButton}>
            Upload Data
          </button>
        </form>

        <h4>GitHub File:</h4>
        <form className={styles.uploadForm} onSubmit={handleGithubUpload}>
          <label className={styles.uploadLabel}>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setGithubFile(e.target.files[0])}
            />
          </label>
          <button type="submit" className={styles.uploadButton}>
            Upload Data
          </button>
        </form>

        <h4>Slack File:</h4>
        <form className={styles.uploadForm} onSubmit={handleSlackUpload}>
          <label className={styles.uploadLabel}>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setSlackFile(e.target.files[0])}
            />
          </label>
          <button type="submit" className={styles.uploadButton}>
            Upload Data
          </button>
        </form>
      </div>

      {/* <div className={styles.meetingSection}>
        <p>Your current team scribe is Member 1.</p>
        {isTeamScribe ? (
          <MeetingDataModal />
        ) : (
          <p style={{ color: 'red' }}>
            Only the team scribe can record meeting info. You&apos;re not the scribe.
          </p>
        )}
      </div> */}

      <div className={styles.uploadSection}>
        <h2>Reattribute Your Data</h2>
        {/* Our new "Reattribute" button */}
        <button onClick={handleReattribute} className={styles.reflectButton}>
          Reattribute
        </button>
      </div>

      <div className={styles.uploadSection}>
        <h2>Reflect on Your Data</h2>
      </div>

      <div className={styles.reflectButtonContainer}>
        <button onClick={handleReflect} className={styles.reflectButton}>
          Reflect
        </button>
      </div>

      {message && (
        <div className={styles.messageBox}>
          {message}
        </div>
      )}
    </div>
  );
}
