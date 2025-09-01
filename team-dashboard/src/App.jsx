import React, { useState, useEffect } from 'react';

// --- Helper Components ---

const IconCheck = () => (
  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);

const IconLock = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
);

const ToolIcon = ({ tool }) => {
    const icons = {
        'GitHub': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-5 h-5 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>,
        'Google Docs': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 332.4" className="w-5 h-5 fill-current"><path d="M93.6,332.4l93.6-162.4L93.6,8.2H0L93.6,170.6,0,332.4Z"/><path d="M125.4,279.3l52.5-91.1-52.5-91.1H231l52.5,91.1-52.5,91.1Z"/><path d="M258.6,332.4l93.6-162.4L258.6,8.2h93.6L445.8,170.6,352.2,332.4Z"/></svg>,
        'External Work': <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
    };
    return <div className="text-gray-500" title={tool}>{icons[tool] || icons['External Work']}</div>;
};


// --- Mock Data & Config ---

const CURRENT_USER_ID = 1; // Assuming Alex is the logged-in user

const TEAM_MEMBERS = [
    { id: 1, name: 'Alex', initials: 'A', avatarColor: 'bg-blue-500', colorHex: '#3B82F6' },
    { id: 2, name: 'Brianna', initials: 'B', avatarColor: 'bg-green-500', colorHex: '#10B981' },
    { id: 3, name: 'Charlie', initials: 'C', avatarColor: 'bg-yellow-500', colorHex: '#F59E0B' },
    { id: 4, name: 'Dana', initials: 'D', avatarColor: 'bg-purple-500', colorHex: '#8B5CF6' },
];

const MOCK_CONTRIBUTIONS = [
    // Alex: Heavy on GitHub, steady work
    { id: 1, authorId: 1, description: 'Created initial project structure', tool: 'GitHub', date: '2025-07-15', attributedTo: [1], valuedBy: [], hours: 3 },
    { id: 3, authorId: 1, description: 'Implemented user authentication', tool: 'GitHub', date: '2025-07-18', attributedTo: [1, 2], valuedBy: [{ from: 4, tag: 'Quality Work' }], hours: 8 },
    { id: 8, authorId: 1, description: 'Added responsive CSS', tool: 'GitHub', date: '2025-07-21', attributedTo: [1], valuedBy: [], hours: 5 },
    { id: 11, authorId: 1, description: 'Finalized README documentation', tool: 'Google Docs', date: '2025-07-26', attributedTo: [1], valuedBy: [], hours: 2 },

    // Brianna: Heavy on Google Docs, work clustered at the end
    { id: 2, authorId: 2, description: 'Wrote API documentation draft', tool: 'Google Docs', date: '2025-07-25', attributedTo: [2], valuedBy: [{from: 1, tag: 'Quality Work'}], hours: 5 },
    { id: 6, authorId: 2, description: 'Refactored application logic', tool: 'GitHub', date: '2025-07-22', attributedTo: [2], valuedBy: [{ from: 3, tag: 'Quality Work' }], hours: 7 },
    { id: 12, authorId: 2, description: 'Created presentation slides', tool: 'Google Docs', date: '2025-07-26', attributedTo: [2], valuedBy: [], hours: 4 },
    { id: 13, authorId: 2, description: 'Polished final proposal document', tool: 'Google Docs', date: '2025-07-27', attributedTo: [2], valuedBy: [{from: 4, tag: 'Quality Work'}], hours: 6 },

    // Charlie: Heavy on External Work, clustered at the beginning
    { id: 4, authorId: 3, description: 'Designed UI in Figma', tool: 'External Work', date: '2025-07-16', attributedTo: [3, 4], valuedBy: [{from: 1, tag: 'Creative Idea'}], hours: 6, evidence: 'figma_design.png' },
    { id: 7, authorId: 3, description: 'Conducted user testing interviews', tool: 'External Work', date: '2025-07-17', attributedTo: [3], valuedBy: [], hours: 4, evidence: 'user_feedback_notes.pdf' },
    { id: 14, authorId: 3, description: 'Whiteboard session for architecture planning', tool: 'External Work', date: '2025-07-14', attributedTo: [1, 2, 3, 4], valuedBy: [{from: 1, tag: 'Leadership'}], hours: 3 },
    { id: 15, authorId: 3, description: 'Minor bug fixes', tool: 'GitHub', date: '2025-07-24', attributedTo: [3], valuedBy: [], hours: 2 },

    // Dana: Database work on GitHub, supportive on Google Docs
    { id: 5, authorId: 4, description: 'Set up database schema', tool: 'GitHub', date: '2025-07-20', attributedTo: [4], valuedBy: [{ from: 1, tag: 'Leadership' }], hours: 4 },
    { id: 16, authorId: 4, description: 'Wrote database migration scripts', tool: 'GitHub', date: '2025-07-23', attributedTo: [4], valuedBy: [], hours: 5 },
    { id: 17, authorId: 4, description: 'Proofread final proposal', tool: 'Google Docs', date: '2025-07-27', attributedTo: [4], valuedBy: [], hours: 2 },
];

const MOCK_INTERACTIONS = [
    { id: 1, from: 2, to: 1, type: 'Comment', tool: 'Google Docs', content: "For the README, can you add a section on deployment?", on: "README Documentation" },
    { id: 2, from: 4, to: 1, type: 'Code Review', tool: 'GitHub', content: "LGTM, but can we extract this logic into a helper function?", on: "PR #12: User Auth" },
    { id: 3, from: 3, to: 2, type: 'Code Review', tool: 'GitHub', content: "Nice refactor! This is much cleaner.", on: "PR #15: Refactor Logic" },
    { id: 4, from: 1, to: 4, type: 'Comment', tool: 'GitHub', content: "Good catch on the schema design.", on: "Commit #a3f5d6" },
    { id: 5, from: 1, to: 3, type: 'Comment', tool: 'External Work', content: "The Figma designs are very clear and helpful.", on: "Figma UI Design" },
    { id: 6, from: 4, to: 2, type: 'Comment', tool: 'Google Docs', content: "Great work on the slides, everything looks very professional.", on: "Presentation Slides" },
    { id: 7, from: 1, to: 2, type: 'Code Review', tool: 'GitHub', content: "This logic looks solid.", on: "PR #15: Refactor Logic" },
];


const VALUED_TAGS = ["Leadership", "Creative Idea", "Quality Work", "Helpful Support"];

// --- Main App Components ---

const MainDashboard = ({ setCurrentPage, stepsCompletion }) => (
    <div className="p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Teamwork Reflection</h1>
            <p className="text-gray-600 mt-2">Follow these steps to analyze and reflect on your team's collaboration.</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
            <div className={`p-6 rounded-lg shadow-md transition-all ${stepsCompletion.step1 ? 'bg-green-50' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stepsCompletion.step1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            <span className="font-bold text-lg">1</span>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-xl font-semibold text-gray-800">Link Collaboration Tools</h2>
                            <p className={`text-sm ${stepsCompletion.step1 ? 'text-green-700' : 'text-gray-500'}`}>{stepsCompletion.step1 ? 'Status: Done' : 'Connect your team\'s tools'}</p>
                        </div>
                    </div>
                    {stepsCompletion.step1 && <IconCheck />}
                </div>
                {stepsCompletion.step1 ? (<button onClick={() => setCurrentPage('linkTools')} className="mt-4 text-sm text-blue-600 hover:underline">View/Edit Links</button>) : (<button onClick={() => setCurrentPage('linkTools')} className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Start Step 1</button>)}
            </div>
            <div className={`p-6 rounded-lg shadow-md transition-all ${!stepsCompletion.step1 ? 'opacity-50 cursor-not-allowed' : ''} ${stepsCompletion.step2 ? 'bg-green-50' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                         <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stepsCompletion.step2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}><span className="font-bold text-lg">2</span></div>
                        <div className="ml-4">
                            <h2 className="text-xl font-semibold text-gray-800">Annotate Contributions</h2>
                             <p className={`text-sm ${stepsCompletion.step2 ? 'text-green-700' : 'text-gray-500'}`}>{stepsCompletion.step2 ? 'Status: Done' : 'Attribute work to team members'}</p>
                        </div>
                    </div>
                    {stepsCompletion.step2 ? <IconCheck /> : !stepsCompletion.step1 && <IconLock />}
                </div>
                {stepsCompletion.step1 && !stepsCompletion.step2 && (<button onClick={() => setCurrentPage('attributeContributions')} className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Start Step 2</button>)}
                 {stepsCompletion.step2 && (<button onClick={() => setCurrentPage('attributeContributions')} className="mt-4 text-sm text-blue-600 hover:underline">View/Edit Annotations</button>)}
            </div>
            <div className={`p-6 rounded-lg shadow-md transition-all ${!stepsCompletion.step2 ? 'opacity-50 cursor-not-allowed' : ''} ${stepsCompletion.step3 ? 'bg-green-50' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                     <div className="flex items-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stepsCompletion.step3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}><span className="font-bold text-lg">3</span></div>
                        <div className="ml-4">
                            <h2 className="text-xl font-semibold text-gray-800">Team Reflection</h2>
                            <p className={`text-sm ${stepsCompletion.step3 ? 'text-green-700' : 'text-gray-500'}`}>{stepsCompletion.step3 ? 'Status: Done' : 'Review and discuss teamwork patterns'}</p>
                        </div>
                    </div>
                    {stepsCompletion.step3 ? <IconCheck /> : !stepsCompletion.step2 && <IconLock />}
                </div>
                 {stepsCompletion.step2 && (<button onClick={() => setCurrentPage('reflections')} className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Start Reflection</button>)}
            </div>
        </div>
        <div className="mt-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-lg max-w-2xl mx-auto">
            <p className="font-bold">A Note on Your Data</p>
            <p className="text-sm">This tool is designed for team reflection only. All data is controlled by your team and is not used for formal assessment or grading.</p>
        </div>
    </div>
);


const LinkToolsPage = ({ setCurrentPage, setStepsCompletion }) => {
    const [teamLinks, setTeamLinks] = useState({ github: '', googleDrive: '' });
    const [personalAccounts, setPersonalAccounts] = useState({
        1: { github: '', google: '' }, 2: { github: 'bri-dev', google: 'brianna@example.com' }, 3: { github: 'c-davis', google: '' }, 4: { github: '', google: 'dana@example.com' }
    });
    const handleTeamLinkChange = (toolKey, value) => setTeamLinks(prev => ({ ...prev, [toolKey]: value }));
    const handlePersonalAccountChange = (memberId, tool, value) => setPersonalAccounts(prev => ({ ...prev, [memberId]: { ...prev[memberId], [tool]: value } }));
    const handleDone = () => {
        setStepsCompletion(prev => ({ ...prev, step1: true }));
        setCurrentPage('dashboard');
    };
    const teamToolsToLink = [ { key: 'github', name: 'GitHub Repository' }, { key: 'googleDrive', name: 'Google Docs' }];

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <button onClick={() => setCurrentPage('dashboard')} className="text-blue-600 hover:underline mb-6">&larr; Back to Dashboard</button>
            <h1 className="text-2xl font-bold text-gray-800">Step 1: Link Collaboration Tools</h1>
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
                <p className="text-sm font-semibold">Instructions:</p>
                 <ul className="list-disc list-inside text-sm mt-2 space-y-2"><li><span className="font-bold">Team Resources:</span> Any team member can update these links for the whole team.<ul className="list-disc list-inside ml-5 mt-1 space-y-1"><li>For GitHub repo, you can leave it blank until the start of implementation. Please use the repo created by the course staff.</li><li>For Google Docs, you can update the link for each deliverable, or you can link your main project folder only once and we'll filter files by date. Please make sure the link will grant "Editor" access for all documents in the folder.</li></ul></li><li><span className="font-bold">Personal Accounts:</span> Each team member must enter their usernames to map their contributions correctly.</li></ul>
            </div>
            <div className="mt-8"><h2 className="text-xl font-semibold text-gray-700 mb-4">Team Resources</h2><div className="space-y-6">{teamToolsToLink.map(tool => (<div key={tool.key} className="p-4 border rounded-lg bg-white shadow-sm"><label htmlFor={tool.key} className="block text-lg font-medium text-gray-700">{tool.name}</label><div className="mt-2 flex items-center space-x-3"><input id={tool.key} type="text" placeholder={`Paste ${tool.name} URL here...`} value={teamLinks[tool.key]} onChange={(e) => handleTeamLinkChange(tool.key, e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" /><button className="px-4 py-2 rounded-md font-semibold text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors">{teamLinks[tool.key] ? 'Update' : 'Connect'}</button></div></div>))}</div></div>
            <div className="mt-10"><h2 className="text-xl font-semibold text-gray-700 mb-4">Personal Accounts</h2><div className="space-y-6">{TEAM_MEMBERS.map(member => { const isCurrentUser = member.id === CURRENT_USER_ID; return (<div key={member.id} className={`p-4 border rounded-lg bg-white shadow-sm ${!isCurrentUser ? 'bg-gray-50' : ''}`}><h3 className="font-bold text-lg text-gray-800">{member.name} {isCurrentUser && <span className="text-sm font-normal text-blue-600">(You)</span>}</h3><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"><div><label htmlFor={`github-${member.id}`} className="block text-sm font-medium text-gray-600">GitHub Username</label><input id={`github-${member.id}`} type="text" placeholder="e.g., alex-doe" value={personalAccounts[member.id].github} onChange={(e) => handlePersonalAccountChange(member.id, 'github', e.target.value)} disabled={!isCurrentUser} className={`mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${!isCurrentUser ? 'bg-gray-200 cursor-not-allowed' : ''}`} /></div><div><label htmlFor={`google-${member.id}`} className="block text-sm font-medium text-gray-600">Google Account Email</label><input id={`google-${member.id}`} type="email" placeholder="e.g., alex@example.com" value={personalAccounts[member.id].google} onChange={(e) => handlePersonalAccountChange(member.id, 'google', e.target.value)} disabled={!isCurrentUser} className={`mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${!isCurrentUser ? 'bg-gray-200 cursor-not-allowed' : ''}`} /></div></div></div>); })}</div></div>
            <div className="mt-10 text-center"><button onClick={handleDone} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">Done</button></div>
        </div>
    );
};

const AttributeContributionsPage = ({ setCurrentPage, setStepsCompletion }) => {
    const [contributions, setContributions] = useState(MOCK_CONTRIBUTIONS);
    const [editingContribution, setEditingContribution] = useState(null);
    const [showValuedModal, setShowValuedModal] = useState(null);
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const toggleAttribution = (contributionId, memberId) => { setContributions(contributions.map(c => { if (c.id === contributionId && c.authorId === CURRENT_USER_ID) { const isAttributed = c.attributedTo.includes(memberId); const newAttributedTo = isAttributed ? c.attributedTo.filter(id => id !== memberId) : [...c.attributedTo, memberId]; return { ...c, attributedTo: newAttributedTo }; } return c; })); };
    const handleAddOfflineWork = (newItem) => { const newContribution = { id: contributions.length + 1, authorId: CURRENT_USER_ID, ...newItem, tool: 'External Work', attributedTo: newItem.contributors, valuedBy: [], comments: [] }; setContributions([...contributions, newContribution]); setShowOfflineModal(false); };
    const handleEditOfflineWork = (updatedItem) => { setContributions(contributions.map(c => c.id === updatedItem.id ? { ...c, ...updatedItem, attributedTo: updatedItem.contributors } : c)); setEditingContribution(null); };
    const handleDeleteOfflineWork = (id) => { if(window.confirm("Are you sure you want to delete this external contribution?")){ setContributions(contributions.filter(c => c.id !== id)); } };
    const handleDone = () => { setStepsCompletion(prev => ({...prev, step2: true})); setCurrentPage('dashboard'); }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <button onClick={() => setCurrentPage('dashboard')} className="text-blue-600 hover:underline mb-6">&larr; Back to Dashboard</button>
            <h1 className="text-2xl font-bold text-gray-800">Step 2: Annotate Contributions</h1>
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
                <p className="text-sm">From the resources you linked, the system has extracted the following contribution history. Please review each item with your team and use the options below to create a more complete and accurate picture of your work.</p>
                 <ul className="list-disc list-inside text-sm space-y-2 mt-2">
                    <li><span className="font-bold">Attribute Work:</span> For each item, the logged contributor can attribute the work to other team members who also contributed, such as during pair programming.</li>
                    <li><span className="font-bold">Highlight Valuable Contributions:</span> You can highlight contributions from your teammates that you found particularly valuable (e.g., high-quality or difficult work) using the bookmark icon (<svg className="w-4 h-4 inline-block -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>). You cannot highlight your own work.</li>
                    <li><span className="font-bold">Add External Work:</span> If important work happened outside of the linked tools (e.g., a whiteboard session), use the button at the end of the list to add it. Only one person needs to add an external item.</li>
                </ul>
            </div>
            <div className="mt-8 overflow-x-auto"><div className="min-w-full bg-white rounded-lg shadow">{contributions.map(c => { const author = TEAM_MEMBERS.find(m => m.id === c.authorId); const isCurrentUserAuthor = c.authorId === CURRENT_USER_ID; const isOfflineWork = c.tool === 'External Work'; return (<div key={c.id} className={`p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between ${!isCurrentUserAuthor ? 'bg-gray-50' : ''}`}><div className="flex-grow mb-4 md:mb-0 flex items-center space-x-4"><ToolIcon tool={c.tool} /><div><p className="font-semibold text-gray-800">{c.description}</p><p className="text-sm text-gray-500">Logged by {author.name} on {c.date}</p></div></div><div className={`flex items-center space-x-2 md:space-x-4 ${!isCurrentUserAuthor && !isOfflineWork ? 'opacity-50' : ''}`}><div className="flex items-center"><span className="text-sm font-medium text-gray-600 mr-2">Attributed to:</span><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${author.avatarColor} ring-2 ring-offset-1 ring-blue-500`}>{author.initials}</div><div className="border-l h-6 border-gray-300 mx-3"></div>{TEAM_MEMBERS.filter(m => m.id !== c.authorId).map(member => { const isAttributed = c.attributedTo.includes(member.id); return (<button key={member.id} onClick={() => toggleAttribution(c.id, member.id)} disabled={!isCurrentUserAuthor} className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 mx-1 ${member.avatarColor} ${isAttributed ? 'opacity-100 ring-2 ring-offset-1 ring-green-500' : 'opacity-40 hover:opacity-100'} ${!isCurrentUserAuthor ? 'cursor-not-allowed' : ''}`} title={isCurrentUserAuthor ? `Attribute to ${member.name}`: ''}>{member.initials}</button>); })}</div><div className="flex items-center"><button onClick={() => setShowValuedModal(c.id)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Tag as Valued"><svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg></button>{isCurrentUserAuthor && isOfflineWork && (<><button onClick={() => setEditingContribution(c)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Edit External Work"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button><button onClick={() => handleDeleteOfflineWork(c.id)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Delete External Work"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button></>)}</div></div></div>); })}</div></div>
            <div className="mt-6 text-center">
                <button onClick={() => setShowOfflineModal(true)} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors">+ Add External Work</button>
            </div>
            <div className="mt-8 text-center"><button onClick={handleDone} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">Done</button></div>
            {showValuedModal !== null && <ValuedContributionModal contributionId={showValuedModal} onCancel={() => setShowValuedModal(null)} />}
            {showOfflineModal && <AddOfflineWorkModal onSubmit={handleAddOfflineWork} onCancel={() => setShowOfflineModal(false)} />}
            {editingContribution && <AddOfflineWorkModal existingWork={editingContribution} onSubmit={handleEditOfflineWork} onCancel={() => setEditingContribution(null)} />}
        </div>
    );
};

// --- Modal Components ---

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
    
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-bold mb-4">{existingWork ? 'Edit' : 'Add'} External Work</h3><p className="text-sm text-gray-600 mb-4">Log work that happened outside of linked tools, like brainstorming sessions or in-person meetings.</p><div className="space-y-4"><div><label htmlFor="offline-desc" className="block text-sm font-medium text-gray-700">Description</label><textarea id="offline-desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded h-20" placeholder="e.g., Whiteboard session for UI design..."></textarea></div><div><label htmlFor="offline-hours" className="block text-sm font-medium text-gray-700">Estimated Hours</label><input type="number" id="offline-hours" value={hours} onChange={e => setHours(e.target.value)} className="mt-1 w-full p-2 border rounded" placeholder="e.g., 2.5" /></div><div><label htmlFor="offline-date" className="block text-sm font-medium text-gray-700">Date</label><input type="date" id="offline-date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full p-2 border rounded" /></div><div><label className="block text-sm font-medium text-gray-700">Contributors</label><div className="flex items-center space-x-2 mt-1">{TEAM_MEMBERS.map(member => { const isAttributed = contributors.includes(member.id); return (<button key={member.id} onClick={() => toggleContributor(member.id)} className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 ${member.avatarColor} ${isAttributed ? 'opacity-100 ring-2 ring-offset-1 ring-green-500' : 'opacity-40 hover:opacity-100'}`} title={`Attribute to ${member.name}`}>{member.initials}</button>); })}</div></div><div><label htmlFor="offline-evidence" className="block text-sm font-medium text-gray-700">Evidence (Photo, PDF, etc.)</label><input type="file" id="offline-evidence" onChange={e => setEvidence(e.target.files[0])} className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>{existingWork?.evidence && !evidence && <p className="text-xs text-gray-500 mt-1">Current file: {existingWork.evidence}</p>}</div></div><div className="mt-6 flex justify-end space-x-3"><button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold">{existingWork ? 'Save Changes' : 'Add Contribution'}</button></div></div></div>);
};

const ValuedContributionModal = ({ contributionId, onCancel }) => {
    const [selectedTag, setSelectedTag] = useState('');
    const handleSubmit = () => { console.log(`Contribution ${contributionId} tagged as ${selectedTag}`); onCancel(); };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-bold mb-4">Identify as a Valued Contribution</h3><p className="text-sm text-gray-600 mb-4">Select a tag to describe why this contribution was valuable. You can also add an optional comment.</p><div className="space-y-2">{VALUED_TAGS.map(tag => (<button key={tag} onClick={() => setSelectedTag(tag)} className={`w-full text-left p-2 rounded transition-colors ${selectedTag === tag ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{tag}</button>))}</div><textarea className="mt-4 w-full p-2 border rounded h-20" placeholder="Optional comment..."></textarea><div className="mt-6 flex justify-end space-x-3"><button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold">Submit</button></div></div></div>);
};


const ReflectionsPage = ({ setCurrentPage, setStepsCompletion }) => {
    const [activeTab, setActiveTab] = useState('equity');
    const [showGoldStandard, setShowGoldStandard] = useState(null);

    const handleDone = () => {
        setStepsCompletion(prev => ({...prev, step3: true}));
        setCurrentPage('dashboard');
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'equity': return <EquitableContributionPanel setShowGoldStandard={setShowGoldStandard} />;
            case 'timeliness': return <TimelinessPanel setShowGoldStandard={setShowGoldStandard} />;
            case 'support': return <SupportPanel setShowGoldStandard={setShowGoldStandard} />;
            case 'valued': return <ValuedContributionsPanel setShowGoldStandard={setShowGoldStandard} />;
            default: return null;
        }
    };

    const tabs = [
        { id: 'equity', label: 'Equitable Contribution' },
        { id: 'timeliness', label: 'Timeliness' },
        { id: 'support', label: 'Mutual Support' },
        { id: 'valued', label: 'Valued Contributions' },
    ];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
             <button onClick={() => setCurrentPage('dashboard')} className="text-blue-600 hover:underline mb-6">&larr; Back to Dashboard</button>
            <h1 className="text-2xl font-bold text-gray-800">Step 3: Team Reflection</h1>
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
                <p className="text-sm">Based on the <strong> annotated contribution history from Step 2 </strong>, we've generated visual summaries for the following teamwork behaviors. These behaviors were identified as important by both instructors and students in prior research [citation].</p>
            </div>
            <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${ activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-8">{renderContent()}</div>
            <div className="mt-12 text-center">
                 <button onClick={handleDone} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                    Finish Reflection
                </button>
            </div>
            {showGoldStandard && <GoldStandardModal behavior={showGoldStandard} onCancel={() => setShowGoldStandard(null)} />}
        </div>
    );
};

// --- Reflection Panel Components ---

const GoldStandardModal = ({ behavior, onCancel }) => {
    const content = {
        equity: { title: "Why is Equitable Contribution Important?", description: "Equitable contribution doesn't mean everyone does the exact same amount of work, but that the workload is distributed fairly and agreed upon by the team. A 'gold-standard' team often shows a relatively balanced pie chart, with no single member dominating or contributing very little." },
        timeliness: { title: "Why is Timeliness Important?", description: "Timeliness involves completing work on schedule and avoiding last-minute rushes. A 'gold-standard' team shows consistent progress throughout the project timeline, rather than a large cluster of activity right before the deadline." },
        support: { title: "Why is Mutual Support Important?", description: "Mutual support is about helping teammates, providing constructive feedback, and acknowledging valuable contributions. A 'gold-standard' team shows a heatmap with support flowing between all members, indicating a reciprocal and supportive environment." },
        valued: { title: "Why are Valued Contributions Important?", description: "Valued contributions are pieces of work that teammates identify as being particularly high-quality, creative, or helpful. In a 'gold-standard' team, all members both give and receive recognition, showing that high-quality work is distributed and appreciated across the team." },
    };
    const current = content[behavior];
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg"><h3 className="text-xl font-bold mb-4">{current.title}</h3><p className="text-sm text-gray-600 mb-4">{current.description}</p><div className="mt-6 flex justify-end"><button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">Close</button></div></div></div>);
};

const PieChart = ({ data, toolName }) => {
    const [hoveredMember, setHoveredMember] = useState(null);
    let cumulativePercent = 0;
    const pieData = data.map(d => {
        const percent = d.percentage;
        const startAngle = cumulativePercent;
        cumulativePercent += percent;
        const endAngle = cumulativePercent;
        return {...d, startAngle, endAngle};
    });

    return (
        <div className="flex-1 p-4 bg-white rounded-lg shadow-md flex flex-col items-center justify-center min-w-[300px]">
            <h4 className="font-bold text-gray-700 mb-2">{toolName}</h4>
            <div className="relative">
                <svg width="180" height="180" viewBox="0 0 100 100" className="transform -rotate-90">
                    {pieData.map(slice => {
                        if(slice.percentage === 0) return null;
                        const x1 = 50 + 50 * Math.cos(slice.startAngle * 2 * Math.PI / 100);
                        const y1 = 50 + 50 * Math.sin(slice.startAngle * 2 * Math.PI / 100);
                        const x2 = 50 + 50 * Math.cos(slice.endAngle * 2 * Math.PI / 100);
                        const y2 = 50 + 50 * Math.sin(slice.endAngle * 2 * Math.PI / 100);
                        const largeArcFlag = slice.percentage > 50 ? 1 : 0;
                        return <path key={slice.id} d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`} fill={slice.colorHex} onMouseEnter={() => setHoveredMember(slice)} onMouseLeave={() => setHoveredMember(null)} />;
                    })}
                </svg>
                {hoveredMember && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg"><p className="font-bold">{hoveredMember.name}</p><p>{hoveredMember.value} contribution(s)</p></div>}
            </div>
            <div className="mt-4 space-y-1 text-xs w-full">{data.map(m => (<div key={m.id} className="flex items-center"><div className={`w-3 h-3 rounded-sm ${m.avatarColor}`}></div><span className="ml-2 text-gray-700">{m.name} ({m.percentage.toFixed(1)}%)</span></div>))}</div>
        </div>
    );
};

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
            <div className="text-right text-sm text-gray-500 mt-1">{wordCount}/{maxWords} words</div>
        </div>
    );
};

const EquitableContributionPanel = ({ setShowGoldStandard }) => {
    const tools = ['GitHub', 'Google Docs', 'External Work'];
    const toolData = tools.map(tool => {
        const contributionsForTool = MOCK_CONTRIBUTIONS.filter(c => c.tool === tool);
        const totalAttributions = contributionsForTool.reduce((sum, c) => sum + c.attributedTo.length, 0);
        if (totalAttributions === 0) return { toolName: tool, data: [] };

        const data = TEAM_MEMBERS.map(m => {
            const memberAttributions = contributionsForTool.filter(c => c.attributedTo.includes(m.id));
            return {
                ...m,
                value: memberAttributions.length,
                percentage: totalAttributions > 0 ? (memberAttributions.length / totalAttributions) * 100 : 0,
            }
        });
        return { toolName: tool, data };
    });

    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Equitable Contribution</h3>
                    <p className="mt-2 text-gray-600">The pie charts below show the distribution of contributions. For GitHub, one unit is a commit. For Google Docs, one unit is an edit. For External Work, one unit is one hour.</p>
                    <button onClick={() => setShowGoldStandard('equity')} className="text-sm text-blue-600 hover:underline mt-1">Why is equitable contribution important?</button>
                </div>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
                {toolData.map(td => td.data.length > 0 && <PieChart key={td.toolName} data={td.data} toolName={td.toolName} />)}
            </div>
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reflection Prompt:</label>
                <p className="text-sm text-gray-600 mb-2">Looking at the contribution balance across different tools, what patterns do you see? Does the team have specialists for certain types of work? Does this distribution feel fair and effective?</p>
                <WordCountTextArea />
            </div>
        </div>
    );
};

const TimelinessPanel = ({ setShowGoldStandard }) => {
    const [hoveredContribution, setHoveredContribution] = useState(null);
    const projectStartDate = new Date('2025-07-14');
    const projectEndDate = new Date('2025-07-28');
    const totalDays = (projectEndDate - projectStartDate) / (1000 * 60 * 60 * 24);
    const dayMarkers = Array.from({ length: totalDays + 1 }, (_, i) => i);

    const getShape = (tool, colorClass) => {
        const baseClasses = "w-4 h-4 absolute transform -translate-y-1/2 -translate-x-1/2";
        switch (tool) {
            case 'GitHub': // Circle
                return <div className={`${baseClasses} ${colorClass} rounded-full`}></div>;
            case 'Google Docs': // Triangle
                return <div className={`w-0 h-0 absolute transform -translate-y-1/2 -translate-x-1/2 border-l-8 border-l-transparent border-b-[14px] ${colorClass.replace('bg-', 'border-b-')} border-r-8 border-r-transparent`}></div>;
            case 'External Work': // Square
                return <div className={`${baseClasses} ${colorClass}`}></div>;
            default:
                return null;
        }
    };

    return (
        <div>
             <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Timeliness</h3>
                    <p className="mt-2 text-gray-600">This chart visualizes when contributions were made by each team member over the project timeline. Each shape represents a type of work, colored by the author.</p>
                     <button onClick={() => setShowGoldStandard('timeliness')} className="text-sm text-blue-600 hover:underline mt-1">Why is timeliness important?</button>
                </div>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="space-y-6">
                    {TEAM_MEMBERS.map(member => {
                        const contributions = MOCK_CONTRIBUTIONS.filter(c => c.authorId === member.id);
                        return (
                            <div key={member.id} className="flex items-center">
                                <span className="font-medium text-sm text-gray-700 w-20">{member.name}</span>
                                <div className="flex-grow h-8 relative ml-4 border-b-2 border-gray-300">
                                    {dayMarkers.map(day => (
                                        <div key={day} className="absolute h-full border-l border-gray-200" style={{left: `${(day/totalDays) * 100}%`}}></div>
                                    ))}
                                    {contributions.map(c => {
                                        const contributionDate = new Date(c.date);
                                        const leftPosition = ((contributionDate - projectStartDate) / (1000 * 60 * 60 * 24) / totalDays) * 100;
                                        return (
                                            <div key={c.id} 
                                                 onMouseEnter={() => setHoveredContribution(c)} 
                                                 onMouseLeave={() => setHoveredContribution(null)} 
                                                 className="absolute top-1/2"
                                                 style={{ left: `${leftPosition}%` }}>
                                                {getShape(c.tool, member.avatarColor)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 flex justify-between text-xs text-gray-500">
                    <span>Start: {projectStartDate.toLocaleDateString()}</span>
                    <span>End: {projectEndDate.toLocaleDateString()}</span>
                </div>
                 <div className="mt-8 flex justify-center items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center"><div className="w-4 h-4 bg-gray-400 rounded-full mr-2"></div><span>GitHub</span></div>
                    <div className="flex items-center"><div className="w-0 h-0 border-l-8 border-l-transparent border-b-[14px] border-b-gray-400 border-r-8 border-r-transparent mr-2"></div><span>Google Docs</span></div>
                    <div className="flex items-center"><div className="w-4 h-4 bg-gray-400 mr-2"></div><span>External Work</span></div>
                </div>
            </div>
            {hoveredContribution && <div className="mt-2 p-2 bg-gray-100 rounded text-sm"><strong>{TEAM_MEMBERS.find(m => m.id === hoveredContribution.authorId).name} - {hoveredContribution.date}:</strong> [{hoveredContribution.tool}] {hoveredContribution.description}</div>}
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reflection Prompt:</label>
                <p className="text-sm text-gray-600 mb-2">What patterns do you notice in each person's work rhythm? Was work front-loaded, back-loaded, or steady? How did the timing of different types of work (e.g., coding vs. writing) affect the team?</p>
                <WordCountTextArea />
            </div>
        </div>
    );
};


const SupportPanel = ({ setShowGoldStandard }) => {
    const [hoveredCell, setHoveredCell] = useState(null);

    return (
         <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Mutual Support</h3>
                    <p className="mt-2 text-gray-600">This heatmap shows the flow of support, based on interactions like code reviews and comments. The color intensity of a cell indicates the number of supportive interactions from one member (row) to another (column).</p>
                    <button onClick={() => setShowGoldStandard('support')} className="text-sm text-blue-600 hover:underline mt-1">Why is mutual support important?</button>
                </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-md overflow-x-auto">
                <div className="inline-block min-w-full relative">
                    <div className="flex items-center">
                        <div className="w-32 flex-shrink-0"></div>
                        <div className="flex-grow grid grid-cols-4 gap-2">
                            {TEAM_MEMBERS.map(member => (<div key={member.id} className="text-center font-semibold text-sm text-gray-600 p-2">{member.name} Receives</div>))}
                        </div>
                    </div>
                    {TEAM_MEMBERS.map(giver => (
                        <div key={giver.id} className="flex items-center mt-2">
                            <div className="w-32 flex-shrink-0 text-right pr-4 font-semibold text-sm text-gray-600">{giver.name} Gives</div>
                            <div className="flex-grow grid grid-cols-4 gap-2">
                                {TEAM_MEMBERS.map(receiver => { 
                                    const interactions = MOCK_INTERACTIONS.filter(i => i.from === giver.id && i.to === receiver.id); 
                                    const count = interactions.length; 
                                    const opacity = count > 0 ? Math.min(0.4 + count * 0.2, 1) : 0.1; 
                                    return (<div key={receiver.id} onMouseEnter={() => setHoveredCell({giver, receiver, interactions})} onMouseLeave={() => setHoveredCell(null)} className="h-12 rounded flex items-center justify-center font-bold text-white cursor-pointer" style={{ backgroundColor: giver.colorHex, opacity }}>{count}</div>); 
                                })}
                            </div>
                        </div>
                    ))}
                    {hoveredCell && hoveredCell.interactions.length > 0 && <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 w-96"><p className="font-bold mb-2">{hoveredCell.giver.name} gave feedback to {hoveredCell.receiver.name}:</p><ul className="list-disc list-inside space-y-1">{hoveredCell.interactions.map(i => <li key={i.id}>[{i.type} on {i.on}]: "{i.content}"</li>)}</ul></div>}
                </div>
            </div>
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reflection Prompt:</label>
                <p className="text-sm text-gray-600 mb-2">Are there any notable patterns in how support is given and received? Is the support reciprocal? Are there any team members who might need more support?</p>
                <WordCountTextArea />
            </div>
        </div>
    );
};

const ValuedContributionsPanel = ({ setShowGoldStandard }) => {
    const valuedContributions = MOCK_CONTRIBUTIONS.filter(c => c.valuedBy.length > 0);

    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Valued Contributions</h3>
                    <p className="mt-2 text-gray-600">This list shows all contributions that were bookmarked as 'Valued' by teammates. This helps surface high-impact work that the team collectively appreciated.</p>
                    <button onClick={() => setShowGoldStandard('valued')} className="text-sm text-blue-600 hover:underline mt-1">Why are valued contributions important?</button>
                </div>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
                {TEAM_MEMBERS.map(member => {
                    const memberValuedContributions = valuedContributions.filter(c => c.attributedTo.includes(member.id));
                    if (memberValuedContributions.length === 0) return null;
                    return (
                        <div key={member.id} className="mb-4">
                            <h4 className="font-bold text-gray-800">{member.name}'s Valued Work:</h4>
                            <ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-2">
                                {memberValuedContributions.map(c => (
                                    <li key={c.id}>
                                        <span className="font-semibold">"{c.description}"</span> was valued by <span className="font-semibold">{c.valuedBy.map(v => TEAM_MEMBERS.find(m=>m.id===v.from).name).join(', ')}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
                 {valuedContributions.length === 0 && <p className="text-center text-gray-500">No contributions have been marked as valuable yet.</p>}
            </div>
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reflection Prompt:</label>
                <p className="text-sm text-gray-600 mb-2">What kinds of work does the team seem to value most? Are there any surprises here? How can the team ensure that all types of important work are recognized?</p>
                <WordCountTextArea />
            </div>
        </div>
    );
};


export default function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [stepsCompletion, setStepsCompletion] = useState({ step1: false, step2: false, step3: false });
    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <MainDashboard setCurrentPage={setCurrentPage} stepsCompletion={stepsCompletion} />;
            case 'linkTools': return <LinkToolsPage setCurrentPage={setCurrentPage} setStepsCompletion={setStepsCompletion} />;
            case 'attributeContributions': return <AttributeContributionsPage setCurrentPage={setCurrentPage} setStepsCompletion={setStepsCompletion} />;
            case 'reflections': return <ReflectionsPage setCurrentPage={setCurrentPage} setStepsCompletion={setStepsCompletion} />;
            default: return <MainDashboard setCurrentPage={setCurrentPage} stepsCompletion={stepsCompletion} />;
        }
    };
    return (<div className="bg-gray-50 min-h-screen font-sans">{renderPage()}</div>);
}
