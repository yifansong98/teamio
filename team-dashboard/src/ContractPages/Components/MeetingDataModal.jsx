import React, { useState } from 'react';
import './MeetingDataModal.css';

export default function MeetingDataModal() {
  // Modal open state
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Rows of meeting data; each row has: dateTime, mode, present, onTime
  const [rows, setRows] = useState([
    { dateTime: '', mode: '', present: '', onTime: '' }
  ]);
  // Warning message for validation errors
  const [warning, setWarning] = useState('');

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setWarning('');
  };

  // Update a specific field of a row.
  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  // Validate a row: All fields must be non-empty, and mode must be "in-person" or "remote".
  const validateRow = (row) => {
    if (!row.dateTime) return false;
    if (row.mode !== 'in-person' && row.mode !== 'remote') return false;
    if (!row.present.trim()) return false;
    if (!row.onTime.trim()) return false;
    return true;
  };

  // Save the row at the given index.
  const handleSaveRow = (index) => {
    const row = rows[index];
    if (!validateRow(row)) {
      setWarning('Please fill all fields correctly before saving.');
      return;
    }
    setWarning('');
    // Optionally, here you could send the row data to your backend.
    // For now, if the current row is the last row, add a new empty row.
    if (index === rows.length - 1) {
      setRows([...rows, { dateTime: '', mode: '', present: '', onTime: '' }]);
    }
  };

  return (
    <div>
      {/* "Enter Your Data" button */}
      <button className="enter-data-button" onClick={openModal}>
        Enter Your Data
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Meeting Data Entry</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Save</th>
                  <th>Date &amp; Time</th>
                  <th>In-person/Remote</th>
                  <th>Present</th>
                  <th>On-time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <button
                        className="save-button"
                        onClick={() => handleSaveRow(index)}
                      >
                        Save
                      </button>
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        value={row.dateTime}
                        onChange={(e) =>
                          handleRowChange(index, 'dateTime', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={row.mode}
                        onChange={(e) =>
                          handleRowChange(index, 'mode', e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="in-person">In-person</option>
                        <option value="remote">Remote</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Enter names, comma-separated"
                        value={row.present}
                        onChange={(e) =>
                          handleRowChange(index, 'present', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Enter names, comma-separated"
                        value={row.onTime}
                        onChange={(e) =>
                          handleRowChange(index, 'onTime', e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {warning && <div className="warning-message">{warning}</div>}
            <button className="close-button" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
