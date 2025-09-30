import React, { useEffect, useState, useMemo} from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Pie, Scatter } from "react-chartjs-2";
import { useStepsCompletion } from "./StepsCompletionContext";
import Chart from "chart.js/auto";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart as ChartJS, CategoryScale, TimeScale, ArcElement, Tooltip, Legend, PointElement, LinearScale, Title } from "chart.js";
import "chartjs-adapter-date-fns"; // make sure to install this



ChartJS.register(TimeScale, ChartDataLabels, CategoryScale, ArcElement, Tooltip, Legend, PointElement,LinearScale,Title, MatrixController, MatrixElement);

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


import { useRef } from "react";

const FeedbackHeatmap = ({ matrixData, options }) => {
        const canvasRef = useRef(null);
        const chartRef = useRef(null);

        useEffect(() => {
            if (!canvasRef.current || !matrixData) return;
            const ctx = canvasRef.current.getContext("2d");

            if (chartRef.current) {
                chartRef.current.destroy();
            }

            chartRef.current = new Chart(ctx, {
                type: "matrix",
                data: {
                    datasets: [{
                        label: "Feedback Matrix",
                        data: matrixData,
                        backgroundColor: (ctx) => ctx.raw?.backgroundColor || 'rgba(0,0,0,0.05)',
                        borderColor: 'white',
                        borderWidth: 2,
                        hoverBorderColor: '#333',
                        width: ({ chart }) => (chart.chartArea || {}).width / chart.scales.x.ticks.length - 1,
                        height: ({ chart }) => (chart.chartArea || {}).height / chart.scales.y.ticks.length - 1,
                    }],
                },
                options: options,
            });

            return () => {
                chartRef.current?.destroy();
            };
        }, [matrixData, options]);

        return (
            <div className="relative w-full h-full">
                <canvas ref={canvasRef} />
            </div>
        );
    };

const ScatterChart = ({ data, options }) => {
            const canvasRef = useRef(null);
            const chartRef = useRef(null);

            useEffect(() => {
                if (!canvasRef.current) return;
                const ctx = canvasRef.current.getContext("2d");

                if (chartRef.current) {
                    chartRef.current.destroy();
                }

                chartRef.current = new Chart(ctx, {
                    type: 'scatter',
                    data: data,
                    options: options,
                });

                return () => {
                    chartRef.current?.destroy();
                };
            }, [data, options]);

            return <canvas ref={canvasRef} />;
        };

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

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
  const [revisionData, setRevisionData] = useState({});
  const [timelineGDocData, setTimelineGDocData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("equitable");
  const [githubMetric, setGithubMetric] = useState("commits"); 
  const [gdocMetric, setGDocMetric] = useState("revisions");   
  const [feedbackData, setFeedbackData] = useState({});
  const { setStepsCompletion } = useStepsCompletion();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [commitRes, revisionRes, feedbackRes] = await Promise.all([
          fetch(`http://localhost:3000/api/reflections/commits?team_id=${teamId}`),
          fetch(`http://localhost:3000/api/reflections/revisions?team_id=${teamId}`),
          fetch(`http://localhost:3000/api/reflections/feedback?team_id=${teamId}`)
        ]);

        const commitData = await commitRes.json();
        const revisionData = await revisionRes.json();
        const feedbackData = await feedbackRes.json();

        if (commitRes.ok) {
          setCommitData(commitData.summary);
          setTimelineData(Array.isArray(commitData.timeline) ? commitData.timeline : []);
        } else {
          setError(commitData.error || "Failed to fetch commit data");
        }

        if (revisionRes.ok) {
          setRevisionData(revisionData.summary);
          setTimelineGDocData(Array.isArray(revisionData.timeline) ? revisionData.timeline : []);
        } else {
          setError(revisionData.error || "Failed to fetch revision data");
        }
        if (feedbackRes.ok) {
          setFeedbackData(feedbackData.feedback_counts);
          
        } else {
          setError(feedbackData.error || "Failed to fetch feedback data");
        }
      } catch (err) {
        setError("Error fetching reflection data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);


  const hasPieData = Object.keys(commitData).length > 0;
  const hasTimelineData =  Array.isArray(timelineData) && timelineData.length > 0;
  const hasGDocPieData = Object.keys(revisionData).length > 0;
  const hasGDocTimelineData =  Array.isArray(timelineGDocData) && timelineGDocData.length > 0;


  

  const colors = [
  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
  "#9966FF", "#FF9F40", "#8E44AD", "#2ECC71",
  "#E67E22", "#1ABC9C", "#C0392B", "#34495E"
  ];

    const allNetIds = Array.from(
      new Set([
        ...Object.keys(commitData || {}),
        ...Object.keys(revisionData || {}),
        ...Object.keys(feedbackData || {}),
        ...Object.values(feedbackData || {}).flatMap(obj => Object.keys(obj))
      ])
    );

    const userColors = {};
    allNetIds.forEach((net_id, idx) => {
      userColors[net_id] = colors[idx % colors.length];
    });



  const allParticipants = allNetIds;
  const maxCount = useMemo(() => Math.max(
      1, ...Object.values(feedbackData).flatMap(v => Object.values(v))
  ), [feedbackData]);

  const matrixData = useMemo(() => {
      return allParticipants.flatMap(giver =>
          allParticipants.map(receiver => {
              const value = feedbackData[giver]?.[receiver] || 0;
              const baseColor = userColors[giver] || "#d7e0e8ff";;
              const rgbColor = hexToRgb(baseColor);
              const alpha =  value > 0 ? 0.15 + (value / maxCount) * 0.85 : 0.05;
              const backgroundColor =`rgba(${rgbColor}, ${alpha})`;
              return {
                  x: receiver,
                  y: giver,
                  v: value,
                  backgroundColor
              };
          })
      );
  }, [allParticipants, maxCount]);

      

    const prettyHeatmapOptions = useMemo(() => ({
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'category',
                        labels: allParticipants,
                        position: 'top',
                        title: { display: true, text: 'Feedback Receiver', font: { size: 18, weight: 'bold' }, padding: 10 },
                        grid: { display: false },
                        ticks: { padding: 5, font: { size: 12 } }
                    },
                    y: {
                        type: 'category',
                        labels: allParticipants,
                        offset: true,
                        title: { display: true, text: 'Feedback Giver', font: { size: 18, weight: 'bold' }, padding: 10 },
                        grid: { display: false },
                        ticks: { font: { size: 12 } }
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#2d3748', // Dark gray
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        displayColors: false,
                        callbacks: {
                            title: () => '',
                            label: (ctx) => `${ctx.raw.y} gave ${ctx.raw.v} feedback to ${ctx.raw.x}`,
                        },
                    },
                    datalabels: {
                        
                        display: (context) => context.raw && context.raw.v > 0,
                        font: { size: 17 },
                        color: (context) => {
                            
                            if (!context.raw) return '#1f2937';
                            const alpha = (context.raw.v > 0) ? 0.15 + (context.raw.v / maxCount) * 0.85 : 0;
                            return alpha > 0.65 ? 'white' : '#1f2937'; // Dark gray text
                        },
                        // FIX: Check if the value exists before formatting
                        formatter: (value) => value ? value.v : '',
                    }
                },
                layout: { padding: 10 }
            }), [allParticipants, maxCount]);

  const pieChartData = {
    labels: Object.keys(commitData),
    datasets: [
      {
        label: githubMetric === "commits" ? "Commits" : "Lines of Code",
        data: Object.values(commitData).map((item) =>
          githubMetric === "commits" ? item.commits : item.lines
        ),
        backgroundColor: Object.keys(commitData).map(
        (id) => userColors[id]
      ),
        borderWidth: 1,
      },
    ],
  };

  const pieGDocChartData = {
    labels: Object.keys(revisionData),
    datasets: [
      {
        // label: gdocMetric === "revisions" ? "Revisions" : "Word Count",
        // data: Object.values(revisionData).map((item) =>
        //   gdocMetric === "revisions" ? item.revisions : item.word_count
        // ),
        label: "Revisions",
        data: Object.values(revisionData),
        backgroundColor:Object.keys(revisionData).map(
        (id) => userColors[id]
      ),
        borderWidth: 1,
      },
    ],
  };

//   const scatterChartData = {
//   datasets: [
//     // GitHub commits
//     ...timelineData.map((entry) => ({
//       label: entry.author, // just the author
//       data: entry.timestamps.map((ts) => ({
//         x: new Date(ts),
//         y: entry.author,
//       })),
//       backgroundColor: userColors[entry.author] || "#999999",
//       pointRadius: 6,
//       pointStyle: "circle", // shape for GitHub
//     })),

//     // Google Docs revisions
//     ...timelineGDocData.map((entry) => ({
//       label: entry.author, // same author name
//       data: entry.timestamps.map((ts) => ({
//         x: new Date(ts),
//         y: entry.author,
//       })),
//       backgroundColor: userColors[entry.author] || "#999999",
//       pointRadius: 6,
//       pointStyle: "triangle", // shape for Google Docs
//     })),
//   ],
// };
  const allAuthors = allNetIds;
    const paddedYAxisLabels = useMemo(() => 
                    ['', ...allAuthors, ''],
                    [allAuthors]
                );


    const mapSizeToRadius = (size) => {
      if (size < 50) return 5;
      if (size < 200) return 7;
      if (size < 1500) return 10;
      if (size < 1000) return 12;
      return 14
    };

const scatterChartData = useMemo(() => {
    const datasets = [
        ...timelineData.map((entry) => {
            const authorIndex = paddedYAxisLabels.indexOf(entry.author);
            return {
                label: entry.author,
                datalabels: { display: false },
                data: entry.contributions.map(c => ({
                    x: new Date(c.ts),
                    y: authorIndex + 0.2, // Offset above the integer
                    v: c.size,
                })),
                backgroundColor: userColors[entry.author] || "#999999",
                pointStyle: 'circle',
                radius: entry.contributions.map(c => mapSizeToRadius(c.size)),
            };
        }),
        // Google Docs Data (Triangles) - Positioned slightly BELOW the line
        ...timelineGDocData.map((entry) => {
            const authorIndex = paddedYAxisLabels.indexOf(entry.author);
            return {
                label: entry.author,
                datalabels: { display: false },
                data: entry.contributions.map(c => ({
                    x: new Date(c.ts),
                    y: authorIndex - 0.2, // Offset below the integer
                    v: c.size,
                })),
                backgroundColor: userColors[entry.author] || "#999999",
                pointStyle: 'triangle',
                radius: entry.contributions.map(c => mapSizeToRadius(c.size)),
            };
        }),
    ];
    return { datasets };
}, [timelineData, timelineGDocData, paddedYAxisLabels]);



// const scatterOptions = {
//   maintainAspectRatio: false,
  
//   plugins: {
//     datalabels: { display: false },
//     legend: {
//       onClick: () => null,
//       labels: {
//         generateLabels: (chart) => {
//           const datasets = chart.data.datasets;
//           const uniqueAuthors = [...new Set(datasets.map(ds => ds.label))];

//           return uniqueAuthors.map((author) => ({
//             text: author,
//             fillStyle: userColors[author] || "#999999", // author color
//             strokeStyle: userColors[author] || "#999999",
//             hidden: false,
//             datasetIndex: datasets.findIndex(ds => ds.label === author),
//           }));
//         },
//       },
//     },
//   },
//   scales: {
//     x: {
//       type: "time",
//       time: { unit: "day" },
//       title: { display: true, text: "Date" },
//     },
//     y: {
//       type: "category",
//       labels: timelineData.map((entry) => entry.author),
//       title: { display: true, text: "Team Member" },
//     },
//   },
// };

const scatterOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      datalabels: { display: false },
      legend: {
      onClick: () => null,
      labels: {
        generateLabels: (chart) => {
          const datasets = chart.data.datasets;
          const uniqueAuthors = [...new Set(datasets.map(ds => ds.label))];

          return uniqueAuthors.map((author) => ({
            text: author,
            fillStyle: userColors[author] || "#999999", // author color
            strokeStyle: userColors[author] || "#999999",
            hidden: false,
            datasetIndex: datasets.findIndex(ds => ds.label === author),
          }));
        },
      },
    },
      tooltip: {
          backgroundColor: '#1F2937',
          titleFont: { size: 14 },
          bodyFont: { size: 12 },
          displayColors: false,
          callbacks: {
              title: (ctx) => {
                  const yValue = ctx[0].raw.y;
                  const authorIndex = Math.round(yValue); 
                  return paddedYAxisLabels[authorIndex];
              },
              label: (ctx) => {
                  const size = ctx.raw.v;
                  const source = ctx.dataset.pointStyle === 'triangle' ? 'Google Docs' : 'GitHub';
                  return `${source} contribution of size ${size}.`;
              }
          }
      }
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "day", displayFormats: { day: 'MMM d' } },
        title: { display: true, text: "Date of Contribution", font: {size: 14} },
        grid: { color: '#e5e7eb' }
      },
      y: {
        type: "linear", 
        min: 0, 
        max: paddedYAxisLabels.length - 1, 
        title: { display: true, text: "Team Member", font: {size: 14} },
        grid: { 
          drawOnChartArea: true,
          color: (context) => {
            const label = paddedYAxisLabels[context.tick.value];
            return label === '' ? 'transparent' : '#e5e7eb';
          }
        },
        ticks: {
          stepSize: 1, 
          callback: function(value, index, ticks) {
              
              if (Math.floor(value) === value) {
                  return paddedYAxisLabels[value];
              }
              return ''; 
          }
        }
      },
    },
  }), [paddedYAxisLabels]);

 const tabs = [
    { id: "equitable", label: "Equitable Contribution" },
    { id: "timeliness", label: "Timeliness" },
    { id: "support", label: "Mutual Support" },
    { id: "valued", label: "Valued Contributions" },
  ]; 
  
  const navigate = useNavigate();

return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <button onClick={() => navigate("/teamio", { state: { teamId: teamId } })} className="text-blue-600 hover:underline mb-6">&larr; Back to Dashboard</button>
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
          <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commits Pie */}
        <div className="w-full h-[400px] flex flex-col items-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            GitHub
          </h2>
          {/* Dropdown for GitHub metric */}
          {hasPieData && (
            <div className="mb-2 flex items-center space-x-2">
              <label className="text-sm font-medium">Metric:</label>
              <select
                value={githubMetric}
                onChange={(e) => setGithubMetric(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="commits">Commits</option>
                <option value="lines">Lines of Code</option>
              </select>
            </div>
          )}
          <div className="w-full h-full">
            {hasPieData ? (
              <Pie
                data={pieChartData}
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
              <p className="text-gray-500 text-center">No commit data available.</p>
            )}
          </div>
        </div>

              {/* Revisions Pie */}
              <div className="w-full h-[400px] flex flex-col items-center">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  Google Docs
                </h2>
                {/* Dropdown for GDoc metric */}
              {hasGDocPieData && (
                <div className="mb-2 flex items-center space-x-2">
                  <label className="text-sm font-medium">Metric:</label>
                  <select
                    value={gdocMetric}
                    onChange={(e) => setGDocMetric(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="revisions">Revisions</option>
                    <option value="word_count">Word Count</option>
                  </select>
                </div>
              )}
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
            <div className="p-6 bg-white rounded-lg shadow-md">
      {hasTimelineData ? (
        <>
          {}
          <div className="w-full h-[500px]">
            <ScatterChart
              data={scatterChartData}
              options={scatterOptions}
            />
          </div>

          {}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 border-t pt-4 w-full justify-center">
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              ></div>
              <span className="text-sm text-gray-600">GitHub</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderTop: '16px solid rgba(0,0,0,0.5)',
                  transform: 'rotate(180deg)',
                }}
              ></div>
              <span className="text-sm text-gray-600">Google Docs</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-center">No timeline data available.</p>
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
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Mutual Support
            </h3>
            <button
              onClick={() => setShowGoldStandard("support")}
              className="text-sm text-blue-600 hover:underline mb-4"
            >
              Why is mutual support important?
            </button>
            {showGoldStandard && (
              <GoldStandardModal
                behavior={showGoldStandard}
                onCancel={() => setShowGoldStandard(null)}
              />
            )}
            
            <div className="p-6 bg-white rounded-lg shadow-md">
                        <div style={{ height: '600px' }}>
                            <FeedbackHeatmap
                                matrixData={matrixData}
                                options={prettyHeatmapOptions}
                            />
                        </div>
                    </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reflection Prompt:
              </label>
              <p className="text-sm text-gray-600 mb-2">
              What patterns do you notice in how support is given and received? Is the support reciprocal among team members? Are there individuals who might benefit from more support?              </p>
              <WordCountTextArea />
            </div>

          </div>
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