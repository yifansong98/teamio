// src/components/ProgressTypes/ProgressTypes.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './ProgressTypes.module.css';

export default function ProgressTypes() {
  // We'll store selected file(s) in local state for Google, GitHub, Slack
  const [gdocsFile, setGdocsFile] = useState(null);
  const [githubFile, setGithubFile] = useState(null);
  const [slackFile, setSlackFile] = useState(null);

  // For user-friendly status messages
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
    // For now, let's just do a placeholder
    setMessage('Slack file selected, but no API call is currently implemented.');
  }

  // We add a new function to fetch and store the processed data from the backend
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
      // Save to localStorage so the reflection pages can read it
      localStorage.setItem('TeamIO_ProcessedData', JSON.stringify(jsonData));
      setMessage('Data fetched successfully! Going to reflection page...');
      // now navigate to reflection
      navigate('/contractReflection');
    } catch (error) {
      setMessage(`Failed to fetch data: ${error.toString()}`);
    }
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Team I/O</h1>
        <Link to="/teamContract" className={styles.teamContractButton}>
          Team Contract
        </Link>
      </header>

      <div className={styles.uploadSection}>
        <h2>Upload Your Data</h2>
        
        {/* Google Docs Upload */}
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

        {/* GitHub Upload */}
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

        {/* Slack Upload */}
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

      {/* Reflect on data button */}
      <div className={styles.reflectButtonContainer}>
        {/* Instead of a direct link, we'll call handleReflect so we can fetch the data first */}
        <button onClick={handleReflect} className={styles.reflectButton}>
          Reflect on Your Data
        </button>
      </div>

      {/* Status / message display */}
      {message && (
        <div className={styles.messageBox}>
          {message}
        </div>
      )}
    </div>
  );
}
