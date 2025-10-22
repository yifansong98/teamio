import React, { useState, useEffect } from 'react';

const GoogleDocsContributions = ({ teamId, documentId }) => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedByKey, setExpandedByKey] = useState({});
  const [showTypedByKey, setShowTypedByKey] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const toggleExpanded = (tileKey) => {
    setExpandedByKey(prev => ({ ...prev, [tileKey]: !prev[tileKey] }));
  };

  const toggleShowTyped = (tileKey) => {
    setShowTypedByKey(prev => ({ ...prev, [tileKey]: !prev[tileKey] }));
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getAuthorColor = (author) => {
    // Simple color assignment based on author name
    const colors = ['bg-pink-500', 'bg-blue-500', 'bg-yellow-400', 'bg-teal-400', 'bg-purple-500', 'bg-orange-400'];
    const hash = author.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getAuthorInitials = (author) => {
    return author.split(' ').map(name => name.charAt(0)).join('').toUpperCase();
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text || '');
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {}
  };

  useEffect(() => {
    const fetchGoogleDocsContributions = async () => {
      if (!teamId || !documentId) {
        setContributions([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch Google Docs data from the scraping API
        const response = await fetch('http://localhost:8787/api/replay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 65678987654567887658'
          },
          body: JSON.stringify({
            target: documentId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch Google Docs contributions');
        }

        const data = await response.json();
        if (data.tiles && Array.isArray(data.tiles)) {
          setContributions(data.tiles);
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

    fetchGoogleDocsContributions();
  }, [teamId, documentId]);

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading Google Docs contributions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        Error loading Google Docs contributions: {error}
      </div>
    );
  }

  if (!documentId) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No Google Docs document selected.</p>
        <p className="text-sm mt-2">Enter a Google Doc ID above and click "Load" to view contributions.</p>
      </div>
    );
  }

  if (!contributions || contributions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {loading ? "Loading Google Docs contributions..." : "No Google Docs contributions found for the selected document."}
      </div>
    );
  }

  

  return (
    <div className="space-y-4">
      {contributions.map((tile, index) => {
        const tileKey = tile.googleTile?.revisionMac || tile.id || `${tile.start}-${tile.end}-${index}`;
        const isExpanded = !!expandedByKey[tileKey];
        const cleanedText = String(tile.text || '')
          .replace(/\[Edits:[^\]]+\]/gi, '')
          .replace(/\(\s*[+-]?\d+\s+chars?\s+(?:inserted|deleted)[^)]*\)/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        const hasText = cleanedText.length > 0;
        const hasTypedHistory = Array.isArray(tile.typedHistory?.frames) && tile.typedHistory.frames.length > 0;
        const showTyped = !!showTypedByKey[tileKey] && hasTypedHistory;
        const wordCount = tile.wordCount || 0;
        const charCount = tile.charCount || 0;
        const titleHasUtc = typeof tile.title === 'string' && /Contribution\s+—\s+\d{4}-\d{2}-\d{2}/.test(tile.title);
        const displayTitle = titleHasUtc && tile.timestamp
          ? `Contribution — ${new Date(tile.timestamp).toLocaleString()}`
          : tile.title;

        

        return (
          <div key={tileKey} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            {/* Tile Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 min-h-12 flex-nowrap">
                <div className="flex items-center gap-3 min-w-0 flex-1 flex-nowrap">
                  {/* Author Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow ${getAuthorColor(tile.author)}`}>
                    {getAuthorInitials(tile.author)}
                  </div>
                  
                  {/* Tile Info - single horizontal row */}
                  <div className="flex items-center gap-2 min-w-0 flex-nowrap">
                    <h3 className="font-semibold text-gray-800 leading-tight truncate" title={displayTitle}>{displayTitle}</h3>
                    {wordCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                        {wordCount} words
                      </span>
                    )}
                    {charCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                        {charCount} chars
                      </span>
                    )}
                    <span className="text-xs text-gray-500 whitespace-nowrap">By {tile.author}{tile.timestamp ? ` on ${formatDate(tile.timestamp)}` : ''}</span>
                  </div>
                </div>

                {/* Chevron only */}
                <button
                  onClick={() => hasText && toggleExpanded(tileKey)}
                  className={`p-2 rounded-full transition-colors shrink-0 ml-auto self-center ${hasText ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'}`}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && hasText && (
              <div className="px-0 pb-0 bg-transparent">
                <div className="bg-white rounded-b-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h4 className="font-medium text-gray-800">Contribution Text</h4>
                    <div className="flex items-center gap-2">
                      {hasTypedHistory && (
                        <button
                          onClick={() => toggleShowTyped(tileKey)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border ${showTyped ? 'border-blue-300 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                          title={showTyped ? 'Show reconstructed text' : 'Show typed history'}
                        >
                          {showTyped ? 'Typed: ON' : 'Typed: OFF'}
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(tile.text, tile.id || index)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        {copiedId === (tile.id || index) ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none">
                      {showTyped ? (
                        <div className="space-y-2">
                          {tile.typedHistory.frames.map((f, i) => (
                            <div key={i} className="text-sm">
                              <div className="text-[11px] text-gray-500 mb-1">{new Date(f.ts).toLocaleString()}</div>
                              <div className="rounded-md border border-gray-100 bg-gray-50 p-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: f.html }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed bg-gray-50 rounded-md p-3 border border-gray-100 w-full">{cleanedText}</pre>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{wordCount} words</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{charCount} chars</span>
                      {tile.stats && (
                        <>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{tile.stats.totalWords || 0} total words</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">{tile.stats.totalChars || 0} total chars</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Text Message (only when expanded) */}
            {isExpanded && !hasText && (
              <div className="p-4 bg-gray-50 text-center text-gray-500 text-sm">
                No text content available for this contribution.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GoogleDocsContributions;
