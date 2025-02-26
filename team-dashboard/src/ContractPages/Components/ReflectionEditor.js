// src/ContractPages/Components/ReflectionEditor.js
import React, { useState } from 'react';

export default function ReflectionEditor({ sectionName, initialReflection = '' }) {
  const [text, setText] = useState(initialReflection);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const confirmSubmit = window.confirm(
      `Are you sure you want to submit your reflection on ${sectionName}?`
    );
    if (confirmSubmit) {
      setSubmitted(true);
      // Save the reflection to localStorage or send to an API here.
    }
  };

  return (
    <div style={{ position: 'relative', textAlign: 'center', marginTop: '1rem' }}>
      {submitted ? (
        <div
          style={{
            width: '80%',
            margin: '0 auto',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#f9f9f9',
          }}
        >
          {text || <i>No reflection submitted.</i>}
        </div>
      ) : (
        <div style={{ position: 'relative', width: '80%', margin: '0 auto' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Reflect on your ${sectionName} here, e.g. how well you believe the team satisfied the desired behavior and what you can do to improve your teamwork in this regard`}
            style={{
              width: '100%',
              height: '100px',
              padding: '1rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              resize: 'vertical',
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              padding: '0.5rem 1rem',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
