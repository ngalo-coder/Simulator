import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';

interface PrivacySettings {
  showInLeaderboard: boolean;
  showRealName: boolean;
  shareProgressWithEducators: boolean;
  allowAnonymousAnalytics: boolean;
  dataRetentionPeriod: 'forever' | '1year' | '2years' | '5years';
  profileVisibility: 'public' | 'educators' | 'private';
}

interface PrivacySettingsProps {
  onClose: () => void;
}

const PrivacySettingsModal: React.FC<PrivacySettingsProps> = ({ onClose }) => {
  // const { user } = useAuth(); // Not needed for current implementation
  const [settings, setSettings] = useState<PrivacySettings>({
    showInLeaderboard: true,
    showRealName: false,
    shareProgressWithEducators: true,
    allowAnonymousAnalytics: true,
    dataRetentionPeriod: '2years',
    profileVisibility: 'educators'
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const response = await api.getPrivacySettings();
      setSettings({
        showInLeaderboard: response.showInLeaderboard,
        showRealName: response.showRealName,
        shareProgressWithEducators: response.shareProgressWithEducators,
        allowAnonymousAnalytics: response.allowAnonymousAnalytics,
        dataRetentionPeriod: response.dataRetentionPeriod,
        profileVisibility: response.profileVisibility
      });
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      // Keep default settings if fetch fails
    }
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await api.updatePrivacySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      alert('Failed to save privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.'
    );
    
    if (confirmed) {
      const doubleConfirmed = window.confirm(
        'This is your final warning. Deleting your account will permanently remove:\n\n' +
        '• Your profile and account information\n' +
        '• All your progress and performance data\n' +
        '• Your session history and interactions\n' +
        '• Your privacy settings\n\n' +
        'Are you absolutely sure you want to proceed?'
      );
      
      if (doubleConfirmed) {
        try {
          setLoading(true);
          await api.requestAccountDeletion();
          alert('Your account has been successfully deleted. You will be logged out now.');
          
          // Clear local storage and redirect to home
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          window.location.href = '/';
        } catch (error) {
          console.error('Error deleting account:', error);
          alert('Failed to delete account. Please try again or contact support.');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Privacy & Security Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Control how your data is used and displayed</p>
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
          {/* Leaderboard Privacy */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🏆</span>
              Leaderboard Privacy
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Show in Leaderboard</label>
                  <p className="text-sm text-gray-600">Allow your performance to appear in public leaderboards</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showInLeaderboard}
                    onChange={(e) => handleSettingChange('showInLeaderboard', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Show Real Name</label>
                  <p className="text-sm text-gray-600">Display your real name instead of username in leaderboards</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showRealName}
                    onChange={(e) => handleSettingChange('showRealName', e.target.checked)}
                    className="sr-only peer"
                    disabled={!settings.showInLeaderboard}
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!settings.showInLeaderboard ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
            </div>
          </div>

          {/* Progress Sharing */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📊</span>
              Progress Sharing
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Share with Educators</label>
                  <p className="text-sm text-gray-600">Allow educators to view your detailed progress and performance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.shareProgressWithEducators}
                    onChange={(e) => handleSettingChange('shareProgressWithEducators', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-2">Profile Visibility</label>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="public">Public - Anyone can view</option>
                  <option value="educators">Educators Only - Only educators can view</option>
                  <option value="private">Private - Only you can view</option>
                </select>
                <p className="text-sm text-gray-600 mt-1">Controls who can see your detailed profile and progress</p>
              </div>
            </div>
          </div>

          {/* Data & Analytics */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🔒</span>
              Data & Analytics
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">Anonymous Analytics</label>
                  <p className="text-sm text-gray-600">Allow anonymous usage data to help improve the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowAnonymousAnalytics}
                    onChange={(e) => handleSettingChange('allowAnonymousAnalytics', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-2">Data Retention Period</label>
                <select
                  value={settings.dataRetentionPeriod}
                  onChange={(e) => handleSettingChange('dataRetentionPeriod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="forever">Keep Forever</option>
                  <option value="5years">5 Years</option>
                  <option value="2years">2 Years (Recommended)</option>
                  <option value="1year">1 Year</option>
                </select>
                <p className="text-sm text-gray-600 mt-1">How long to keep your detailed performance data</p>
              </div>
            </div>
          </div>

          {/* Data Rights */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">⚖️</span>
              Your Data Rights
            </h3>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>You can request a copy of all your data at any time</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>You can delete your account and all associated data</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Your data is encrypted and stored securely</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>We never sell your personal information to third parties</span>
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button 
                onClick={() => {
                  // This would open the data export modal
                  alert('Data export functionality is available from the dashboard.');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Download My Data
              </button>
              <button 
                onClick={handleAccountDeletion}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {saved && (
              <span className="text-green-600 font-medium">✓ Settings saved successfully</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsModal;