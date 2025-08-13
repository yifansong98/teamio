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
        'Google Drive': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 332.4" className="w-5 h-5 fill-current"><path d="M93.6,332.4l93.6-162.4L93.6,8.2H0L93.6,170.6,0,332.4Z"/><path d="M125.4,279.3l52.5-91.1-52.5-91.1H231l52.5,91.1-52.5,91.1Z"/><path d="M258.6,332.4l93.6-162.4L258.6,8.2h93.6L445.8,170.6,352.2,332.4Z"/></svg>,
        'Offline Work': <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
    };
    return <div className="text-gray-500" title={tool}>{icons[tool] || icons['Offline Work']}</div>;
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
    { id: 1, authorId: 1, description: 'Created initial project structure', tool: 'GitHub', date: '2025-07-15', attributedTo: [1], valuedBy: [{from: 2, tag: 'Leadership', text: "Great start!"}], hours: 3 },
    { id: 2, authorId: 2, description: 'Wrote API documentation', tool: 'Google Drive', date: '2025-07-16', attributedTo: [2], valuedBy: [{from: 1, tag: 'Quality Work', text: "Very clear."}], hours: 5 },
    { id: 3, authorId: 1, description: 'Implemented user authentication', tool: 'GitHub', date: '2025-07-18', attributedTo: [1, 2], valuedBy: [{ from: 4, tag: 'Quality Work', text: 'This was a complex feature, great job!' }, { from: 3, tag: 'Helpful Support', text: 'Helped me get unblocked.' }], hours: 8 },
    { id: 4, authorId: 3, description: 'Designed UI in Figma', tool: 'Offline Work', date: '2025-07-19', attributedTo: [3, 4], valuedBy: [{from: 1, tag: 'Creative Idea'}], hours: 6, evidence: 'figma_design.png' },
    { id: 5, authorId: 4, description: 'Set up database schema', tool: 'GitHub', date: '2025-07-20', attributedTo: [4], valuedBy: [{ from: 1, tag: 'Leadership' }], hours: 4 },
    { id: 6, authorId: 2, description: 'Refactored application logic', tool: 'GitHub', date: '2025-07-22', attributedTo: [2], valuedBy: [{ from: 3, tag: 'Quality Work' }], hours: 7 },
    { id: 7, authorId: 3, description: 'User testing feedback', tool: 'Offline Work', date: '2025-07-24', attributedTo: [3], valuedBy: [], hours: 4, evidence: 'user_feedback_notes.pdf' },
];

const MOCK_INTERACTIONS = [
    { id: 1, from: 2, to: 1, type: 'Comment', tool: 'Google Drive', content: "Looks good, maybe we can add a section for error handling?", on: "API Documentation" },
    { id: 2, from: 4, to: 1, type: 'Code Review', tool: 'GitHub', content: "LGTM, but can we extract this logic into a helper function?", on: "PR #12: User Auth" },
    { id: 3, from: 3, to: 2, type: 'Code Review', tool: 'GitHub', content: "Nice refactor! This is much cleaner.", on: "PR #15: Refactor Logic" },
    { id: 4, from: 1, to: 4, type: 'Comment', tool: 'GitHub', content: "Good catch on the schema design.", on: "Commit #a3f5d6" },
    { id: 5, from: 1, to: 3, type: 'Comment', tool: 'Offline Work', content: "The Figma designs are very clear and helpful.", on: "Figma UI Design" },
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
                            <h2 className="text-xl font-semibold text-gray-800">Attribute Contributions</h2>
                             <p className={`text-sm ${stepsCompletion.step2 ? 'text-green-700' : 'text-gray-500'}`}>{stepsCompletion.step2 ? 'Status: Done' : 'Attribute work to team members'}</p>
                        </div>
                    </div>
                    {stepsCompletion.step2 ? <IconCheck /> : !stepsCompletion.step1 && <IconLock />}
                </div>
                {stepsCompletion.step1 && !stepsCompletion.step2 && (<button onClick={() => setCurrentPage('attributeContributions')} className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Start Step 2</button>)}
                 {stepsCompletion.step2 && (<button onClick={() => setCurrentPage('attributeContributions')} className="mt-4 text-sm text-blue-600 hover:underline">View/Edit Attributes</button>)}
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
    const [teamLinks, setTeamLinks] = useState({ github: '', googleDrive: '', slack: '' });
    const [personalAccounts, setPersonalAccounts] = useState({
        1: { github: '', google: '' }, 2: { github: 'bri-dev', google: 'brianna@example.com' }, 3: { github: 'c-davis', google: '' }, 4: { github: '', google: 'dana@example.com' }
    });
    const handleTeamLinkChange = (toolKey, value) => setTeamLinks(prev => ({ ...prev, [toolKey]: value }));
    const handlePersonalAccountChange = (memberId, tool, value) => setPersonalAccounts(prev => ({ ...prev, [memberId]: { ...prev[memberId], [tool]: value } }));
    const handleDone = () => {
        if (Object.values(teamLinks).some(link => link.trim() !== '')) {
            setStepsCompletion(prev => ({ ...prev, step1: true }));
            setCurrentPage('dashboard');
        } else { alert('Please link at least one team resource to proceed.'); }
    };
    const teamToolsToLink = [ { key: 'github', name: 'GitHub Repository' }, { key: 'googleDrive', name: 'Google Drive Folder' }, { key: 'slack', name: 'Slack Channel' }];

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <button onClick={() => setCurrentPage('dashboard')} className="text-blue-600 hover:underline mb-6">&larr; Back to Dashboard</button>
            <h1 className="text-2xl font-bold text-gray-800">Step 1: Link Collaboration Tools</h1>
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
                <p className="text-sm font-semibold">Instructions:</p>
                 <ul className="list-disc list-inside text-sm mt-2 space-y-2"><li><span className="font-bold">Team Resources:</span> Any team member can update these links for the whole team.<ul className="list-disc list-inside ml-5 mt-1 space-y-1"><li>For GitHub repo, you can leave it blank until the start of implementation. Please use the repo created by the course staff.</li><li>For Google Drive folder, you can update the link for each deliverable, or you can link your main project folder only once and we'll filter files by date. Please make sure the link will grant "Editor" access for all documents in the folder.</li></ul></li><li><span className="font-bold">Personal Accounts:</span> Each team member must enter their usernames to map their contributions correctly.</li></ul>
            </div>
            <div className="mt-8"><h2 className="text-xl font-semibold text-gray-700 mb-4">Team Resources</h2><div className="space-y-6">{teamToolsToLink.map(tool => (<div key={tool.key} className="p-4 border rounded-lg bg-white shadow-sm"><label htmlFor={tool.key} className="block text-lg font-medium text-gray-700">{tool.name}</label><div className="mt-2 flex items-center space-x-3"><input id={tool.key} type="text" placeholder={`Paste ${tool.name} URL here...`} value={teamLinks[tool.key]} onChange={(e) => handleTeamLinkChange(tool.key, e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" /><button className="px-4 py-2 rounded-md font-semibold text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors">{teamLinks[tool.key] ? 'Update' : 'Save'}</button></div></div>))}</div></div>
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
    const handleAddOfflineWork = (newItem) => { const newContribution = { id: contributions.length + 1, authorId: CURRENT_USER_ID, ...newItem, tool: 'Offline Work', attributedTo: [CURRENT_USER_ID], valuedBy: [], comments: [] }; setContributions([newContribution, ...contributions]); setShowOfflineModal(false); };
    const handleEditOfflineWork = (updatedItem) => { setContributions(contributions.map(c => c.id === updatedItem.id ? { ...c, ...updatedItem } : c)); setEditingContribution(null); };
    const handleDeleteOfflineWork = (id) => { if(window.confirm("Are you sure you want to delete this offline contribution?")){ setContributions(contributions.filter(c => c.id !== id)); } };
    const handleDone = () => { setStepsCompletion(prev => ({...prev, step2: true})); setCurrentPage('dashboard'); }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <button onClick={() => setCurrentPage('dashboard')} className="text-blue-600 hover:underline mb-6">&larr; Back to Dashboard</button>
            <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-gray-800">Step 2: Attribute Contributions</h1><button onClick={() => setShowOfflineModal(true)} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors">+ Add External Work</button></div>
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
                 <ul className="list-disc list-inside text-sm space-y-2"><li><span className="font-bold">Add External Work:</span> For work outside linked tools (e.g., in-person discussions), use the button above to log contributions and upload evidence (like a photo of a whiteboard).</li><li><span className="font-bold">Attribute Work:</span> To account for collaboration like pair programming, the original contributor ("scribe") can attribute their work to others. You can only edit attributions for your own contributions.</li><li><span className="font-bold">Identify Valued Contributions:</span> Use the bookmark icon (<svg className="w-4 h-4 inline-block -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>) to highlight work from teammates that you found valuable.</li></ul>
            </div>
            <div className="mt-8 overflow-x-auto"><div className="min-w-full bg-white rounded-lg shadow">{contributions.map(c => { const author = TEAM_MEMBERS.find(m => m.id === c.authorId); const isCurrentUserAuthor = c.authorId === CURRENT_USER_ID; const isOfflineWork = c.tool === 'Offline Work'; return (<div key={c.id} className={`p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between ${!isCurrentUserAuthor ? 'bg-gray-50' : ''}`}><div className="flex-grow mb-4 md:mb-0 flex items-center space-x-4"><ToolIcon tool={c.tool} /><div><p className="font-semibold text-gray-800">{c.description}</p><p className="text-sm text-gray-500">Logged by {author.name} on {c.date}</p></div></div><div className={`flex items-center space-x-2 md:space-x-4 ${!isCurrentUserAuthor && !isOfflineWork ? 'opacity-50' : ''}`}><div className="flex items-center"><span className="text-sm font-medium text-gray-600 mr-2">Attributed to:</span><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${author.avatarColor} ring-2 ring-offset-1 ring-blue-500`}>{author.initials}</div><div className="border-l h-6 border-gray-300 mx-3"></div>{TEAM_MEMBERS.filter(m => m.id !== c.authorId).map(member => { const isAttributed = c.attributedTo.includes(member.id); return (<button key={member.id} onClick={() => toggleAttribution(c.id, member.id)} disabled={!isCurrentUserAuthor} className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 mx-1 ${member.avatarColor} ${isAttributed ? 'opacity-100 ring-2 ring-offset-1 ring-green-500' : 'opacity-40 hover:opacity-100'} ${!isCurrentUserAuthor ? 'cursor-not-allowed' : ''}`} title={isCurrentUserAuthor ? `Attribute to ${member.name}`: ''}>{member.initials}</button>); })}</div><div className="flex items-center"><button onClick={() => setShowValuedModal(c.id)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Tag as Valued"><svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg></button>{isCurrentUserAuthor && isOfflineWork && (<><button onClick={() => setEditingContribution(c)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Edit Offline Work"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button><button onClick={() => handleDeleteOfflineWork(c.id)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Delete Offline Work"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button></>)}</div></div></div>); })}</div></div>
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
    const handleSubmit = () => { if (!description.trim() || !hours) { alert("Please fill in the description and estimated hours."); return; } if (!existingWork && !evidence) { alert("Please upload evidence for new offline work."); return; } const workData = { id: existingWork?.id, description, date, hours: parseFloat(hours), evidence: evidence ? evidence.name : existingWork?.evidence, }; onSubmit(workData); };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-bold mb-4">{existingWork ? 'Edit' : 'Add'} External Work</h3><p className="text-sm text-gray-600 mb-4">Log work that happened outside of linked tools, like brainstorming sessions or in-person meetings.</p><div className="space-y-4"><div><label htmlFor="offline-desc" className="block text-sm font-medium text-gray-700">Description</label><textarea id="offline-desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded h-20" placeholder="e.g., Whiteboard session for UI design..."></textarea></div><div><label htmlFor="offline-hours" className="block text-sm font-medium text-gray-700">Estimated Hours</label><input type="number" id="offline-hours" value={hours} onChange={e => setHours(e.target.value)} className="mt-1 w-full p-2 border rounded" placeholder="e.g., 2.5" /></div><div><label htmlFor="offline-date" className="block text-sm font-medium text-gray-700">Date</label><input type="date" id="offline-date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full p-2 border rounded" /></div><div><label htmlFor="offline-evidence" className="block text-sm font-medium text-gray-700">Evidence (Photo, PDF, etc.)</label><input type="file" id="offline-evidence" onChange={e => setEvidence(e.target.files[0])} className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>{existingWork?.evidence && !evidence && <p className="text-xs text-gray-500 mt-1">Current file: {existingWork.evidence}</p>}</div></div><div className="mt-6 flex justify-end space-x-3"><button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold">{existingWork ? 'Save Changes' : 'Add Contribution'}</button></div></div></div>);
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
        equity: { title: "What is Equitable Contribution?", description: "Equitable contribution doesn't mean everyone does the exact same amount of work, but that the workload is distributed fairly and agreed upon by the team. A 'gold-standard' team often shows a relatively balanced pie chart, with no single member dominating or contributing very little.", viz: <div className="w-48 h-48 rounded-full flex relative" style={{background: `conic-gradient(#4299e1 0% 25%, #48bb78 25% 50%, #f6e05e 50% 75%, #9f7aea 75% 100%)`}}></div> },
        timeliness: { title: "What is Timeliness?", description: "Timeliness involves completing work on schedule and avoiding last-minute rushes. A 'gold-standard' team shows consistent progress throughout the project timeline, rather than a large cluster of activity right before the deadline.", viz: <div className="w-full h-10 bg-gray-200 rounded-full relative"><div className="absolute top-0 h-10 w-2 rounded bg-blue-500" style={{left: '10%'}}></div><div className="absolute top-0 h-10 w-2 rounded bg-green-500" style={{left: '30%'}}></div><div className="absolute top-0 h-10 w-2 rounded bg-yellow-500" style={{left: '55%'}}></div><div className="absolute top-0 h-10 w-2 rounded bg-purple-500" style={{left: '80%'}}></div></div> },
        support: { title: "What is Mutual Support?", description: "Mutual support is about helping teammates, providing constructive feedback, and acknowledging valuable contributions. A 'gold-standard' team shows a heatmap with support flowing between all members, indicating a reciprocal and supportive environment.", viz: <div className="grid grid-cols-4 gap-1 w-48 h-48">{[...Array(16)].map((_, i) => <div key={i} className="bg-blue-500 rounded" style={{opacity: Math.random() * 0.7 + 0.3}}></div>)}</div> },
        valued: { title: "What are Valued Contributions?", description: "Valued contributions are pieces of work that teammates identify as being particularly high-quality, creative, or helpful. In a 'gold-standard' team, all members both give and receive recognition, showing that high-quality work is distributed and appreciated across the team.", viz: <div className="w-full space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-purple-500 rounded" style={{width: `${Math.random() * 50 + 50}%`}}></div>)}</div> },
    };
    const current = content[behavior];
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg"><h3 className="text-xl font-bold mb-4">{current.title}</h3><p className="text-sm text-gray-600 mb-4">{current.description}</p><div className="my-6 flex items-center justify-center">{current.viz}</div><div className="mt-6 flex justify-end"><button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">Close</button></div></div></div>);
};

const DataViewDropdown = ({ view, setView }) => (
    <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-600">Data View:</span>
        <select value={view} onChange={e => setView(e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
            <option value="Overall">Overall</option>
            <option value="Google Drive">Google Drive</option>
            <option value="GitHub">GitHub</option>
        </select>
    </div>
);

const EquitableContributionPanel = ({ setShowGoldStandard }) => {
    const [view, setView] = useState('Overall');
    const [hoveredMember, setHoveredMember] = useState(null);

    const totalAttributions = MOCK_CONTRIBUTIONS.reduce((sum, c) => sum + c.attributedTo.length, 0);
    const data = TEAM_MEMBERS.map(m => {
        const memberAttributions = MOCK_CONTRIBUTIONS.filter(c => c.attributedTo.includes(m.id));
        const githubCount = memberAttributions.filter(c => c.tool === 'GitHub').length;
        const googleCount = memberAttributions.filter(c => c.tool === 'Google Drive').length;
        const offlineCount = memberAttributions.filter(c => c.tool === 'Offline Work').length;
        return {
            ...m,
            value: memberAttributions.length,
            percentage: ((memberAttributions.length / totalAttributions) * 100),
            details: `GitHub (commits): ${githubCount}\nGoogle Docs (Edits): ${googleCount}\nOffline Work (hours): ${offlineCount}`
        }
    });

    let cumulativePercent = 0;
    const pieData = data.map(d => {
        const percent = d.percentage;
        const startAngle = cumulativePercent;
        cumulativePercent += percent;
        const endAngle = cumulativePercent;
        return {...d, startAngle, endAngle};
    });

    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">Equitable Contribution <button onClick={() => setShowGoldStandard('equity')} className="p-1 rounded-full hover:bg-gray-200"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button></h3>
                    <p className="mt-2 text-gray-600">This chart shows the total work distribution. Hover over a pie slice to see details.</p>
                </div>
                <DataViewDropdown view={view} setView={setView} />
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md h-96 flex items-center justify-center">
                <div className="flex items-center justify-center space-x-8 relative">
                    <svg width="256" height="256" viewBox="0 0 100 100" className="transform -rotate-90">
                        {pieData.map(slice => {
                            const x1 = 50 + 50 * Math.cos(slice.startAngle * 2 * Math.PI / 100);
                            const y1 = 50 + 50 * Math.sin(slice.startAngle * 2 * Math.PI / 100);
                            const x2 = 50 + 50 * Math.cos(slice.endAngle * 2 * Math.PI / 100);
                            const y2 = 50 + 50 * Math.sin(slice.endAngle * 2 * Math.PI / 100);
                            const largeArcFlag = slice.percentage > 50 ? 1 : 0;
                            return <path key={slice.id} d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`} fill={slice.colorHex} onMouseEnter={() => setHoveredMember(slice)} onMouseLeave={() => setHoveredMember(null)} />;
                        })}
                    </svg>
                    <div className="space-y-2">{data.map(m => (<div key={m.id} className="flex items-center"><div className={`w-4 h-4 rounded-sm ${m.avatarColor}`}></div><span className="ml-2 text-sm text-gray-700">{m.name} ({m.percentage.toFixed(1)}%)</span></div>))}</div>
                    {hoveredMember && <div className="absolute top-0 left-full ml-4 p-3 bg-gray-800 text-white text-xs rounded shadow-lg w-48 whitespace-pre-line"><p className="font-bold">{hoveredMember.name}</p><p>{hoveredMember.details}</p></div>}
                </div>
            </div>
            <textarea className="mt-4 w-full p-2 border rounded-md" placeholder="This chart shows the total work distribution. How does the team feel about this balance?"></textarea>
        </div>
    );
};

const TimelinessPanel = ({ setShowGoldStandard }) => {
    const [view, setView] = useState('Overall');
    const [hoveredContribution, setHoveredContribution] = useState(null);
    const projectStartDate = new Date('2025-07-14');
    const projectEndDate = new Date('2025-07-28');
    const totalDays = (projectEndDate - projectStartDate) / (1000 * 60 * 60 * 24);
    const maxHours = Math.max(...MOCK_CONTRIBUTIONS.map(c => c.hours));
    
    return (
        <div>
             <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">Timeliness <button onClick={() => setShowGoldStandard('timeliness')} className="p-1 rounded-full hover:bg-gray-200"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button></h3>
                    <p className="mt-2 text-gray-600">What patterns do you notice? Was work front-loaded, back-loaded, or steady? </p>
                </div>
                <DataViewDropdown view={view} setView={setView} />
            </div>
            <div className="p-4 bg-white rounded-lg shadow-md"><div className="space-y-4">{TEAM_MEMBERS.map(member => {
                const contributions = MOCK_CONTRIBUTIONS.filter(c => c.authorId === member.id);
                return (<div key={member.id}><span className="font-medium text-sm text-gray-700">{member.name}</span><div className="mt-1 w-full bg-gray-200 rounded h-8 relative">{contributions.map(c => { const contributionDate = new Date(c.date); const leftPosition = ((contributionDate - projectStartDate) / (1000 * 60 * 60 * 24) / totalDays) * 100; const width = (c.hours / maxHours) * 15 + 2; return (<div key={`${c.id}-${member.id}`} onMouseEnter={() => setHoveredContribution(c)} onMouseLeave={() => setHoveredContribution(null)} className={`absolute top-0 h-8 rounded ${member.avatarColor}`} style={{ left: `${leftPosition}%`, width: `${width}%`, minWidth: '8px' }}></div>); })}</div></div>)
            })}</div>
            <div className="mt-4 flex justify-between text-xs text-gray-500"><span>Start: {projectStartDate.toLocaleDateString()}</span><span>End: {projectEndDate.toLocaleDateString()}</span></div>
            {hoveredContribution && <div className="mt-2 p-2 bg-gray-100 rounded text-sm"><strong>{TEAM_MEMBERS.find(m => m.id === hoveredContribution.authorId).name} - {hoveredContribution.date}:</strong> {hoveredContribution.description} ({hoveredContribution.hours} hrs)</div>}
            </div>
            <textarea className="mt-4 w-full p-2 border rounded-md" placeholder="What patterns do you notice? Was work front-loaded, back-loaded, or steady?"></textarea>
        </div>
    );
};

const SupportPanel = ({ setShowGoldStandard }) => {
    const [view, setView] = useState('Overall');
    const [hoveredCell, setHoveredCell] = useState(null);

    return (
         <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">Mutual Support <button onClick={() => setShowGoldStandard('support')} className="p-1 rounded-full hover:bg-gray-200"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button></h3>
                    <p className="mt-2 text-gray-600">Are there patterns in how support is given and received? Is it reciprocal?</p>
                </div>
                <DataViewDropdown view={view} setView={setView} />
            </div>
            <div className="p-4 bg-white rounded-lg shadow-md overflow-x-auto"><div className="inline-block min-w-full relative"><div className="flex items-center"><div className="w-32 flex-shrink-0"></div><div className="flex-grow grid grid-cols-4 gap-2">{TEAM_MEMBERS.map(member => (<div key={member.id} className="text-center font-semibold text-sm text-gray-600 p-2">Receives</div>))}</div></div><div className="flex items-center mt-1"><div className="w-32 flex-shrink-0"></div><div className="flex-grow grid grid-cols-4 gap-2">{TEAM_MEMBERS.map(member => (<div key={member.id} className="text-center font-semibold text-sm text-gray-600 p-2">{member.name}</div>))}</div></div>{TEAM_MEMBERS.map(giver => (<div key={giver.id} className="flex items-center mt-2"><div className="w-32 flex-shrink-0 text-right pr-4 font-semibold text-sm text-gray-600">{giver.id === TEAM_MEMBERS[0].id && <div className="absolute -left-4 transform -rotate-90 origin-bottom-left text-center font-semibold text-sm text-gray-600">Gives</div>}{giver.name}</div><div className="flex-grow grid grid-cols-4 gap-2">{TEAM_MEMBERS.map(receiver => { const interactions = MOCK_INTERACTIONS.filter(i => i.from === giver.id && i.to === receiver.id); const count = interactions.length; const opacity = count > 0 ? Math.min(0.4 + count * 0.2, 1) : 0.1; return (<div key={receiver.id} onMouseEnter={() => setHoveredCell({giver, receiver, interactions})} onMouseLeave={() => setHoveredCell(null)} className="h-12 rounded flex items-center justify-center font-bold text-white cursor-pointer" style={{ backgroundColor: giver.colorHex, opacity }}>{count}</div>); })}</div></div>))}
                {hoveredCell && hoveredCell.interactions.length > 0 && <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 w-96"><p className="font-bold mb-2">{hoveredCell.giver.name} gave feedback to {hoveredCell.receiver.name}:</p><ul className="list-disc list-inside space-y-1">{hoveredCell.interactions.map(i => <li key={i.id}>[{i.type} on {i.on}]: "{i.content}"</li>)}</ul></div>}
                </div></div>
            <textarea className="mt-4 w-full p-2 border rounded-md" placeholder="Are there patterns in how support is given and received? Is it reciprocal?"></textarea>
        </div>
    );
};

const ValuedContributionsPanel = ({ setShowGoldStandard }) => {
    const [view, setView] = useState('Overall');
    const [selectedUser, setSelectedUser] = useState(null);
    const data = TEAM_MEMBERS.map(member => ({ id: member.id, name: member.name, value: MOCK_CONTRIBUTIONS.filter(c => c.attributedTo.includes(member.id) && c.valuedBy.length > 0).length, color: member.avatarColor }));
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const valuedContributionsForSelectedUser = selectedUser ? MOCK_CONTRIBUTIONS.filter(c => c.attributedTo.includes(selectedUser.id) && c.valuedBy.length > 0) : [];

    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">Valued Contributions <button onClick={() => setShowGoldStandard('valued')} className="p-1 rounded-full hover:bg-gray-200"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button></h3>
                    <p className="mt-2 text-gray-600">How are valued contributions distributed across the team? Click a bar to see details.</p>
                </div>
                <DataViewDropdown view={view} setView={setView} />
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="space-y-4">{data.map(item => (<div key={item.name} className="flex items-center"><span className="w-24 text-sm font-medium text-gray-700">{item.name}</span><div className="flex-grow bg-gray-200 rounded-full h-6 cursor-pointer" onClick={() => setSelectedUser(item)}><div className={`${item.color} h-6 rounded-full flex items-center justify-end pr-2 text-white font-bold text-sm`} style={{ width: `${(item.value / maxValue) * 100}%` }}>{item.value}</div></div></div>))}</div>
                {selectedUser && (<div className="mt-6 p-4 bg-gray-50 rounded-lg"><h4 className="font-bold text-gray-800">Details for {selectedUser.name}</h4><ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-1">{valuedContributionsForSelectedUser.map(c => <li key={c.id}>"{c.description}" was valued by {c.valuedBy.map(v => TEAM_MEMBERS.find(m=>m.id===v.from).name).join(', ')}</li>)}</ul></div>)}
            </div>
            <textarea className="mt-4 w-full p-2 border rounded-md" placeholder="How are valued contributions distributed across the team?"></textarea>
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
