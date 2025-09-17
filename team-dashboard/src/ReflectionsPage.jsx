import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Pie, Scatter } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, TimeScale, ArcElement, Tooltip, Legend, PointElement, LinearScale, Title } from "chart.js";
import "chartjs-adapter-date-fns"; // make sure to install this



ChartJS.register(TimeScale,CategoryScale, ArcElement, Tooltip, Legend, PointElement,LinearScale,Title);

const WordCountTextArea = ({ maxWords = 200 }) => {
  const [text, setText] = useState("");
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const handleChange = (e) => {
    const newText = e.target.value;
    if (newText.split(/\s+/).filter(Boolean).length <= maxWords) {
      setText(newText);
    }
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

const GoldStandardModal = ({ behavior, onCancel }) => {
  const content = {
    equitable: {
      title: "Why is Equitable Contribution Important?",
      description:
        "Equitable contribution doesn't mean everyone does the exact same amount of work, but that the workload is distributed fairly and agreed upon by the team. A 'gold-standard' team often shows a relatively balanced pie chart, with no single member dominating or contributing very little.",
    },
    timeliness: {
      title: "Why is Timeliness Important?",
      description:
        "Timeliness involves completing work on schedule and avoiding last-minute rushes. A 'gold-standard' team shows consistent progress throughout the project timeline, rather than a large cluster of activity right before the deadline.",
    },
    support: {
      title: "Why is Mutual Support Important?",
      description:
        "Mutual support is about helping teammates, providing constructive feedback, and acknowledging valuable contributions. A 'gold-standard' team shows reciprocal support, where all members are engaged in helping each other succeed.",
    },
    valued: {
      title: "Why are Valued Contributions Important?",
      description:
        "Valued contributions are pieces of work that teammates identify as particularly high-quality, creative, or helpful. In a 'gold-standard' team, all members both give and receive recognition, showing that high-quality work is distributed and appreciated across the team.",
    },
  };
  const current = content[behavior];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4">{current.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{current.description}</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


const ReflectionsPage = () => {
  const location = useLocation();
  const teamId = location.state?.teamId || "defaultTeamId";
  const [showGoldStandard, setShowGoldStandard] = useState(null);

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
    backgroundColor: colors[idx % colors.length], 
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


 const tabs = [
    { id: "equitable", label: "Equitable Contribution" },
    { id: "timeliness", label: "Timeliness" },
    { id: "support", label: "Mutual Support" },
    { id: "valued", label: "Valued Contributions" },
  ]; 
  
return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <button onClick={() => setCurrentPage('dashboard')} className="text-blue-600 hover:underline mb-6">&larr; Back to Dashboard</button>
            <h1 className="text-2xl font-bold text-gray-800">Step 3: Team Reflection</h1>
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
                <p className="text-sm">
                From the <strong>annotated contribution history</strong> you completed in Step 2, we’ve 
                generated visual summaries that capture important teamwork behaviors. These behaviors 
                were chosen because both instructors and students, in past research [citation], recognized them as 
                critical for successful collaboration. They include:
            </p>

            <ul className="mt-2 list-disc list-inside text-sm space-y-2 mt-2">
                <li><strong>Equitable contribution</strong> – ensuring work is shared fairly among team members</li>
                <li><strong>Timeliness</strong> – completing tasks on schedule to keep the team on track</li>
                <li><strong>Mutual support</strong> – helping and encouraging one another throughout the process</li>
                <li><strong>Valued contributions</strong> – recognizing and building upon meaningful input from teammates</li>
            </ul>

            <p className="text-sm mt-3">
            For each behavior, we recommend viewing the <strong>gold standard</strong> — 
            <em>"Why is [behavior] important?" </em> - which provides explanations and examples of what strong teamwork looks like in practice. 
        </p>
    </div>

      <div className="mt-6 border-b border-gray-200">
        <nav
          className="-mb-px flex space-x-6 overflow-x-auto"
          aria-label="Tabs"
        >
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
        {loading && (
          <p className="text-center text-gray-500 text-lg">Loading...</p>
        )}
        {error && <p className="text-center text-red-500 text-lg">{error}</p>}

        {!loading && !error && activeTab === "equitable" && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Equitable Contribution
            </h3>
            <button
              onClick={() => setShowGoldStandard("equitable")}
              className="text-sm text-blue-600 hover:underline mb-4"
            >
              Why is equitable contribution important?
            </button>
            {showGoldStandard && (
            <GoldStandardModal
              behavior={showGoldStandard}
              onCancel={() => setShowGoldStandard(null)}
            />
          )}
          <div className="p-6 bg-white rounded-lg shadow-md flex justify-center">
            {hasPieData ? (
              <div className="w-full h-[400px]">
              <Pie
                data={pieChartData}
                options={{ maintainAspectRatio: false, responsive: true, plugins: {
                legend: {
                  position: "bottom",   
                  align: "start",      
                  labels: {
                    boxWidth: 20,
                    padding: 15,
                  },
                },
              },}}
              />
              </div>
            ) : (
              <p className="text-gray-500">No commit data available.</p>
            )}
          </div>
          <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reflection Prompt:
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Looking back at your team’s work, do you feel contributions were
                shared fairly? Were there times when some carried more load, or
                others contributed less? What strategies could help balance
                contributions?
              </p>
              <WordCountTextArea />
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "timeliness" && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Timeliness
            </h3>
            <button
              onClick={() => setShowGoldStandard("timeliness")}
              className="text-sm text-blue-600 hover:underline mb-4"
            >
              Why is timeliness important?
            </button>
            {showGoldStandard && (
            <GoldStandardModal
              behavior={showGoldStandard}
              onCancel={() => setShowGoldStandard(null)}
            />
          )}
            <div className="p-6 bg-white rounded-lg shadow-md flex justify-center">
            {hasTimelineData ? (
              <div className="w-full h-[400px]">
              <Scatter
                data={scatterChartData}
                options={{ ...scatterOptions, maintainAspectRatio: false }}
              />
              </div>
            ) : (
              <p className="text-gray-500">No timeline data available.</p>
            )}
            </div>
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reflection Prompt:</label>
                <p className="text-sm text-gray-600 mb-2">How well did you and your team manage deadlines and complete tasks on time? Were there any patterns of last-minute work or early completion? How did this affect the team’s progress and collaboration?</p>
                <WordCountTextArea />
            </div>
          </div>
        )}

        {activeTab === "support" && (
          <p className="text-gray-600 italic">
            Mutual Support visualization coming soon.
          </p>
        )}

        {activeTab === "valued" && (
          <p className="text-gray-600 italic">
            Valued Contributions visualization coming soon.
          </p>
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