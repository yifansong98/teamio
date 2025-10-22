import React from 'react';

const ContributionsDisplay = ({ contributions, teamMembers, currentUser, onToggleAttribution, onValuedContribution }) => {
  return (
    <div className="space-y-4">
      {contributions.map((contribution, index) => (
        <div key={index} className="border rounded-lg p-4">
          <h3 className="font-semibold">{contribution.title}</h3>
          <p className="text-sm text-gray-600">By: {contribution.author}</p>
          <p className="text-sm text-gray-600">Tool: {contribution.tool}</p>
          <p className="text-sm text-gray-600">Date: {new Date(contribution.timestamp).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};

export default ContributionsDisplay;
