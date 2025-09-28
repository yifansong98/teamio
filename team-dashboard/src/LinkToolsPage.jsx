import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LinkToolsPage = () => {
  const [googleDocsData, setGoogleDocsData] = useState(null);
  const [googleDocsFileName, setGoogleDocsFileName] = useState("");
  const [repoURL, setRepoURL] = useState("");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [onlyMainBranch, setOnlyMainBranch] = useState(false);
  const [onlyMergedPRs, setOnlyMergedPRs] = useState(false);

  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGoogleDocsFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          setGoogleDocsData(parsedData);
        } catch (error) {
          setResponseMessage("Error: Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

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

      const googleDocsRequest = fetch(
        `http://localhost:3000/api/google_docs/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ team_id: teamId, doc: googleDocsData }),
        }
      );

      // Execute both requests in parallel
      const [githubResponse, googleDocsResponse] = await Promise.all([
        githubRequest,
        googleDocsRequest,
      ]);

      // Handle GitHub response
      if (githubResponse.ok) {
        const data = await githubResponse.json();
        setResponseMessage((prev) => prev + "GitHub: " + JSON.stringify(data) + "\n");
      } else {
        const errorData = await githubResponse.json();
        setResponseMessage((prev) => prev + "GitHub Error: " + JSON.stringify(errorData) + "\n");
      }

      // Handle Google Docs response
      if (googleDocsResponse.ok) {
        const data = await googleDocsResponse.json();
        setResponseMessage((prev) => prev + "Google Docs: " + JSON.stringify(data) + "\n");
      } else {
        const errorData = await googleDocsResponse.json();
        setResponseMessage((prev) => prev + "Google Docs Error: " + JSON.stringify(errorData) + "\n");
      }

      // Navigate to the next page if both requests succeed
      if (githubResponse.ok && googleDocsResponse.ok) {
        navigate("/teamio/mapping", { state: { teamId: teamId } });
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
        onClick={() => navigate("/teamio/dashboard")}
        className="text-blue-600 hover:underline mb-6"
      >
        &larr; Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-gray-800">Step 1: Link Collaboration Tools</h1>

      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
        <p className="text-sm">
          Link your GitHub repository and upload your Google Docs JSON file to
          extract contributions. You can also specify additional options for
          filtering GitHub data.
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
            <label htmlFor="jsonFile" className="block text-sm font-medium text-gray-700">
              Google Docs JSON
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                id="jsonFile"
                accept="application/json"
                onChange={(e) => handleFileUpload(e)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById("jsonFile").click()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                {googleDocsData ? googleDocsFileName : "Upload File"}
              </button>
            </div>
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