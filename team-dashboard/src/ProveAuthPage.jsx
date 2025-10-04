import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft, IconCheck, IconExternalLink } from "./assets/icons";
import { useStepsCompletion } from "./StepsCompletionContext";

const ProveAuthPage = () => {
  const navigate = useNavigate();
  const { stepsCompletion, setStepsCompletion } = useStepsCompletion();
  const [serverStatus, setServerStatus] = useState('checking');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState('not-started'); // 'not-started', 'in-progress', 'success', 'failed'
  const [error, setError] = useState(null);
  const [testDocUrl, setTestDocUrl] = useState('');

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
    return () => clearInterval(interval);
  }, []);

  const startAuthentication = async () => {
    if (!testDocUrl.trim()) {
      setError('Please enter a Google Docs URL to test authentication');
      return;
    }

    setIsAuthenticating(true);
    setAuthStatus('in-progress');
    setError(null);

    try {
      // Use the provided document to trigger authentication
      const response = await fetch('http://localhost:8787/api/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 65678987654567887658'
        },
        body: JSON.stringify({
          target: testDocUrl,
          includeRaw: false,
          includeChars: false,
          download: false,
          logoutFirst: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Not signed into Google')) {
          setAuthStatus('in-progress');
          setError('Browser window opened for authentication. Please sign in to your Google account.');
        } else {
          throw new Error(errorData.error || 'Failed to initiate authentication');
        }
      } else {
        setAuthStatus('success');
        setError(null);
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setAuthStatus('in-progress');
        setError('Browser window opened for authentication. Please sign in to your Google account.');
      } else {
        setAuthStatus('failed');
        setError(err.message);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const testAuthentication = async () => {
    if (!testDocUrl.trim()) {
      setError('Please enter a Google Docs URL to test authentication');
      return;
    }

    try {
      const response = await fetch('http://localhost:8787/api/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 65678987654567887658'
        },
        body: JSON.stringify({
          target: testDocUrl,
          includeRaw: false,
          includeChars: false,
          download: false,
          logoutFirst: false
        })
      });

      if (response.ok) {
        setAuthStatus('success');
        setError(null);
        // Mark step 2 as completed
        setStepsCompletion(prev => ({ ...prev, step2: true }));
      } else {
        setAuthStatus('failed');
        setError('Authentication test failed. Please try authenticating again.');
      }
    } catch (err) {
      setAuthStatus('failed');
      setError('Authentication test failed. Please try authenticating again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/teamio')}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <IconArrowLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Prove Authentication</h1>
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

        {/* Authentication Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Google Authentication</h2>
          
          <div className="space-y-4">
            {/* Test Document Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Document URL
              </label>
              <input
                type="text"
                value={testDocUrl}
                onChange={(e) => setTestDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/1ABC... or just the document ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-1">
                Enter a Google Docs URL that you have access to for testing authentication
              </p>
            </div>
            {/* Authentication Status */}
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                authStatus === 'success' ? 'bg-green-500' :
                authStatus === 'in-progress' ? 'bg-yellow-500' :
                authStatus === 'failed' ? 'bg-red-500' :
                'bg-gray-300'
              }`}>
                {authStatus === 'success' && <IconCheck className="w-5 h-5 text-white" />}
                {authStatus === 'in-progress' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {authStatus === 'failed' && <span className="text-white text-sm font-bold">!</span>}
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  {authStatus === 'success' ? 'Authentication Successful' :
                   authStatus === 'in-progress' ? 'Authentication in Progress' :
                   authStatus === 'failed' ? 'Authentication Failed' :
                   'Not Authenticated'}
                </p>
                <p className="text-sm text-gray-600">
                  {authStatus === 'success' ? 'You can now scrape documents' :
                   authStatus === 'in-progress' ? 'Complete sign-in in the browser window' :
                   authStatus === 'failed' ? 'Please try authenticating again' :
                   'Click below to authenticate with Google'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {authStatus !== 'success' && (
                <button
                  onClick={startAuthentication}
                  disabled={serverStatus !== 'running' || isAuthenticating || !testDocUrl.trim()}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconExternalLink className="w-4 h-4 mr-2" />
                  {isAuthenticating ? 'Authenticating...' : 'Start Authentication'}
                </button>
              )}
              
              {authStatus === 'in-progress' && (
                <button
                  onClick={testAuthentication}
                  disabled={!testDocUrl.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Authentication
                </button>
              )}

              {authStatus === 'success' && (
                <button
                  onClick={() => navigate('/teamio/scrape')}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <IconExternalLink className="w-4 h-4 mr-2" />
                  Go to Scrape Documents
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">How to authenticate:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
            <li>Make sure the server is running (green status above)</li>
            <li>Enter a Google Docs URL that you have access to</li>
            <li>Click "Start Authentication" - a browser window will open</li>
            <li>Sign in to your Google account in the browser window</li>
            <li>Click "Test Authentication" to verify it worked</li>
            <li>Once successful, you can proceed to scrape documents</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ProveAuthPage;
