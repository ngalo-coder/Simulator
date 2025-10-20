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
  // Helper function to generate a patient name
  const getPatientName = () => {
    // Generate a realistic patient name based on case characteristics
    const firstNames = {
      male: ['John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles'],
      female: ['Mary', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy']
    };

    const lastNames = ['Onyango', 'Wanjiku', 'Kiprotich', 'Achieng', 'Mwangi', 'Wanjala', 'Odhiambo', 'Nyambura', 'Koech', 'Cheruiyot'];

    let gender = 'neutral';
    if (case_.patient_gender) {
      gender = case_.patient_gender.toLowerCase();
    }

    // Select first name based on gender
    let firstName;
    if (gender === 'male' && firstNames.male) {
      firstName = firstNames.male[Math.floor(Math.random() * firstNames.male.length)];
    } else if (gender === 'female' && firstNames.female) {
      firstName = firstNames.female[Math.floor(Math.random() * firstNames.female.length)];
    } else {
      // Neutral or unknown gender - pick randomly
      const allFirstNames = [...firstNames.male, ...firstNames.female];
      firstName = allFirstNames[Math.floor(Math.random() * allFirstNames.length)];
    }

    // Select last name
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${firstName} ${lastName}`;
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
    <div
      data-testid="case-card"
      role="group"
      aria-label={case_.title || 'Clinical case card'}
      tabIndex={0}
      className="relative rounded-2xl shadow-lg border border-gray-200 bg-white group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-500 flex flex-col h-full"
      onKeyDown={(e) => {
        if (e.key === 'Enter') onStartSimulation(case_);
      }}
    >
      {/* Enhanced decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-purple-100 opacity-30 group-hover:opacity-40 transition-opacity duration-300 rounded-full transform translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100 to-pink-100 opacity-20 group-hover:opacity-30 transition-opacity duration-300 rounded-full transform -translate-x-12 translate-y-12"></div>

      <div className="relative p-4 sm:p-6 flex flex-col flex-grow">
        {/* Enhanced Header Section */}
        <div className="mb-6">
          {/* Patient Name as Primary Title */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 leading-tight dark:text-white line-clamp-2 group-hover:text-blue-900 transition-colors duration-200">
              {getPatientName()}
            </h3>
          </div>

          {/* Patient Information Card */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Patient Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                {/* Patient Details */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {case_.patient_age && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Age:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{case_.patient_age} years</span>
                    </div>
                  )}
                  {case_.patient_gender && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Gender:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{case_.patient_gender}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Completion Status Badge */}
              {case_.isCompleted && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/50">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Completed
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Specialty Badge */}
        <div className="mb-6">
          {case_.specialty && (() => {
            const tagStyle = getSpecialtyTagStyle(case_.specialty);
            return (
              <div className="inline-flex items-center gap-2">
                <div className={`w-8 h-8 ${tagStyle.bg} rounded-lg flex items-center justify-center shadow-sm`}>
                  <span className="text-sm">{tagStyle.icon}</span>
                </div>
                <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} border shadow-sm`}>
                  {case_.specialty}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Enhanced Chief Complaint */}
        {case_.chief_complaint && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700/50 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-200 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-amber-800 dark:text-amber-200">Chief Complaint</span>
                </div>
                <p className="text-amber-900 text-sm leading-relaxed dark:text-amber-100 line-clamp-4">{case_.chief_complaint}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Section */}
        {case_.isCompleted && (case_.bestScore || case_.lastCompletedAt) && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Performance Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {case_.bestScore && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 font-medium">Best Score</div>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{case_.bestScore}%</div>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              {case_.lastCompletedAt && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700/50 dark:to-slate-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Last Completed</div>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {new Date(case_.lastCompletedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-slate-200 dark:from-gray-600 dark:to-slate-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Buttons Section */}
        <div className="mt-auto space-y-3">
          {/* Start Simulation Button */}
          <button
            onClick={() => onStartSimulation(case_)}
            disabled={startingSimulation}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl group/btn"
          >
            {startingSimulation ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Starting Simulation...</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 8a9 9 0 110-18 9 9 0 010 18z" />
                  </svg>
                </div>
                <span>{case_.isCompleted ? 'Start New Attempt' : 'Start Simulation'}</span>
              </>
            )}
          </button>

          {/* Retake Button */}
          {case_.isCompleted && (
            <button
              onClick={() => onRetake(case_)}
              disabled={startingSimulation}
              className="w-full bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 disabled:from-gray-100 disabled:to-gray-200 text-amber-800 disabled:text-gray-500 py-3 px-6 rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg border border-amber-200 hover:border-amber-300"
            >
              <div className="w-5 h-5 bg-amber-200 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span>Retake for Improvement</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseCard;