// src/pages/WorkDistribution/TeamContractModal.js
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import styles from './TeamContractModal.module.css';

/**
 * initialDataMap holds default distributions for each tool.
 * 'value' must sum to 100, 'errorVal' is ± range, 'role' is either ''/'creator'/'programmer'.
 */
const initialDataMap = {
  '': [],
  GoogleDocs: [
    { name: 'Anna', value: 25, errorVal: 5, role: '' },
    { name: 'Harry', value: 25, errorVal: 5, role: '' },
    { name: 'Daniel', value: 25, errorVal: 5, role: '' },
    { name: 'Sarah', value: 25, errorVal: 5, role: '' },
  ],
  GitHub: [
    { name: 'Anna', value: 25, errorVal: 5, role: '' },
    { name: 'Harry', value: 25, errorVal: 5, role: '' },
    { name: 'Daniel', value: 25, errorVal: 5, role: '' },
    { name: 'Sarah', value: 25, errorVal: 5, role: '' },
  ],
};

/**
 * Recalculate distribution if 'role-based':
 * If the selected tool is GoogleDocs => only members with role='creator' share 100%.
 * If the selected tool is GitHub => only members with role='programmer' share 100%.
 * Everyone else gets 0.
 */
function recalcRoleBased(tool, currentData) {
  const updated = [...currentData];

  let relevantRole = '';
  if (tool === 'GoogleDocs') relevantRole = 'creator';
  else if (tool === 'GitHub') relevantRole = 'programmer';
  else return updated; // no changes

  // find how many members have that relevantRole
  const membersWithRole = updated.filter((m) => m.role === relevantRole);
  if (membersWithRole.length === 0) {
    // no one with the role => all 0
    return updated.map((m) => ({ ...m, value: 0 }));
  }

  const portion = Math.floor(100 / membersWithRole.length);
  let leftover = 100 - portion * membersWithRole.length;

  // assign portion to each relevant member, +1 if leftover remains
  return updated.map((m) => {
    if (m.role === relevantRole) {
      const plusOne = leftover > 0 ? 1 : 0;
      leftover -= plusOne;
      return { ...m, value: portion + plusOne };
    }
    return { ...m, value: 0 };
  });
}

/**
 * TeamContractModal
 * - chartType: 'bar' or 'pie', from parent so we display the chart accordingly
 * - onClose, onSaveContract
 */
export default function TeamContractModal({ onClose, onSaveContract, chartType }) {
  // Which tool are we editing?
  const [selectedTool, setSelectedTool] = useState('');
  // The distribution data for each tool
  const [chartDataMap, setChartDataMap] = useState(initialDataMap);

  // The distribution approach: 'equal' or 'roleBased'
  const [distributionOption, setDistributionOption] = useState('equal');

  // The array of data for the chosen tool
  const currentData = chartDataMap[selectedTool] || [];

  // Summation
  const total = currentData.reduce((sum, item) => sum + item.value, 0);

  // If user picks a new tool, recalc if role-based
  const handleToolChange = (e) => {
    const newTool = e.target.value;
    setSelectedTool(newTool);

    if (distributionOption === 'roleBased' && newTool) {
      const updated = recalcRoleBased(newTool, currentData);
      setChartDataMap((prev) => ({
        ...prev,
        [newTool]: updated,
      }));
    }
  };

  // Called when user changes distribution approach
  const handleDistributionOption = (val) => {
    setDistributionOption(val);
    if (!selectedTool) return;

    if (val === 'equal') {
      // 4 members => 25 each
      const eqData = currentData.map((m) => ({ ...m, value: 25 }));
      setChartDataMap((prev) => ({
        ...prev,
        [selectedTool]: eqData,
      }));
    } else if (val === 'roleBased') {
      // recalc roles for the selected tool
      if (selectedTool) {
        const updated = recalcRoleBased(selectedTool, currentData);
        setChartDataMap((prev) => ({
          ...prev,
          [selectedTool]: updated,
        }));
      }
    }
  };

  /**
   * handleValueChange: updates either 'value' (percentage), 'errorVal' (± range),
   * or 'role' if distributionOption='roleBased'.
   */
  const handleValueChange = (index, field, newVal) => {
    const updated = [...currentData];

    if (field === 'role') {
      // set role
      updated[index] = { ...updated[index], role: newVal };
      // if role-based, recalc distribution
      const newArr = recalcRoleBased(selectedTool, updated);
      setChartDataMap((prev) => ({
        ...prev,
        [selectedTool]: newArr,
      }));
    } else {
      // numeric field => value or errorVal
      const numeric = parseInt(newVal, 10) || 0;
      updated[index] = { ...updated[index], [field]: numeric };
      setChartDataMap((prev) => ({
        ...prev,
        [selectedTool]: updated,
      }));
    }
  };

  // On Save, sum must be 100
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

  // Build the chart data we pass into Bar or Pie
  const chartData = currentData;
  // For Pie usage
  const pieData = chartData.map((m) => ({
    name: m.name,
    value: m.value,
  }));

  // Colors for slices
  const colors = ['#3182ce', '#48bb78', '#e53e3e', '#d53f8c'];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Team Contract</h2>
        <p>
          Select a tool and distribution approach. If “Role-based,” you must
          assign each member as a “creator” or “programmer.” Must total 100%.
        </p>

        {/* Tool dropdown */}
        <div className={styles.toolDropdown}>
          <label style={{ marginRight: '0.5rem' }}>Tool: </label>
          <select value={selectedTool} onChange={handleToolChange}>
            <option value="">Select Tool</option>
            <option value="GoogleDocs">GoogleDocs</option>
            <option value="GitHub">GitHub</option>
          </select>
        </div>

        {/* distribution approach => 'equal' or 'roleBased' */}
        <div className={styles.distributionOption}>
          <label>Distribution Option:</label>
          <select
            value={distributionOption}
            onChange={(e) => handleDistributionOption(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="equal">Equal</option>
            <option value="roleBased">Role-based</option>
          </select>
        </div>

        {selectedTool && chartData.length > 0 ? (
          <>
            <p>
              Current total for {selectedTool}: <strong>{total}%</strong>
            </p>

            {/* This row shows columns for each member */}
            <div className={styles.membersRow}>
              {chartData.map((item, idx) => (
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

                      {/* Range dropdown => small=5, medium=10, large=15 */}
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

                      {/* If roleBased => user picks role for each member */}
                      {distributionOption === 'roleBased' && (
                        <div className={styles.roleRow}>
                          <label>Role:</label>
                          <select
                            value={item.role || ''}
                            onChange={(e) => handleValueChange(idx, 'role', e.target.value)}
                          >
                            <option value="">(none)</option>
                            <option value="creator">creator</option>
                            <option value="programmer">programmer</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart: either bar or pie based on chartType prop */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              {chartType === 'bar' ? (
                <BarChart width={600} height={400} data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Bar dataKey="value" fill="#3182ce" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top" formatter={(val) => `${val}%`} />
                    <ErrorBar dataKey="errorVal" stroke="red" strokeWidth={2} width={5} />
                  </Bar>
                </BarChart>
              ) : (
                // If chartType === 'pie'
                <PieChart width={400} height={400}>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              )}
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
