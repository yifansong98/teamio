import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useStepsCompletion } from "./StepsCompletionContext";

// This will now be determined dynamically from the data
const VALUED_TAGS = ["Leadership", "Creative Idea", "Quality Work", "Helpful Support"];

const ToolIcon = ({ tool }) => {
  const icons = {
    'github': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-5 h-5 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>,
    'google_docs': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 332.4" className="w-5 h-5 fill-current"><path d="M93.6,332.4l93.6-162.4L93.6,8.2H0L93.6,170.6,0,332.4Z" /><path d="M125.4,279.3l52.5-91.1-52.5-91.1H231l52.5,91.1-52.5,91.1Z" /><path d="M258.6,332.4l93.6-162.4L258.6,8.2h93.6L445.8,170.6,352.2,332.4Z" /></svg>,
    'External Work': <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
  };
  return <div className="text-gray-500" title={tool}>{icons[tool] || icons['External Work']}</div>;
};

const AddOfflineWorkModal = ({ onSubmit, onCancel, existingWork = null, teamMembers, currentUser }) => {
  const [description, setDescription] = useState(existingWork?.title || '');
  const [date, setDate] = useState(existingWork?.timestamp ? new Date(existingWork.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(existingWork?.hours || '');
  const [evidence, setEvidence] = useState(null);
  const [contributors, setContributors] = useState(existingWork?.attributedTo || [currentUser]);

  const toggleContributor = (memberId) => {
    const isIncluded = contributors.includes(memberId);
    if (isIncluded) {
      if (contributors.length > 1) {
        setContributors(contributors.filter(id => id !== memberId));
      }
    } else {
      setContributors([...contributors, memberId]);
    }
  };

  const handleSubmit = () => {
    if (!description.trim() || !hours) {
      alert("Please fill in the description and estimated hours.");
      return;
    }
    if (!existingWork && !evidence) {
      alert("Please upload evidence for new external work.");
      return;
    }
    const workData = {
      id: existingWork?.id,
      title: description,
      timestamp: date,
      hours: parseFloat(hours),
      evidence: evidence ? evidence.name : existingWork?.evidence,
      contributors
    };
    onSubmit(workData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">{existingWork ? 'Edit' : 'Add'} External Work</h3>
        <p className="text-sm text-gray-600 mb-4">Log work that happened outside of linked tools, like brainstorming sessions or in-person meetings.</p>
        <div className="space-y-4">
          <div><label htmlFor="offline-desc" className="block text-sm font-medium text-gray-700">Description</label><textarea id="offline-desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded h-20" placeholder="e.g., Whiteboard session for UI design..."></textarea></div>
          <div><label htmlFor="offline-hours" className="block text-sm font-medium text-gray-700">Estimated Hours</label><input type="number" id="offline-hours" value={hours} onChange={e => setHours(e.target.value)} className="mt-1 w-full p-2 border rounded" placeholder="e.g., 2.5" /></div>
          <div><label htmlFor="offline-date" className="block text-sm font-medium text-gray-700">Date</label><input type="date" id="offline-date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full p-2 border rounded" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Contributors</label>
            <div className="flex items-center space-x-2 mt-1">
                {Object.values(teamMembers).map(member => {
                    const isAttributed = contributors.includes(member.net_id);
                    return (
                        <button key={member.net_id} onClick={() => toggleContributor(member.net_id)} className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 ${member.color} ${isAttributed ? 'opacity-100 ring-2 ring-offset-1 ring-green-500' : 'opacity-40 hover:opacity-100'}`} title={`Attribute to ${member.net_id}`}>
                            {member.initials}
                        </button>
                    );
                })}
            </div>
          </div>
          <div><label htmlFor="offline-evidence" className="block text-sm font-medium text-gray-700">Evidence (Photo, PDF, etc.)</label><input type="file" id="offline-evidence" onChange={e => setEvidence(e.target.files[0])} className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />{existingWork?.evidence && !evidence && <p className="text-xs text-gray-500 mt-1">Current file: {existingWork.evidence}</p>}</div>
        </div>
        <div className="mt-6 flex justify-end space-x-3"><button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold">{existingWork ? 'Save Changes' : 'Add Contribution'}</button></div>
      </div>
    </div>
  );
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
  const location = useLocation();
  const navigate = useNavigate();
  // Get team ID from location state or localStorage
  let teamId = location.state?.teamId || localStorage.getItem("teamId") || "teamio";
  const [teamMembers, setTeamMembers] = useState({});
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
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
    // Reset data when team ID changes
    setContributions([]);
    setTeamMembers({});
    setError("");
    setCurrentUser(null);
    setEditingContribution(null);
    setShowValuedModal(null);
    setShowOfflineModal(false);

    const fetchData = async () => {
      setLoading(true);
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
        
        // Process contributions with mapped net_ids
        const processedContributions = contributionsData.map(c => {
          // Map the author/login to net_id using the mapping
          const mappedNetId = mappedUsers[c.author] || c.author;
          return {
            ...c,
            net_id: mappedNetId,
            attributedTo: c.attributedTo || [mappedNetId],
            valuedBy: c.valuedBy || []
          };
        });
        
        setContributions(processedContributions);
        
        // Create team members from mapped users
        const members = {};
        Object.values(mappedUsers).forEach((netId, i) => {
          if (!members[netId]) {
            members[netId] = { 
              net_id: netId, 
              initials: netId.charAt(0).toUpperCase(),
              color: ["bg-pink-500", "bg-blue-500", "bg-yellow-400", "bg-teal-400", "bg-purple-500", "bg-orange-400"][i % 6]
            };
          }
        });
        
        setTeamMembers(members);
        
        // Set current user (use first mapped user or default)
        const sortedNetIds = Object.values(mappedUsers).sort();
        const determinedUser = sortedNetIds.includes('yifan') ? 'yifan' : sortedNetIds[0] || 'default_user';
        setCurrentUser(determinedUser);
        
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
  const toggleAttribution = (contributionId, memberId) => { setContributions(contributions.map(c => { if (c.id === contributionId && c.net_id === currentUser) { const newAttributedTo = c.attributedTo.includes(memberId) ? c.attributedTo.filter(id => id !== memberId) : [...c.attributedTo, memberId]; if (newAttributedTo.length > 0) { return { ...c, attributedTo: newAttributedTo }; } } return c; })); };
  const handleAddOfflineWork = (newItem) => { const newContribution = { id: `ext-${Date.now()}`, net_id: currentUser, title: newItem.title, tool: 'External Work', timestamp: newItem.timestamp, attributedTo: newItem.contributors, valuedBy: [] }; setContributions([...contributions, newContribution]); setShowOfflineModal(false); };
  const handleEditOfflineWork = (updatedItem) => { setContributions(contributions.map(c => c.id === updatedItem.id ? { ...c, title: updatedItem.title, timestamp: updatedItem.timestamp, hours: updatedItem.hours, attributedTo: updatedItem.contributors } : c )); setEditingContribution(null); };
  const handleDeleteExternalWork = (idToDelete) => { if (window.confirm("Are you sure?")) { setContributions(contributions.filter(c => c.id !== idToDelete)); } };
  const handleValuedContribution = (tag, comment) => { setContributions(contributions.map(c => { if (c.id === showValuedModal) { const alreadyValued = c.valuedBy.some(v => v.net_id === currentUser); if (alreadyValued) { return { ...c, valuedBy: c.valuedBy.filter(v => v.net_id !== currentUser) }; } else { const newValuation = { net_id: currentUser, tag, comment }; return { ...c, valuedBy: [...c.valuedBy, newValuation] }; } } return c; })); setShowValuedModal(null); };

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
      <button 
        onClick={() => {
          // Get team ID from localStorage if not already available
          let currentTeamId = teamId || localStorage.getItem("teamId") || "teamio";
          navigate("/teamio", { state: { teamId: currentTeamId } });
        }} 
        className="text-blue-600 hover:underline mb-6"
      >
        &larr; Back to Dashboard
      </button>
      <h1 className="text-2xl font-bold text-gray-800">Step 5: Annotate Contributions</h1>
      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
          <p className="text-sm">From the resources you linked, the system has extracted the following contribution history. Please review each item with your team and use the options below to create a more complete and accurate picture of your work.</p>
          <ul className="list-disc list-inside text-sm space-y-2 mt-2">
              <li><span className="font-bold">Attribute Work:</span> For each item, the logged contributor can attribute the work to other team members who also contributed, such as during pair programming.</li>
              <li><span className="font-bold">Highlight Valuable Contributions:</span> You can highlight contributions from your teammates that you found particularly valuable using the bookmark icon. You cannot highlight your own work.</li>
              <li><span className="font-bold">Add External Work:</span> If important work happened outside of the linked tools, use the button at the end of the list to add it. Only one person needs to add an external item.</li>
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
          <option value="github">GitHub</option>
          <option value="google_docs">Google Docs</option>
          <option value="External Work">External Work</option>
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
              const isCurrentUserAuthor = c.net_id === currentUser;
              const isExternalWork = c.tool === 'External Work';
              const hasCurrentUserValued = c.valuedBy.some(v => v.net_id === currentUser);

              return (
                <div key={c.id} className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between">
                  {/* ... rest of the component is the same as the previous correct version ... */}
                  <div className="flex-grow mb-4 md:mb-0 flex items-center space-x-4">
                    <ToolIcon tool={c.tool} />
                    <div>
                      <p className="font-semibold text-gray-800">{c.title}</p>
                      <p className="text-sm text-gray-500">Logged by {c.net_id} on {new Date(c.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 mr-2">Attributed to:</span>
                      {Object.values(teamMembers).map(member => {
                        const isAttributed = c.attributedTo.includes(member.net_id);
                        const isOriginalAuthor = c.net_id === member.net_id;
                        return (
                          <button
                            key={member.net_id}
                            onClick={() => toggleAttribution(c.id, member.net_id)}
                            disabled={!isCurrentUserAuthor || isOriginalAuthor}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 mx-1 ${member.color} ${isAttributed ? 'opacity-100' : 'opacity-30'} ${isOriginalAuthor ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${isCurrentUserAuthor && !isOriginalAuthor ? 'hover:opacity-100' : ''} ${!isCurrentUserAuthor || isOriginalAuthor ? 'cursor-not-allowed' : ''}`}
                            title={isCurrentUserAuthor ? `Click to ${isAttributed ? 'remove' : 'add'} ${member.net_id}` : member.net_id}
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
                      {isCurrentUserAuthor && isExternalWork && (
                        <>
                          <button onClick={() => setEditingContribution(c)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Edit External Work"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                          <button onClick={() => handleDeleteExternalWork(c.id)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Delete External Work"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button onClick={() => setShowOfflineModal(true)} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors">+ Add External Work</button>
      </div>
      <div className="flex justify-center mt-4">
        <button
          onClick={() => { 
            setStepsCompletion((prev) => ({...prev, step5: true })); 
            // Get team ID from localStorage if not already available
            let currentTeamId = teamId || localStorage.getItem("teamId") || "teamio";
            navigate("/teamio", { state: { teamId: currentTeamId } });
          }}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
        >
          Submit
        </button>
      </div>

      {showValuedModal && <ValuedContributionModal onSubmit={(tag, comment) => handleValuedContribution(tag, comment)} onCancel={() => setShowValuedModal(null)} />}
      {showOfflineModal && <AddOfflineWorkModal onSubmit={handleAddOfflineWork} onCancel={() => setShowOfflineModal(false)} teamMembers={teamMembers} currentUser={currentUser} />}
      {editingContribution && <AddOfflineWorkModal existingWork={editingContribution} onSubmit={handleEditOfflineWork} onCancel={() => setEditingContribution(null)} teamMembers={teamMembers} currentUser={currentUser} />}
    </div>
  );
};

export default AnnotateContributionsPage;