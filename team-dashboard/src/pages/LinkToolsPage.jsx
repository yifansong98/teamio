import React, { useState, useEffect } from "react";
import { useStepsCompletion } from "../contexts/StepsCompletionContext";
import { useNavigate } from "react-router-dom";

const LinkToolsPage = () => {
  const [googleDocsData, setGoogleDocsData] = useState(null);
  const [googleDocsFileName, setGoogleDocsFileName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const { setStepsCompletion } = useStepsCompletion();
  const navigate = useNavigate();

  // Load saved data from localStorage on page load
  useEffect(() => {
    const savedData = localStorage.getItem("linkToolsData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setGoogleDocsData(parsedData.googleDocsData || null);
      setGoogleDocsFileName(parsedData.googleDocsFileName || "");
    }

    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      console.log("Parsed User Data:", parsedUserData);
      setTeamId(parsedUserData.team_id || "");
    } else {
      setResponseMessage("Error: User data not found. Please log in again.");
    }
  }, []);

  // Save data to localStorage whenever inputs change
  useEffect(() => {
    const dataToSave = {
      googleDocsData,
      googleDocsFileName
    };
    localStorage.setItem("linkToolsData", JSON.stringify(dataToSave));
  }, [googleDocsData, googleDocsFileName]);

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

    try {
      // Create the fetch requests

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
      const [googleDocsResponse] = await Promise.all([
        googleDocsRequest
      ]);

      // Handle Google Docs response
      if (googleDocsResponse.ok) {
        const data = await googleDocsResponse.json();
        setResponseMessage((prev) => prev + "Google Docs: " + JSON.stringify(data) + "\n");
      } else {
        const errorData = await googleDocsResponse.json();
        setResponseMessage((prev) => prev + "Google Docs Error: " + JSON.stringify(errorData) + "\n");
      }

      // Navigate to the next page if both requests succeed
      if (googleDocsResponse.ok) {
        setStepsCompletion((prev) => ({ ...prev, step1: true }));
        navigate("/home");
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
        onClick={() => navigate("/home")}
        className="text-blue-600 hover:underline mb-6"
      >
        &larr; Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-gray-800">Step 1: Link Collaboration Tools</h1>

      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
        <p className="text-sm">
          Upload your Google Docs JSON file to extract contributions.
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