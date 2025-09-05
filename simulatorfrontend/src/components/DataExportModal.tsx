import React, { useState } from 'react';
import { apiService } from '../services/apiService';;

interface DataExportModalProps {
  onClose: () => void;
}

const DataExportModal: React.FC<DataExportModalProps> = ({ onClose }) => {
  // const { user } = useAuth(); // Not needed for current implementation
  const [exportType, setExportType] = useState<'all' | 'progress' | 'sessions' | 'profile'>('all');
  const [format, setFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [loading, setLoading] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Call the real API
      const exportData = await apiService.exportUserData(exportType, format);
      
      // Create download
      let dataStr: string;
      let mimeType: string;
      
      if (format === 'json') {
        dataStr = typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
      } else if (format === 'csv') {
        dataStr = typeof exportData === 'string' ? exportData : JSON.stringify(exportData);
        mimeType = 'text/csv';
      } else {
        dataStr = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
      }
      
      const dataBlob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `simuatech-data-export-${exportType}-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportComplete(true);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getExportDescription = (type: string) => {
    switch (type) {
      case 'all':
        return 'Complete data export including profile, progress, sessions, and privacy settings';
      case 'progress':
        return 'Your learning progress, scores, and performance metrics';
      case 'sessions':
        return 'Detailed session logs and interaction history';
      case 'profile':
        return 'Profile information and account settings';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Your Data</h2>
            <p className="text-sm text-gray-600 mt-1">Download a copy of your Simuatech data</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {exportComplete ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-500 text-2xl">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Complete!</h3>
              <p className="text-gray-600">Your data has been downloaded to your device.</p>
            </div>
          ) : (
            <>
              {/* Export Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">What to export:</label>
                <div className="space-y-3">
                  {[
                    { value: 'all', label: 'All Data', icon: '📦' },
                    { value: 'progress', label: 'Progress & Scores', icon: '📊' },
                    { value: 'sessions', label: 'Session History', icon: '📝' },
                    { value: 'profile', label: 'Profile Only', icon: '👤' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="exportType"
                        value={option.value}
                        checked={exportType === option.value}
                        onChange={(e) => setExportType(e.target.value as any)}
                        className="mr-3 text-blue-600"
                      />
                      <div className="flex items-center">
                        <span className="mr-2">{option.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600">{getExportDescription(option.value)}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Format:</label>
                <div className="flex space-x-4">
                  {[
                    { value: 'json', label: 'JSON', description: 'Machine readable' },
                    { value: 'csv', label: 'CSV', description: 'Spreadsheet format' },
                    { value: 'pdf', label: 'PDF', description: 'Human readable' }
                  ].map((option) => (
                    <label key={option.value} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value={option.value}
                        checked={format === option.value}
                        onChange={(e) => setFormat(e.target.value as any)}
                        className="sr-only"
                      />
                      <div className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        format === option.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400">🔒</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Privacy Notice</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your exported data will only include information you have access to. 
                      Sensitive system data and other users' information are never included.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {!exportComplete && 'Export will begin immediately'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {exportComplete ? 'Close' : 'Cancel'}
            </button>
            {!exportComplete && (
              <button
                onClick={handleExport}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Exporting...
                  </div>
                ) : (
                  'Export Data'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExportModal;