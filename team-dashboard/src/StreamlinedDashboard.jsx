import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useStepsCompletion } from "./StepsCompletionContext";
import { IconCheck, IconLock } from "./assets/icons";

const StreamlinedDashboard = () => {
  const navigate = useNavigate();
  const { stepsCompletion, setStepsCompletion } = useStepsCompletion();
  const location = useLocation();

  const [teamId, setTeamId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize team ID from localStorage or location state
  useEffect(() => {
    const storedTeamId = localStorage.getItem("teamId");
    const storedMembers = localStorage.getItem("teamMembers");
    const stateTeamId = location.state?.teamId;
    const finalTeamId = stateTeamId || storedTeamId || "";
    const finalMembers = storedMembers ? JSON.parse(storedMembers) : [];
    console.log("StreamlinedDashboard - Team ID sources:", { storedTeamId, stateTeamId, finalTeamId });
    
    // Check if team ID has changed (only if we already have a teamId set)
    if (teamId && teamId !== finalTeamId && teamId !== "") {
      console.log("Team ID changed, resetting all data");
      // Reset all step completion
      setStepsCompletion({
        step1: false,
        step2: false,
        step3: false,
        step4: false,
        step5: false,
        step6: false
      });
      // Clear all stored data
      localStorage.removeItem("linkToolsData");
      localStorage.removeItem("scrapedData");
      localStorage.removeItem("mappingData");
      localStorage.removeItem("annotationData");
    }
    
    // Only set teamId if it's not already set or if it's coming from location state
    if (stateTeamId || !teamId) {
      setTeamId(finalTeamId);
    }
    setTeamMembers(finalMembers);
    setIsLoading(false);
  }, [location.state]);

  // Team setup functions
  const handleTeamIdChange = (e) => {
    setTeamId(e.target.value);
  };

  const handleAddMember = () => {
    if (newMemberName.trim() && !teamMembers.includes(newMemberName.trim())) {
      const updatedMembers = [...teamMembers, newMemberName.trim()];
      setTeamMembers(updatedMembers);
      setNewMemberName("");
      localStorage.setItem("teamMembers", JSON.stringify(updatedMembers));
    }
  };

  const handleRemoveMember = (memberToRemove) => {
    const updatedMembers = teamMembers.filter(member => member !== memberToRemove);
    setTeamMembers(updatedMembers);
    localStorage.setItem("teamMembers", JSON.stringify(updatedMembers));
  };

  const handleSaveTeamSetup = () => {
    if (teamId.trim() && teamMembers.length > 0) {
      localStorage.setItem("teamId", teamId.trim());
      setStepsCompletion(prev => ({ ...prev, step1: true }));
    }
  };

  const isStep1Complete = teamId.trim() && teamMembers.length > 0;

  // Show loading while determining team ID
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getNextStep = () => {
    if (!stepsCompletion.step1) return 1;
    if (!stepsCompletion.step2) return 2;
    if (!stepsCompletion.step3) return 3;
    if (!stepsCompletion.step4) return 4;
    if (!stepsCompletion.step5) return 5;
    if (!stepsCompletion.step6) return 6;
    return 6;
  };

  const nextStep = getNextStep();

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Teamwork Analysis</h1>
        <p className="text-gray-600 mt-2">
          Team ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{teamId || "Not set"}</span>
        </p>
        <p className="text-gray-600 mt-2">
          Follow these steps to analyze your team's collaboration patterns.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Step 1: Team Setup */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            isStep1Complete ? "bg-green-50" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  isStep1Complete
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white"
                }`}
              >
                <span className="font-bold text-lg">1</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Team Setup
                </h2>
                <p className="text-sm text-gray-500">
                  Provide your team ID and team member names
                </p>
              </div>
            </div>
            {isStep1Complete ? <IconCheck /> : null}
          </div>
          
          <div className="mt-6 space-y-4">
            {/* Team ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team ID
              </label>
              <input
                type="text"
                value={teamId}
                onChange={handleTeamIdChange}
                placeholder="Enter your team ID (e.g., team_alpha_2024)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Team Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Members
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter team member name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                />
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              
              {/* Team Members List */}
              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                      <span className="text-sm text-gray-700">{member}</span>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveTeamSetup}
              disabled={!isStep1Complete}
              className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Save Team Setup
            </button>
          </div>
        </div>

        {/* Step 2: GitHub Data (Optional) */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            stepsCompletion.step2 ? "bg-green-50" : isStep1Complete ? "bg-white" : "bg-gray-100"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step2
                    ? "bg-green-500 text-white"
                    : isStep1Complete
                    ? "bg-gray-200 text-gray-600"
                    : "bg-gray-300 text-gray-500"
                }`}
              >
                <span className="font-bold text-lg">2</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  GitHub Data (Optional)
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step2
                      ? "text-green-700"
                      : isStep1Complete
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {stepsCompletion.step2
                    ? "Status: Done"
                    : isStep1Complete
                    ? "Optional: Link GitHub repository for code contribution analysis"
                    : "Complete Step 1 first"}
                </p>
              </div>
            </div>
            {stepsCompletion.step2 ? <IconCheck /> : <IconLock />}
          </div>
          {isStep1Complete && !stepsCompletion.step2 && (
            <button
              onClick={() => navigate("/teamio/link", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 2
            </button>
          )}
          {stepsCompletion.step2 && (
            <button
              onClick={() => navigate("/teamio/link", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit GitHub Data
            </button>
          )}
        </div>

        {/* Step 3: Google Docs */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            stepsCompletion.step3 ? "bg-green-50" : isStep1Complete ? "bg-white" : "bg-gray-100"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step3
                    ? "bg-green-500 text-white"
                    : isStep1Complete
                    ? "bg-gray-200 text-gray-600"
                    : "bg-gray-300 text-gray-500"
                }`}
              >
                <span className="font-bold text-lg">3</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Google Docs
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step3
                      ? "text-green-700"
                      : isStep1Complete
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {stepsCompletion.step3
                    ? "Status: Done"
                    : isStep1Complete
                    ? "Authenticate and scrape Google Docs collaboration data"
                    : "Complete Step 1 first"}
                </p>
              </div>
            </div>
            {stepsCompletion.step3 ? <IconCheck /> : <IconLock />}
          </div>
          {isStep1Complete && !stepsCompletion.step3 && (
            <button
              onClick={() => navigate("/teamio/scrape-documents", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 3
            </button>
          )}
          {stepsCompletion.step3 && (
            <button
              onClick={() => navigate("/teamio/scrape-documents", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Google Docs Data
            </button>
          )}
        </div>

        {/* Step 4: Map All Logins to UserIDs */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            stepsCompletion.step4 ? "bg-green-50" : isStep1Complete ? "bg-white" : "bg-gray-100"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step4
                    ? "bg-green-500 text-white"
                    : isStep1Complete
                    ? "bg-gray-200 text-gray-600"
                    : "bg-gray-300 text-gray-500"
                }`}
              >
                <span className="font-bold text-lg">4</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Map All Logins to UserIDs
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step4
                      ? "text-green-700"
                      : isStep1Complete
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {stepsCompletion.step4
                    ? "Status: Done"
                    : isStep1Complete
                    ? "Link GitHub and Google Docs accounts to team members"
                    : "Complete Step 1 first"}
                </p>
              </div>
            </div>
            {stepsCompletion.step4 ? <IconCheck /> : <IconLock />}
          </div>
          {isStep1Complete && !stepsCompletion.step4 && (
            <button
              onClick={() => navigate("/teamio/map-logins", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 4
            </button>
          )}
          {stepsCompletion.step4 && (
            <button
              onClick={() => navigate("/teamio/map-logins", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Login Mappings
            </button>
          )}
        </div>

        {/* Step 5: Annotate Contributions */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            stepsCompletion.step5 ? "bg-green-50" : isStep1Complete ? "bg-white" : "bg-gray-100"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step5
                    ? "bg-green-500 text-white"
                    : isStep1Complete
                    ? "bg-gray-200 text-gray-600"
                    : "bg-gray-300 text-gray-500"
                }`}
              >
                <span className="font-bold text-lg">5</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Annotate Contributions
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step5
                      ? "text-green-700"
                      : isStep1Complete
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {stepsCompletion.step5
                    ? "Status: Done"
                    : isStep1Complete
                    ? "Review and attribute contributions to team members"
                    : "Complete Step 1 first"}
                </p>
              </div>
            </div>
            {stepsCompletion.step5 ? <IconCheck /> : <IconLock />}
          </div>
          {isStep1Complete && !stepsCompletion.step5 && (
            <button
              onClick={() => navigate("/teamio/annotate-contributions", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 5
            </button>
          )}
          {stepsCompletion.step5 && (
            <button
              onClick={() => navigate("/teamio/annotate-contributions", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Annotations
            </button>
          )}
        </div>

        {/* Step 6: Team Reflection */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            stepsCompletion.step6 ? "bg-green-50" : isStep1Complete ? "bg-white" : "bg-gray-100"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step6
                    ? "bg-green-500 text-white"
                    : isStep1Complete
                    ? "bg-gray-200 text-gray-600"
                    : "bg-gray-300 text-gray-500"
                }`}
              >
                <span className="font-bold text-lg">6</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Team Reflection
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step6
                      ? "text-green-700"
                      : isStep1Complete
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {stepsCompletion.step6
                    ? "Status: Done"
                    : isStep1Complete
                    ? "View collaboration analysis and insights"
                    : "Complete Step 1 first"}
                </p>
              </div>
            </div>
            {stepsCompletion.step6 ? <IconCheck /> : <IconLock />}
          </div>
          {isStep1Complete && !stepsCompletion.step6 && (
            <button
              onClick={() => navigate("/teamio/reflections", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 6
            </button>
          )}
          {stepsCompletion.step6 && (
            <button
              onClick={() => navigate("/teamio/reflections", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Reflections
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamlinedDashboard;