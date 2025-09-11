import React from 'react';

interface Case {
  id: string;
  title: string;
  description: string;
  specialty?: string;
  patient_age?: number;
  patient_gender?: string;
  chief_complaint?: string;
  isCompleted?: boolean;
  bestScore?: number;
  lastCompletedAt?: string;
}

interface CaseCardProps {
  case_: Case;
  onStartSimulation: (case_: Case) => void;
  onRetake: (case_: Case) => void;
  startingSimulation: boolean;
}


const CaseCard: React.FC<CaseCardProps> = ({ case_, onStartSimulation, onRetake, startingSimulation }) => {
  // Helper function to clean up the title if it's duplicated in chief complaint
  const getCleanTitle = () => {
    if (!case_.chief_complaint) return case_.title;
    
    // If title is the same as chief complaint, use a generic title
    const titleLower = case_.title?.toLowerCase();
    const complaintLower = case_.chief_complaint?.toLowerCase();
    
    if (titleLower === complaintLower || 
        titleLower?.includes(complaintLower) || 
        complaintLower?.includes(titleLower)) {
      // Extract a more meaningful title or use specialty-based title
      if (case_.specialty) {
        return `${case_.specialty} Case`;
      }
      return "Clinical Case";
    }
    
    return case_.title;
  };

  return (
    <div className="relative rounded-2xl shadow-xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-blue-100/60 group overflow-hidden transition-all duration-200 hover:shadow-2xl hover:border-blue-300">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-300" style={{background: 'radial-gradient(circle at 80% 20%, #60a5fa33 0%, transparent 70%)'}} />

      <div className="relative p-6 flex flex-col min-h-[280px]">
        {/* Completion Status Badge */}
        {case_.isCompleted && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
              ✓ Completed
            </span>
            {case_.bestScore && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                💯 {case_.bestScore}%
              </span>
            )}
          </div>
        )}

        {/* Case Title */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {getCleanTitle()}
          </h3>
        </div>

        {/* Patient Info & Specialty Row */}
        <div className="flex items-center gap-3 mb-4 text-sm">
          {case_.patient_age && case_.patient_gender && (
            <span className="flex items-center gap-1.5 text-gray-700 font-medium">
              <span>👤</span>
              <span>{case_.patient_age}y {case_.patient_gender}</span>
            </span>
          )}
          {case_.patient_age && case_.patient_gender && case_.specialty && (
            <span className="text-gray-400">|</span>
          )}
          {case_.specialty && (
            <span className="flex items-center gap-1.5 text-blue-700 font-medium">
              <span>🏥</span>
              <span>{case_.specialty}</span>
            </span>
          )}
        </div>

        {/* Chief Complaint */}
        {case_.chief_complaint && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-1 text-sm">
              <span>🟨</span>
              <span>Chief Complaint:</span>
            </div>
            <p className="text-yellow-900 text-sm leading-relaxed">{case_.chief_complaint}</p>
          </div>
        )}

        {/* Description (only if no chief complaint and different from title) */}
        {case_.description && !case_.chief_complaint && 
         case_.description.toLowerCase() !== case_.title?.toLowerCase() && (
          <div className="text-gray-700 text-sm mb-4 line-clamp-2">
            {case_.description}
          </div>
        )}

        {/* Buttons Section */}
        <div className="mt-auto space-y-2">
          {/* Start Simulation Button */}
          <button
            onClick={() => onStartSimulation(case_)}
            disabled={startingSimulation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            {startingSimulation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Starting...</span>
              </>
            ) : (
              <>
                <span className="text-lg">🔵</span>
                <span>{case_.isCompleted ? 'Start New Attempt' : 'Start Simulation'}</span>
              </>
            )}
          </button>

          {/* Retake Button */}
          {case_.isCompleted && (
            <button
              onClick={() => onRetake(case_)}
              disabled={startingSimulation}
              className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 py-2.5 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow"
            >
              <span>🔄</span>
              <span>Retake for Improvement</span>
            </button>
          )}
        </div>

        {/* Footer: Last completed date */}
        {case_.lastCompletedAt && (
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <span>⏰</span>
            <span>Last completed: {new Date(case_.lastCompletedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseCard;
