// src/Components/WorkDataModal.js
import React, { useState } from 'react';
import './WorkDataModal.css';

// Suppose your team has 4 members
const TEAM_SIZE = 4;

export default function WorkDataModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Each row => { 
  //   date, task, hours, isSaved,
  //   workedCount, myWorked
  // }
  const [rows, setRows] = useState([createEmptyRow()]);

  // Single message for warnings
  const [statusMessage, setStatusMessage] = useState('');

  function openModal() {
    setIsModalOpen(true);
    setStatusMessage('');
  }

  function closeModal() {
    setIsModalOpen(false);
    setStatusMessage('');
  }

  function createEmptyRow() {
    return {
      date: '',
      task: '',
      hours: '',
      isSaved: false,
      workedCount: 0, // how many team members worked on this
      myWorked: false,
    };
  }

  function handleFieldChange(index, field, value) {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  }

  function validateRow(row) {
    if (!row.date) return false;
    if (!row.task.trim()) return false;
    if (!row.hours || isNaN(row.hours)) return false;
    return true;
  }

  function handleSave(index) {
    const row = rows[index];
    if (!validateRow(row)) {
      setStatusMessage('This work is not saved. Please fill Date, Task, and a numeric Hours field.');
      return;
    }
    setStatusMessage('');
    const newRows = [...rows];
    newRows[index].isSaved = true;
    setRows(newRows);

    // If it's the last row => add new
    if (index === rows.length - 1) {
      setRows([...newRows, createEmptyRow()]);
    }
  }

  // Edit => revert isSaved => show warning
  function handleEdit(index) {
    const newRows = [...rows];
    newRows[index].isSaved = false;
    setRows(newRows);
    setStatusMessage('This work is not saved. Please fill all fields before saving again.');
  }

  function handleDelete(index) {
    const newRows = [...rows];
    newRows.splice(index, 1);
    if (newRows.length === 0) {
      newRows.push(createEmptyRow());
    }
    setRows(newRows);
    setStatusMessage('');
  }

  // Toggle "Did you work on this task?" => increments workedCount
  function handleMyWorked(index) {
    const newRows = [...rows];
    const row = newRows[index];
    if (!row.myWorked) row.workedCount++;
    else row.workedCount--;
    row.myWorked = !row.myWorked;
    setRows(newRows);
  }

  function getWorkedLabel(row) {
    return row.isSaved ? `${row.workedCount}/${TEAM_SIZE}` : '--';
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <button className="enter-data-button" onClick={openModal}>
        Enter your work
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Work Data Entry</h2>

            <div
              style={{ 
                marginTop: '0.5rem', 
                marginBottom: '1rem', 
                fontStyle: 'italic', 
                color: '#000', 
                textAlign: 'left' 
              }}
            >
              Please save one work entry to enter the next one
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Task</th>
                  <th>Hours</th>
                  <th>Worked</th>
                  <th style={{ width: '200px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <React.Fragment key={index}>
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
                      {/* Task */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.task}</span>
                        ) : (
                          <input
                            type="text"
                            value={row.task}
                            onChange={(e) =>
                              handleFieldChange(index, 'task', e.target.value)
                            }
                            placeholder="Enter task name"
                          />
                        )}
                      </td>
                      {/* Hours */}
                      <td>
                        {row.isSaved ? (
                          <span>{row.hours}</span>
                        ) : (
                          <input
                            type="number"
                            value={row.hours}
                            onChange={(e) =>
                              handleFieldChange(index, 'hours', e.target.value)
                            }
                            placeholder="hrs"
                          />
                        )}
                      </td>
                      {/* Worked */}
                      <td style={{ textAlign: 'center' }}>
                        {getWorkedLabel(row)}
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
                    {/* sub-row for "Did you work on this task?" if saved */}
                    {row.isSaved && (
                      <tr>
                        <td colSpan={5}>
                          <div className="subRow">
                            <strong>Did you work on this task?</strong>
                            <div style={{ marginLeft: '1rem' }}>
                              <label style={{ marginRight: '1rem' }}>
                                <input
                                  type="checkbox"
                                  checked={row.myWorked}
                                  onChange={() => handleMyWorked(index)}
                                />
                                Me
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
