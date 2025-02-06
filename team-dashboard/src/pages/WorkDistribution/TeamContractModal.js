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
 * initialDataMap holds default distributions for each tool.
 * 'value' must sum to 100, 'errorVal' is ± range.
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
  const [chartDataMap, setChartDataMap] = useState(initialDataMap);

  // Data for the chosen tool
  const currentData = chartDataMap[selectedTool] || [];
  const total = currentData.reduce((sum, item) => sum + item.value, 0);

  const handleToolChange = (e) => {
    setSelectedTool(e.target.value);
  };

  /**
   * handleValueChange: updates either 'value' (percentage) or 'errorVal' (± range)
   */
  const handleValueChange = (index, field, newVal) => {
    // If range is chosen from dropdown, we store numeric 5, 10, or 15
    const numeric = parseInt(newVal, 10) || 0;
    const updated = [...currentData];
    updated[index] = { ...updated[index], [field]: numeric };
    setChartDataMap((prev) => ({
      ...prev,
      [selectedTool]: updated,
    }));
  };

  const handleSave = () => {
    if (!selectedTool) {
      alert('Please select a tool first.');
      return;
    }
    if (total !== 100) {
      alert(
        `All 'value' fields for ${selectedTool} must sum to 100 (currently ${total}%).`
      );
      return;
    }
    onSaveContract(selectedTool, chartDataMap[selectedTool]);
    alert(`Team Contract for "${selectedTool}" saved successfully!`);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Team Contract</h2>
        <p>
          Select a tool and adjust each member’s distribution (must total 100%).
          You can drag the vertical slider or type the “value” on the right,
          then pick a ± range.
        </p>

        <div className={styles.toolDropdown}>
          <label style={{ marginRight: '0.5rem' }}>Tool: </label>
          <select value={selectedTool} onChange={handleToolChange}>
            <option value="">Select Tool</option>
            <option value="GoogleDocs">GoogleDocs</option>
            <option value="GitHub">GitHub</option>
          </select>
        </div>

        {selectedTool && currentData.length > 0 ? (
          <>
            <p>
              Current total for {selectedTool}: <strong>{total}%</strong>
            </p>

            {/* This row shows columns for each member */}
            <div className={styles.membersRow}>
              {currentData.map((item, idx) => (
                <div key={item.name} className={styles.memberColumn}>
                  {/* Member's name at the top */}
                  <div className={styles.memberName}>{item.name}</div>

                  <div className={styles.sliderRow}>
                    {/* The rotated vertical slider on the left */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={item.value}
                      className={styles.verticalSlider}
                      onChange={(e) =>
                        handleValueChange(idx, 'value', e.target.value)
                      }
                    />

                    {/* The text fields on the right */}
                    <div className={styles.valueInputs}>
                      <label className={styles.valueLabel}>Value (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.value}
                        onChange={(e) =>
                          handleValueChange(idx, 'value', e.target.value)
                        }
                        className={styles.valueInput}
                      />

                      {/* Range dropdown with 3 options: small=5, medium=10, large=15 */}
                      <label className={styles.rangeLabel}>Range (±%):</label>
                      <select
                        value={item.errorVal}
                        onChange={(e) =>
                          handleValueChange(idx, 'errorVal', e.target.value)
                        }
                        className={styles.rangeSelect}
                      >
                        <option value={5}>small (±5)</option>
                        <option value={10}>medium (±10)</option>
                        <option value={15}>large (±15)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart: vertical bars by default */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <BarChart width={600} height={400} data={currentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Bar dataKey="value" fill="#3182ce" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top" formatter={(val) => `${val}%`} />
                    <ErrorBar dataKey="errorVal" stroke="red" strokeWidth={2} width={5} />
                </Bar>
                </BarChart>
            </div>
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
