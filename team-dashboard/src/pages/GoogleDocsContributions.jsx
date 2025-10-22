import React, { useState, useEffect } from 'react';

const GoogleDocsContributions = ({ teamId, documentId }) => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (documentId) {
      fetchGoogleDocsContributions(documentId);
    }
  }, [documentId]);

  const fetchGoogleDocsContributions = async (docId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8787/api/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 65678987654567887658'
        },
        body: JSON.stringify({
          target: `https://docs.google.com/document/d/${docId}/edit`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Google Docs contributions');
      }

      const data = await response.json();
      if (data.tiles && Array.isArray(data.tiles)) {
        const transformedTiles = data.tiles.map(tile => ({
          id: `google-docs-${tile.id || Date.now()}`,
          net_id: tile.author,
          title: tile.title,
          tool: 'google_docs',
          timestamp: tile.timestamp || new Date().toISOString(),
          attributedTo: [tile.author],
          valuedBy: [],
          text: tile.text,
          wordCount: tile.wordCount,
          charCount: tile.charCount,
          stats: tile.stats
        }));
        setContributions(transformedTiles);
      } else {
        setContributions([]);
      }
    } catch (err) {
      console.error('Error fetching Google Docs contributions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading Google Docs contributions...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Error: {error}</div>;
  }

  if (!documentId) {
    return <div className="text-center text-gray-500">Enter a Google Doc ID to load contributions</div>;
  }

  return (
    <div className="space-y-4">
      {contributions.length === 0 ? (
        <div className="text-center text-gray-500">No contributions found for this document</div>
      ) : (
        contributions.map((contribution, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h3 className="font-semibold">{contribution.title}</h3>
            <p className="text-sm text-gray-600">By: {contribution.net_id}</p>
            <p className="text-sm text-gray-600">Words: {contribution.wordCount || 0}</p>
            <p className="text-sm text-gray-600">Characters: {contribution.charCount || 0}</p>
            {contribution.text && (
              <div className="mt-2">
                <p className="text-sm text-gray-700">{contribution.text.substring(0, 200)}...</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default GoogleDocsContributions;
