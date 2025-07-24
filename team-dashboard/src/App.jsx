import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar } from 'recharts';

// --- MOCK DATA & CONFIG ---
const MOCK_CURRENT_USER_ID = 1; // Alex is the logged-in user for this demo
const HIGH_QUALITY_LIMIT_PERCENTAGE = 0.2;

const initialActivities = [
    { id: 'a1', type: 'github_commit', userId: 1, timestamp: '2025-08-01T10:00:00Z', summary: 'Initial project setup', details: { linesAdded: 150 }, annotations: [], isHighQuality: { markedBy: [2, 4] }, isReviewed: true },
    { id: 'a2', type: 'gdoc_edit', userId: 4, timestamp: '2025-08-02T14:30:00Z', summary: 'Drafted project proposal introduction', details: { wordsAdded: 350 }, annotations: [], isHighQuality: { markedBy: [1, 3, 5] }, isReviewed: true },
    { id: 'a3', type: 'offline_work', userId: 1, timestamp: '2025-08-03T16:00:00Z', summary: 'Team brainstorming session', details: { duration: 60 }, annotations: [{ type: 'attribution', attributedTo: [1, 2, 3, 4, 5] }], isHighQuality: { markedBy: [2, 3, 4] }, isReviewed: true },
    { id: 'a4', type: 'github_commit', userId: 1, timestamp: '2025-08-04T11:20:00Z', summary: 'Implemented user authentication', details: { linesAdded: 250 }, annotations: [], isHighQuality: { markedBy: [3] }, isReviewed: false },
    { id: 'a5', type: 'gdoc_comment', userId: 2, onActivityId: 'a2', timestamp: '2025-08-04T15:00:00Z', summary: 'Comment on proposal draft', details: {}, annotations: [], isHighQuality: { markedBy: [] }, isReviewed: true },
    { id: 'a6', type: 'gdoc_edit', userId: 5, timestamp: '2025-08-05T18:00:00Z', summary: 'Added methodology section', details: { wordsAdded: 600 }, annotations: [], isHighQuality: { markedBy: [1, 2, 3, 4] }, isReviewed: false },
    { id: 'a7', type: 'github_pr_review', userId: 3, onActivityId: 'a4', timestamp: '2025-08-06T09:30:00Z', summary: 'Reviewed auth pull request', details: {}, annotations: [], isHighQuality: { markedBy: [] }, isReviewed: true },
    { id: 'a8', type: 'github_commit', userId: 2, timestamp: '2025-08-07T11:00:00Z', summary: 'Created basic UI components', details: { linesAdded: 400 }, annotations: [], isHighQuality: { markedBy: [1, 4, 5] }, isReviewed: false },
    { id: 'a9', type: 'gdoc_edit', userId: 3, timestamp: '2025-08-08T15:00:00Z', summary: 'Wrote user research findings', details: { wordsAdded: 800 }, annotations: [], isHighQuality: { markedBy: [1, 5] }, isReviewed: true },
    { id: 'a10', type: 'github_pr_review', userId: 1, onActivityId: 'a8', timestamp: '2025-08-09T10:00:00Z', summary: 'Reviewed UI components', details: {}, annotations: [], isHighQuality: { markedBy: [] }, isReviewed: true },
    { id: 'a11', type: 'github_commit', userId: 1, timestamp: '2025-08-10T20:15:00Z', summary: 'Set up database schema', details: { linesAdded: 180 }, annotations: [], isHighQuality: { markedBy: [] }, isReviewed: false },
    { id: 'a12', type: 'github_commit', userId: 1, timestamp: '2025-08-13T22:00:00Z', summary: 'Fixed critical auth bug', details: { linesAdded: 5 }, annotations: [{ type: 'context', text: 'This was a small but complex fix that took 3 hours to debug.', userId: 2 }], isHighQuality: { markedBy: [2, 3, 4, 5] }, isReviewed: true },
    { id: 'a13', type: 'gdoc_edit', userId: 4, timestamp: '2025-08-13T23:00:00Z', summary: 'Final formatting and references', details: { wordsAdded: 150 }, annotations: [], isHighQuality: { markedBy: [] }, isReviewed: false },
    { id: 'a14', type: 'github_commit', userId: 5, timestamp: '2025-08-14T10:00:00Z', summary: 'Final UI tweaks and deployment scripts', details: { linesAdded: 300 }, annotations: [], isHighQuality: { markedBy: [1] }, isReviewed: false },
    { id: 'a15', type: 'gdoc_comment', userId: 5, onActivityId: 'a9', timestamp: '2025-08-14T20:00:00Z', summary: 'Comment on research findings', details: {}, annotations: [], isHighQuality: { markedBy: [] }, isReviewed: true },
    { id: 'a16', type: 'offline_work', userId: 3, timestamp: '2025-08-14T23:00:00Z', summary: 'Discussing next deliverable', details: { duration: 60 }, annotations: [{ type: 'attribution', attributedTo: [1, 2, 3, 4, 5] }], isHighQuality: { markedBy: [2, 3, 4] }, isReviewed: true },
];

const mockData = {
  project: {
    name: "CS 465 Final Project", course: "User Interface Design", teamName: "Team Innovate",
    startDate: "2025-08-01T00:00:00Z",
    endDate: "2025-08-15T23:59:59Z",
    deliverables: ["Initial Proposal", "Revised Proposal", "User Research", "Low-fi Prototype", "Low-fi Prototype Evaluation", "Initial Functional Prototype", "Revised Functional Prototype", "Functional Prototype Evaluation"],
    currentDeliverableIndex: 5,
  },
  team: [
    { id: 1, name: "Alex", avatar: "https://placehold.co/40x40/7c3aed/ffffff?text=A" },
    { id: 2, name: "Ben", avatar: "https://placehold.co/40x40/2563eb/ffffff?text=B" },
    { id: 3, name: "Casey", avatar: "https://placehold.co/40x40/db2777/ffffff?text=C" },
    { id: 4, name: "Dana", avatar: "https://placehold.co/40x40/16a34a/ffffff?text=D" },
    { id: 5, name: "Eli", avatar: "https://placehold.co/40x40/f97316/ffffff?text=E" },
  ],
};

// --- ICONS ---
const icons = {
  home: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  github: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/></svg>,
  gdoc: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
  offline: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  annotate: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  interaction: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  star: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  info: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  check: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrowLeft: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  upload: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
};

// --- HELPER FUNCTIONS ---
const getUser = (id) => mockData.team.find(u => u.id === id);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const memberNameToY = (name) => mockData.team.findIndex(m => m.name === name);
const yToMemberName = (y) => mockData.team[y]?.name;

// --- UI COMPONENTS ---
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>{children}</div>;
const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md"><div className="p-4 border-b flex justify-between items-center"><h3 className="text-lg font-semibold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button></div><div className="p-4">{children}</div></div>
    </div>
  );
};
const PageHeader = ({ title, onBack }) => (
    <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-2">
            {icons.arrowLeft} Back to Homepage
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
    </div>
);

// --- PAGE COMPONENTS ---
const Dashboard = ({ setPage, activities }) => {
    const { project } = mockData;
    const unreviewedCount = activities.filter(a => !a.isReviewed).length;

    const workflowSteps = [
        { name: "Connect Tools", description: "Link your GitHub and Google accounts.", status: "Complete", page: "settings" },
        { name: "Annotate Contributions", description: `${unreviewedCount} items need review.`, status: unreviewedCount > 0 ? "Action Required" : "Complete", page: "contributions" },
        { name: "Reflect on Teamwork", description: `Explore visualizations and reflect.`, status: "Action Required", page: "reflections" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {getUser(MOCK_CURRENT_USER_ID)?.name}</h1>
                <p className="text-gray-500 mt-1">Team: <span className="font-semibold">{project.teamName}</span></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {workflowSteps.map((step, index) => (
                    <Card key={step.name} className="flex flex-col">
                        <div className="p-6 flex-grow">
                            <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${step.status === 'Complete' ? 'bg-green-500 text-white' : 'bg-purple-600 text-white'}`}>
                                    {step.status === 'Complete' ? <div className="w-6 h-6">{icons.check}</div> : index + 1}
                                </div>
                                <h2 className="ml-4 text-xl font-semibold text-gray-800">{step.name}</h2>
                            </div>
                            <p className="mt-4 text-gray-600">{step.description}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-b-xl">
                            <button onClick={() => setPage(step.page)} className="w-full text-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                                {step.status === 'Complete' ? 'View' : 'Start Now'}
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
            <Card>
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800">Project Timeline</h2>
                    <div className="mt-4 relative flex items-center">
                        {project.deliverables.map((d, index) => {
                            const isCompleted = index < project.currentDeliverableIndex;
                            const isCurrent = index === project.currentDeliverableIndex;
                            return (
                                <React.Fragment key={d}>
                                    <div className="flex flex-col items-center text-center w-full">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCurrent ? 'border-purple-600 bg-purple-100' : isCompleted ? 'border-green-500 bg-green-100' : 'border-gray-300'}`}>
                                            {isCompleted && <span className="text-green-500 w-5 h-5">{icons.check}</span>}
                                        </div>
                                        <p className={`mt-2 text-xs ${isCurrent ? 'font-bold text-purple-700' : 'text-gray-600'}`}>{d}</p>
                                    </div>
                                    {index < project.deliverables.length - 1 && <div className={`flex-auto border-t-2 ${isCompleted ? 'border-green-500' : 'border-gray-300'}`}></div>}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
};

const Settings = ({ onBack }) => {
    return (
        <div>
            <PageHeader title="Settings" onBack={onBack} />
            <div className="space-y-8 max-w-2xl">
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-800">Team: {mockData.project.teamName}</h2>
                        <ul className="mt-4 space-y-2">
                            {mockData.team.map(member => (
                                <li key={member.id} className="flex items-center gap-3">
                                    <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
                                    <span className="text-gray-700">{member.name}</span>
                                    {member.id === MOCK_CURRENT_USER_ID && <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full">You</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
                <Card>
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center"><span className="text-purple-600">{icons.github}</span><span className="ml-4 text-lg font-semibold text-gray-700">GitHub</span></div>
                        <div className="flex items-center"><span className="text-sm text-green-600 mr-4">Connected</span><button className="px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200">Disconnect</button></div>
                    </div>
                    <div className="bg-gray-50 p-4 border-t text-sm text-gray-600">Connected repository: `team-awesomesauce/final-project`</div>
                </Card>
                 <Card>
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center"><span className="text-blue-600">{icons.gdoc}</span><span className="ml-4 text-lg font-semibold text-gray-700">Google Workspace</span></div>
                        <div className="flex items-center"><button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">Connect</button></div>
                    </div>
                     <div className="bg-gray-50 p-4 border-t text-sm text-gray-600">Share you link of your team's Google Drive folder to sync contributions from Docs and Slides.</div>
                </Card>
            </div>
        </div>
    );
};

const Contributions = ({ activities, onUpdateActivity, onBack, onAddOfflineWork }) => {
    const [modalState, setModalState] = useState({ show: false, type: null, data: null });
    const [customAlert, setCustomAlert] = useState({ show: false, message: '' });

    const showInfoModal = (type) => setModalState({ show: true, type: 'info', data: { type } });
    const showOfflineModal = () => setModalState({ show: true, type: 'offline' });
    const showCommentModal = (activityId, existingComment) => {
        setModalState({ show: true, type: 'comment', data: { activityId, comment: existingComment } });
    };
    const closeModal = () => setModalState({ show: false, type: null, data: null });

    const handleUpdateWithAlert = (activityId, updates) => {
        const result = onUpdateActivity(activityId, updates);
        if (result && result.error) {
            setCustomAlert({ show: true, message: result.error });
        }
    };

    return (
        <div>
            <PageHeader title="Annotate Contributions" onBack={onBack} />
            <div className="mb-6 flex justify-between items-center -mt-6">
                <p className="text-gray-500">Review each item, attribute work, and add context where needed.</p>
                <button onClick={showOfflineModal} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100"><span className="text-gray-600">{icons.offline}</span><span className="text-sm font-medium">Add Offline Work</span></button>
            </div>
            <Card>
                <div className="p-4 grid grid-cols-12 gap-4 border-b bg-gray-50 rounded-t-xl">
                    <div className="col-span-6 text-xs font-semibold text-gray-600 uppercase">Contribution</div>
                    <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">Contributors</div>
                    <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase flex items-center justify-end gap-x-4 sm:gap-x-6 pr-4">
                        <button onClick={() => showInfoModal('high-quality')} className="flex items-center gap-1">High-quality {icons.info}</button>
                        <button onClick={() => showInfoModal('comment')} className="flex items-center gap-1">Comment {icons.info}</button>
                    </div>
                </div>
                <ul className="divide-y divide-gray-200">
                    {activities.map(activity => <ActivityItem key={activity.id} activity={activity} onUpdateActivity={handleUpdateWithAlert} onCommentClick={showCommentModal} />)}
                </ul>
            </Card>
            <InfoModal modalState={modalState} onClose={closeModal} />
            <OfflineWorkModal show={modalState.type === 'offline'} onClose={closeModal} onSave={onAddOfflineWork} setAlert={setCustomAlert} />
            <CommentModal modalState={modalState} onClose={closeModal} onSave={onUpdateActivity} setAlert={setCustomAlert} />
            <Modal show={customAlert.show} onClose={() => setCustomAlert({ show: false, message: '' })} title="Notification">
                <p>{customAlert.message}</p>
            </Modal>
        </div>
    );
};

// --- MODALS ---
const InfoModal = ({ modalState, onClose }) => {
    if (modalState.type !== 'info') return null;
    const content = {
        'high-quality': { title: 'What is a "High-quality" contribution?', body: 'Mark contributions that were particularly important, difficult, or high-quality. This helps your team recognize critical efforts that might not be obvious from metrics alone. You cannot mark your own work, and there is a limit to how many items can be marked.' },
        'comment': { title: 'How to use Comments?', body: 'Add a comment to provide context about a piece of work. For example, you could explain that a small code change fixed a major bug, or that a paragraph in a document was the result of a long discussion. This helps create an accurate story of your project.' },
        'measurement': { title: 'How we measure contributions?', body: "To compare different types of work, we use a naive sum where 1 unit can be: 1 line of code added in GitHub, 1 word written in Google Docs, or 1 minute spent on offline work. This provides a rough estimate for discussion." },
        'measurement_support': { title: 'How we measure mutual support?', body: "Each unit of feedback is counted as one interaction. This includes one comment on a Google Doc or one pull request review on GitHub."},
        'health_status': { title: 'About Health Status', body: `We determine ${modalState.data.behavior} status based on ${modalState.data.placeholder}. You are required to write reflection on behaviors that need improvement, and optional for those that are already good. The algorithm is not perfect. You can share your thoughts in the reflection if you believe the result is not accurate, and we appreciate your understanding.`}
    };
    const info = content[modalState.data.type];
    return <Modal show={true} onClose={onClose} title={info.title}><p className="text-sm text-gray-600">{info.body}</p></Modal>;
};

const OfflineWorkModal = ({ show, onClose, onSave, setAlert }) => {
    const [formState, setFormState] = useState({ summary: '', description: '', date: new Date().toISOString().split('T')[0], time: '' });
    
    const handleChange = (e) => setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    
    const handleSave = () => {
        if (!formState.summary) { setAlert({show: true, message: "Please provide a summary."}); return; }
        onSave(formState);
        onClose();
        setFormState({ summary: '', description: '', date: new Date().toISOString().split('T')[0], time: '' });
    };

    return (
        <Modal show={show} onClose={onClose} title="Add Offline Work">
            <div className="space-y-4">
                <div><label className="text-sm font-medium">Summary</label><input type="text" name="summary" value={formState.summary} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" placeholder="e.g., Whiteboard design session" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium">Date</label><input type="date" name="date" value={formState.date} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" /></div>
                    <div><label className="text-sm font-medium">Time Spent (hours)</label><input type="number" name="time" value={formState.time} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" placeholder="e.g., 2.5" /></div>
                </div>
                <div><label className="text-sm font-medium">Description (Optional)</label><textarea name="description" value={formState.description} onChange={handleChange} className="w-full p-2 border rounded-md mt-1" rows="3" placeholder="Add more details about the work..."></textarea></div>
                <div><label className="text-sm font-medium">Artifact (Optional)</label><div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"><div className="space-y-1 text-center"><span className="mx-auto h-12 w-12 text-gray-400">{icons.upload}</span><div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none"><span>Upload a file</span><input id="file-upload" name="file-upload" type="file" className="sr-only" /></label><p className="pl-1">or drag and drop</p></div><p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p></div></div></div>
                <button onClick={handleSave} className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">Save Work</button>
            </div>
        </Modal>
    );
};

const CommentModal = ({ modalState, onClose, onSave, setAlert }) => {
    const isEditing = modalState.data?.comment;
    const [commentText, setCommentText] = useState(isEditing ? isEditing.text : '');
    
    React.useEffect(() => {
        if (modalState.show && modalState.type === 'comment') {
            setCommentText(modalState.data?.comment?.text || '');
        }
    }, [modalState]);

    const handleSave = () => {
        if (!commentText) { setAlert({show: true, message: "Please enter a comment."}); return; }
        const annotation = { type: 'context', text: commentText, userId: MOCK_CURRENT_USER_ID };
        onSave(modalState.data.activityId, { updatedAnnotation: annotation });
        onClose();
    };
    
    const handleDelete = () => {
        onSave(modalState.data.activityId, { deleteAnnotation: { type: 'context', userId: MOCK_CURRENT_USER_ID }});
        onClose();
    };

    if (modalState.type !== 'comment') return null;

    return (
        <Modal show={true} onClose={onClose} title={isEditing ? "Edit/View Comment" : "Add a Comment"}>
            <div>
                <textarea value={commentText} onChange={e => setCommentText(e.target.value)} className="w-full p-2 border rounded-md" rows="4" placeholder="Provide context about this contribution..."></textarea>
                <div className="flex justify-end gap-2 mt-4">
                    {isEditing && <button onClick={handleDelete} className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700">Delete</button>}
                    <button onClick={handleSave} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">{isEditing ? "Save Changes" : "Save Comment"}</button>
                </div>
            </div>
        </Modal>
    );
};

// --- REUSABLE ACTIVITY ITEM COMPONENT ---
const ActivityItem = ({ activity, onUpdateActivity, onCommentClick }) => {
    const [isAttributing, setIsAttributing] = useState(false);
    const user = activity.userId ? getUser(activity.userId) : null;
    const typeMap = { 
        github_commit: { icon: icons.github, color: 'purple', name: 'GitHub Commit' }, 
        gdoc_edit: { icon: icons.gdoc, color: 'blue', name: 'Google Doc Edit' }, 
        offline_work: { icon: icons.offline, color: 'gray', name: 'Offline Work' },
        gdoc_comment: { icon: icons.interaction, color: 'pink', name: 'Google Doc Comment' },
        github_pr_review: { icon: icons.interaction, color: 'pink', name: 'GitHub PR Review' },
    };
    const { icon, color, name } = typeMap[activity.type] || {};

    const attributionAnnotation = activity.annotations.find(a => a.type === 'attribution');
    const attributedUserIds = new Set(attributionAnnotation?.attributedTo || []);
    if (user) attributedUserIds.add(user.id);
    const attributedUsers = Array.from(attributedUserIds).map(id => getUser(id)).filter(Boolean);
    
    const initialContributor = user || (activity.type === 'offline_work' ? getUser(activity.userId) : null);
    const otherContributors = attributedUsers.filter(u => u.id !== initialContributor?.id);

    const canManageAttribution = activity.userId === MOCK_CURRENT_USER_ID;

    const handleAttributionChange = (memberId, isChecked) => {
        const currentAttribution = attributionAnnotation?.attributedTo || (user ? [user.id] : []);
        const newAttribution = isChecked ? [...currentAttribution, memberId] : currentAttribution.filter(id => id !== memberId);
        onUpdateActivity(activity.id, { updatedAnnotation: { type: 'attribution', attributedTo: newAttribution } });
    };
    
    const myComment = activity.annotations.find(a => a.type === 'context' && a.userId === MOCK_CURRENT_USER_ID);
    
    const handleHighQualityClick = () => {
        const currentMarkers = new Set(activity.isHighQuality.markedBy);
        if (currentMarkers.has(MOCK_CURRENT_USER_ID)) {
            currentMarkers.delete(MOCK_CURRENT_USER_ID);
        } else {
            currentMarkers.add(MOCK_CURRENT_USER_ID);
        }
        onUpdateActivity(activity.id, { isHighQuality: { markedBy: Array.from(currentMarkers) } });
    };
    
    const isInteraction = activity.type === 'gdoc_comment' || activity.type === 'github_pr_review';
    const interactionTarget = isInteraction ? initialActivities.find(a => a.id === activity.onActivityId) : null;
    const targetUser = interactionTarget ? getUser(interactionTarget.userId) : null;

    return (
        <li className="p-4 grid grid-cols-12 gap-4 items-start hover:bg-gray-50">
            <div className="col-span-6 flex items-start space-x-4">
                <div className={`text-${color}-600 mt-1`}>{icon}</div>
                <div className="flex-1">
                    <p className="text-sm text-gray-800"><span className="font-semibold">{name}:</span> {activity.summary}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                    {activity.annotations.filter(a => a.type === 'context').map((ann, i) => (
                        <div key={i} className="mt-2 p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg flex items-start gap-2">
                            <img src={getUser(ann.userId)?.avatar} className="w-4 h-4 rounded-full" />
                            <span>{ann.text}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-span-3">
                {isInteraction ? (
                    <div className="flex items-center gap-2 text-sm">
                        <img src={user?.avatar} className="w-6 h-6 rounded-full" title={user?.name} />
                        <span>→</span>
                        <img src={targetUser?.avatar} className="w-6 h-6 rounded-full" title={targetUser?.name} />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            {initialContributor && <img src={initialContributor.avatar} alt={initialContributor.name} className="w-6 h-6 rounded-full" title={initialContributor.name} />}
                            {otherContributors.length > 0 && <div className="border-l-2 border-gray-300 h-6 mx-1"></div>}
                            {otherContributors.map(u => <img key={u.id} src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full" title={u.name} />)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            <button onClick={() => setIsAttributing(!isAttributing)} className="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline" disabled={!canManageAttribution}>Add Contributors</button>
                            {!canManageAttribution && <span className="relative group"><span className="text-gray-400">{icons.info}</span><span className="absolute hidden group-hover:block -top-8 -left-1/2 w-48 bg-gray-700 text-white text-xs rounded-md p-2 z-10">Only the original contributor can edit attribution.</span></span>}
                        </div>
                        {isAttributing && (
                            <div className="mt-3 p-3 bg-gray-100 rounded-md"><p className="text-xs font-semibold mb-2">Select all contributors:</p><div className="flex flex-col gap-2">
                                {mockData.team.map(member => <div key={member.id} className="flex items-center"><input id={`m-${member.id}-${activity.id}`} type="checkbox" checked={attributedUsers.some(u => u.id === member.id)} disabled={member.id === activity.userId && activity.type !== 'offline_work'} onChange={e => handleAttributionChange(member.id, e.target.checked)} className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-70" /><label htmlFor={`m-${member.id}-${activity.id}`} className="ml-2 text-sm text-gray-700">{member.name}</label></div>)}
                            </div><button onClick={() => setIsAttributing(false)} className="text-xs bg-purple-600 text-white px-2 py-1 rounded-md mt-3 hover:bg-purple-700">Done</button></div>
                        )}
                    </>
                )}
            </div>
            <div className="col-span-3 flex items-center justify-end gap-x-4 sm:gap-x-6 pr-4">
                <button onClick={handleHighQualityClick} className={`p-1.5 rounded-full ${activity.isHighQuality.markedBy.length > 0 ? 'text-yellow-500 bg-yellow-100' : 'text-gray-400 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={activity.userId === MOCK_CURRENT_USER_ID || isInteraction} >{icons.star}</button>
                <button onClick={() => onCommentClick(activity.id, myComment)} className={`p-1.5 rounded-full ${myComment ? 'text-blue-500 bg-blue-100' : 'text-gray-400 hover:bg-gray-200'}`} disabled={isInteraction}>{icons.annotate}</button>
            </div>
        </li>
    );
};

// --- META VISUALIZATION PAGE ---
const Reflections = ({ activities, onBack }) => {
    const [activeTab, setActiveTab] = useState('Equitable Contribution');
    const [modalState, setModalState] = useState({ show: false, type: null, data: null });
    
    const swimlaneChartData = useMemo(() => {
        const contributionActivities = activities.filter(a => a.type !== 'gdoc_comment' && a.type !== 'github_pr_review');
        const maxes = contributionActivities.reduce((acc, act) => {
            if (act.type === 'github_commit') acc.lines = Math.max(acc.lines, act.details.linesAdded || 0);
            if (act.type === 'gdoc_edit') acc.words = Math.max(acc.words, act.details.wordsAdded || 0);
            if (act.type === 'offline_work') acc.duration = Math.max(acc.duration, act.details.duration || 0);
            return acc;
        }, { lines: 0, words: 0, duration: 0 });

        return contributionActivities.flatMap(act => {
            const attributed = new Set(act.annotations.find(an => an.type === 'attribution')?.attributedTo || (act.userId ? [act.userId] : []));
            return Array.from(attributed).map(userId => {
                const user = getUser(userId);
                if (!user) return null;
                let normalizedSize = 0.5;
                if (act.type === 'github_commit' && maxes.lines > 0) normalizedSize = (act.details.linesAdded || 0) / maxes.lines;
                if (act.type === 'gdoc_edit' && maxes.words > 0) normalizedSize = (act.details.wordsAdded || 0) / maxes.words;
                if (act.type === 'offline_work' && maxes.duration > 0) normalizedSize = (act.details.duration || 0) / maxes.duration;
                return { x: new Date(act.timestamp).getTime(), y: memberNameToY(user.name), z: (normalizedSize * 900) + 100, name: user.name, summary: act.summary, type: act.type };
            }).filter(Boolean);
        });
    }, [activities]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-2 border rounded-md shadow-lg text-sm">
                    <p className="font-bold">{data.name}</p>
                    <p>{formatDate(new Date(data.x))}</p>
                    <p className="text-gray-600">{data.summary}</p>
                </div>
            );
        }
        return null;
    };
    
    const typeColors = { github_commit: '#8b5cf6', gdoc_edit: '#3b82f6', offline_work: '#6b7280' };

    const healthStatus = useMemo(() => {
        // Dummy logic for health status. Replace with real calculations.
        return {
            "Equitable Contribution": "Good",
            "Timeliness": "Good",
            "Mutual Support": "Needs Improvement",
            "High-Quality Work": "Good",
        };
    }, [activities]);

    const behaviorTabs = {
        "Equitable Contribution": { prompt: "This chart shows the total work distribution. How does the team feel about this balance?", Chart: ContributionPieChart, placeholder: "e.g., The overall distribution looks fair, but we should check the GitHub-specific view as Alex might be doing most of the coding." },
        "Timeliness": { prompt: "This chart shows project pacing. Is the team making steady progress or rushing at the end?", Chart: TimelinessLineChart, placeholder: "e.g., We seem to be making steady progress, which is great. Let's keep this up for the next deliverable." },
        "Mutual Support": { prompt: "This heatmap shows who is giving feedback to whom. Are there any imbalances?", Chart: MutualSupportHeatmap, placeholder: "e.g., It looks like Alex and Casey are reviewing most of the work. We should encourage everyone to participate more in code reviews." },
        "High-Quality Work": { prompt: "This chart shows who is creating and identifying high-quality work. How does the team recognize key contributions?", Chart: HighQualityBarChart, placeholder: "e.g., It's great to see that everyone's key contributions are being recognized by multiple teammates." },
    };
    
    const ActiveChart = behaviorTabs[activeTab].Chart;
    const activeStatus = healthStatus[activeTab];

    return (
        <div>
            <PageHeader title="Team Reflections" onBack={onBack} />
            <p className="text-gray-500 -mt-6 mb-8">Use the visualizations to explore your team's work patterns, then write your reflections.</p>
            <Card>
                <div className="p-4 border-b"><h2 className="text-xl font-semibold text-gray-800">Overall Project Timeline</h2></div>
                <div className="p-6 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="x" name="date" domain={['dataMin', 'dataMax']} tickFormatter={(unixTime) => formatDate(new Date(unixTime))} />
                            <YAxis type="number" dataKey="y" name="member" domain={[-1, mockData.team.length]} ticks={mockData.team.map((m, i) => i)} tickFormatter={yToMemberName} />
                            <ZAxis dataKey="z" name="size" range={[50, 1000]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                            <Legend />
                            {Object.keys(typeColors).map(type => (
                                <Scatter key={type} name={type.replace('_', ' ')} data={swimlaneChartData.filter(d => d.type === type)} fill={typeColors[type]} />
                            ))}
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card className="mt-8">
                <div className="p-4 border-b flex items-center gap-4">
                    {Object.keys(behaviorTabs).map(tabName => (
                         <button key={tabName} onClick={() => setActiveTab(tabName)} className={`flex items-center gap-2 px-3 py-1 text-sm rounded-full ${activeTab === tabName ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${healthStatus[tabName] === 'Good' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                            {tabName}
                        </button>
                    ))}
                </div>
                <div className="p-6">
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50 h-80">
                        <ActiveChart activities={activities} setModalState={setModalState} />
                    </div>
                </div>
                <div className="bg-gray-50 p-6 border-t">
                    <div className="flex items-center gap-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            {behaviorTabs[activeTab].prompt}
                            <span className="font-normal text-gray-500 ml-1">{activeStatus === 'Needs Improvement' ? '(Required)' : '(Optional)'}</span>
                        </label>
                        <button onClick={() => setModalState({ show: true, type: 'info', data: { type: 'health_status', behavior: activeTab.toLowerCase(), placeholder: '[placeholder]' }})} className="text-gray-500">{icons.info}</button>
                    </div>
                     <textarea 
                        className="mt-2 w-full p-2 border rounded-md shadow-sm" 
                        rows="3" 
                        maxLength="500" 
                        placeholder={behaviorTabs[activeTab].placeholder}
                    />
                    <div className="flex justify-end items-center mt-2"><button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save</button></div>
                </div>
            </Card>
            <InfoModal modalState={modalState} onClose={() => setModalState({ show: false, type: null, data: null })} />
        </div>
    );
};

// --- BEHAVIOR-SPECIFIC CHARTS ---
const ChartColors = ["#8b5cf6", "#3b82f6", "#db2777", "#16a34a", "#f97316"];

const ContributionPieChart = ({ activities, setModalState }) => {
    const [lens, setLens] = useState('Overall');
    const lenses = ['Overall', 'GitHub', 'Google Docs', 'Offline Work'];

    const data = useMemo(() => {
        const totals = mockData.team.map(m => ({ name: m.name, value: 0 }));
        activities
            .filter(act => {
                if (lens === 'GitHub') return act.type === 'github_commit';
                if (lens === 'Google Docs') return act.type === 'gdoc_edit';
                if (lens === 'Offline Work') return act.type === 'offline_work';
                return act.type !== 'gdoc_comment' && act.type !== 'github_pr_review';
            })
            .forEach(act => {
                let value = 0;
                if (act.type === 'github_commit') value = act.details.linesAdded || 0;
                if (act.type === 'gdoc_edit') value = act.details.wordsAdded || 0;
                if (act.type === 'offline_work') value = (act.details.duration || 0);
                
                const attributed = new Set(act.annotations.find(an => an.type === 'attribution')?.attributedTo || (act.userId ? [act.userId] : []));
                if (attributed.size > 0) {
                    const perPersonValue = value / attributed.size;
                    attributed.forEach(id => {
                        const user = getUser(id);
                        if(user) totals.find(t => t.name === user.name).value += perPersonValue;
                    });
                }
            });
        return totals;
    }, [activities, lens]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
                <select value={lens} onChange={e => setLens(e.target.value)} className="text-sm border-gray-300 rounded-md">
                    {lenses.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={() => setModalState({ show: true, type: 'info', data: { type: 'measurement' }})} className="text-gray-500">{icons.info}</button>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={'80%'} label>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={ChartColors[index % ChartColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(0)} units`}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

const TimelinessLineChart = ({ activities, setModalState }) => {
    const [lens, setLens] = useState('Overall');
    const lenses = ['Overall', 'GitHub', 'Google Docs', 'Offline Work'];

    const data = useMemo(() => {
        const workActivities = activities.filter(act => {
            if (lens === 'GitHub') return act.type === 'github_commit';
            if (lens === 'Google Docs') return act.type === 'gdoc_edit';
            if (lens === 'Offline Work') return act.type === 'offline_work';
            return act.type !== 'gdoc_comment' && act.type !== 'github_pr_review';
        });
        const totalWork = workActivities.length;
        if (totalWork === 0) return [];
        const sortedActivities = workActivities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        let cumulativeWork = 0;
        return sortedActivities.map(act => {
            cumulativeWork++;
            return { date: new Date(act.timestamp).getTime(), percentage: (cumulativeWork / totalWork) * 100 };
        });
    }, [activities, lens]);

    return (
        <div className="h-full flex flex-col">
             <div className="flex items-center gap-2 mb-2">
                <select value={lens} onChange={e => setLens(e.target.value)} className="text-sm border-gray-300 rounded-md">
                    {lenses.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={() => setModalState({ show: true, type: 'info', data: { type: 'measurement' }})} className="text-gray-500">{icons.info}</button>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="date" domain={['dataMin', 'dataMax']} tickFormatter={(unixTime) => formatDate(new Date(unixTime))}><Label value="Project Timeline" offset={-15} position="insideBottom" /></XAxis>
                    <YAxis domain={[0, 100]} label={{ value: '% Work Done', angle: -90, position: 'insideLeft' }}/>
                    <Tooltip labelFormatter={(unixTime) => formatDate(new Date(unixTime))} formatter={(value) => `${value.toFixed(1)}%`} />
                    <Line type="monotone" dataKey="percentage" stroke={ChartColors[0]} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const MutualSupportHeatmap = ({ activities, setModalState }) => {
    const [lens, setLens] = useState('Overall');
    const lenses = ['Overall', 'GitHub', 'Google Docs'];

    const data = useMemo(() => {
        const matrix = mockData.team.map(giver => ({ name: giver.name, ...Object.fromEntries(mockData.team.map(receiver => [receiver.name, 0])) }));

        activities
            .filter(act => {
                if (lens === 'GitHub') return act.type === 'github_pr_review';
                if (lens === 'Google Docs') return act.type === 'gdoc_comment';
                return act.type === 'gdoc_comment' || act.type === 'github_pr_review';
            })
            .forEach(act => {
                if (act.onActivityId) {
                    const sourceAct = activities.find(a => a.id === act.onActivityId);
                    if (sourceAct) {
                        const giver = getUser(act.userId);
                        const receiver = getUser(sourceAct.userId);
                        if (giver && receiver && giver.id !== receiver.id) {
                            const giverRow = matrix.find(r => r.name === giver.name);
                            if (giverRow) giverRow[receiver.name]++;
                        }
                    }
                }
            });
        return matrix;
    }, [activities, lens]);

    const maxInteractions = Math.max(...data.flatMap(row => Object.values(row).filter(v => typeof v === 'number')));

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
                <select value={lens} onChange={e => setLens(e.target.value)} className="text-sm border-gray-300 rounded-md">
                    {lenses.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                 <button onClick={() => setModalState({ show: true, type: 'info', data: { type: 'measurement_support' }})} className="text-gray-500">{icons.info}</button>
            </div>
            <div className="flex-grow flex flex-col p-4 font-sans">
                <div className="flex w-full pl-16">
                    {mockData.team.map(member => <div key={member.name} className="flex-1 text-center text-xs font-bold -rotate-45 h-12">{member.name}</div>)}
                </div>
                {data.map(row => (
                    <div key={row.name} className="flex items-center flex-1 w-full">
                        <div className="w-16 text-right pr-2 text-xs font-bold">{row.name}</div>
                        {mockData.team.map(member => (
                            <div key={member.name} className="flex-1 h-full flex items-center justify-center p-1">
                                <div 
                                    className="w-full h-full rounded relative group"
                                    style={{ backgroundColor: `rgba(139, 92, 246, ${row[member.name] / Math.max(1, maxInteractions)})` }}
                                >
                                    <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md p-2 z-10 whitespace-nowrap -top-8 left-1/2 -translate-x-1/2">
                                        {row.name} gave feedback to {member.name} {row[member.name]} time(s)
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

const HighQualityBarChart = ({ activities }) => {
    const data = useMemo(() => {
        return mockData.team.map(member => {
            const contributionsMarked = activities.filter(act => act.userId === member.id && act.isHighQuality.markedBy.length > 0).length;
            const teammatesMarking = new Set(activities.filter(act => act.userId === member.id).flatMap(act => act.isHighQuality.markedBy)).size;
            return { 
                name: member.name, 
                "HQ Contributions Made": contributionsMarked, 
                "Recognized By Teammates": teammatesMarking 
            };
        });
    }, [activities]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="HQ Contributions Made" fill={ChartColors[0]} />
                <Bar dataKey="Recognized By Teammates" fill={ChartColors[1]} />
            </BarChart>
        </ResponsiveContainer>
    );
};


// --- MAIN APP COMPONENT ---
export default function App() {
    const [page, setPage] = useState('dashboard');
    const [activities, setActivities] = useState(initialActivities);

    const handleUpdateActivity = (activityId, updates) => {
        let error = null;
        setActivities(prevActivities => {
            if (updates.isHighQuality) {
                const currentActivity = prevActivities.find(a => a.id === activityId);
                const wantsToAddMark = updates.isHighQuality.markedBy.includes(MOCK_CURRENT_USER_ID);
                const isAlreadyMarkedByMe = currentActivity.isHighQuality.markedBy.includes(MOCK_CURRENT_USER_ID);

                if (wantsToAddMark && !isAlreadyMarkedByMe) {
                    const highQualityCount = prevActivities.filter(a => a.isHighQuality.markedBy.length > 0).length;
                    const limit = Math.floor(prevActivities.length * HIGH_QUALITY_LIMIT_PERCENTAGE);
                    if (highQualityCount >= limit) {
                        error = `You can only mark up to ${limit} (${HIGH_QUALITY_LIMIT_PERCENTAGE * 100}%) contributions as high-quality.`;
                        return prevActivities;
                    }
                }
            }
            return prevActivities.map(act => {
                if (act.id === activityId) {
                    let newAnnotations = [...act.annotations];
                    if (updates.updatedAnnotation) {
                        const existingIndex = newAnnotations.findIndex(a => a.type === updates.updatedAnnotation.type && a.userId === updates.updatedAnnotation.userId);
                        if (existingIndex > -1) {
                            newAnnotations[existingIndex] = updates.updatedAnnotation;
                        } else {
                            newAnnotations.push(updates.updatedAnnotation);
                        }
                        delete updates.updatedAnnotation;
                    }
                    if (updates.deleteAnnotation) {
                        newAnnotations = newAnnotations.filter(a => !(a.type === updates.deleteAnnotation.type && a.userId === updates.deleteAnnotation.userId));
                        delete updates.deleteAnnotation;
                    }
                    return { ...act, ...updates, annotations: newAnnotations, isReviewed: true };
                }
                return act;
            });
        });
        return { error };
    };

    const handleAddOfflineWork = ({ summary, description, date, time }) => {
        const newActivity = {
            id: `offline-${Date.now()}`, type: 'offline_work', userId: MOCK_CURRENT_USER_ID, timestamp: new Date(date).toISOString(),
            summary, details: { description, duration: parseFloat(time) * 60 }, annotations: [], isHighQuality: { markedBy: [] }, isReviewed: false
        };
        setActivities(prev => [newActivity, ...prev].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    };
 
    const renderPage = () => {
        const sortedActivities = [...activities].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        const pageProps = { activities: sortedActivities, onBack: () => setPage('dashboard'), setPage: setPage, onUpdateActivity: handleUpdateActivity, onAddOfflineWork: handleAddOfflineWork };
        switch (page) {
            case 'settings': return <Settings {...pageProps} />;
            case 'reflections': return <Reflections {...pageProps} />;
            case 'contributions': return <Contributions {...pageProps} />;
            case 'dashboard': default: return <Dashboard {...pageProps} />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setPage('dashboard')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" title="Homepage">{icons.home}</button>
                            <span className="font-bold text-xl text-purple-700">Team I/O</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            {['contributions', 'reflections'].map(p => <button key={p} onClick={() => setPage(p)} className={`capitalize px-3 py-2 rounded-md text-sm font-medium ${page === p ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>)}
                        </div>
                        <div className="flex items-center"><button onClick={() => setPage('settings')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600" title="Settings">{icons.settings}</button></div>
                    </div>
                </nav>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderPage()}</main>
        </div>
    );
}
