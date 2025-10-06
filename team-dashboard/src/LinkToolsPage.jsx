import React, { useState, useEffect } from "react";
import { useStepsCompletion } from "./StepsCompletionContext";
import { useNavigate, useLocation } from "react-router-dom";

const LinkToolsPage = () => {
  const [repoURL, setRepoURL] = useState("");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [onlyMainBranch, setOnlyMainBranch] = useState(false);
  const [onlyMergedPRs, setOnlyMergedPRs] = useState(false);

  const { setStepsCompletion } = useStepsCompletion();
  const navigate = useNavigate();
  const location = useLocation();

  // Load saved data from localStorage on page load
  useEffect(() => {
    const savedData = localStorage.getItem("linkToolsData");
    const stateTeamId = location.state?.teamId;
    const storedTeamId = localStorage.getItem("teamId");
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setRepoURL(parsedData.repoURL || "");
      setTeamId(parsedData.teamId || "");
      setOnlyMainBranch(parsedData.onlyMainBranch || false);
      setOnlyMergedPRs(parsedData.onlyMergedPRs || false);
    }
    
    // Set teamId from location state or localStorage
    const finalTeamId = stateTeamId || storedTeamId || "";
    if (finalTeamId) {
      setTeamId(finalTeamId);
    }
  }, [location.state]);

  // Save data to localStorage whenever inputs change
  useEffect(() => {
    const dataToSave = {
      repoURL,
      teamId,
      onlyMainBranch,
      onlyMergedPRs,
    };
    localStorage.setItem("linkToolsData", JSON.stringify(dataToSave));
  }, [repoURL, teamId, onlyMainBranch, onlyMergedPRs]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Extract owner and repo name from the URL
    const match = repoURL.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      setResponseMessage("Error: Invalid GitHub URL");
      setLoading(false);
      return;
    }
    const repoOwner = match[1];
    const repoName = match[2];

    try {
      // Create the fetch requests
      const githubRequest = fetch(
        `http://localhost:3000/api/github/post?team_id=${teamId}&owner=${repoOwner}&repo_name=${repoName}&main_branch_only=${onlyMainBranch}&merged_prs_only=${onlyMergedPRs}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Execute GitHub request
      const githubResponse = await githubRequest;

      // Handle GitHub response
      if (githubResponse.ok) {
        const data = await githubResponse.json();
        setResponseMessage("GitHub: " + JSON.stringify(data) + "\n");
        setStepsCompletion((prev) => ({ ...prev, step2: true }));
        navigate("/teamio", { state: { teamId: teamId } });
      } else {
        const errorData = await githubResponse.json();
        setResponseMessage("GitHub Error: " + JSON.stringify(errorData) + "\n");
      }
    } catch (error) {
      setResponseMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/teamio", { state: { teamId: teamId } })}
        className="text-blue-600 hover:underline mb-6"
      >
        &larr; Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-gray-800">Step 1: Link GitHub Repository</h1>

      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
        <p className="text-sm">
          Link your GitHub repository to extract contributions. You can specify additional options for GitHub data extraction.
        </p>
      </div>

      {responseMessage && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            responseMessage.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
          }`}
        >
          {responseMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-4">
          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
              Team ID
            </label>
            <input
              type="text"
              id="teamId"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="Enter team ID"
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
              required
            />
          </div>

          <div>
            <label htmlFor="repoURL" className="block text-sm font-medium text-gray-700">
              GitHub Repository URL
            </label>
            <input
              type="text"
              id="repoURL"
              value={repoURL}
              onChange={(e) => setRepoURL(e.target.value)}
              placeholder="Enter repository URL"
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
              required
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700">GitHub Options</label>
            <div className="flex items-center space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={onlyMainBranch}
                  onChange={(e) => setOnlyMainBranch(e.target.checked)}
                  className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-200"
                />
                <span className="text-sm text-gray-700">Only pull commit data from the main branch</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={onlyMergedPRs}
                  onChange={(e) => setOnlyMergedPRs(e.target.checked)}
                  className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-200"
                />
                <span className="text-sm text-gray-700">Only pull data from merged PRs</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LinkToolsPage;