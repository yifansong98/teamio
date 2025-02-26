// src/ContractPages/Visualizations/CommunicationBar.js
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Dummy data for messages (stacked bars)
const messagesAggregatedData = [
  { name: 'Day 1', Polite: 40, Neutral: 30, Aggressive: 10 },
  { name: 'Day 2', Polite: 35, Neutral: 40, Aggressive: 15 },
  { name: 'Day 3', Polite: 50, Neutral: 20, Aggressive: 15 },
  { name: 'Day 4', Polite: 45, Neutral: 35, Aggressive: 20 },
  { name: 'Day 5', Polite: 40, Neutral: 30, Aggressive: 15 },
  { name: 'Day 6', Polite: 55, Neutral: 25, Aggressive: 10 },
  { name: 'Day 7', Polite: 45, Neutral: 25, Aggressive: 20 },
];

const messagesUserData = [
  { name: 'Day 1', Polite: 20, Neutral: 15, Aggressive: 5 },
  { name: 'Day 2', Polite: 25, Neutral: 20, Aggressive: 10 },
  { name: 'Day 3', Polite: 30, Neutral: 10, Aggressive: 8 },
  { name: 'Day 4', Polite: 15, Neutral: 20, Aggressive: 5 },
  { name: 'Day 5', Polite: 25, Neutral: 15, Aggressive: 5 },
  { name: 'Day 6', Polite: 20, Neutral: 15, Aggressive: 10 },
  { name: 'Day 7', Polite: 25, Neutral: 20, Aggressive: 10 },
];

// Dummy data for words (simple bar chart)
// Aggregated: total words per day for the team
const wordsAggregatedData = [
  { name: 'Day 1', totalWords: 500 },
  { name: 'Day 2', totalWords: 600 },
  { name: 'Day 3', totalWords: 450 },
  { name: 'Day 4', totalWords: 700 },
  { name: 'Day 5', totalWords: 650 },
  { name: 'Day 6', totalWords: 800 },
  { name: 'Day 7', totalWords: 750 },
];

// Dummy data for words (individual)
const wordsUserData = [
  { name: 'Day 1', totalWords: 250 },
  { name: 'Day 2', totalWords: 300 },
  { name: 'Day 3', totalWords: 220 },
  { name: 'Day 4', totalWords: 350 },
  { name: 'Day 5', totalWords: 320 },
  { name: 'Day 6', totalWords: 400 },
  { name: 'Day 7', totalWords: 370 },
];

// For messages: combine aggregated and user data for side-by-side view.
function combineMessagesData(agg, user) {
  return agg.map((d, i) => ({
    name: d.name,
    teamPolite: d.Polite,
    teamNeutral: d.Neutral,
    teamAggressive: d.Aggressive,
    userPolite: user[i]?.Polite || 0,
    userNeutral: user[i]?.Neutral || 0,
    userAggressive: user[i]?.Aggressive || 0,
  }));
}

// For words: combine aggregated and user data for side-by-side view.
function combineWordsData(agg, user) {
  return agg.map((d, i) => ({
    name: d.name,
    teamTotal: d.totalWords,
    userTotal: user[i]?.totalWords || 0,
  }));
}

export default function CommunicationBar({ showMyData, mode }) {
  // Always compute combined data unconditionally.
  const combinedMessagesData = useMemo(
    () => combineMessagesData(messagesAggregatedData, messagesUserData),
    []
  );
  const combinedWordsData = useMemo(
    () => combineWordsData(wordsAggregatedData, wordsUserData),
    []
  );

  if (mode === 'messages') {
    return (
      <div style={{ textAlign: 'center' }}>
        {showMyData ? (
          <BarChart
            width={800}
            height={400}
            data={combinedMessagesData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: '# of messages', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend
              payload={[
                { value: 'Polite', type: 'square', color: '#82ca9d' },
                { value: 'Neutral', type: 'square', color: '#8884d8' },
                { value: 'Aggressive', type: 'square', color: '#ff7f7f' },
              ]}
            />
            {/* Team stacked bars */}
            <Bar dataKey="teamPolite" stackId="team" fill="rgba(130,202,157,0.6)" />
            <Bar dataKey="teamNeutral" stackId="team" fill="rgba(136,132,216,0.6)" />
            <Bar dataKey="teamAggressive" stackId="team" fill="rgba(255,127,127,0.6)" />
            {/* User stacked bars */}
            <Bar dataKey="userPolite" stackId="user" fill="rgba(130,202,157,1)" />
            <Bar dataKey="userNeutral" stackId="user" fill="rgba(136,132,216,1)" />
            <Bar dataKey="userAggressive" stackId="user" fill="rgba(255,127,127,1)" />
          </BarChart>
        ) : (
          <BarChart
            width={800}
            height={400}
            data={messagesAggregatedData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: '# of messages', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend
              payload={[
                { value: 'Polite', type: 'square', color: '#82ca9d' },
                { value: 'Neutral', type: 'square', color: '#8884d8' },
                { value: 'Aggressive', type: 'square', color: '#ff7f7f' },
              ]}
            />
            <Bar dataKey="Polite" stackId="a" fill="#82ca9d" />
            <Bar dataKey="Neutral" stackId="a" fill="#8884d8" />
            <Bar dataKey="Aggressive" stackId="a" fill="#ff7f7f" />
          </BarChart>
        )}
      </div>
    );
  } else if (mode === 'words') {
    return (
      <div style={{ textAlign: 'center' }}>
        {showMyData ? (
          // Side-by-side view: grouped bars with two bars per day.
          <BarChart
            width={800}
            height={400}
            data={combinedWordsData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: '# of words', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => value} />
            {/* No legend for words view */}
            <Bar dataKey="teamTotal" fill="#82ca9d" name="Team" />
            <Bar dataKey="userTotal" fill="#ff7f7f" name="You" />
          </BarChart>
        ) : (
          // Aggregated view: one bar per day.
          <BarChart
            width={800}
            height={400}
            data={wordsAggregatedData}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: '# of words', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => value} />
            {/* No legend */}
            <Bar dataKey="totalWords" fill="#82ca9d" />
          </BarChart>
        )}
      </div>
    );
  } else {
    return null;
  }
}
