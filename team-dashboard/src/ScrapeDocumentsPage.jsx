import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft, IconDownload, IconExternalLink } from "./assets/icons";
import { useStepsCompletion } from "./StepsCompletionContext";

const ScrapeDocumentsPage = () => {
  const navigate = useNavigate();
  const { stepsCompletion, setStepsCompletion } = useStepsCompletion();
  const [serverStatus, setServerStatus] = useState('checking');
  const [docUrl, setDocUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [teamId, setTeamId] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);
  const [isGettingToken, setIsGettingToken] = useState(false);

  // Check server health
  const checkServerHealth = async () => {
    try {
      const response = await fetch('http://localhost:8787/health');
      if (response.ok) {
        setServerStatus('running');
        return true;
      }
    } catch (err) {
      console.log('Server not running:', err.message);
    }
    setServerStatus('stopped');
    return false;
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);
    
    // Load team ID from localStorage
    const savedData = localStorage.getItem("linkToolsData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setTeamId(parsedData.teamId || "");
    }
    
    return () => clearInterval(interval);
  }, []);

  const getGoogleToken = async () => {
    setIsGettingToken(true);
    setError(null);
    
    try {
      // Open OAuth flow in a popup
      const popup = window.open(
        'http://localhost:8787/oauth/authorize',
        'oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      // Listen for the popup to close or receive a message
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
          setGoogleToken(event.data.token);
          popup.close();
          clearInterval(checkClosed);
          setIsGettingToken(false);
          window.removeEventListener('message', messageListener);
        }
      };
      
      window.addEventListener('message', messageListener);
      
    } catch (err) {
      setError('Failed to get Google token: ' + err.message);
      setIsGettingToken(false);
    }
  };

  const scrapeDocument = async () => {
    if (!docUrl.trim()) {
      setError('Please enter a Google Docs URL or document ID');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('Sending token to server:', googleToken ? `${googleToken.length} characters` : 'null');
      const response = await fetch('http://localhost:8787/api/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 65678987654567887658',
          'X-Google-Token': googleToken || ''
        },
        body: JSON.stringify({
          target: docUrl,
          includeRaw: true,
          includeChars: false,
          download: false,
          logoutFirst: false  // Don't logout, use existing authentication
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Not signed into Google')) {
          setError('Authentication required. Please go to the "Prove Auth" page first to authenticate with Google.');
        } else {
          throw new Error(errorData.error || 'Failed to scrape document');
        }
      } else {
      const data = await response.json();
      setResult(data);
      setError(null);
      // Mark step 5 as completed
      setStepsCompletion(prev => ({ ...prev, step5: true }));
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

  const postToBackend = async () => {
    if (!result || !teamId) {
      setError('No scraped data or team ID available');
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
          doc: result
        })
      });

      if (response.ok) {
        const data = await response.json();
        setError(null);
        // Mark step 3 as completed
        setStepsCompletion(prev => ({ ...prev, step3: true }));
        alert('Google Docs data posted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post Google Docs data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `docs-replay-${result.meta?.docId || 'result'}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/teamio')}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <IconArrowLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Scrape Documents</h1>
        </div>

        {/* Server Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Server Status</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                serverStatus === 'running' ? 'bg-green-500' :
                serverStatus === 'checking' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium capitalize">
                {serverStatus === 'checking' ? 'Checking...' : serverStatus}
              </span>
            </div>
          </div>

          {serverStatus === 'stopped' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                <strong>Server not running.</strong> Please start the Google Docs replay server:
              </p>
              <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                cd server && npm start
              </div>
            </div>
          )}

          {serverStatus === 'running' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>Server is running and ready!</strong>
              </p>
            </div>
          )}
        </div>

        {/* Google Token Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Google Authentication</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {googleToken ? 'Google token obtained' : 'Get Google token to fetch comments'}
                </p>
                {googleToken && (
                  <p className="text-xs text-green-600 mt-1">
                    Token: {googleToken.substring(0, 20)}...
                  </p>
                )}
              </div>
              <button
                onClick={getGoogleToken}
                disabled={isGettingToken}
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isGettingToken ? 'Getting Token...' : googleToken ? 'Refresh Token' : 'Get Google Token'}
              </button>
            </div>
          </div>
        </div>

        {/* Document Scraping Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Scrape Google Docs</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Docs URL or Document ID
              </label>
              <input
                type="text"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/1ABC... or just the document ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => {
                console.log('Button clicked! Server status:', serverStatus, 'Processing:', isProcessing, 'Token:', googleToken ? `${googleToken.length} chars` : 'null');
                scrapeDocument();
              }}
              disabled={serverStatus !== 'running' || isProcessing}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconExternalLink className="w-4 h-4 mr-2" />
              {isProcessing ? 'Scraping...' : 'Scrape Document'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                {error.includes('Authentication required') && (
                  <button
                    onClick={() => navigate('/teamio/auth')}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Go to Prove Auth
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Scraping Results</h2>
              <div className="flex space-x-2">
                <button
                  onClick={postToBackend}
                  disabled={isPosting || !teamId}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPosting ? 'Posting...' : 'Post to Backend'}
                </button>
                <button
                  onClick={downloadResult}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <IconDownload className="w-4 h-4 mr-2" />
                  Download JSON
                </button>
              </div>
            </div>
            
            {!teamId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800">
                  No team ID found. Please complete Step 1 (Link GitHub Repository) first to set up your team ID.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Document ID</div>
                  <div className="font-mono text-sm">{result.meta?.docId}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Total Events</div>
                  <div className="font-semibold">{result.meta?.counts?.events || 0}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Inserts</div>
                  <div className="font-semibold">{result.meta?.counts?.inserts || 0}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Deletes</div>
                  <div className="font-semibold">{result.meta?.counts?.deletes || 0}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Contributors</h3>
                <div className="space-y-1">
                  {Object.entries(result.users || {}).map(([id, user]) => (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{user.name || id}</span>
                      <span className="text-gray-600">{user.anonymous ? 'Anonymous' : 'Known'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                <h3 className="font-medium text-gray-800 mb-2">Recent Events</h3>
                <div className="space-y-2">
                  {result.events?.slice(0, 10).map((event, index) => (
                    <div key={index} className="text-sm border-l-2 border-blue-200 pl-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{event.authorName}</span>
                        <span className="text-gray-600">{event.type}</span>
                      </div>
                      <div className="text-gray-600">{event.timestamp}</div>
                      {event.text && (
                        <div className="text-gray-700 mt-1 truncate">
                          {event.text.length > 100 ? `${event.text.substring(0, 100)}...` : event.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">How to scrape documents:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
            <li>Make sure you've completed authentication on the "Prove Auth" page</li>
            <li>Enter a Google Docs URL or document ID</li>
            <li>Click "Scrape Document" to extract revision history and comments</li>
            <li>Download the results as JSON for further analysis</li>
          </ol>
          <p className="text-blue-600 text-sm mt-3">
            <strong>Note:</strong> You must have access to the Google Docs document and be authenticated with the correct Google account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScrapeDocumentsPage;
