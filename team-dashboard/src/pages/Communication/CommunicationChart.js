import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
  Legend,
} from 'recharts';
import styles from './Communication.module.css';

const slackData = {
  messages: [
    { name: 'Oct 1', Positive: 50, Neutral: 70, Negative: 30 },
    { name: 'Oct 2', Positive: 40, Neutral: 40, Negative: 20 },
    { name: 'Oct 3', Positive: 30, Neutral: 30, Negative: 20 },
    { name: 'Oct 4', Positive: 60, Neutral: 40, Negative: 20 },
    { name: 'Oct 5', Positive: 30, Neutral: 40, Negative: 10 },
    { name: 'Oct 6', Positive: 10, Neutral: 10, Negative: 0 },
    { name: 'Oct 7', Positive: 30, Neutral: 10, Negative: 50},
  ],
  words: [
    { name: 'Oct 1', Positive: 1000, Neutral: 1500, Negative: 500 },
    { name: 'Oct 2', Positive: 800, Neutral: 900, Negative: 300 },
    { name: 'Oct 3', Positive: 600, Neutral: 700, Negative: 200 },
    { name: 'Oct 4', Positive: 1200, Neutral: 1000, Negative: 300 },
    { name: 'Oct 5', Positive: 1320, Neutral: 400, Negative: 1000 },
    { name: 'Oct 6', Positive: 1100, Neutral: 1200, Negative: 200 },
    { name: 'Oct 7', Positive: 500, Neutral: 120, Negative: 50},
  ],
};


export default function SlackChart() {
    const [selectedMetric, setSelectedMetric] = useState('messages');
    const [showSentiment, setShowSentiment] = useState(false); 
    const [showTeamMembers, setShowTeamMembers] = useState(false); // Track team member visibility
  const TeamMembersButton = () => {
    setShowTeamMembers(!showTeamMembers);
  };
    return (
        <div className={styles.mainContent}>
              {/* Left (1/3) */}
              <div className={styles.leftSection}>
                <p className={styles.paragraph}>
                  Your team have 150 messages in the past week, where 20% of them are positive and 40% are negative. The class average has 200 messages with 30% positive and 20% negative.  <br />
                  70% of your messages have been replied within a day, whereas the class average is 90%
                </p>
                <p className={styles.paragraph}>
                  Your team's average response time was 16 hours and 32 minutes. This is higher than the class average of 20 hours and 2 minutes. 
                </p>
              </div>
           
      
        <div className={styles.rightSection}>
            <select //dropdown to select the Slack metric
                className={styles.select}
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
            >
                <option value="messages">Messages</option>
                <option value="words">Words</option>
            </select>
            
            <label style={{ marginLeft: '30px'}}> 
                <input
                type="checkbox"
                style={{ width: '20px', height: '20px', marginRight: '8px' }}
                checked={showSentiment}
                onChange={(e) => setShowSentiment(e.target.checked)}
                />
                Show Sentiment
                {/*checkbox splits bars by sentiment*/}
            </label>

            <button onClick={TeamMembersButton} className={styles.team_button}>
              Show Team Members
            </button>

            <div className={styles.chartContainer}>
              <BarChart
                width={600}
                height={400}
                barSize={40}
                data={slackData[selectedMetric]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {showSentiment ? (
                <>
                  <Bar dataKey="Positive" stackId="a" fill="#82ca9d" />
                  <Bar dataKey="Neutral" stackId="a" fill="#8884d8" />
                  <Bar dataKey="Negative" stackId="a" fill="#ff7f7f" />
                </>
                ) : (
                  <Bar dataKey={(entry) => entry.Positive + entry.Neutral + entry.Negative} fill="#8884d8" name="Total Messages"/>
                  
                )}
              </BarChart>
            </div>
      </div>

    </div>
  );
}