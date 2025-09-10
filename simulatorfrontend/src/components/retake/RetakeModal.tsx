import React, { useState } from 'react';
import { api } from '../../services/apiService';

interface RetakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle: string;
  previousSessionId?: string;
  onRetakeSuccess: (sessionId: string) => void;
}

const RetakeModal: React.FC<RetakeModalProps> = ({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  previousSessionId,
  onRetakeSuccess
}) => {
  const [retakeReason, setRetakeReason] = useState('');
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const improvementOptions = [
    'History Taking',
    'Risk Assessment', 
    'Differential Diagnosis',
    'Communication & Empathy',
    'Clinical Urgency',
    'Diagnosis Accuracy',
    'Overall Performance'
  ];

  const handleAreaToggle = (area: string) => {
    setImprovementAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleStartRetake = async () => {
    if (!retakeReason.trim()) {
      alert('Please provide a reason for retaking this case.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.startRetakeSimulation(
        caseId,
        previousSessionId,
        retakeReason,
        improvementAreas
      );
      
      onRetakeSuccess(response.sessionId);
      onClose();
    } catch (error) {
      console.error('Error starting retake:', error);
      alert('Failed to start retake. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold flex items-center space-x-2">
                <span>🔄</span>
                <span>Retake Case</span>
              </h3>
              <p className="text-blue-100 text-sm mt-1 font-medium">{caseTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white hover:bg-blue-800 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Why do you want to retake this case? *
            </label>
            <textarea
              value={retakeReason}
              onChange={(e) => setRetakeReason(e.target.value)}
              placeholder="e.g., Want to improve my diagnosis accuracy and clinical reasoning skills..."
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-500"
              rows={4}
              required
              aria-describedby="reason-help"
            />
            <p id="reason-help" className="text-xs text-gray-600 mt-2">
              Help us understand your learning goals for this retake session.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Areas you want to improve (optional):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {improvementOptions.map((area) => (
                <label key={area} className="flex items-start space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={improvementAreas.includes(area)}
                    onChange={() => handleAreaToggle(area)}
                    className="mt-0.5 rounded border-2 border-gray-400 text-blue-600 focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200"
                  />
                  <span className="text-sm font-medium text-gray-800 group-hover:text-blue-800 transition-colors duration-200">{area}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Select areas where you want focused learning recommendations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleStartRetake}
              disabled={isLoading || !retakeReason.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 font-bold flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Start Retake</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetakeModal;