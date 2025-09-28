import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useStepsCompletion } from "./StepsCompletionContext";
const CURRENT_USER_ID = "ritikav2";
const ToolIcon = ({ tool }) => {
  const icons = {
    'github': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-5 h-5 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>,
    'google_docs': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 332.4" className="w-5 h-5 fill-current"><path d="M93.6,332.4l93.6-162.4L93.6,8.2H0L93.6,170.6,0,332.4Z" /><path d="M125.4,279.3l52.5-91.1-52.5-91.1H231l52.5,91.1-52.5,91.1Z" /><path d="M258.6,332.4l93.6-162.4L258.6,8.2h93.6L445.8,170.6,352.2,332.4Z" /></svg>,
    'External Work': <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
  };
  return <div className="text-gray-500" title={tool}>{icons[tool] || icons['External Work']}</div>;
};


const avatarColors = [
  "bg-pink-500",
  "bg-blue-500",
  "bg-yellow-400",
  "bg-teal-400",
  "bg-purple-500",
  "bg-orange-400",
  "bg-purple-700",
  "bg-green-500",
  "bg-orange-600",
  "bg-teal-600",
  "bg-red-600",
  "bg-gray-800",
];

// Function to pick a color based on net_id
const getColorForNetId = (net_id) => {
  let hash = 0;
  for (let i = 0; i < net_id.length; i++) {
    hash = net_id.charCodeAt(i) + ((hash << 5) - hash); // simple hash
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
};
const AddOfflineWorkModal = ({ onSubmit, onCancel, existingWork = null }) => {
  const [description, setDescription] = useState(existingWork?.description || '');
  const [date, setDate] = useState(existingWork?.date || new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(existingWork?.hours || '');
  const [evidence, setEvidence] = useState(null);
  const [contributors, setContributors] = useState(existingWork?.attributedTo || [CURRENT_USER_ID]);
  const toggleContributor = (memberId) => {
    const isIncluded = contributors.includes(memberId);
    if (isIncluded) {
      if (contributors.length > 1) { // Prevent removing the last contributor
        setContributors(contributors.filter(id => id !== memberId));
      }
    } else {
      setContributors([...contributors, memberId]);
    }
  };
  const handleSubmit = () => { if (!description.trim() || !hours) { alert("Please fill in the description and estimated hours."); return; } if (!existingWork && !evidence) { alert("Please upload evidence for new external work."); return; } const workData = { id: existingWork?.id, description, date, hours: parseFloat(hours), evidence: evidence ? evidence.name : existingWork?.evidence, contributors }; onSubmit(workData); };

  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-bold mb-4">{existingWork ? 'Edit' : 'Add'} External Work</h3><p className="text-sm text-gray-600 mb-4">Log work that happened outside of linked tools, like brainstorming sessions or in-person meetings.</p><div className="space-y-4"><div><label htmlFor="offline-desc" className="block text-sm font-medium text-gray-700">Description</label><textarea id="offline-desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded h-20" placeholder="e.g., Whiteboard session for UI design..."></textarea></div><div><label htmlFor="offline-hours" className="block text-sm font-medium text-gray-700">Estimated Hours</label><input type="number" id="offline-hours" value={hours} onChange={e => setHours(e.target.value)} className="mt-1 w-full p-2 border rounded" placeholder="e.g., 2.5" /></div><div><label htmlFor="offline-date" className="block text-sm font-medium text-gray-700">Date</label><input type="date" id="offline-date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full p-2 border rounded" /></div><div><label className="block text-sm font-medium text-gray-700">Contributors</label><div className="flex items-center space-x-2 mt-1">{TEAM_MEMBERS.map(member => { const isAttributed = contributors.includes(member.id); return (<button key={member.id} onClick={() => toggleContributor(member.id)} className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 ${member.avatarColor} ${isAttributed ? 'opacity-100 ring-2 ring-offset-1 ring-green-500' : 'opacity-40 hover:opacity-100'}`} title={`Attribute to ${member.name}`}>{member.initials}</button>); })}</div></div><div><label htmlFor="offline-evidence" className="block text-sm font-medium text-gray-700">Evidence (Photo, PDF, etc.)</label><input type="file" id="offline-evidence" onChange={e => setEvidence(e.target.files[0])} className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />{existingWork?.evidence && !evidence && <p className="text-xs text-gray-500 mt-1">Current file: {existingWork.evidence}</p>}</div></div><div className="mt-6 flex justify-end space-x-3"><button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold">{existingWork ? 'Save Changes' : 'Add Contribution'}</button></div></div></div>);
};

const ValuedContributionModal = ({ contributionId, onCancel }) => {
  const [selectedTag, setSelectedTag] = useState('');
  const handleSubmit = () => { console.log(`Contribution ${contributionId} tagged as ${selectedTag}`); onCancel(); };
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-bold mb-4">Identify as a Valued Contribution</h3><p className="text-sm text-gray-600 mb-4">Select a tag to describe why this contribution was valuable. You can also add an optional comment.</p><div className="space-y-2">{VALUED_TAGS.map(tag => (<button key={tag} onClick={() => setSelectedTag(tag)} className={`w-full text-left p-2 rounded transition-colors ${selectedTag === tag ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{tag}</button>))}</div><textarea className="mt-4 w-full p-2 border rounded h-20" placeholder="Optional comment..."></textarea><div className="mt-6 flex justify-end space-x-3"><button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold">Submit</button></div></div></div>);
};

const AttributeContributionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const teamId = location.state?.teamId;
  const [teamMembers, setTeamMembers] = useState({});
  const [userColors, setUserColor] = useState({});
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { setStepsCompletion } = useStepsCompletion();

  // const [editingContribution, setEditingContribution] = useState(null);
  // const [showValuedModal, setShowValuedModal] = useState(null);
  // const [showOfflineModal, setShowOfflineModal] = useState(false);
  // const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/contributions/all?team_id=" + teamId);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched contributions:", data);
          setContributions(data);
          const uniqueNetIds = Array.from(new Set(data.map(c => c.net_id)));
          setTeamMembers(uniqueNetIds)
          const members = {};
          uniqueNetIds.forEach((net_id, i) => {
          members[net_id] = {
          net_id,
          initials: net_id.charAt(0).toUpperCase(),
          color: avatarColors[i % avatarColors.length],
          };
        });
        setUserColor(members);
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

  // const toggleAttribution = (contributionId, memberId) => { setContributions(contributions.map(c => { if (c.id === contributionId && c.authorId === CURRENT_USER_ID) { const isAttributed = c.attributedTo.includes(memberId); const newAttributedTo = isAttributed ? c.attributedTo.filter(id => id !== memberId) : [...c.attributedTo, memberId]; return { ...c, attributedTo: newAttributedTo }; } return c; })); };
  // const handleAddOfflineWork = (newItem) => { const newContribution = { id: contributions.length + 100, authorId: CURRENT_USER_ID, ...newItem, tool: 'External Work', attributedTo: newItem.contributors, valuedBy: [], comments: [] }; setContributions([...contributions, newContribution]); setShowOfflineModal(false); };
  // const handleEditOfflineWork = (updatedItem) => { setContributions(contributions.map(c => c.id === updatedItem.id ? { ...c, ...updatedItem, attributedTo: updatedItem.contributors } : c)); setEditingContribution(null); };
  // const handleDeleteOfflineWork = (id) => { setContributions(contributions.filter(c => c.id !== id)); setShowConfirmDelete(null); };

  if (loading) {
    return <div className="p-8 text-center text-gray-600 text-lg">Loading contributions...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 text-lg">{error}</div>;
  }

  return (
  <div className="p-4 md:p-8 max-w-6xl mx-auto">
    <button
      onClick={() => navigate("/teamio", { state: { teamId: teamId } })}
      className="text-blue-600 hover:underline mb-6"
    >
      &larr; Back to Dashboard
    </button>

    <h1 className="text-2xl font-bold text-gray-800">
      Step 2: Annotate Contributions
    </h1>

    {/* Instructions box */}
    <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
      <p className="text-sm">
        From the resources you linked, the system has extracted the following
        contribution history. Please review each item with your team and use
        the options below to create a more complete and accurate picture of your
        work.
      </p>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <span className="font-bold">Attribute Work:</span> For each item, the
          logged contributor can attribute the work to other team members who
          also contributed, such as during pair programming.
        </li>
        <li>
          <span className="font-bold">Highlight Valuable Contributions:</span>{" "}
          You can highlight contributions from your teammates that you found
          particularly valuable (e.g., high-quality or difficult work) using the
          bookmark icon (
          <svg
            className="w-4 h-4 inline-block -mt-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          ). You cannot highlight your own work.
        </li>
        <li>
          <span className="font-bold">Add External Work:</span> If important work
          happened outside of the linked tools (e.g., a whiteboard session), use
          the button at the end of the list to add it. Only one person needs to
          add an external item.
        </li>
      </ul>
    </div>

    {/* Contributions list */}
    {contributions.length === 0 ? (
      <p className="text-center text-gray-500 text-sm mt-6">No contributions found.</p>
    ) : (
      <div className="mt-8 overflow-x-auto">
        <div className="min-w-full bg-white rounded-lg shadow">
          {contributions.map((contribution, index) => {
            
            const isCurrentUserAuthor = contribution.net_id === CURRENT_USER_ID;

            return (
              <div
                key={index}
                className="p-4 border-b last:border-b-0 shadow-sm bg-white hover:shadow-md transition-shadow"
                >
                <div className="flex justify-between items-center">
                  {/* Left: Tool Icon + Text */}
                  <div className="flex items-center space-x-3">
                    <ToolIcon tool={contribution.tool} />
                    <div>
                      <h2 className="font-semibold text-gray-800">{contribution.title}</h2>
                      <p className="text-sm text-gray-500">
                        Logged by {contribution.net_id} on{" "}
                        {new Date(contribution.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Right: Attribution */}
                  <div className="flex items-center">
                    <div
                      className={`flex items-center space-x-2 md:space-x-4 ${
                      !isCurrentUserAuthor ? "opacity-60" : ""
                      }`}
                    >
                    
                      <span className="text-sm font-medium text-gray-600">Attributed to:</span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${userColors[contribution.net_id].color || "bg-gray-400"} ring-2 ring-offset-1 ring-blue-500`}
                      >
                      {userColors[contribution.net_id].initials}
                    </div>
                  <div className="border-l h-6 border-gray-300 mx-3"></div>
                  {/* Other team members
                  {Object.values(teamMembers)
                    .filter((member) => member.net_id !== contribution.net_id)
                    .map((member) => {
                      const isAttributed = contribution.attributedTo?.includes(member.net_id);
                      return (
                        <button
                          key={member.net_id}
                          onClick={() => toggleAttribution(c.id, member.net_id)}
                          disabled={!isCurrentUserAuthor}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 mx-1 ${
                            isAttributed
                              ? `${member.colorClass} ring-2 ring-offset-1 ring-green-500`
                              : "bg-gray-400 hover:bg-gray-500"
                          } ${!isCurrentUserAuthor ? "cursor-not-allowed" : ""}`}
                          title={isCurrentUserAuthor ? `Attribute to ${member.net_id}` : ""}
                        >
                          {member.initials}
                        </button>
                      );
                    })} */}

                </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
   {/* Navigation Button to Reflections Page */}
      <div className="flex justify-center mt-4">
  <button
    onClick={() => { setStepsCompletion((prev) => ({...prev, step2: true })) ; navigate("/teamio", { state: { teamId: teamId } })}}
    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
  >
    Submit
  </button>
</div>
  </div>
);

};

export default AttributeContributionsPage;
