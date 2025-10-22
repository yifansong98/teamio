import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStepsCompletion } from "../contexts/StepsCompletionContext";
import { IconCheck, IconLock, IconArrowRightOnRectangle } from "../assets/icons";

const MainDashboardPage = () => {
  const navigate = useNavigate();
  const { stepsCompletion } = useStepsCompletion();
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Get user data from localStorage (populated by auth)
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const teamId = userData.team_id || null;

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user || !user.email) {
        console.error("No authenticated user found");
        setLoading(false);
        return;
      }
      
      if (localStorage.getItem("userData") && localStorage.getItem("teamData")) {
        setLoading(false);
        return; // User data already in localStorage
      }

      try {
        const response = await fetch(`http://localhost:3000/api/users?email=${user.email}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.log("User not found in database, creating default user data");
            // Create default user data for new users
            const defaultUserData = {
              user_id: user.email.split('@')[0],
              email: user.email,
              full_name: user.displayName || 'User',
              team_id: 'default-team'
            };
            localStorage.setItem("userData", JSON.stringify(defaultUserData));
            localStorage.setItem("teamData", JSON.stringify([]));
            setLoading(false);
            return;
          }
          throw new Error("Failed to fetch user info");
        }

        const userInfo = await response.json();

        // Store user info in localStorage
        localStorage.setItem("userData", JSON.stringify(userInfo));

        const teamId = userInfo.team_id;
        if (teamId) {
          const teamResponse = await fetch(`http://localhost:3000/api/teams/members/?team_id=${teamId}`);
          if (!teamResponse.ok) {
            console.warn("Failed to fetch team members, using empty array");
            localStorage.setItem("teamData", JSON.stringify([]));
          } else {
            const teamMembers = await teamResponse.json();
            localStorage.setItem("teamData", JSON.stringify(teamMembers));
          }
        } else {
          localStorage.setItem("teamData", JSON.stringify([]));
        }

      } catch (error) {
        console.error("Error fetching user info:", error);
        // Create default user data on error
        const defaultUserData = {
          user_id: user.email.split('@')[0],
          email: user.email,
          full_name: user.displayName || 'User',
          team_id: 'default-team'
        };
        localStorage.setItem("userData", JSON.stringify(defaultUserData));
        localStorage.setItem("teamData", JSON.stringify([]));
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user]);

  const handleSignOut = () => {
    localStorage.clear(); // Clear all stored data
    navigate("/login"); // Redirect to login page
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If no team ID, show message to contact admin
  if (!teamId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Team Assigned</h2>
          <p className="text-gray-600 mb-4">
            You haven't been assigned to a team yet. Please contact your administrator.
          </p>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        {/* Centered Content */}
        <div className="flex-1 flex justify-center items-start">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Hi, {userData.full_name || userData.email || "User"}!
            </h1>
            <p className="text-gray-600 mt-2">
              Team ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{teamId || "Not assigned"}</span>
            </p>
            <p className="text-gray-600 mt-2">
              Follow these steps to analyze your team's collaboration patterns.
            </p>
          </div>
        </div>

        {/* Right-Aligned Content */}
        <div className="text-right">
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="mt-2 bg-gray-400 text-white font-bold p-2 rounded-lg hover:bg-gray-500 transition-colors flex items-start justify-center"
          >
            <IconArrowRightOnRectangle className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Step 1: Scrape Google Docs */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            stepsCompletion.step3 ? "bg-green-50" : "bg-white"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step3
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <span className="font-bold text-lg">1</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Scrape Google Docs
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step3
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {stepsCompletion.step3
                    ? "Status: Done"
                    : "Extract revision history and comments from Google Docs"}
                </p>
              </div>
            </div>
            {stepsCompletion.step3 ? <IconCheck /> : <IconLock />}
          </div>
          {!stepsCompletion.step3 && (
            <button
              onClick={() => navigate("/home/scrape-documents")}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 1
            </button>
          )}
          {stepsCompletion.step3 && (
            <button
              onClick={() => navigate("/home/scrape-documents")}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Scraping
            </button>
          )}
        </div>

        {/* Step 2: Map All Logins to UserIDs */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            stepsCompletion.step4 ? "bg-green-50" : "bg-white"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step4
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <span className="font-bold text-lg">2</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Map All Logins to UserIDs
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step4
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {stepsCompletion.step4
                    ? "Status: Done"
                    : "Map GitHub and Google Docs logins to team member IDs"}
                </p>
              </div>
            </div>
            {stepsCompletion.step4 ? <IconCheck /> : <IconLock />}
          </div>
          {!stepsCompletion.step4 && (
            <button
              onClick={() => navigate("/home/map-logins", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 2
            </button>
          )}
          {stepsCompletion.step4 && (
            <button
              onClick={() => navigate("/home/map-logins", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Mapping
            </button>
          )}
        </div>

        {/* Step 3: Annotate Contributions */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            stepsCompletion.step5 ? "bg-green-50" : "bg-white"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step5
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <span className="font-bold text-lg">3</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Annotate Contributions
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step5
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {stepsCompletion.step5
                    ? "Status: Done"
                    : "Attribute work to team members"}
                </p>
              </div>
            </div>
            {stepsCompletion.step5 ? <IconCheck /> : <IconLock />}
          </div>
          {!stepsCompletion.step5 && (
            <button
              onClick={() => navigate("/home/annotate-contributions", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 3
            </button>
          )}
          {stepsCompletion.step5 && (
            <button
              onClick={() => navigate("/home/annotate-contributions", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Annotations
            </button>
          )}
        </div>

        {/* Step 4: Team Reflection */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            !stepsCompletion.step5 ? "opacity-50 cursor-not-allowed" : ""
          } ${stepsCompletion.step6 ? "bg-green-50" : "bg-white"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step6
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <span className="font-bold text-lg">4</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Team Reflection
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step6
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {stepsCompletion.step6
                    ? "Status: Done"
                    : "Review and discuss teamwork patterns"}
                </p>
              </div>
            </div>
            {stepsCompletion.step6 ? <IconCheck /> : !stepsCompletion.step5 && <IconLock />}
          </div>
          {stepsCompletion.step5 && !stepsCompletion.step6 && (
            <button
              onClick={() => navigate("/home/reflections", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 4
            </button>
          )}
          {stepsCompletion.step6 && (
            <button
              onClick={() => navigate("/home/reflections", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View Reflection
            </button>
          )}
        </div>
      </div>

      {/* Data Note */}
      <div className="mt-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-lg max-w-2xl mx-auto">
        <p className="font-bold">A Note on Your Data</p>
        <p className="text-sm">
          This tool is designed for team reflection only. All data is controlled
          by your team and is not used for formal assessment or grading.
        </p>
      </div>
    </div>
  );
};

export default MainDashboardPage;