// src/pages/TeamContract/TeamContract.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './TeamContract.module.css';

function TeamContract() {
  const navigate = useNavigate();

  // Default contract data (note: commTool and decisionMethod removed)
  const defaultData = {
    teamName: '',
    goals: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    place: '',
    signatures: [
      { fullName: '', netId: '' },
      { fullName: '', netId: '' },
      { fullName: '', netId: '' },
      { fullName: '', netId: '' },
      { fullName: '', netId: '' },
      { fullName: '', netId: '' },
    ],
  };

  // State to track whether the contract is editable
  const [editMode, setEditMode] = useState(true);
  const [contractData, setContractData] = useState(defaultData);

  // Load any saved contract from localStorage and merge with defaults
  useEffect(() => {
    const saved = localStorage.getItem('teamContractData');
    if (saved) {
      const parsed = JSON.parse(saved);
      setContractData((prev) => ({
        ...prev,
        ...parsed,
        signatures: parsed.signatures || prev.signatures,
      }));
      setEditMode(false);
    }
  }, []);

  // Ref for capturing the contract for PDF export
  const contractRef = useRef(null);

  // Generic change handler for scalar fields
  const handleChange = (field, value) => {
    setContractData((prev) => ({ ...prev, [field]: value }));
  };

  // Handler for the signatures table
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

  // Save the contract to localStorage and lock editing
  const handleSave = () => {
    localStorage.setItem('teamContractData', JSON.stringify(contractData));
    setEditMode(false);
  };

  // Enable edit mode to allow changes
  const handleRequestEditAccess = () => {
    setEditMode(true);
  };

  // Return to home page
  const handleReturn = () => {
    navigate('/teamio');
  };

  // Export to PDF using jsPDF and html2canvas
  const handleExportPDF = async () => {
    if (!contractRef.current) return;
    try {
      const canvas = await html2canvas(contractRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('team_contract.pdf');
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  };

  return (
    <div className={styles.contractContainer}>
      {/* Return Button */}
      <button className={styles.returnButton} onClick={handleReturn}>
        Return
      </button>

      <div className={styles.contractContent} ref={contractRef}>
        {/* Title */}
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

        {/* Section 1: Goals */}
        <h2>1. Goals</h2>
        <ul>
          <li>
            {editMode ? (
              <textarea
                className={styles.textAreaInput}
                placeholder="Write down 1-3 goals that the team wants to accomplish through the course project. Examples can include the desired project grade, learning specific tools or methods, and disseminating the project outcome to specific external audiences."
                value={contractData.goals}
                onChange={(e) => handleChange('goals', e.target.value)}
              />
            ) : (
              <span>
                {contractData.goals ||
                  'Write down 1-3 goals that the team wants to accomplish through the course project. Examples can include the desired project grade, learning specific tools or methods, and disseminating the project outcome to specific external audiences.'}
              </span>
            )}
          </li>
          <li>
            We agree to reflect together on our teamwork behaviors and data relevant to this contract.
          </li>
        </ul>

        {/* Section 2: Meetings */}
        <h2>2. Meetings</h2>
        <ul>
          <li>
            We agree to meet every week on{' '}
            {editMode ? (
              <input
                className={styles.inlineInput}
                type="text"
                placeholder="(days of the week)"
                value={contractData.dayOfWeek}
                onChange={(e) => handleChange('dayOfWeek', e.target.value)}
              />
            ) : (
              <span>{contractData.dayOfWeek || '_____'}</span>
            )}{' '}
            from{' '}
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
            )}{' '}
            to{' '}
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
            )}{' '}
            at{' '}
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
            We agree to arrive on time for all team meetings and notify team members in advance when running late or unable to attend.
          </li>
        </ul>

        {/* Section 3: Interaction Norms */}
        <h2>3. Interaction Norms</h2>
        <ul>
          <li>We agree to communicate in a timely, respectful, and professional manner.</li>
          <li>We agree to be inclusive so that everyone can participate in discussions and decision-making.</li>
          <li>We agree to review each other’s work and provide constructive feedback.</li>
        </ul>

        {/* Section 4: Work Norms */}
        <h2>4. Work Norms</h2>
        <ul>
          <li>We agree to divide work equitably across all project deliverables and catch up on missing work if a significant imbalance arises.</li>
          <li>We agree to make plans for every project deliverable and inform team members in advance if assigned tasks cannot be completed on time.</li>
          <li>We agree to maintain good work quality and revise based on each other’s feedback.</li>
        </ul>

        {/* Section 5: Signatures */}
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

      {/* Button Row */}
      <div className={styles.buttonRow}>
        {editMode ? (
          <>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleExportPDF}>Export as PDF</button>
          </>
        ) : (
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
