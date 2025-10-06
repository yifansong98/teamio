import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IconArrowLeft, IconCheck, IconLock } from "./assets/icons";
import { useStepsCompletion } from "./StepsCompletionContext";

const GoogleDocsStepper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stepsCompletion, setStepsCompletion } = useStepsCompletion();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [teamId, setTeamId] = useState('');
  const [googleToken, setGoogleToken] = useState(null);
  const [commentsToken, setCommentsToken] = useState(null);
  const [isGettingToken, setIsGettingToken] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    // Load team ID from localStorage or location state
    const storedTeamId = localStorage.getItem("teamId");
    const stateTeamId = location.state?.teamId;
    const finalTeamId = stateTeamId || storedTeamId || "";
    console.log("GoogleDocsStepper - Team ID sources:", { storedTeamId, stateTeamId, finalTeamId });
    
    // Reset data when team ID changes
    if (teamId && teamId !== finalTeamId) {
      console.log("Team ID changed in GoogleDocsStepper, resetting data");
      setCurrentStep(1);
      setGoogleToken(null);
      setCommentsToken(null);
      setDocUrl("");
      setResult(null);
      setError(null);
      setSuccess(null);
    }
    
    setTeamId(finalTeamId);
  }, [location.state, teamId]);

  // Automatically trigger OAuth when reaching Step 2
  useEffect(() => {
    if (currentStep === 2 && !commentsToken && !isGettingToken) {
      console.log('Auto-triggering OAuth for comments...');
      setTimeout(() => {
        initiateCommentsLogin();
      }, 500); // Small delay to ensure component is ready
    }
  }, [currentStep, commentsToken, isGettingToken]);

  // Monitor commentsToken changes and force step transition
  useEffect(() => {
    if (commentsToken && currentStep === 2) {
      console.log('CommentsToken received, forcing step transition to 3');
      setTimeout(() => {
        setCurrentStep(3);
      }, 500);
    }
  }, [commentsToken, currentStep]);

  const initiateLogin = async () => {
    if (!docUrl.trim()) {
      setError('Please enter a Google Docs URL first');
      return;
    }

    setIsGettingToken(true);
    setError(null);
    
    try {
      // This will open browser window for login
      const response = await fetch('http://localhost:8787/api/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 65678987654567887658'
        },
        body: JSON.stringify({
          target: docUrl.trim(),
          includeRaw: false,
          includeChars: false,
          download: false,
          logoutFirst: true
        })
      });

      // For initiate login, we expect it to fail and open browser window
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Not signed into Google')) {
          setError('Browser window opened for authentication. Please sign in to your Google account, then use "Check Status" to verify.');
        } else {
          setError('Browser window opened for authentication. Please sign in to your Google account, then use "Check Status" to verify.');
        }
      } else {
        // If it works immediately, we're already logged in
        setGoogleToken('authenticated');
        setError(null);
        setTimeout(() => {
          setCurrentStep(2);
        }, 1000);
      }
    } catch (err) {
      setError('Browser window opened for authentication. Please sign in to your Google account, then use "Check Status" to verify.');
    } finally {
      setIsGettingToken(false);
    }
  };

  const checkCommentsAuth = async () => {
    if (!docUrl.trim()) {
      setError('Please enter a Google Docs URL first');
      return;
    }

    // Automatically trigger OAuth login for comments
    await initiateCommentsLogin();
  };

  const initiateCommentsLogin = async () => {
    console.log('initiateCommentsLogin called');
    setIsGettingToken(true);
    setError(null);
    
    try {
      console.log('Opening OAuth popup...');
      const popup = window.open(
        'http://localhost:8787/oauth/authorize',
        'google-drive-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
      
      console.log('Popup opened:', popup);
      
      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsGettingToken(false);
        }
      }, 1000);
      
      // Listen for message from popup (if using postMessage)
      const messageListener = (event) => {
        if (event.origin !== 'http://localhost:8787') return;
        
        if (event.data.token) {
          console.log('Received token from OAuth:', event.data.token.length, 'characters');
          setCommentsToken(event.data.token);
          popup.close();
          clearInterval(checkClosed);
          setIsGettingToken(false);
          window.removeEventListener('message', messageListener);
          // Move to next step
          setTimeout(() => {
            setCurrentStep(3);
          }, 1000);
        }
      };
      
      window.addEventListener('message', messageListener);
      
    } catch (err) {
      setError('Failed to get Google token: ' + err.message);
      setIsGettingToken(false);
    }
  };

  const getGoogleToken = async () => {
    if (!docUrl.trim()) {
      setError('Please enter a Google Docs URL first');
      return;
    }

    setIsGettingToken(true);
    setError(null);
    
    try {
      // This checks if we can access the document (status check only, no scraping)
      const response = await fetch('http://localhost:8787/api/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 65678987654567887658'
        },
        body: JSON.stringify({
          target: docUrl.trim(),
          includeRaw: false,
          includeChars: false,
          download: false,
          logoutFirst: false,
          statusCheck: true  // This is just a status check, not a full scrape
        })
      });

      if (!response.ok) {
        setError('Cannot access document. Please login first.');
        return;
      }

      // Parse the response to check if the status check was successful
      const result = await response.json();
      
      if (result.success) {
        // Successfully accessed the document
        setGoogleToken('authenticated');
        setError(null);
        setSuccess('Document access confirmed! You can proceed to the next step.');
        
        // Move to next step after a short delay
        setTimeout(() => {
          setCurrentStep(2);
        }, 1000);
      } else {
        setError(result.error || 'Cannot access document. Please login first.');
      }
      
    } catch (err) {
      setError('Failed to check document access: ' + err.message);
    } finally {
      setIsGettingToken(false);
    }
  };

  const scrapeDocument = async () => {
    if (!docUrl.trim()) {
      setError('Please enter a Google Docs URL');
      return;
    }

    if (!commentsToken) {
      setError('Please complete comments authentication first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8787/api/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 65678987654567887658',
          'X-Google-Token': commentsToken // Use the actual OAuth token
        },
        body: JSON.stringify({
          target: docUrl.trim(),
          includeRaw: false,
          includeChars: false,
          download: false,
          logoutFirst: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('401')) {
          setError('Authentication required. Please go to the "Prove Auth" page first to authenticate with Google.');
        } else {
          throw new Error(errorData.error || 'Failed to scrape document');
        }
      } else {
        const data = await response.json();
        setResult(data);
        setError(null);
        
        console.log('Scraping completed, data keys:', Object.keys(data));
        console.log('Current teamId:', teamId);
        
        // Automatically post to backend after scraping
        try {
          await postToBackendWithData(data);
          // Mark step 3 as completed (scraping and posting done)
          setStepsCompletion(prev => ({ ...prev, step3: true }));
          setSuccess("Google Docs data scraped and posted successfully!");
          setCurrentStep(4); // Move to completion step
        } catch (postError) {
          console.error('Failed to post to backend:', postError);
          setError(`Scraping successful but failed to post to backend: ${postError.message}`);
        }
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError('Authentication required. Please go to the "Prove Auth" page first to authenticate with Google.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const postToBackendWithData = async (data) => {
    console.log('postToBackendWithData called with:', { data: !!data, teamId, dataKeys: data ? Object.keys(data) : null });
    if (!data || !teamId) {
      setError(`No scraped data or team ID available. Data: ${!!data}, TeamId: ${teamId}`);
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/google_docs/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          doc: data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post Google Docs data');
      }

      const responseData = await response.json();
      console.log('Successfully posted to backend:', responseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Authenticate for Revisions",
      description: "Get Google authentication to access document revision history",
      completed: googleToken !== null,
      active: currentStep === 1
    },
    {
      id: 2,
      title: "Authenticate for Comments",
      description: "Get additional permissions to access document comments",
      completed: false, // This would be a separate auth step
      active: currentStep === 2
    },
    {
      id: 3,
      title: "Scrape Document",
      description: "Extract collaboration data from your Google Doc",
      completed: result !== null,
      active: currentStep === 3
    },
    {
      id: 4,
      title: "Complete",
      description: "Data successfully scraped and posted",
      completed: success !== null,
      active: currentStep === 4
    }
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <button
          onClick={() => navigate("/teamio", { state: { teamId: teamId } })}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200"
        >
          <IconArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Google Docs Data Collection</h1>
        <p className="text-gray-600 mt-2">
          Extract collaboration insights from your team's documents
        </p>
      </div>

        {/* Stepper */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : step.active
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step.completed ? (
                        <IconCheck className="w-5 h-5" />
                      ) : (
                        <span className="font-bold text-lg">{step.id}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-semibold ${
                        step.active ? "text-blue-600" : step.completed ? "text-green-600" : "text-gray-500"
                      }`}>
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full ${
                      step.completed ? "bg-green-500" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Step 1: Revisions Auth */}
          {currentStep === 1 && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Authenticate for Revisions</h2>
                <p className="text-gray-600 max-w-xl mx-auto">
                  We need to authenticate with Google to access your document's revision history and track all the changes made by your team.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">What we'll access:</h3>
                    <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                      <li>Document revision history</li>
                      <li>Who made what changes and when</li>
                      <li>Text additions, deletions, and modifications</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="max-w-xl mx-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Docs URL
                    </label>
                    <input
                      type="url"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/1ABC... or just the document ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Enter the Google Docs URL you want to analyze
                    </p>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={getGoogleToken}
                      disabled={isGettingToken || !docUrl.trim()}
                      className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGettingToken ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Checking Status...
                        </div>
                      ) : (
                        "Check Status"
                      )}
                    </button>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <p className="mt-2 text-sm text-red-700">{error}</p>
                          {error.includes('Cannot access document') && (
                            <div className="mt-3">
                              <button
                                onClick={initiateLogin}
                                disabled={isGettingToken}
                                className="bg-green-500 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Login
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

              {commentsToken && !error && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Comments Access Successful!</h3>
                      <p className="mt-2 text-sm text-green-700">Comments authentication complete. Moving to next step...</p>
                      <button
                        onClick={() => {
                          console.log('Manual step transition to 3');
                          setCurrentStep(3);
                        }}
                        className="mt-2 bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700"
                      >
                        Continue to Scraping
                      </button>
                    </div>
                  </div>
                </div>
              )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Comments Auth */}
          {currentStep === 2 && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Authenticating for Comments</h2>
                <p className="text-gray-600 max-w-xl mx-auto">
                  Setting up access to document comments and discussions for complete collaboration analysis.
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">What we'll access:</h3>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                      <li>Document comments and discussions</li>
                      <li>Comment attribution to specific text</li>
                      <li>Collaboration insights from comments</li>
                    </ul>
                  </div>
                </div>
              </div>

              {isGettingToken && (
                <div className="text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-blue-800 font-medium">Opening authentication window...</span>
                    </div>
                  </div>
                </div>
              )}

              {!isGettingToken && !commentsToken && (
                <div className="text-center">
                  <button
                    onClick={initiateCommentsLogin}
                    className="bg-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                  >
                    Start Comments Authentication
                  </button>
                </div>
              )}

              {isGettingToken && (
                <div className="text-center mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 mb-3">If the popup doesn't close automatically after authentication:</p>
                    <button
                      onClick={() => {
                        setCommentsToken('manual-success');
                        setIsGettingToken(false);
                        setCurrentStep(3);
                      }}
                      className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                    >
                      Continue to Next Step
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="mt-2 text-sm text-red-700">{error}</p>
                      {error.includes('Cannot access comments') && (
                        <div className="mt-3">
                          <button
                            onClick={initiateCommentsLogin}
                            disabled={isGettingToken}
                            className="bg-green-500 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Login for Comments
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {googleToken && !error && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Comments Access Successful!</h3>
                      <p className="mt-2 text-sm text-green-700">Comments authentication complete. Moving to next step...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Scrape Document */}
          {currentStep === 3 && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Scrape Document</h2>
                <p className="text-gray-600 max-w-xl mx-auto">
                  Enter the Google Docs URL you want to analyze for collaboration data. We'll extract all the revision history and collaboration insights.
                </p>
              </div>
              
              <div className="max-w-xl mx-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Docs URL
                    </label>
                    <input
                      type="url"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/1ABC... or just the document ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      onClick={scrapeDocument}
                      disabled={isProcessing}
                      className="bg-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Scraping Document...
                        </div>
                      ) : (
                        "Scrape Document"
                      )}
                    </button>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <p className="mt-2 text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Success!</h3>
                          <p className="mt-2 text-sm text-green-700">{success}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <IconCheck className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Google Docs Data Collected!</h2>
              <p className="text-lg text-gray-600 mb-6 max-w-xl mx-auto">
                Your Google Docs collaboration data has been successfully scraped and posted to the backend. 
                You can now proceed to map logins and analyze your team's collaboration patterns.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-xl mx-auto">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-800 font-medium">Data successfully processed and stored</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/teamio", { state: { teamId: teamId } })}
                  className="bg-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  Return to Dashboard
                </button>
                
                <button
                  onClick={() => navigate("/teamio/map-logins", { state: { teamId: teamId } })}
                  className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Continue to Mapping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleDocsStepper;
