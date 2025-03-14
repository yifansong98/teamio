// src/ContractPages/CommunicationNorms/CommunicationBarChart.js
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

export default function CommunicationBarChart() {
  // Dummy aggregated team data for messages (stacked: polite, neutral, impolite)
  const aggregatedMessages = [
    { day: 'Day 1', polite: 10, neutral: 5, impolite: 0 },
    { day: 'Day 2', polite: 7, neutral: 8, impolite: 1 },
    { day: 'Day 3', polite: 12, neutral: 4, impolite: 0 },
    { day: 'Day 4', polite: 5, neutral: 6, impolite: 0 },
    { day: 'Day 5', polite: 9, neutral: 3, impolite: 0 },
    { day: 'Day 6', polite: 11, neutral: 2, impolite: 1 },
    { day: 'Day 7', polite: 6, neutral: 4, impolite: 0 },
  ];
  // Dummy user data for messages
  const userMessages = [
    { day: 'Day 1', polite: 4, neutral: 1, impolite: 0 },
    { day: 'Day 2', polite: 3, neutral: 2, impolite: 0 },
    { day: 'Day 3', polite: 5, neutral: 1, impolite: 0 },
    { day: 'Day 4', polite: 2, neutral: 2, impolite: 0 },
    { day: 'Day 5', polite: 3, neutral: 1, impolite: 0 },
    { day: 'Day 6', polite: 4, neutral: 1, impolite: 0 },
    { day: 'Day 7', polite: 2, neutral: 2, impolite: 0 },
  ];

  // Dummy aggregated team data for words (single total per day) – more varied than a fixed multiplier
  const aggregatedWordsTotal = [
    { day: 'Day 1', total: 90 },
    { day: 'Day 2', total: 60 },
    { day: 'Day 3', total: 110 },
    { day: 'Day 4', total: 45 },
    { day: 'Day 5', total: 80 },
    { day: 'Day 6', total: 100 },
    { day: 'Day 7', total: 55 },
  ];
  // Dummy user data for words
  const userWordsTotal = [
    { day: 'Day 1', total: 30 },
    { day: 'Day 2', total: 20 },
    { day: 'Day 3', total: 40 },
    { day: 'Day 4', total: 15 },
    { day: 'Day 5', total: 25 },
    { day: 'Day 6', total: 35 },
    { day: 'Day 7', total: 20 },
  ];

  // State to choose between "messages" and "words"
  const [selectedMetric, setSelectedMetric] = useState('messages');
  // Global "Show my data" state
  const [showMyData, setShowMyData] = useState(false);

  // Prepare combined data based on selected metric.
  // For "messages", we combine aggregatedMessages and userMessages into a single object.
  // For "words", we combine aggregatedWordsTotal and userWordsTotal.
  const combinedData =
    selectedMetric === 'messages'
      ? aggregatedMessages.map((teamItem, i) => ({
          day: teamItem.day,
          teamPolite: teamItem.polite,
          teamNeutral: teamItem.neutral,
          teamImpolite: teamItem.impolite,
          userPolite: userMessages[i].polite,
          userNeutral: userMessages[i].neutral,
          userImpolite: userMessages[i].impolite,
        }))
      : aggregatedWordsTotal.map((teamItem, i) => ({
          day: teamItem.day,
          teamTotal: teamItem.total,
          userTotal: userWordsTotal[i].total,
        }));

  // Set the y-axis label based on the selected metric.
  const yAxisLabel =
    selectedMetric === 'messages' ? "# of messages" : "# of words";

  // Define a custom legend for messages view (Polite, Neutral, Impolite)
  const customLegendPayload = [
    { value: 'Polite', type: 'square', color: '#82ca9d' },
    { value: 'Neutral', type: 'square', color: '#8884d8' },
    { value: 'Impolite', type: 'square', color: '#ff7f7f' },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Dropdown for metric selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '0.5rem', fontSize: '1rem' }}>View:</label>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          style={{ fontSize: '1rem', padding: '0.3rem' }}
        >
          <option value="messages"># of messages</option>
          <option value="words"># of words</option>
        </select>
      </div>

      {/* Bar Chart */}
      {selectedMetric === 'messages' ? (
        <BarChart
          width={700}
          height={350}
          data={combinedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
            }}
          />
          <Tooltip />
          <Legend payload={customLegendPayload} />
          {showMyData ? (
            <>
              {/* Team bars with lighter opacity */}
              <Bar dataKey="teamPolite" stackId="team" fill="#82ca9d" fillOpacity={0.6} />
              <Bar dataKey="teamNeutral" stackId="team" fill="#8884d8" fillOpacity={0.6} />
              <Bar dataKey="teamImpolite" stackId="team" fill="#ff7f7f" fillOpacity={0.6} />
              {/* User bars fully opaque */}
              <Bar dataKey="userPolite" stackId="user" fill="#82ca9d" />
              <Bar dataKey="userNeutral" stackId="user" fill="#8884d8" />
              <Bar dataKey="userImpolite" stackId="user" fill="#ff7f7f" />
            </>
          ) : (
            <>
              <Bar dataKey="teamPolite" stackId="a" fill="#82ca9d" />
              <Bar dataKey="teamNeutral" stackId="a" fill="#8884d8" />
              <Bar dataKey="teamImpolite" stackId="a" fill="#ff7f7f" />
            </>
          )}
        </BarChart>
      ) : (
        // For "words": a simple bar chart with one value per day and uniform color
        <BarChart
          width={700}
          height={350}
          data={combinedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
            }}
          />
          <Tooltip />
          {/* No legend for words view */}
          {showMyData ? (
            <>
              {/* Team bars: lighter */}
              <Bar dataKey="teamTotal" fill="#0088FE" fillOpacity={0.6} />
              {/* User bars: full opacity */}
              <Bar dataKey="userTotal" fill="#0088FE" />
            </>
          ) : (
            <Bar dataKey="teamTotal" fill="#0088FE" />
          )}
        </BarChart>
      )}

      {/* "Show my data" checkbox below the chart */}
      <div style={{ marginTop: '1rem' }}>
        <label style={{ fontSize: '1rem', color: '#333' }}>
          <input
            type="checkbox"
            checked={showMyData}
            onChange={() => setShowMyData(!showMyData)}
            style={{ marginRight: '0.5rem' }}
          />
          Show my data
        </label>
      </div>
    </div>
  );
}
