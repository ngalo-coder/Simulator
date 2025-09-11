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

  // Helper function to get specialty tag styling
  const getSpecialtyTagStyle = (specialty: string) => {
    const normalizedSpecialty = specialty.toLowerCase();
    
    const specialtyStyles: Record<string, {
      bg: string;
      text: string;
      border: string;
      icon: string;
      gradient: string;
    }> = {
      // Internal Medicine - Blue theme
      'internal medicine': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: '🩺',
        gradient: 'from-blue-50 to-blue-100'
      },
      // Cardiology - Red theme
      'cardiology': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: '❤️',
        gradient: 'from-red-50 to-red-100'
      },
      // Ophthalmology - Green theme
      'ophthalmology': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: '👁️',
        gradient: 'from-green-50 to-green-100'
      },
      // Neurology - Purple theme
      'neurology': {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200',
        icon: '🧠',
        gradient: 'from-purple-50 to-purple-100'
      },
      // Pediatrics - Pink theme
      'pediatrics': {
        bg: 'bg-pink-100',
        text: 'text-pink-800',
        border: 'border-pink-200',
        icon: '👶',
        gradient: 'from-pink-50 to-pink-100'
      },
      // Emergency Medicine - Orange theme
      'emergency medicine': {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        icon: '🚨',
        gradient: 'from-orange-50 to-orange-100'
      },
      // Surgery - Indigo theme
      'surgery': {
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        border: 'border-indigo-200',
        icon: '🔪',
        gradient: 'from-indigo-50 to-indigo-100'
      },
      // Radiology - Teal theme
      'radiology': {
        bg: 'bg-teal-100',
        text: 'text-teal-800',
        border: 'border-teal-200',
        icon: '📸',
        gradient: 'from-teal-50 to-teal-100'
      },
      // Laboratory - Cyan theme
      'laboratory': {
        bg: 'bg-cyan-100',
        text: 'text-cyan-800',
        border: 'border-cyan-200',
        icon: '🔬',
        gradient: 'from-cyan-50 to-cyan-100'
      },
      // Pharmacy - Emerald theme
      'pharmacy': {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        icon: '💊',
        gradient: 'from-emerald-50 to-emerald-100'
      },
      // Nursing - Rose theme
      'nursing': {
        bg: 'bg-rose-100',
        text: 'text-rose-800',
        border: 'border-rose-200',
        icon: '👩‍⚕️',
        gradient: 'from-rose-50 to-rose-100'
      },
      // Dermatology - Amber theme
      'dermatology': {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-200',
        icon: '🧴',
        gradient: 'from-amber-50 to-amber-100'
      },
      // Psychiatry - Violet theme
      'psychiatry': {
        bg: 'bg-violet-100',
        text: 'text-violet-800',
        border: 'border-violet-200',
        icon: '🧘',
        gradient: 'from-violet-50 to-violet-100'
      }
    };

    // Return specific style or default blue theme
    return specialtyStyles[normalizedSpecialty] || {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: '🏥',
      gradient: 'from-blue-50 to-blue-100'
    };
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
          {case_.specialty && (() => {
            const tagStyle = getSpecialtyTagStyle(case_.specialty);
            return (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} border shadow-sm`}>
                <span>{tagStyle.icon}</span>
                <span>{case_.specialty}</span>
              </span>
            );
          })()}
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
