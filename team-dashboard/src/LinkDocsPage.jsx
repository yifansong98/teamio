import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function GoogleDocsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // try to prefill from prior page if it passed { state: { teamId } }
  const initialTeamId = location.state?.teamId || "";
  const [teamId, setTeamId] = useState(initialTeamId);
  const [jsonText, setJsonText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const postJson = async () => {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setMsg("Error: Invalid JSON. Please fix and try again.");
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("http://localhost:3000/api/google_docs/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId, doc: parsed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("Success (JSON): " + JSON.stringify(data));
      } else {
        setMsg("Error (JSON): " + JSON.stringify(data));
      }
    } catch (e) {
      setMsg("Error (JSON): " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setMsg("Please choose a .json file first.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const form = new FormData();
      form.append("team_id", teamId);
      form.append("file", file);

      const res = await fetch("http://localhost:3000/api/google_docs/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("Success (Upload): " + JSON.stringify(data));
      } else {
        setMsg("Error (Upload): " + JSON.stringify(data));
      }
    } catch (e) {
      setMsg("Error (Upload): " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Google Docs → Team Data</h1>

      {/* Team ID */}
      <div style={styles.card}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Team ID</label>
          <input
            style={styles.input}
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="Enter team ID"
          />
        </div>
      </div>

      {/* Option A: Paste JSON */}
      <div style={styles.card}>
        <h2 style={styles.subheading}>Option A — Paste JSON</h2>
        <textarea
          rows={10}
          style={styles.textarea}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='Paste JSON here (e.g. {"docId":"...","title":"..."} )'
        />
        <button style={styles.primary} disabled={loading || !teamId || !jsonText} onClick={postJson}>
          {loading ? "Submitting..." : "Submit JSON"}
        </button>
      </div>

      {/* Option B: Upload .json file */}
      <div style={styles.card}>
        <h2 style={styles.subheading}>Option B — Upload .json File</h2>
        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginBottom: "1rem" }}
        />
        <button style={styles.secondary} disabled={loading || !teamId} onClick={uploadFile}>
          {loading ? "Uploading..." : "Upload File"}
        </button>
      </div>

      {msg && <div style={styles.msg}>{msg}</div>}

      <button style={styles.link} onClick={() => navigate("/teamio")}>
        ← Back to GitHub Link Page
      </button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 700, margin: "40px auto", padding: "0 16px", fontFamily: "Arial, sans-serif" },
  heading: { fontSize: "1.8rem", marginBottom: 16, color: "#333" },
  subheading: { fontSize: "1.1rem", marginBottom: 12, color: "#444" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" },
  inputGroup: { marginBottom: "1rem" },
  label: { display: "block", marginBottom: 6, fontWeight: "bold", color: "#555" },
  input: { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: 6, fontSize: "1rem" },
  textarea: { width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: 6, fontSize: ".95rem", fontFamily: "monospace" },
  primary: { marginTop: 8, padding: "10px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  secondary: { padding: "10px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  link: { marginTop: 16, background: "transparent", border: "none", color: "#2563eb", cursor: "pointer", textDecoration: "underline" },
  msg: { marginTop: 12, padding: 12, background: "#f3f4f6", borderRadius: 6, fontSize: ".95rem", whiteSpace: "pre-wrap" },
};
