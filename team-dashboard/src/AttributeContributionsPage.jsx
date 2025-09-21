import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const AttributeContributionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const teamId = location.state?.teamId; // Replace with actual team ID retrieval logic
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/contributions/all?team_id=" + teamId);
        if (response.ok) {
          const data = await response.json();
          setContributions(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch contributions");
        }
      } catch (err) {
        setError("An error occurred while fetching contributions");
      } finally {
        setLoading(false);
      }
    };
    
    fetchContributions();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Loading contributions...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Team Contributions</h1>
      {contributions.length === 0 ? (
        <p style={styles.noContributions}>No contributions found.</p>
      ) : (
        <div style={styles.contributionsList}>
          {contributions.map((contribution, index) => (
            <div key={index} style={styles.contributionCard}>
              <h2 style={styles.title}>{contribution.title}</h2>
              <p style={styles.author}>By: {contribution.net_id}</p>
              <p style={styles.timestamp}>
                {new Date(contribution.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
      {/* Navigation Button to Reflections Page */}
      <div style={styles.buttonContainer}>
        <button
          onClick={() => navigate("/teamio/reflections", { state: { teamId } })}
          style={styles.button}
        >
          Go to Reflections
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    color: "#333",
  },
  loading: {
    textAlign: "center",
    fontSize: "1.5rem",
    color: "#555",
  },
  error: {
    textAlign: "center",
    fontSize: "1.5rem",
    color: "red",
  },
  noContributions: {
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#777",
  },
  contributionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  contributionCard: {
    backgroundColor: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    border: "1px solid #ddd",
  },
  title: {
    fontSize: "1.5rem",
    marginBottom: "0.5rem",
    color: "#007bff",
  },
  author: {
    fontSize: "1rem",
    marginBottom: "0.5rem",
    color: "#555",
  },
  timestamp: {
    fontSize: "0.9rem",
    color: "#777",
  },
  buttonContainer: {
    marginTop: "2rem",
    textAlign: "center",
  },
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
};

export default AttributeContributionsPage;