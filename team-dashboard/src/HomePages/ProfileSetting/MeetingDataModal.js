// src/HomePages/ProfileSetting/MeetingDataModal.js
import React, { useState } from 'react';
import styles from './MeetingDataModal.module.css';

const TEAM_MEMBERS = ['Member 1','Member 2','Member 3','Member 4'];

export default function MeetingDataModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // each row => { date, startTime, endTime, mode, isSaved, presentList:[], onTimeList:[] }
  const [rows, setRows] = useState([createEmptyRow()]);

  // For the sub-modal that lets us pick members for either presentList or onTimeList
  const [selectModal, setSelectModal] = useState({
    isOpen: false,
    rowIndex: null,
    field: '', // 'presentList' or 'onTimeList'
    selected: [], // currently chosen members
  });

  function createEmptyRow() {
    return {
      date: '',
      startTime: '',
      endTime: '',
      mode: '',
      isSaved: false,
      presentList: [],
      onTimeList: [],
    };
  }

  function openModal() {
    setIsModalOpen(true);
    setStatusMessage('');
  }

  function closeModal() {
    setIsModalOpen(false);
    setStatusMessage('');
    // store in local storage
    localStorage.setItem('TeamIO_Meetings', JSON.stringify(rows));
  }

  function handleFieldChange(index, field, value) {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  }

  function validateRow(row) {
    if (!row.date) return false;
    if (!row.startTime) return false;
    if (!row.endTime) return false;
    if (row.mode !== 'in-person' && row.mode !== 'remote') return false;
    return true;
  }

  function handleSave(index) {
    const row = rows[index];
    if (!validateRow(row)) {
      setStatusMessage('Please fill Date, Start/End Time, and Mode before saving.');
      return;
    }
    setStatusMessage('');
    const newRows = [...rows];
    newRows[index].isSaved = true;
    setRows(newRows);

    // add a new row if user just saved the last one
    if (index === newRows.length - 1) {
      newRows.push(createEmptyRow());
      setRows(newRows);
    }

    // store in local storage
    localStorage.setItem('TeamIO_Meetings', JSON.stringify(newRows));
  }

  function handleEdit(index) {
    const newRows = [...rows];
    newRows[index].isSaved = false;
    setRows(newRows);
    setStatusMessage('This entry is now editable again.');
  }

  function handleDelete(index) {
    const newRows = [...rows];
    newRows.splice(index, 1);
    if (newRows.length === 0) {
      newRows.push(createEmptyRow());
    }
    setRows(newRows);
    setStatusMessage('');
    // store in local storage
    localStorage.setItem('TeamIO_Meetings', JSON.stringify(newRows));
  }

  // counts
  function countPresent(row) {
    return row.presentList.length;
  }
  function countOnTime(row) {
    return row.onTimeList.length;
  }

  // We open the sub-modal for either presentList or onTimeList
  function openSelectModal(rowIndex, field) {
    const row = rows[rowIndex];
    const selected = (field === 'presentList') ? row.presentList : row.onTimeList;

    setSelectModal({
      isOpen: true,
      rowIndex,
      field, // 'presentList' or 'onTimeList'
      selected: [...selected], // copy array
    });
  }

  // For sub-modal check/uncheck
  function toggleMember(member) {
    let newSelected = [...selectModal.selected];
    if (newSelected.includes(member)) {
      newSelected = newSelected.filter((m) => m !== member);
    } else {
      newSelected.push(member);
    }
    setSelectModal({ ...selectModal, selected: newSelected });
  }

  // Cancel the sub-modal
  function cancelSelectModal() {
    setSelectModal({ isOpen: false, rowIndex: null, field: '', selected: [] });
  }

  // "Done" in the sub-modal => store the updated array into the row
  function confirmSelectModal() {
    const { rowIndex, field, selected } = selectModal;
    const newRows = [...rows];
    newRows[rowIndex][field] = selected;
    setRows(newRows);
    // close sub-modal
    setSelectModal({ isOpen: false, rowIndex: null, field: '', selected: [] });
  }

  return (
    <div>
      <button className={styles.enterDataButton} onClick={openModal}>
        Enter Meeting Data
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Meeting Data Entry</h2>
            <p className={styles.reminder}>
              Please save one meeting entry to enter the next one.
            </p>

            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Mode</th>
                  <th>Present</th>
                  <th>On-Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const pCount = countPresent(row);
                  const oCount = countOnTime(row);
                  return (
                    <tr key={index}>
                      {/* date */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.date}</span>
                        ) : (
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) => handleFieldChange(index, 'date', e.target.value)}
                          />
                        )}
                      </td>
                      {/* start time */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.startTime}</span>
                        ) : (
                          <input
                            type="time"
                            value={row.startTime}
                            onChange={(e) => handleFieldChange(index, 'startTime', e.target.value)}
                          />
                        )}
                      </td>
                      {/* end time */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.endTime}</span>
                        ) : (
                          <input
                            type="time"
                            value={row.endTime}
                            onChange={(e) => handleFieldChange(index, 'endTime', e.target.value)}
                          />
                        )}
                      </td>
                      {/* mode */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.mode}</span>
                        ) : (
                          <select
                            value={row.mode}
                            onChange={(e) => handleFieldChange(index, 'mode', e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="in-person">In-person</option>
                            <option value="remote">Remote</option>
                          </select>
                        )}
                      </td>
                      {/* present */}
                      <td>
                        {row.isSaved ? (
                          <span>{pCount}/4</span>
                        ) : (
                          <button
                            className={styles.selectButton}
                            onClick={() => openSelectModal(index, 'presentList')}
                          >
                            {pCount}/4
                          </button>
                        )}
                      </td>
                      {/* on-time */}
                      <td>
                        {row.isSaved ? (
                          <span>{oCount}/4</span>
                        ) : (
                          <button
                            className={styles.selectButton}
                            onClick={() => openSelectModal(index, 'onTimeList')}
                          >
                            {oCount}/4
                          </button>
                        )}
                      </td>
                      {/* actions */}
                      <td>
                        {row.isSaved ? (
                          <>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEdit(index)}
                            >
                              Edit
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDelete(index)}
                              style={{ marginLeft: '0.5rem' }}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.saveButton}
                            onClick={() => handleSave(index)}
                          >
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {statusMessage && (
              <div className={styles.warningMessage}>{statusMessage}</div>
            )}

            <button className={styles.closeButton} onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Sub-Modal for multi-select checkboxes */}
      {selectModal.isOpen && (
        <div className={styles.selectModalOverlay}>
          <div className={styles.selectModalContent}>
            <h3>{selectModal.field === 'presentList' ? 'Select who is Present' : 'Select who is On-Time'}</h3>
            <div className={styles.checkList}>
              {TEAM_MEMBERS.map((mName) => (
                <label key={mName} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={selectModal.selected.includes(mName)}
                    onChange={() => toggleMember(mName)}
                  />
                  {mName}
                </label>
              ))}
            </div>
            <div className={styles.selectModalButtons}>
              <button onClick={cancelSelectModal} className={styles.cancelButton}>Cancel</button>
              <button onClick={confirmSelectModal} className={styles.doneButton}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
