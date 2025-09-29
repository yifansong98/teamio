import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 

const LinkToolsPage = () => {
  const [googleDocsData, setGoogleDocsData] = useState(null); 
  const [googleDocsFileName, setGoogleDocsFileName] = useState(""); 
  const [repoURL, setRepoURL] = useState("");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGoogleDocsFileName(file.name); 
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          setGoogleDocsData(parsedData); 
          console.log("Uploaded JSON Data:", parsedData);
        } catch (error) {
          setResponseMessage("Error: Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        let githubSuccess = true;
        let googleDocsSuccess = true;
        let responseMessages = [];

        // Handle GitHub data submission (only if URL is provided)
        if (repoURL.trim()) {
            // Extract owner and repo name from the URL
            const match = repoURL.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                setResponseMessage("Error: Invalid GitHub URL format");
                setLoading(false);
                return;
            }
            const repoOwner = match[1];
            const repoName = match[2];

            const response = await fetch(
              `http://localhost:3000/api/github/post`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  "repo_owner": repoOwner,
                  "repo_name": repoName,
                  "team_id": teamId
                }),
              }
            );

            if (response.ok) {
                const data = await response.json();
                responseMessages.push("GitHub: " + JSON.stringify(data));
            } else {
                const errorData = await response.json();
                responseMessages.push("GitHub Error: " + JSON.stringify(errorData));
                githubSuccess = false;
            }
        }

        // Handle Google Docs data submission (only if data is provided)
        if (googleDocsData) {
            const googleDocsResponse = await fetch(
              `http://localhost:3000/api/google_docs/post`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({"team_id": teamId, "doc": googleDocsData}),
              }
            );

            if (googleDocsResponse.ok) {
                const data = await googleDocsResponse.json();
                responseMessages.push("Google Docs: " + JSON.stringify(data));
            } else {
                const errorData = await googleDocsResponse.json();
                responseMessages.push("Google Docs Error: " + JSON.stringify(errorData));
                googleDocsSuccess = false;
            }
        }

        // Set combined response message
        setResponseMessage(responseMessages.join(" | "));

        // Navigate if at least one submission was successful
        if (githubSuccess || googleDocsSuccess) {
            navigate("/teamio/mapping", { state: { teamId: teamId } });
        }

    } catch (error) {
        setResponseMessage("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Link Collaboration Tools</h1>
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
          <label htmlFor="repoURL" style={styles.label}>
            GitHub Repository URL (Optional):
          </label>
          <input
            type="text"
            id="repoURL"
            value={repoURL}
            onChange={(e) => setRepoURL(e.target.value)}
            placeholder="Enter repository url (optional)"
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="jsonFile" style={styles.label}>
            Google Docs JSON:
          </label>
          {/* Hidden file input */}
          <input
            type="file"
            id="jsonFile"
            accept="application/json"
            onChange={(e) => handleFileUpload(e)}
            style={styles.hiddenInput} // Hide the default file input
          />
          {/* Custom button to trigger file input */}
          <button
            type="button"
            onClick={() => document.getElementById("jsonFile").click()} // Trigger file input click
            style={styles.customButton}
          >
            {googleDocsData ? googleDocsFileName : "Upload File"}
          </button>
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
  hiddenInput: {
    display: "none", // Completely hide the default file input
  },
  customButton: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "lightgray",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    textAlign: "center",
  },
};

export default LinkToolsPage;