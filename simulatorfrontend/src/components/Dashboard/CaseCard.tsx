import React from 'react';
import { Link } from 'react-router-dom';
import { Case } from '../../types';

interface CaseCardProps {
  caseItem: Case;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900">{caseItem.case_metadata.title}</h3>
      <p className="mt-2 text-sm text-gray-600">{caseItem.description}</p>
      <div className="mt-4">
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
          {caseItem.case_metadata.specialty}
        </span>
        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
          {caseItem.case_metadata.difficulty}
        </span>
      </div>
      <div className="mt-4">
        <Link to={`/simulation/${caseItem._id}`} className="text-blue-600 hover:text-blue-800 font-medium">
          Start Simulation →
        </Link>
      </div>
    </div>
  );
};