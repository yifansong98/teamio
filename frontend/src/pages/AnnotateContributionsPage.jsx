import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStepsCompletion } from "../contexts/StepsCompletionContext";

// This will now be determined dynamically from the data
const VALUED_TAGS = ["Leadership", "Creative Idea", "Quality Work", "Helpful Support"];

const ToolIcon = ({ tool }) => {
  const icons = {
    'google_docs': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 332.4" className="w-5 h-5 fill-current"><path d="M93.6,332.4l93.6-162.4L93.6,8.2H0L93.6,170.6,0,332.4Z" /><path d="M125.4,279.3l52.5-91.1-52.5-91.1H231l52.5,91.1-52.5,91.1Z" /><path d="M258.6,332.4l93.6-162.4L258.6,8.2h93.6L445.8,170.6,352.2,332.4Z" /></svg>,
  };
  return <div className="text-gray-500" title={tool}>{icons[tool] || icons['External Work']}</div>;
};

const ValuedContributionModal = ({ onSubmit, onCancel }) => {
  const [selectedTag, setSelectedTag] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
      if(!selectedTag){
          alert("Please select a tag to describe why this contribution was valuable.");
          return;
      }
      onSubmit(selectedTag, comment);
      onCancel();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Identify as a Valued Contribution</h3>
        <p className="text-sm text-gray-600 mb-4">Select a tag to describe why this contribution was valuable. You can also add an optional comment.</p>
        <div className="space-y-2">{VALUED_TAGS.map(tag => (<button key={tag} onClick={() => setSelectedTag(tag)} className={`w-full text-left p-2 rounded transition-colors ${selectedTag === tag ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{tag}</button>))}</div>
        <textarea className="mt-4 w-full p-2 border rounded h-20" placeholder="Optional comment..." value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold">Submit</button>
        </div>
      </div>
    </div>
  );
};

const AnnotateContributionsPage = () => {
  const navigate = useNavigate();
  const teamId = JSON.parse(localStorage.getItem("userData"))?.team_id || "";
  const [teamMembers, setTeamMembers] = useState({});
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("userData")) || {};
  const { setStepsCompletion } = useStepsCompletion();

  // State for annotation functions
  const [editingContribution, setEditingContribution] = useState(null);
  const [showValuedModal, setShowValuedModal] = useState(null);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  
  // State for new search and filter functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log("current user:", user);
      try {
        // Fetch contributions
        const contributionsResponse = await fetch("http://localhost:3000/api/contributions/all?team_id=" + teamId);
        if (!contributionsResponse.ok) {
          const errorData = await contributionsResponse.json();
          setError(errorData.error || "Failed to fetch contributions");
          return;
        }
        const contributionsData = await contributionsResponse.json();
        console.log("Fetched contributions:", contributionsData);
        
        // Fetch mapped users
        const mappedUsersResponse = await fetch(`http://localhost:3000/api/teams/mapped-users?team_id=${teamId}`);
        if (!mappedUsersResponse.ok) {
          const errorData = await mappedUsersResponse.json();
          setError(errorData.error || "Failed to fetch mapped users");
          return;
        }
        const mappedUsers = await mappedUsersResponse.json();
        console.log("Mapped users:", mappedUsers);
        
        // Process contributions with mapped user_ids
        const processedContributions = contributionsData.map(c => {
          // Map the author/login to user_id using the mapping
          const mappedUser = mappedUsers[c.author] || c.author;
          return {
            ...c,
            user_id: mappedUser['user_id'],
            full_name: mappedUser['full_name'],
            attributedTo: c.attributedTo || [mappedUser['user_id']],
            valuedBy: c.valuedBy || []
          };
        });
        
        setContributions(processedContributions);
        
        // Create team members
        const teamData = JSON.parse(localStorage.getItem("teamData")) ?? [];
        const members = {};

        teamData.forEach((member, i) => {
          members[member.user_id] = { 
            user_id: member.user_id,
            full_name: member.full_name,
            initials: member.full_name ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : member.user_id.slice(0, 2).toUpperCase(),
            color: ["bg-pink-500", "bg-blue-500", "bg-yellow-400", "bg-teal-400", "bg-purple-500", "bg-orange-400"][i % 6]
          };
        });
        
        console.log("Team members:", members);
        setTeamMembers(members);        
      } catch (err) {
        console.error("Error details:", err);
        setError(`An error occurred while fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
        fetchData();
    }
  }, [teamId]);
  
  // --- Handlers from previous step (unchanged) ---
  const toggleAttribution = (contributionId, memberId) => { setContributions(contributions.map(c => { if (c.id === contributionId && c.user_id === user) { const newAttributedTo = c.attributedTo.includes(memberId) ? c.attributedTo.filter(id => id !== memberId) : [...c.attributedTo, memberId]; if (newAttributedTo.length > 0) { return { ...c, attributedTo: newAttributedTo }; } } return c; })); };
  const handleValuedContribution = (tag, comment) => { setContributions(contributions.map(c => { if (c.id === showValuedModal) { const alreadyValued = c.valuedBy.some(v => v.user_id === user.user_id); if (alreadyValued) { return { ...c, valuedBy: c.valuedBy.filter(v => v.user_id !== user.user_id) }; } else { const newValuation = { user_id: user.user_id, tag, comment }; return { ...c, valuedBy: [...c.valuedBy, newValuation] }; } } return c; })); setShowValuedModal(null); };

  if (loading) {
    return <div className="p-8 text-center text-gray-600 text-lg">Loading contributions...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 text-lg">{error}</div>;
  }
  
  // --- Filtering Logic for the list ---
  const filteredContributions = contributions.filter(c => {
    const searchTermLower = searchTerm.toLowerCase();
    const titleMatch = c.title.toLowerCase().includes(searchTermLower);

    const typeMatch = filterType === 'all' || c.tool === filterType;

    const contributionDate = new Date(c.timestamp);
    const startMatch = !startDate || contributionDate >= new Date(startDate);
    const endMatch = !endDate || contributionDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999));

    return titleMatch && typeMatch && startMatch && endMatch;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline mb-6">&larr; Back to Dashboard</button>
      <h1 className="text-2xl font-bold text-gray-800">Step 2: Annotate Contributions</h1>
      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
          <p className="text-sm">From the resources you linked, the system has extracted the following contribution history. Please review each item with your team and use the options below to create a more complete and accurate picture of your work.</p>
          <ul className="list-disc list-inside text-sm space-y-2 mt-2">
              <li><span className="font-bold">Attribute Work:</span> For each item, the logged contributor can attribute the work to other team members who also contributed, such as during pair programming.</li>
              <li><span className="font-bold">Highlight Valuable Contributions:</span> You can highlight contributions from your teammates that you found particularly valuable using the bookmark icon. You cannot highlight your own work.</li>
          </ul>
      </div>

      {/* --- NEW: Search and Filter Bar --- */}
      <div className="my-6 p-4 bg-gray-50 rounded-lg border flex flex-wrap items-center gap-4">
        <input 
          type="text" 
          placeholder="Search by title..." 
          className="flex-grow p-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="p-2 border rounded-md bg-white"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="google_docs">Google Docs</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From:</label>
          <input 
            type="date" 
            className="p-2 border rounded-md"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To:</label>
          <input 
            type="date" 
            className="p-2 border rounded-md"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      
      {filteredContributions.length === 0 ? (
        <p className="text-center text-gray-500 text-sm mt-6">No contributions match your search criteria.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <div className="min-w-full bg-white rounded-lg shadow">
            {filteredContributions.map((c) => {
              const isCurrentUserAuthor = c.user_id === user.user_id;
              const hasCurrentUserValued = c.valuedBy.some(v => v.user_id === user.user_id);

              return (
                <div key={c.id} className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between">
                  {/* ... rest of the component is the same as the previous correct version ... */}
                  <div className="flex-grow mb-4 md:mb-0 flex items-center space-x-4">
                    <ToolIcon tool={c.tool} />
                    <div>
                      <p className="font-semibold text-gray-800">{c.title}</p>
                      <p className="text-sm text-gray-500">Logged by {c.full_name} on {new Date(c.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 mr-2">Attributed to:</span>
                      {Object.values(teamMembers).map(member => {
                        const isAttributed = c.attributedTo.includes(member.user_id);
                        const isOriginalAuthor = c.user_id === member.user_id;
                        return (
                          <button
                            key={member.user_id}
                            onClick={() => toggleAttribution(c.id, member.user_id)}
                            disabled={!isCurrentUserAuthor || isOriginalAuthor}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 mx-1 ${member.color} ${isAttributed ? 'opacity-100' : 'opacity-30'} ${isOriginalAuthor ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${isCurrentUserAuthor && !isOriginalAuthor ? 'hover:opacity-100' : ''} ${!isCurrentUserAuthor || isOriginalAuthor ? 'cursor-not-allowed' : ''}`}
                            title={isCurrentUserAuthor ? `Click to ${isAttributed ? 'remove' : 'add'} ${member.user_id}` : member.user_id}
                          >
                            {member.initials}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center">
                      <button onClick={() => !isCurrentUserAuthor && setShowValuedModal(c.id)} disabled={isCurrentUserAuthor} className={`p-2 rounded-full transition-colors ${isCurrentUserAuthor ? 'cursor-not-allowed' : ''} ${hasCurrentUserValued ? 'text-yellow-500' : 'text-gray-500 hover:bg-gray-200'}`} title={isCurrentUserAuthor ? "Cannot value your own work" : "Tag as Valued"}>
                        <svg className="w-5 h-5" fill={hasCurrentUserValued ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-center mt-4">
        <button
          onClick={() => { setStepsCompletion((prev) => ({...prev, step2: true })) ; navigate("/home")}}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
        >
          Submit
        </button>
      </div>

      {showValuedModal && <ValuedContributionModal onSubmit={(tag, comment) => handleValuedContribution(tag, comment)} onCancel={() => setShowValuedModal(null)} />}
      {showOfflineModal && <AddOfflineWorkModal onSubmit={handleAddOfflineWork} onCancel={() => setShowOfflineModal(false)} teamMembers={teamMembers} currentUser={user.user_id} />}
      {editingContribution && <AddOfflineWorkModal existingWork={editingContribution} onSubmit={handleEditOfflineWork} onCancel={() => setEditingContribution(null)} teamMembers={teamMembers} currentUser={user.user_id} />}
    </div>
  );
};

export default AnnotateContributionsPage;