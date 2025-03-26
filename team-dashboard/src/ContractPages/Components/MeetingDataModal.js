import React, { useState } from 'react';
import './MeetingDataModal.css';

const TEAM_SIZE = 4;

export default function MeetingDataModal({ onRowsUpdate }) {
  // Controls modal open/close
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Each row => { 
  //   date, startTime, endTime, mode, isSaved,
  //   presentCount, onTimeCount,
  //   myPresent, myOnTime
  // }
  const [rows, setRows] = useState([createEmptyRow()]);

  // A single message to show warnings/errors
  const [statusMessage, setStatusMessage] = useState('');

  function openModal() {
    setIsModalOpen(true);
    setStatusMessage('');
  }

  function closeModal() {
    setIsModalOpen(false);
    setStatusMessage('');
  }

  // Create empty row
  function createEmptyRow() {
    return {
      date: '',
      startTime: '',
      endTime: '',
      mode: '',
      isSaved: false,
      presentCount: 0,
      onTimeCount: 0,
      myPresent: false,
      myOnTime: false,
    };
  }

  // Common function to set rows and invoke the onRowsUpdate callback
  function updateRows(newRows) {
    setRows(newRows);
    if (onRowsUpdate) {
      // Let the parent know the new state of rows
      onRowsUpdate(newRows);
    }
  }

  // Handle changes in the main columns
  function handleFieldChange(index, field, value) {
    const newRows = [...rows];
    newRows[index][field] = value;
    updateRows(newRows);
  }

  // Validate the row
  function validateRow(row) {
    if (!row.date) return false;
    if (!row.startTime) return false;
    if (!row.endTime) return false;
    if (row.mode !== 'in-person' && row.mode !== 'remote') return false;
    return true;
  }

  // Save row => if invalid => show warning, else mark isSaved
  function handleSave(index) {
    const row = rows[index];
    if (!validateRow(row)) {
      setStatusMessage('This meeting is not saved. Please fill all fields (Date, Start/End Time, Mode).');
      return;
    }
    setStatusMessage('');
    const newRows = [...rows];
    newRows[index].isSaved = true;
    updateRows(newRows);

    // If it's the last row, add a new empty row
    if (index === rows.length - 1) {
      const extended = [...newRows, createEmptyRow()];
      updateRows(extended);
    }
  }

  // Edit => revert row to unsaved => show a warning
  function handleEdit(index) {
    const newRows = [...rows];
    newRows[index].isSaved = false;
    updateRows(newRows);
    setStatusMessage('This meeting is not saved. Please fill all fields before saving again.');
  }

  // Delete => remove row
  function handleDelete(index) {
    const newRows = [...rows];
    newRows.splice(index, 1);
    if (newRows.length === 0) {
      // if all rows removed => add an empty one
      newRows.push(createEmptyRow());
    }
    updateRows(newRows);
    setStatusMessage('');
  }

  // Toggling "did I join" => increments presentCount or onTimeCount
  function handleJoinCheckbox(index, field) {
    const newRows = [...rows];
    const row = newRows[index];
    if (field === 'myPresent') {
      if (!row.myPresent) row.presentCount++;
      else row.presentCount--;
      row.myPresent = !row.myPresent;
    } else if (field === 'myOnTime') {
      if (!row.myOnTime) row.onTimeCount++;
      else row.onTimeCount--;
      row.myOnTime = !row.myOnTime;
    }
    updateRows(newRows);
  }

  // Return "X/TEAM_SIZE" if saved, else "--"
  function getPresentLabel(row) {
    return row.isSaved ? `${row.presentCount}/${TEAM_SIZE}` : '--';
  }
  function getOnTimeLabel(row) {
    return row.isSaved ? `${row.onTimeCount}/${TEAM_SIZE}` : '--';
  }

  return (
    <div>
      <button className="enter-data-button" onClick={openModal}>
        Enter Your Data
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Meeting Data Entry</h2>

            {/* Reminder message, left aligned, italic */}
            <div 
              style={{ marginTop: '0.5rem', marginBottom: '1rem', fontStyle: 'italic', color: '#000', textAlign: 'left' }}
            >
              Please save one meeting entry to enter the next one
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Mode</th>
                  <th>Present</th>
                  <th>On-time</th>
                  <th style={{ width: '220px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <React.Fragment key={index}>
                    {/* Main row */}
                    <tr>
                      {/* Date */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.date}</span>
                        ) : (
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) =>
                              handleFieldChange(index, 'date', e.target.value)
                            }
                          />
                        )}
                      </td>
                      {/* Start Time */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.startTime}</span>
                        ) : (
                          <input
                            type="time"
                            value={row.startTime}
                            onChange={(e) =>
                              handleFieldChange(index, 'startTime', e.target.value)
                            }
                          />
                        )}
                      </td>
                      {/* End Time */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.endTime}</span>
                        ) : (
                          <input
                            type="time"
                            value={row.endTime}
                            onChange={(e) =>
                              handleFieldChange(index, 'endTime', e.target.value)
                            }
                          />
                        )}
                      </td>
                      {/* Mode */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.mode}</span>
                        ) : (
                          <select
                            value={row.mode}
                            onChange={(e) =>
                              handleFieldChange(index, 'mode', e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            <option value="in-person">In-person</option>
                            <option value="remote">Remote</option>
                          </select>
                        )}
                      </td>
                      {/* Present */}
                      <td style={{ textAlign: 'center' }}>
                        {getPresentLabel(row)}
                      </td>
                      {/* On-time */}
                      <td style={{ textAlign: 'center' }}>
                        {getOnTimeLabel(row)}
                      </td>
                      {/* Action: Save/Edit/Delete */}
                      <td>
                        {row.isSaved ? (
                          <>
                            <button
                              className="edit-button"
                              onClick={() => handleEdit(index)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDelete(index)}
                              style={{ marginLeft: '0.5rem' }}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            className="save-button"
                            onClick={() => handleSave(index)}
                          >
                            Save
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Sub-row for "Did you join?" only if row isSaved */}
                    {row.isSaved && (
                      <tr>
                        <td colSpan={7}>
                          <div className="subRow">
                            <strong>Did you join this meeting?</strong>
                            <div style={{ marginLeft: '1rem' }}>
                              <label style={{ marginRight: '1rem' }}>
                                <input
                                  type="checkbox"
                                  checked={row.myPresent}
                                  onChange={() => handleJoinCheckbox(index, 'myPresent')}
                                />
                                Present
                              </label>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={row.myOnTime}
                                  onChange={() => handleJoinCheckbox(index, 'myOnTime')}
                                />
                                On-time
                              </label>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Single status/warning message below the table */}
            {statusMessage && (
              <div className="warning-message">{statusMessage}</div>
            )}

            <button className="close-button" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
