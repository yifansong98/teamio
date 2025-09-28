import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useStepsCompletion } from "./StepsCompletionContext";
import { IconCheck, IconLock } from "./assets/icons"; // Assuming you have these icons defined elsewhere

const MainDashboardPage = () => {
  const navigate = useNavigate();
  const { stepsCompletion } = useStepsCompletion();
  const location = useLocation(); // Hook to access the current location

  const [teamId, setTeamId] = useState(location.state?.teamId || null);
  // Update teamId whenever location.state changes
  useEffect(() => {
    console.log("Location state changed:", location.state);
    const updatedTeamId = location.state?.teamId || null;
    setTeamId(updatedTeamId);
  }, [location.state]);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Teamwork Reflection</h1>
        <p className="text-gray-600 mt-2">
          Follow these steps to analyze and reflect on your team's collaboration.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Step 1: Link Collaboration Tools */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            stepsCompletion.step1 ? "bg-green-50" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step1
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <span className="font-bold text-lg">1</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Link Collaboration Tools
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step1
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {stepsCompletion.step1
                    ? "Status: Done"
                    : "Connect your team's tools"}
                </p>
              </div>
            </div>
            {stepsCompletion.step1 && <IconCheck />}
          </div>
          {stepsCompletion.step1 ? (
            <button
              onClick={() => navigate("/teamio/link", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Links
            </button>
          ) : (
            <button
              onClick={() => navigate("/teamio/link", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 1
            </button>
          )}
        </div>

        {/* Step 1b: Map Logins to UserIDs */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            !stepsCompletion.step1 ? "opacity-50 cursor-not-allowed" : ""
          } ${stepsCompletion.step1b ? "bg-green-50" : "bg-white"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step1b
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <span className="font-bold text-lg">1b</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Map Logins to UserIDs
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step1b
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {stepsCompletion.step1b
                    ? "Status: Done"
                    : "Ensure contributions are attributed"}
                </p>
              </div>
            </div>
            {stepsCompletion.step1b && <IconCheck />}
          </div>
          {stepsCompletion.step1b ? (
            <button
              onClick={() => navigate("/teamio/mapping", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Mapping
            </button>
          ) : (
            <button
              onClick={() => navigate("/teamio/mapping", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 1b
            </button>
          )}
        </div>

        {/* Step 2: Annotate Contributions */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            !stepsCompletion.step1b ? "opacity-50 cursor-not-allowed" : ""
          } ${stepsCompletion.step2 ? "bg-green-50" : "bg-white"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  stepsCompletion.step2
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <span className="font-bold text-lg">2</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Annotate Contributions
                </h2>
                <p
                  className={`text-sm ${
                    stepsCompletion.step2
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {stepsCompletion.step2
                    ? "Status: Done"
                    : "Attribute work to team members"}
                </p>
              </div>
            </div>
            {stepsCompletion.step2 ? <IconCheck /> : !stepsCompletion.step1 && <IconLock />}
          </div>
          {stepsCompletion.step1 && !stepsCompletion.step2 && (
            <button
              onClick={() => navigate("/teamio/attribution", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Step 2
            </button>
          )}
          {stepsCompletion.step2 && (
            <button
              onClick={() => navigate("/teamio/attribution", { state: { teamId: teamId } })}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              View/Edit Annotations
            </button>
          )}
        </div>

        {/* Step 3: Team Reflection */}
        <div
          className={`p-6 rounded-lg shadow-md transition-all ${
            !stepsCompletion.step2 ? "opacity-50 cursor-not-allowed" : ""
          } ${stepsCompletion.step3 ? "bg-green-50" : "bg-white"}`}
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
                <span className="font-bold text-lg">3</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Team Reflection
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
                    : "Review and discuss teamwork patterns"}
                </p>
              </div>
            </div>
            {stepsCompletion.step3 ? <IconCheck /> : !stepsCompletion.step2 && <IconLock />}
          </div>
          {stepsCompletion.step2 && (
            <button
              onClick={() => navigate("/teamio/reflections", { state: { teamId: teamId } })}
              className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Reflection
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