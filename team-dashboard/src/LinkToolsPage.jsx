import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const LinkToolsPage = () => {
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Add your logic here to handle the inputs (e.g., API call)
    try {
        const response = await fetch('http://localhost:3000/api/github/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                team_id: teamId,
                repo_owner: repoOwner,
                repo_name: repoName,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            setResponseMessage("Success: " + JSON.stringify(data));

            navigate("/teamio/attribution", { state: { teamId: teamId } });
        } else {
            const errorData = await response.json();
            setResponseMessage("Error: " + JSON.stringify(errorData));
        }
    } catch (error) {
        setResponseMessage("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Link GitHub Repository</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
            <label htmlFor="teamId" style={styles.label}>
                Team ID:
            </label>
            <input
                type="text"
                id="teamId"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="Enter team ID"
                style={styles.input}
                required
            />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="repoOwner" style={styles.label}>
            Repository Owner:
          </label>
          <input
            type="text"
            id="repoOwner"
            value={repoOwner}
            onChange={(e) => setRepoOwner(e.target.value)}
            placeholder="Enter repository owner"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="repoName" style={styles.label}>
            Repository Name:
          </label>
          <input
            type="text"
            id="repoName"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="Enter repository name"
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
      {responseMessage && (
        <div style={styles.responseMessage}>{responseMessage}</div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f9f9f9",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    color: "#333",
  },
  form: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  inputGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
  },
};

export default LinkToolsPage;