// src/pages/WorkDistribution/TeamContractModal.js
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
  LabelList,
} from 'recharts';
import styles from './TeamContractModal.module.css';

/**
 * Each tool's default array must sum to 100 by default.
 * 'errorVal' is the ± range.
 */
const initialDataMap = {
  '': [],
  GoogleDocs: [
    { name: 'Anna', value: 25, errorVal: 5 },
    { name: 'Harry', value: 25, errorVal: 5 },
    { name: 'Daniel', value: 25, errorVal: 5 },
    { name: 'Sarah', value: 25, errorVal: 5 },
  ],
  GitHub: [
    { name: 'Anna', value: 25, errorVal: 5 },
    { name: 'Harry', value: 25, errorVal: 5 },
    { name: 'Daniel', value: 25, errorVal: 5 },
    { name: 'Sarah', value: 25, errorVal: 5 },
  ],
};

export default function TeamContractModal({ onClose, onSaveContract }) {
  const [selectedTool, setSelectedTool] = useState('');
  // Keep a local copy of planned data for each tool
  const [chartDataMap, setChartDataMap] = useState(initialDataMap);

  const currentData = chartDataMap[selectedTool] || [];
  const total = currentData.reduce((sum, item) => sum + item.value, 0);

  const handleToolChange = (e) => {
    setSelectedTool(e.target.value);
  };

  // Update value/errorVal in local state
  const handleValueChange = (index, field, newVal) => {
    const numeric = parseInt(newVal, 10) || 0;
    const updated = [...currentData];
    updated[index] = {
      ...updated[index],
      [field]: numeric,
    };
    setChartDataMap((prev) => ({
      ...prev,
      [selectedTool]: updated,
    }));
  };

  // On save, pass the current tool's array up
  const handleSave = () => {
    if (!selectedTool) {
      alert('Please select a tool first.');
      return;
    }
    if (total !== 100) {
      alert(
        `All 'value' fields for ${selectedTool} must sum to 100 (currently ${total}).`
      );
      return;
    }
    // pass final planned array to parent
    onSaveContract(selectedTool, chartDataMap[selectedTool]);
    alert(`Team Contract for "${selectedTool}" saved successfully!`);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Team Contract</h2>
        <p>Select a tool and set each member's % and ± range. Must sum to 100.</p>

        {/* TOOL DROPDOWN */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ marginRight: '0.5rem' }}>Tool: </label>
          <select value={selectedTool} onChange={handleToolChange}>
            <option value="">Select Tool</option>
            <option value="GoogleDocs">GoogleDocs</option>
            <option value="GitHub">GitHub</option>
          </select>
        </div>

        {selectedTool && currentData.length > 0 ? (
          <>
            {/* Editable fields for 'value' & 'errorVal' */}
            <div className={styles.inputGrid}>
              {currentData.map((item, idx) => (
                <div key={item.name} className={styles.inputRow}>
                  <label>{item.name}</label>
                  <div>
                    <span>Value (%): </span>
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) =>
                        handleValueChange(idx, 'value', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <span>Range (±): </span>
                    <input
                      type="number"
                      value={item.errorVal}
                      onChange={(e) =>
                        handleValueChange(idx, 'errorVal', e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <p style={{ marginTop: '1rem' }}>
              Current total for {selectedTool}: <strong>{total}%</strong>
            </p>

            {/* Chart with error bars */}
            <BarChart width={400} height={250} data={currentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(val) => `${val}%`} />
              <Bar dataKey="value" fill="#3182ce" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" formatter={(val) => `${val}%`} />
                <ErrorBar dataKey="errorVal" stroke="red" strokeWidth={2} width={5} />
              </Bar>
            </BarChart>
          </>
        ) : (
          <p>Please select a tool to configure its distribution.</p>
        )}

        <div className={styles.buttonsRow}>
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
