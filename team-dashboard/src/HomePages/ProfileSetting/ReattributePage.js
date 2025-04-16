import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ReattributePage.module.css';

const TEAM_MEMBERS = ['Member 1','Member 2','Member 3','Member 4'];

export default function ReattributePage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('github'); 
  // "github" or "gdocs"

  // We'll store GitHub vs. GDocs contributions separately
  const [ghContributions, setGhContributions] = useState([]);
  const [gdContributions, setGdContributions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // current logged-in user
  const currentId = localStorage.getItem('TeamIO_CurrentUserId') || '1';
  const currentUser = `Member ${currentId}`;

  useEffect(() => {
    async function fetchContributions() {
      try {
        const res = await fetch(
          'https://teamio-backend-c5aefe033171.herokuapp.com/list_contributions'
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(`Failed to fetch: ${errData.error || res.status}`);
        }
        const data = await res.json();
        // data is an array of { id, tool, dummy_user, timestamp, message }

        // We want to store them separately for the two tabs.
        // We'll also create "sliderValues" (an object {m1: number, m2: number, ...}) so that the sum=100.
        // For demonstration, we set the dummy_user slider to 100, the rest to 0, unless you'd prefer a split.
        const ghList = [];
        const gdList = [];

        data.forEach((item) => {
          const sliderValues = {};
          TEAM_MEMBERS.forEach((m) => {
            sliderValues[m] = (m === item.dummy_user) ? 100 : 0; 
          });

          if (item.tool === 'github') {
            ghList.push({ ...item, sliderValues });
          } else {
            // 'gdocs'
            gdList.push({ ...item, sliderValues });
          }
        });

        setGhContributions(ghList);
        setGdContributions(gdList);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setErrorMessage(err.message || 'Failed to load data');
        setLoading(false);
      }
    }
    fetchContributions();
  }, []);

  // helper function to format date/time
  function formatTimestamp(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr; 
    return d.toLocaleString();
  }

  // If the user is not the initial contributor, we disable editing
  function canEdit(initialContributor) {
    return (initialContributor === currentUser);
  }

  // Called when a slider changes
  function handleSliderChange(listSetter, listData, itemId, member, newVal) {
    const updated = listData.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          sliderValues: {
            ...item.sliderValues,
            [member]: parseFloat(newVal) || 0,
          },
        };
      }
      return item;
    });
    listSetter(updated);
  }

  function handleReturn() {
    navigate('/teamio');
  }

  // The table for "GitHub Commits" tab
  function renderGitHubTable() {
    if (!ghContributions.length) {
      return <p>No GitHub commits found. Please upload data first.</p>;
    }
    return (
      <div className={styles.tableContainer}>
        <table className={styles.reattributeTable}>
          <thead>
            <tr>
              <th>Initial</th>
              <th>Timestamp</th>
              <th>Commit Message</th>
              {TEAM_MEMBERS.map((m) => (
                <th key={m}>{m}</th>
              ))}
              <th>Sum</th>
            </tr>
          </thead>
          <tbody>
            {ghContributions.map((item) => {
              const sumVal = Object.values(item.sliderValues).reduce((a, b) => a + b, 0);
              const sumIs100 = Math.abs(sumVal - 100) < 0.0001; // within floating tolerance

              return (
                <tr key={`gh-${item.id}`}>
                  <td>{item.dummy_user}</td>
                  <td>{formatTimestamp(item.timestamp)}</td>
                  <td>{item.message}</td>
                  {TEAM_MEMBERS.map((m) => {
                    const val = item.sliderValues[m] || 0;
                    return (
                      <td key={m} style={{ minWidth: '90px' }}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          disabled={!canEdit(item.dummy_user)}
                          value={val}
                          onChange={(e) =>
                            handleSliderChange(
                              setGhContributions,
                              ghContributions,
                              item.id,
                              m,
                              e.target.value
                            )
                          }
                          className={styles.sliderInput}
                        />
                        <div className={styles.sliderValue}>
                          {val}%
                        </div>
                      </td>
                    );
                  })}
                  <td>
                    {sumIs100 ? (
                      <span className={styles.sumOkay}>100%</span>
                    ) : (
                      <span className={styles.sumWarning}>
                        {sumVal.toFixed(0)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // The table for "Google Docs Edits" tab
  function renderGDocsTable() {
    if (!gdContributions.length) {
      return <p>No Google Docs edits found. Please upload data first.</p>;
    }
    return (
      <div className={styles.tableContainer}>
        <table className={styles.reattributeTable}>
          <thead>
            <tr>
              <th>Initial</th>
              <th>Timestamp</th>
              <th>Edit Content</th>
              {TEAM_MEMBERS.map((m) => (
                <th key={m}>{m}</th>
              ))}
              <th>Sum</th>
            </tr>
          </thead>
          <tbody>
            {gdContributions.map((item) => {
              const sumVal = Object.values(item.sliderValues).reduce((a, b) => a + b, 0);
              const sumIs100 = Math.abs(sumVal - 100) < 0.0001;

              return (
                <tr key={`gd-${item.id}`}>
                  <td>{item.dummy_user}</td>
                  <td>{formatTimestamp(item.timestamp)}</td>
                  {/* For docs, we have no message, but let's keep a blank cell */}
                  <td>{item.message}</td>
                  {TEAM_MEMBERS.map((m) => {
                    const val = item.sliderValues[m] || 0;
                    return (
                      <td key={m} style={{ minWidth: '90px' }}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          disabled={!canEdit(item.dummy_user)}
                          value={val}
                          onChange={(e) =>
                            handleSliderChange(
                              setGdContributions,
                              gdContributions,
                              item.id,
                              m,
                              e.target.value
                            )
                          }
                          className={styles.sliderInput}
                        />
                        <div className={styles.sliderValue}>
                          {val}%
                        </div>
                      </td>
                    );
                  })}
                  <td>
                    {sumIs100 ? (
                      <span className={styles.sumOkay}>100%</span>
                    ) : (
                      <span className={styles.sumWarning}>
                        {sumVal.toFixed(0)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <h2>Reattribute Contributions</h2>
        <p>Loading contributions from DB...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.pageContainer}>
        <h2>Reattribute Contributions</h2>
        <p className={styles.errorText}>Error: {errorMessage}</p>
        <button onClick={handleReturn} className={styles.returnButton}>
          Return
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <h2>Reattribute Contributions</h2>
      <p className={styles.introText}>
        Use the sliders to assign percentage credit among your team members. 
        The sum for each row should be 100%. 
        Only the initial contributor can adjust the sliders.
      </p>

      {/* Tab Buttons */}
      <div className={styles.tabButtons}>
        <button
          onClick={() => setActiveTab('github')}
          className={
            activeTab === 'github'
              ? styles.activeTabButton
              : styles.tabButton
          }
        >
          GitHub Commits
        </button>
        <button
          onClick={() => setActiveTab('gdocs')}
          className={
            activeTab === 'gdocs'
              ? styles.activeTabButton
              : styles.tabButton
          }
        >
          Google Docs Edits
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'github' ? renderGitHubTable() : renderGDocsTable()}
      </div>

      <div className={styles.bottomButtons}>
        <button onClick={handleReturn} className={styles.returnButton}>
          Return
        </button>
      </div>
    </div>
  );
}
