// src/components/ProgressTypes/ProgressTypes.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './ProgressTypes.module.css';
import { Settings } from 'lucide-react';
import MeetingDataModal from '../../HomePages/ProfileSetting/MeetingDataModal'; // new import

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
      const res = await fetch('https://teamio-backend-c5aefe033171.herokuapp.com/upload_gdocs', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Google Docs upload success: ${data.message}`);
      } else {
        setMessage(`Google Docs upload failed: ${data.error || JSON.stringify(data)}`);
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
      const res = await fetch('https://teamio-backend-c5aefe033171.herokuapp.com/upload_github', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`GitHub upload success: ${data.message}`);
      } else {
        setMessage(`GitHub upload failed: ${data.error || JSON.stringify(data)}`);
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
    setMessage('Slack file selected, but no API call is currently implemented.');
  }

  async function handleReflect() {
    setMessage('Fetching processed data from backend...');
    try {
      const res = await fetch('https://teamio-backend-c5aefe033171.herokuapp.com/process_data');
      if (!res.ok) {
        const errData = await res.json();
        setMessage(`Failed to fetch data: ${errData.error || JSON.stringify(errData)}`);
        return;
      }
      const jsonData = await res.json();
      localStorage.setItem('TeamIO_ProcessedData', JSON.stringify(jsonData));
      setMessage('Data fetched successfully! Going to reflection page...');
      navigate('/contractReflection');
    } catch (error) {
      setMessage(`Failed to fetch data: ${error.toString()}`);
    }
  }

  // Check current user
  const storedId = localStorage.getItem('TeamIO_CurrentUserId') || '1';
  const isTeamScribe = (storedId === '1'); // If user is 'Member 1', they're the scribe

  return (
    <div className={styles.dashboardContainer}>
      {/* Top row with settings icon on left, "TeamContract" on right */}
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
        
        <form className={styles.uploadForm} onSubmit={handleGdocsUpload}>
          <label className={styles.uploadLabel}>
            Google Docs File:
            <input
              type="file"
              accept=".json"
              onChange={(e) => setGdocsFile(e.target.files[0])}
            />
          </label>
          <button type="submit" className={styles.uploadButton}>
            Upload Google Docs Data
          </button>
        </form>

        <form className={styles.uploadForm} onSubmit={handleGithubUpload}>
          <label className={styles.uploadLabel}>
            GitHub File:
            <input
              type="file"
              accept=".json"
              onChange={(e) => setGithubFile(e.target.files[0])}
            />
          </label>
          <button type="submit" className={styles.uploadButton}>
            Upload GitHub Data
          </button>
        </form>

        <form className={styles.uploadForm} onSubmit={handleSlackUpload}>
          <label className={styles.uploadLabel}>
            Slack File:
            <input
              type="file"
              accept=".json"
              onChange={(e) => setSlackFile(e.target.files[0])}
            />
          </label>
          <button type="submit" className={styles.uploadButton}>
            Upload Slack Data
          </button>
        </form>
      </div>

      <div className={styles.meetingSection}>
        <p>Your current team scribe is Member 1.</p>
        {isTeamScribe ? (
          <MeetingDataModal />
        ) : (
          <p style={{ color: 'red' }}>
            Only the team scribe can record meeting info. You&apos;re not the team scribe.
          </p>
        )}
      </div>

      <div className={styles.reflectButtonContainer}>
        <button onClick={handleReflect} className={styles.reflectButton}>
          Reflect on Your Data
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
