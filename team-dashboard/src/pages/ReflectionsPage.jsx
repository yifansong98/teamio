import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStepsCompletion } from "../contexts/StepsCompletionContext";
import { Pie } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, ArcElement, Tooltip, Legend, Title);

const WordCountTextArea = ({ maxWords = 200 }) => {
  const [text, setText] = useState("");
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const handleChange = (e) => {
    setText(e.target.value);
  };

  return (
    <div>
      <textarea
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
        value={text}
        onChange={handleChange}
        rows="4"
      ></textarea>
      <div className="text-right text-sm text-gray-500 mt-1">
        {wordCount}/{maxWords} words
      </div>
    </div>
  );
};

const ReflectionsPage = () => {
  const location = useLocation();
  const [revisionData, setRevisionData] = useState({});
  const [timelineGDocData, setTimelineGDocData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("equitable");
  const { setStepsCompletion } = useStepsCompletion();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const userData = localStorage.getItem("userData");
      if (!userData) {
        setError("User data not found. Please log in again.");
        setLoading(false);
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const teamId = parsedUserData.team_id;

      const teamMembers = localStorage.getItem("teamData");
      if (!teamMembers) {
        setError("Team data not found. Please log in again.");
        setLoading(false);
        return;
      }

      const teamData = JSON.parse(teamMembers);

      const userIdToFullName = teamData.reduce((map, user) => {
        map[user.user_id] = user.full_name;
        return map;
      }, {});

      try {
        const [revisionRes] = await Promise.all([
          fetch(`http://localhost:3000/api/reflections/revisions?team_id=${teamId}`),
        ]);

        const revisionData = await revisionRes.json();

        if (revisionRes.ok) {
          const transformedRevisionData = Object.keys(revisionData).reduce((acc, userId) => {
            const fullName = userIdToFullName[userId] || userId; // Fallback to user_id if full_name is not found
            acc[fullName] = revisionData[userId];
            return acc;
          }, {});

          console.log(transformedRevisionData)

          setRevisionData(transformedRevisionData.summary);
          setTimelineGDocData(Array.isArray(transformedRevisionData.timeline) ? transformedRevisionData.timeline : []);
        } else {
          setError(revisionData.error || "Failed to fetch revision data");
        }
      } catch (err) {
        setError("Error fetching reflection data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const hasGDocPieData = Object.keys(revisionData).length > 0;
  const hasGDocTimelineData = Array.isArray(timelineGDocData) && timelineGDocData.length > 0;

  const content = {
    equitable: {
      title: "Why is equitable contribution important?",
      description:
        "Equitable contribution doesn't mean everyone does the exact same amount of work, but that the workload is distributed fairly and agreed upon by the team. A 'gold-standard' team often shows a relatively balanced pie chart, with no single member dominating or contributing very little.",
    },
    timeliness: {
      title: "Why is timeliness important?",
      description:
        "Timeliness involves completing work on schedule and avoiding last-minute rushes. A 'gold-standard' team shows consistent progress throughout the project timeline, rather than a large cluster of activity right before the deadline.",
    },
    support: {
      title: "Why is mutual support important?",
      description:
        "Mutual support is about helping teammates, providing constructive feedback, and acknowledging valuable contributions. A 'gold-standard' team shows reciprocal support, where all members are engaged in helping each other succeed.",
    },
    valued: {
      title: "Why are valued contributions important?",
      description:
        "Valued contributions are pieces of work that teammates identify as particularly high-quality, creative, or helpful. In a 'gold-standard' team, all members both give and receive recognition, showing that high-quality work is distributed and appreciated across the team.",
    },
  };

  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#8E44AD",
    "#2ECC71",
    "#E67E22",
    "#1ABC9C",
    "#C0392B",
    "#34495E",
  ];

  const allNetIds = Array.from(new Set(Object.keys(revisionData || {})));

  const userColors = {};
  allNetIds.forEach((net_id, idx) => {
    userColors[net_id] = colors[idx % colors.length];
  });

  const pieGDocChartData = {
    labels: Object.keys(revisionData),
    datasets: [
      {
        label: "Revisions",
        data: Object.values(revisionData),
        backgroundColor: Object.keys(revisionData).map((id) => userColors[id]),
        borderWidth: 1,
      },
    ],
  };

  const navigate = useNavigate();

  const tabs = [
    { id: "equitable", label: "Equitable Contribution" },
    { id: "timeliness", label: "Timeliness" },
    { id: "support", label: "Mutual Support" },
    { id: "valued", label: "Valued Contributions" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/teamio")}
        className="text-blue-600 hover:underline mb-6"
      >
        &larr; Back to Dashboard
      </button>
      <h1 className="text-2xl font-bold text-gray-800">Step 3: Team Reflection</h1>
      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
        <p className="text-sm">
          From the <strong>annotated contribution history</strong> you completed in Step 2, we’ve
          generated visual summaries that capture important teamwork behaviors. These behaviors
          were chosen because both instructors and students, in past research [citation], recognized
          them as critical for successful collaboration. They include:
        </p>

        <ul className="mt-2 list-disc list-inside text-sm space-y-2 mt-2">
          <li>
            <strong>Equitable contribution</strong> – ensuring work is shared fairly among team
            members
          </li>
          <li>
            <strong>Timeliness</strong> – completing tasks on schedule to keep the team on track
          </li>
          <li>
            <strong>Mutual support</strong> – helping and encouraging one another throughout the
            process
          </li>
          <li>
            <strong>Valued contributions</strong> – recognizing and building upon meaningful input
            from teammates
          </li>
        </ul>

        <p className="text-sm mt-3">
          For each behavior, we recommend viewing the <strong>gold standard</strong> —{" "}
          <em>"Why is [behavior] important?" </em> - which provides explanations and examples of what
          strong teamwork looks like in practice.
        </p>
      </div>

      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-8">
        {loading && <p className="text-center text-gray-500 text-lg">Loading...</p>}
        {error && <p className="text-center text-red-500 text-lg">{error}</p>}

        {!loading && !error && activeTab === "equitable" && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Equitable Contribution</h3>
            <h3 className="text-sm mb-4">{content[activeTab].title}</h3>
            <p className="text-sm text-gray-600 mb-4">{content[activeTab].description}</p>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="w-full h-[400px] flex flex-col items-center">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Google Docs</h2>
                <div className="w-full h-full">
                  {hasGDocPieData ? (
                    <Pie
                      data={pieGDocChartData}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                          datalabels: { display: false },
                          legend: {
                            position: "bottom",
                            align: "start",
                            labels: {
                              boxWidth: 20,
                              padding: 15,
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <p className="text-gray-500 text-center">No revision data available.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reflection Prompt:
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Looking back at your team’s work, do you feel contributions were shared fairly? Were
                there times when some carried more load, or others contributed less? What strategies
                could help balance contributions?
              </p>
              <WordCountTextArea />
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "timeliness" && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Timeliness</h3>
            <h3 className="text-sm mb-4">{content[activeTab].title}</h3>
            <p className="text-sm text-gray-600 mb-4">{content[activeTab].description}</p>
            <div className="p-6 bg-white rounded-lg shadow-md">
              {hasGDocTimelineData ? (
                <p className="text-gray-500 text-center">Timeline data visualization here.</p>
              ) : (
                <p className="text-gray-500 text-center">No timeline data available.</p>
              )}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reflection Prompt:</label>
              <p className="text-sm text-gray-600 mb-2">
                How well did you and your team manage deadlines and complete tasks on time? Were
                there any patterns of last-minute work or early completion? How did this affect the
                team’s progress and collaboration?
              </p>
              <WordCountTextArea />
            </div>
          </div>
        )}
      </div>

      {/* Finish button */}
      <div className="mt-12 text-center">
        <button className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
          Finish Reflection
        </button>
      </div>
    </div>
  );
};

export default ReflectionsPage;