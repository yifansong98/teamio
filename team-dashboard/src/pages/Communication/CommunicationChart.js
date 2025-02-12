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
    { name: 'Anna', Positive: 50, Neutral: 70, Negative: 30 },
    { name: 'Harry', Positive: 40, Neutral: 40, Negative: 20 },
    { name: 'Daniel', Positive: 30, Neutral: 30, Negative: 20 },
    { name: 'Sarah', Positive: 60, Neutral: 40, Negative: 20 },
  ],
  words: [
    { name: 'Anna', Positive: 1000, Neutral: 1500, Negative: 500 },
    { name: 'Harry', Positive: 800, Neutral: 900, Negative: 300 },
    { name: 'Daniel', Positive: 600, Neutral: 700, Negative: 200 },
    { name: 'Sarah', Positive: 1200, Neutral: 1000, Negative: 300 },
  ],
};


export default function SlackChart() {
    const [selectedMetric, setSelectedMetric] = useState('messages');
    const [showSentiment, setShowSentiment] = useState(false); 
    return (
        <div className={styles.mainContent}>
              {/* Left (1/3) */}
              <div className={styles.leftSection}>
                <p className={styles.paragraph}>
                  Your team have 150 messages in the past week, where 20% of them are positive and 40% are negative. The class average has 200 messages with 30% positive and 20% negative. <br /> <br /> <br />
                  70% of your messages have been replied within a day, whereas the class average is 90%
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
            
            <label style={{ marginLeft: '30px' }}> 
                <input
                type="checkbox"
                checked={showSentiment}
                onChange={(e) => setShowSentiment(e.target.checked)}
                />
                Show Sentiment
                {/*checkbox splits bars by sentiment*/}
            </label>

        <BarChart
          width={500}
          height={300}
          data={slackData[selectedMetric]}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend 
          />
          <Bar dataKey="value" 
          fill="#8884d8" 
          
          />
          {showSentiment ? (
          <>
            <Bar dataKey="Positive" stackId="a" fill="#82ca9d" />
            <Bar dataKey="Neutral" stackId="a" fill="#8884d8" />
            <Bar dataKey="Negative" stackId="a" fill="#ff7f7f" />
          </>
          ) : (
            <Bar dataKey={(entry) => entry.Positive + entry.Neutral + entry.Negative} fill="#8884d8" />
          )}
        </BarChart>
      </div>

    </div>
  );
}