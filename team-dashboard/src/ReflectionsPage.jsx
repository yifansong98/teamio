import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Pie, Scatter } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, TimeScale, ArcElement, Tooltip, Legend, PointElement, LinearScale, Title } from "chart.js";
import "chartjs-adapter-date-fns"; // make sure to install this



ChartJS.register(TimeScale,CategoryScale, ArcElement, Tooltip, Legend, PointElement,LinearScale,Title);

const ReflectionsPage = () => {
  const location = useLocation();
  const teamId = location.state?.teamId || "defaultTeamId";

  const [commitData, setCommitData] = useState({});
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("equitable");

  useEffect(() => {
    const fetchCommitSummary = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/reflections/commits?team_id=${teamId}`
        );
        const data = await response.json();
        console.log("API response:", data);
        if (response.ok) {
          setCommitData(data.summary);
          setTimelineData(Array.isArray(data.timeline) ? data.timeline : []);
        } else {
          setError(data.error || "Failed to fetch data");
        }
      } catch (err) {
        setError("Error fetching commit summary");
      } finally {
        setLoading(false);
      }
    };

    fetchCommitSummary();
  }, [teamId]);

  const hasPieData = Object.keys(commitData).length > 0;
  const hasTimelineData =  Array.isArray(timelineData) && timelineData.length > 0;

  const pieChartData = {
    labels: Object.keys(commitData),
    datasets: [
      {
        label: "Commits",
        data: Object.values(commitData),
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40",
        ],
        borderWidth: 1,
      },
    ],
  };
    const colors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40",
    "#8E44AD", "#2ECC71", "#E67E22", "#1ABC9C", "#C0392B", "#34495E"
    ];
  const scatterChartData = {
  datasets: timelineData.map((entry, idx) => ({
    label: entry.author,
    data: entry.timestamps.map((ts) => ({
      x: new Date(ts),
      y: entry.author,
    })),
    backgroundColor: colors[idx % colors.length], // cycle through colors
    pointRadius: 6,
  })),
};

const scatterOptions = {
  scales: {
    x: {
      type: "time",
      time: { unit: "day" },
      title: { display: true, text: "Date" },
    },
    y: {
      type: "category",
      labels: timelineData.map((entry) => entry.author),
      title: { display: true, text: "Team Member" },
    },
  },
};

  
  

  return (
    <div style={styles.container}>
  <h1 style={styles.heading}>Reflect on Log Data</h1>

  <div style={styles.tabContainer}>
    <button
      onClick={() => setActiveTab("equitable")}
      style={styles.tabButton(activeTab === "equitable")}
    >
      Equitable Contribution
    </button>
    <button
      onClick={() => setActiveTab("timeliness")}
      style={styles.tabButton(activeTab === "timeliness")}
    >
      Timeliness
    </button>
  </div>

  {loading && <p style={styles.loading}>Loading...</p>}
  {error && <p style={styles.error}>{error}</p>}

  {!loading && !error && activeTab === "equitable" && (
    <>
      {hasPieData ? (
        <div style={styles.chartCard}>
          <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />

        </div>
      ) : (
        <p style={styles.noData}>No commit data available.</p>
      )}
    </>
  )}

  {!loading && !error && activeTab === "timeliness" && (
    <>
      {hasTimelineData ? (
        <div style={styles.chartCard}>
        <Scatter data={scatterChartData} options={{ ...scatterOptions, maintainAspectRatio: false }} />        </div>
      ) : (
        <p style={styles.noData}>No timeline data available.</p>
      )}
    </>
  )}

  
</div>

  );
};

export default ReflectionsPage;

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
  tabContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.5rem",
    gap: "1rem",
  },
  tabButton: (active) => ({
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
    border: "none",
    backgroundColor: active ? "#007bff" : "#e0e0e0",
    color: active ? "#fff" : "#333",
  }),
  chartCard: {
  backgroundColor: "#fff",
  padding: "1.5rem",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  border: "1px solid #ddd",
  marginBottom: "2rem",
  maxWidth: "800px",   // restrict width
  marginLeft: "auto",  // center horizontally
  marginRight: "auto", // center horizontally
  height: "500px",     // optional fixed height
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
  noData: {
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#777",
  },
  footer: {
    marginTop: "3rem",
    padding: "2rem",
    background: "linear-gradient(to right, #e0f7fa, #f1f8e9)",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  footerHeading: {
    fontSize: "1.5rem",
    color: "#333",
    marginBottom: "1rem",
  },
  footerText: {
    fontSize: "1rem",
    color: "#555",
    maxWidth: "600px",
    margin: "0 auto",
  },
};
