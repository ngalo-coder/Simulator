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
  // Helper function to create a terse, focused title
  const getCleanTitle = () => {
    if (!case_.title) return "Clinical Case";
    
    // Remove common filler words and phrases
    const fillerWords = [
      'patient presenting with',
      'presenting with',
      'patient with',
      'case of',
      'evaluation of',
      'assessment of',
      'management of',
      'history of'
    ];
    
    let cleanTitle = case_.title;
    
    // Remove filler phrases
    fillerWords.forEach(phrase => {
      cleanTitle = cleanTitle.toLowerCase().replace(phrase.toLowerCase(), '').trim();
    });
    
    // Capitalize first letter of each word
    cleanTitle = cleanTitle.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // If the title is the same as chief complaint, create a focused title
    if (case_.chief_complaint && 
        cleanTitle.toLowerCase() === case_.chief_complaint.toLowerCase()) {
      if (case_.patient_age && case_.patient_gender) {
        return `${case_.patient_age}y ${case_.patient_gender}: ${cleanTitle}`;
      }
      return cleanTitle;
    }
    
    // Limit to 40 characters with ellipsis if needed
    return cleanTitle.length > 40 ? cleanTitle.substring(0, 37) + '...' : cleanTitle;
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
        text: 'text-medical-800',
        border: 'border-medical-200',
        icon: '🩺',
        gradient: 'from-medical-50 to-medical-100'
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
      text: 'text-medical-800',
      border: 'border-medical-200',
      icon: '🏥',
      gradient: 'from-medical-50 to-medical-100'
    };
  };

  return (
    <div data-testid="case-card" className="relative rounded-2xl shadow-xl border border-medical-200 bg-gradient-to-br from-medical-50 to-medical-100 group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-300 dark:border-blue-500/30 dark:from-blue-900/30 dark:to-blue-800/20">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-300 dark:opacity-10 dark:group-hover:opacity-20" style={{background: 'radial-gradient(circle at 80% 20%, #2196F3 0%, transparent 70%)'}} />

      <div className="relative p-6 flex flex-col min-h-[300px]">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-3">
          {/* Case Title */}
          <div className="flex-1 mr-2">
            <h3 className="text-lg font-bold text-gray-900 leading-tight dark:text-white">
              {getCleanTitle()}
            </h3>
          </div>
          
          {/* Completion Status Badge */}
          {case_.isCompleted && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/50">
                ✓
              </span>
            </div>
          )}
        </div>

        {/* Specialty Card */}
        <div className="bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center justify-end">
            {case_.specialty && (() => {
              const tagStyle = getSpecialtyTagStyle(case_.specialty);
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} border shadow-sm dark:bg-opacity-20 dark:border-opacity-30`}>
                  <span className="hidden xs:inline">{tagStyle.icon}</span>
                  <span className="dark:text-white">{case_.specialty}</span>
                </span>
              );
            })()}
          </div>
        </div>

        {/* Chief Complaint */}
        {case_.chief_complaint && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-3 mb-4 dark:bg-yellow-900/20 dark:border-yellow-600">
            <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-1 text-sm dark:text-yellow-200">
              <span>🟨</span>
              <span>Chief Complaint:</span>
            </div>
            <p className="text-yellow-900 text-sm leading-relaxed dark:text-yellow-100">{case_.chief_complaint}</p>
          </div>
        )}

        {/* Stats Section */}
        {case_.isCompleted && case_.bestScore && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-medical-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
              <div className="text-xs text-blue-600 dark:text-blue-300 font-medium">Best Score</div>
              <div className="text-lg font-bold text-medical-800 dark:text-blue-200">{case_.bestScore}%</div>
            </div>
            {case_.lastCompletedAt && (
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Last Taken</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {new Date(case_.lastCompletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons Section */}
        <div className="mt-auto space-y-2">
          {/* Start Simulation Button */}
          <button
            onClick={() => onStartSimulation(case_)}
            disabled={startingSimulation}
            className="w-full bg-gradient-to-r from-medical-500 to-medical-600 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg dark:from-blue-700 dark:to-blue-800 dark:hover:from-blue-800 dark:hover:to-blue-900 dark:focus:ring-blue-500 dark:focus:ring-offset-0"
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
              className="w-full bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-700 py-2.5 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-200 dark:hover:from-orange-800/40 dark:hover:to-orange-700/40 dark:focus:ring-orange-500 dark:focus:ring-offset-0"
            >
              <span>🔄</span>
              <span>Retake for Improvement</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseCard;