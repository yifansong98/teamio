import React, { useState } from 'react';

const ContributionsDisplay = ({ contributions, teamMembers, currentUser }) => {
  const [expandedTiles, setExpandedTiles] = useState(new Set());

  const toggleExpanded = (tileId) => {
    const newExpanded = new Set(expandedTiles);
    if (newExpanded.has(tileId)) {
      newExpanded.delete(tileId);
    } else {
      newExpanded.add(tileId);
    }
    setExpandedTiles(newExpanded);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getAuthorColor = (author) => {
    // Find the team member by name
    const member = Object.values(teamMembers).find(m => m.net_id === author);
    return member ? member.color : 'bg-gray-500';
  };

  const getAuthorInitials = (author) => {
    // Find the team member by name
    const member = Object.values(teamMembers).find(m => m.net_id === author);
    return member ? member.initials : author.charAt(0).toUpperCase();
  };

  if (!contributions || contributions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No contributions found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contributions.map((tile, index) => {
        const isExpanded = expandedTiles.has(tile.id || index);
        const hasText = tile.text && tile.text.trim().length > 0;
        const wordCount = tile.wordCount || 0;
        const charCount = tile.charCount || 0;

        return (
          <div key={tile.id || index} className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Tile Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Author Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAuthorColor(tile.author)}`}>
                    {getAuthorInitials(tile.author)}
                  </div>
                  
                  {/* Tile Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{tile.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>By {tile.author}</span>
                      {tile.timestamp && (
                        <span>on {formatDate(tile.timestamp)}</span>
                      )}
                      {wordCount > 0 && (
                        <span>{wordCount} words</span>
                      )}
                      {charCount > 0 && (
                        <span>{charCount} characters</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Button - always show */}
                <button
                  onClick={() => toggleExpanded(tile.id || index)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
            {isExpanded && (
              <div className="p-4 bg-gray-50">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3">Contribution Text:</h4>
                  <div className="prose prose-sm max-w-none">
                    {hasText ? (
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                        {tile.text}
                      </pre>
                    ) : (
                      <div className="text-gray-500 italic">No text content available for this contribution.</div>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-800">{wordCount}</div>
                        <div className="text-gray-600">Words</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-800">{charCount}</div>
                        <div className="text-gray-600">Characters</div>
                      </div>
                      {tile.stats && (
                        <>
                          <div className="text-center">
                            <div className="font-semibold text-gray-800">{tile.stats.totalWords || 0}</div>
                            <div className="text-gray-600">Total Words</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-800">{tile.stats.totalChars || 0}</div>
                            <div className="text-gray-600">Total Chars</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Text Message */}
            {!hasText && (
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

export default ContributionsDisplay;
