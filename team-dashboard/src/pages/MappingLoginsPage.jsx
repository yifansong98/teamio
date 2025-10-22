import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStepsCompletion } from "../contexts/StepsCompletionContext";
import { useTeam } from "../contexts/TeamContext";

const MappingLoginsPage = () => {
  const [logins, setLogins] = useState([]); // Store logins fetched from the API
  const [mappings, setMappings] = useState({}); // Store login-to-UserID mappings
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [members, setMembers] = useState([]); // Store students fetched from the API
  const navigate = useNavigate();
  const { teamId } = useTeam();
  const { setStepsCompletion } = useStepsCompletion();

  useEffect(() => {
    if (!teamId) {
      setResponseMessage("Error: Team ID not found. Please log in again.");
      return;
    }

    // Fetch logins for the given team_id
    const fetchLogins = async (teamId) => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/teams/logins?team_id=${teamId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Logins:", data);
          console.log("Team ID:", teamId);
          setLogins(data || []);
        } else {
          const errorData = await response.json();
          setResponseMessage("Error: " + JSON.stringify(errorData));
        }
      } catch (error) {
        setResponseMessage("Error: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchMembers = async (teamId) => {

      const teamData = localStorage.getItem("teamData");
      if (teamData) {
        setMembers(JSON.parse(teamData));
        return; // Use cached data if available
      }

      try {
        const response = await fetch(`http://localhost:3000/api/teams/members?team_id=${teamId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Members:", data);
          setMembers(data || []);
        } else {
          const errorData = await response.json();
          console.error("Error fetching members:", JSON.stringify(errorData));
        }
      } catch (error) {
        setResponseMessage("Error: " + error.message);
      }
    }

    fetchLogins(teamId);
    fetchMembers(teamId);
  }, [teamId]);

  const handleMappingChange = (login, userId) => {
    const updatedMappings = {
        ...mappings,
        [login]: userId,
      };
      setMappings(updatedMappings);
      localStorage.setItem(`mappings_${teamId}`, JSON.stringify(updatedMappings)); // Save to localStorage
  };

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData.team_id) {
      const savedMappings = localStorage.getItem(`mappings_${userData.team_id}`);
      if (savedMappings) {
        setMappings(JSON.parse(savedMappings)); // Load from localStorage
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/teams/map-logins?team_id=${teamId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mappings }),
      });

      if (response.ok) {
        setResponseMessage("Mappings successfully saved!");
        setStepsCompletion((prev) => ({ ...prev, step1b: true }));
        navigate("/home/annotate-contributions"); // Navigate to the next step
      } else {
        const errorData = await response.json();
        setResponseMessage("Error: " + JSON.stringify(errorData));
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

      <h1 className="text-2xl font-bold text-gray-800">Step 1b: Map Logins to User IDs</h1>

      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-lg">
        <p className="text-sm">
          Below is a list of logins extracted from your linked tools. Please map each login to the
          corresponding UserID for your team members. This mapping ensures that contributions are
          correctly attributed to the right individuals.
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

      {loading ? (
        <p className="text-center text-gray-500 text-lg mt-6">Loading...</p>
      ) : logins.length === 0 ? (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-800">
            No logins found for team "{teamId}". Make sure you've completed Step 1 (Link Tools) first.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {logins.map((login, index) => (
              <div key={`${login}-${index}`} className="flex items-center space-x-4">
                <div className="relative group w-1/3">
                  <label className="text-sm font-medium text-gray-700 truncate block">
                    {login}
                  </label>
                </div>
                <select
                  value={mappings[login] || ""}
                  onChange={(e) => handleMappingChange(login, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  required
                >
                  <option value="" disabled>
                    Select a student
                  </option>
                  {members.map((member) => (
                    <option key={member.full_name} value={member.user_id}>
                      {member.full_name} ({member.user_id})
                    </option>
                  ))}
                </select>
              </div>
            ))}
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
      )}
    </div>
  );
};

export default MappingLoginsPage;