// src/pages/TeamContract/TeamContract.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './TeamContract.module.css';

function TeamContract() {
  const navigate = useNavigate();

  // State to track whether the contract is editable
  const [editMode, setEditMode] = useState(true);

  // Contract data stored in one object
  const [contractData, setContractData] = useState({
    teamName: '',
    goals: ['', '', ''],
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    place: '',
    commTool: '',
    decisionMethod: 'Full Consensus',
    signatures: [
      { fullName: '', netId: '' }, // Member 1
      { fullName: '', netId: '' }, // Member 2
      { fullName: '', netId: '' }, // Member 3
      { fullName: '', netId: '' }, // Member 4
      { fullName: '', netId: '' }, // Member 5
      { fullName: '', netId: '' }, // Member 6
    ],
  });

  // Load any saved contract from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('teamContractData');
    if (saved) {
      setContractData(JSON.parse(saved));
      // If we have saved data, show it in read-only mode
      setEditMode(false);
    }
  }, []);

  // Refs for capturing the contract as an image for PDF
  const contractRef = useRef(null);

  // Update contract data in state for scalar fields
  const handleChange = (field, value) => {
    setContractData((prev) => ({ ...prev, [field]: value }));
  };

  // For array fields like "goals"
  const handleGoalChange = (index, value) => {
    const updatedGoals = [...contractData.goals];
    updatedGoals[index] = value;
    setContractData((prev) => ({ ...prev, goals: updatedGoals }));
  };

  // For the signatures table
  const handleSignatureChange = (index, field, value) => {
    setContractData((prev) => {
      const updatedSignatures = [...prev.signatures];
      updatedSignatures[index] = {
        ...updatedSignatures[index],
        [field]: value,
      };
      return { ...prev, signatures: updatedSignatures };
    });
  };

  // Save contract to localStorage and switch to read-only
  const handleSave = () => {
    localStorage.setItem('teamContractData', JSON.stringify(contractData));
    setEditMode(false);
  };

  // Let user re-edit the contract
  const handleRequestEditAccess = () => {
    setEditMode(true);
  };

  // Return to home page
  const handleReturn = () => {
    navigate('/');
  };

  // Export to PDF using jsPDF + html2canvas
  const handleExportPDF = async () => {
    if (!contractRef.current) return;
    try {
      const canvas = await html2canvas(contractRef.current);
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'pt', 'a4');
      // Calculate image width/height to fit the PDF page
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('team_contract.pdf');
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  };

  // Render bullet point lines differently if read-only vs. editable
  const bulletGoals = contractData.goals.map((g, i) => (
    <li key={i}>
      {editMode ? (
        <input
          type="text"
          placeholder={`Goal ${i + 1}`}
          value={g}
          onChange={(e) => handleGoalChange(i, e.target.value)}
        />
      ) : (
        <span>{g || `Goal ${i + 1}`}</span>
      )}
    </li>
  ));

  return (
    <div className={styles.contractContainer}>
      {/* Return button at the top */}
      <button className={styles.returnButton} onClick={handleReturn}>
        Return
      </button>

      {/* Contract content */}
      <div className={styles.contractContent} ref={contractRef}>
        {/* Title: Team Name */}
        <h1>
          CS 465 Team Contract for{' '}
          {editMode ? (
            <input
              className={styles.inlineInput}
              type="text"
              placeholder="Enter Team Name"
              value={contractData.teamName}
              onChange={(e) => handleChange('teamName', e.target.value)}
            />
          ) : (
            <span>{contractData.teamName || '_________'}</span>
          )}
        </h1>

        {/* 1. Goals */}
        <h2>1. Goals</h2>
        <ul>{bulletGoals}</ul>

        {/* 2. Meetings */}
        <h2>2. Meetings</h2>
        <ul>
          <li>
            We agree to meet every week on{' '}
            {editMode ? (
              <input
                className={styles.inlineInput}
                type="text"
                placeholder="(day of week)"
                value={contractData.dayOfWeek}
                onChange={(e) => handleChange('dayOfWeek', e.target.value)}
              />
            ) : (
              <span>{contractData.dayOfWeek || '_____'}</span>
            )}
            {' '}from{' '}
            {editMode ? (
              <input
                className={styles.inlineInput}
                type="text"
                placeholder="(time)"
                value={contractData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
              />
            ) : (
              <span>{contractData.startTime || '_____'}</span>
            )}
            {' '}to{' '}
            {editMode ? (
              <input
                className={styles.inlineInput}
                type="text"
                placeholder="(time)"
                value={contractData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
              />
            ) : (
              <span>{contractData.endTime || '_____'}</span>
            )}
            {' '}at{' '}
            {editMode ? (
              <input
                className={styles.inlineInput}
                type="text"
                placeholder="(place)"
                value={contractData.place}
                onChange={(e) => handleChange('place', e.target.value)}
              />
            ) : (
              <span>{contractData.place || '_____'}</span>
            )}
            .
          </li>
          <li>
            We agree to arrive on time for all team meetings and notify team
            members in advance if running late or unable to attend.
          </li>
        </ul>

        {/* 3. Interaction Norms */}
        <h2>3. Interaction Norms</h2>
        <ul>
          <li>
            We agree to communicate with each other in a timely, inclusive, and
            professional manner.
          </li>
          <li>
            We agree to use{' '}
            {editMode ? (
              <input
                className={styles.inlineInput}
                type="text"
                placeholder="(communication tool)"
                value={contractData.commTool}
                onChange={(e) => handleChange('commTool', e.target.value)}
              />
            ) : (
              <span>{contractData.commTool || '_____'}</span>
            )}
            {' '}as the main communication channel.
          </li>
          <li>We agree to support each other and ask for help when needed.</li>
          <li>
            We agree to inform team members in advance if assigned tasks cannot
            be completed on time.
          </li>
        </ul>

        {/* 4. Work Norms */}
        <h2>4. Work Norms</h2>
        <ul>
          <li>
            We agree to divide work equitably across all project deliverables
            and catch up on missing work if a significant imbalance arises.
          </li>
          <li>
            We agree to maintain good work quality and review each other’s work
            with constructive feedback and/or direct revisions.
          </li>
          <li>
            We agree to make important decisions by{' '}
            {editMode ? (
              <select
                className={styles.inlineInput}
                value={contractData.decisionMethod}
                onChange={(e) => handleChange('decisionMethod', e.target.value)}
              >
                <option value="Full Consensus">Full Consensus</option>
                <option value="Majority Vote">Majority Vote</option>
              </select>
            ) : (
              <span>{contractData.decisionMethod}</span>
            )}
            .
          </li>
        </ul>

        {/* 5. Signature Section */}
        <h2>5. Signature (Type down your full name and NetID)</h2>
        <table className={styles.signatureTable}>
          <thead>
            <tr>
              <th></th>
              <th>Full Name</th>
              <th>NetID</th>
            </tr>
          </thead>
          <tbody>
            {contractData.signatures.map((member, index) => (
              <tr key={index}>
                <td>Member {index + 1}</td>
                <td>
                  {editMode ? (
                    <input
                      type="text"
                      value={member.fullName}
                      onChange={(e) =>
                        handleSignatureChange(index, 'fullName', e.target.value)
                      }
                    />
                  ) : (
                    <span>{member.fullName || '_____'}</span>
                  )}
                </td>
                <td>
                  {editMode ? (
                    <input
                      type="text"
                      value={member.netId}
                      onChange={(e) =>
                        handleSignatureChange(index, 'netId', e.target.value)
                      }
                    />
                  ) : (
                    <span>{member.netId || '_____'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Button row */}
      <div className={styles.buttonRow}>
        {editMode ? (
          // If editing, show "Save" and "Export"
          <>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleExportPDF}>Export as PDF</button>
          </>
        ) : (
          // If read-only, show "Request Edit Access" and "Export"
          <>
            <button onClick={handleRequestEditAccess}>Request Edit Access</button>
            <button onClick={handleExportPDF}>Export as PDF</button>
          </>
        )}
      </div>
    </div>
  );
}

export default TeamContract;
