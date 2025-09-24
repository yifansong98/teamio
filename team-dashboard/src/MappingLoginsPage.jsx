import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const MappingLoginsPage = () => {
  const [logins, setLogins] = useState([]); // Store logins fetched from the API
  const [mappings, setMappings] = useState({}); // Store login-to-NetID mappings
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const { teamId } = location.state || {}; // Get teamId from the previous page

  useEffect(() => {
    if (!teamId) {
      setResponseMessage("Error: Team ID is missing.");
      return;
    }

    // Fetch logins for the given team_id
    const fetchLogins = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/teams/logins?team_id=${teamId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Logins:", data);
          setLogins(data || []);
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

    fetchLogins();
  }, [teamId]);

  const handleMappingChange = (login, netId) => {
    setMappings((prevMappings) => ({
      ...prevMappings,
      [login]: netId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/teams/map-logins?team_id=${teamId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mappings }),
      });

      if (response.ok) {
        setResponseMessage("Mappings successfully saved!");
        navigate("/teamio/attribution", { state: { teamId: teamId } }); // Navigate to a success page or another route
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
      <h1 style={styles.heading}>Map Logins to NetIDs</h1>
      {responseMessage && <div style={styles.responseMessage}>{responseMessage}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
        {logins.map((login, index) => (
            <div key={`${login}-${index}`} style={styles.inputGroup}>
            <label htmlFor={`netId-${login}`} style={styles.label}>
                <span style={styles.loginText}>{login}</span>
            </label>
            <input
                type="text"
                id={`netId-${login}`}
                placeholder="Enter NetID"
                value={mappings[login] || ""}
                onChange={(e) => handleMappingChange(login, e.target.value)}
                style={styles.input}
                required
            />
            </div>
        ))}
        <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
        </button>
        </form>
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
      padding: "1rem",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "row", // Arrange items side by side
      alignItems: "center", // Align items vertically in the center
      justifyContent: "space-between", // Add space between login and input
      marginBottom: "1rem",
      gap: "1rem", // Add spacing between the label and input
      width: "100%", // Ensure the input group takes up the full width
    },
    label: {
      fontWeight: "bold",
      color: "#555",
      flex: "2", // Allow the label to take up proportional space
      whiteSpace: "nowrap", // Prevent the login text from wrapping
      overflow: "hidden", // Hide overflowing text if necessary
      textOverflow: "ellipsis", // Add ellipsis for long text
    },
    loginText: {
      fontSize: "1rem",
      color: "#333",
      wordBreak: "normal", // Prevent wrapping
    },
    input: {
      flex: "1", // Allow the input to take up more space
      padding: "0.75rem",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "1rem",
    },
    heading: {
      fontSize: "2rem",
      marginBottom: "1.5rem",
      color: "#333",
      textAlign: "center",
    },
    form: {
      width: "100%",
      maxWidth: "600px", // Increase the max width of the form
      backgroundColor: "#fff",
      padding: "2rem",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
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
    responseMessage: {
      marginBottom: "1rem",
      color: "#d9534f",
      textAlign: "center",
    },
  };

export default MappingLoginsPage;