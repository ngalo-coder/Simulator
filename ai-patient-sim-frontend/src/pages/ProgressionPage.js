// ai-patient-sim-frontend/src/pages/ProgressionPage.js
// Dedicated page for user progression and role management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userManagementAPI } from '../utils/userManagementApi';
import { 
  ArrowLeft, 
  User, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProgressionPage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [progressionReqs, setProgressionReqs] = useState(null);
  const [transitionHistory, setTransitionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadProgressionData();
  }, []);

  const loadProgressionData = async () => {
    try {
      setLoading(true);
      
      const [profileResponse, permissionsResponse, progressionResponse, historyResponse] = await Promise.all([
        userManagementAPI.getExtendedProfile(),
        userManagementAPI.getUserPermissions(),
        userManagementAPI.getProgressionRequirements(),
        userManagementAPI.getTransitionHistory()
      ]);

      if (profileResponse.success) setUserProfile(profileResponse.user);
      if (permissionsResponse.success) setPermissions(permissionsResponse.permissions);
      if (progressionResponse.success) setProgressionReqs(progressionResponse);
      if (historyResponse.success) setTransitionHistory(historyResponse.transitions || []);

    } catch (error) {
      console.error('Error loading progression data:', error);
      toast.error('Failed to load progression data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestProgression = async () => {
    if (!progressionReqs?.nextRole) return;
    
    try {
      setRequesting(true);
      const response = await userManagementAPI.requestRoleTransition(
        progressionReqs.nextRole,
        'Ready for advancement based on performance metrics'
      );
      
      if (response.success) {
        toast.success('Progression request submitted successfully!');
        loadProgressionData(); // Refresh data
      } else {
        toast.error(response.error || 'Failed to request progression');
      }
    } catch (error) {
      console.error('Error requesting progression:', error);
      toast.error('Failed to request progression');
    } finally {
      setRequesting(false);
    }
  };

  const handleCheckAutoProgression = async () => {
    try {
      const response = await userManagementAPI.checkAutoProgression();
      
      if (response.eligible && response.newRole) {
        toast.success(`Congratulations! You've been automatically promoted to ${response.newRole.replace(/_/g, ' ')}`);
        loadProgressionData(); // Refresh data
      } else if (response.eligible === false) {
        toast.info('Not yet eligible for automatic progression');
      } else {
        toast.info('No automatic progression available');
      }
    } catch (error) {
      console.error('Error checking auto progression:', error);
      toast.error('Failed to check automatic progression');
    }
  };

  const getProgressPercentage = () => {
    if (!progressionReqs?.requirements) return 0;
    
    const simProgress = Math.min(100, ((progressionReqs.currentProgress?.simulationsCompleted || 0) / (progressionReqs.requirements.simulationsRequired || 1)) * 100);
    const scoreProgress = Math.min(100, ((progressionReqs.currentProgress?.currentAverageScore || 0) / (progressionReqs.requirements.averageScoreRequired || 1)) * 100);
    const compProgress = Math.min(100, ((progressionReqs.currentProgress?.competenciesAchieved?.length || 0) / (progressionReqs.requirements.competenciesRequired?.length || 1)) * 100);
    
    return Math.round((simProgress + scoreProgress + compProgress) / 3);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Academic Progression</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCheckAutoProgression}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                Check Auto Progression
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Status */}
        {userProfile && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {userProfile.profile?.firstName} {userProfile.profile?.lastName}
                </h2>
                <p className="text-lg text-gray-600">
                  {userProfile.extendedProfile?.enhancedRole?.roleType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>Level {userProfile.extendedProfile?.enhancedRole?.level}</span>
                  <span>•</span>
                  <span>Year {userProfile.extendedProfile?.academicProfile?.currentYear}</span>
                  <span>•</span>
                  <span>{userProfile.extendedProfile?.academicProfile?.institution?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              </div>
            </div>

            {/* Competency Levels */}
            {permissions?.competencyLevels && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Competency Levels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(permissions.competencyLevels).map(([skill, level]) => (
                    <div key={skill} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                        level === 'expert' ? 'bg-green-100 text-green-600' :
                        level === 'proficient' ? 'bg-blue-100 text-blue-600' :
                        level === 'competent' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <Award className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium capitalize">{skill.replace(/_/g, ' ')}</p>
                      <p className={`text-xs capitalize ${
                        level === 'expert' ? 'text-green-600' :
                        level === 'proficient' ? 'text-blue-600' :
                        level === 'competent' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {level}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progression Requirements */}
        {progressionReqs && progressionReqs.nextRole && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
                  Next Level: {progressionReqs.nextRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <p className="text-gray-600 mt-1">
                  Overall Progress: {getProgressPercentage()}% Complete
                </p>
              </div>
              <button
                onClick={handleRequestProgression}
                disabled={requesting || getProgressPercentage() < 80}
                className={`px-6 py-3 rounded-md font-medium ${
                  getProgressPercentage() >= 80 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } ${requesting ? 'opacity-50' : ''}`}
              >
                {requesting ? 'Requesting...' : 'Request Advancement'}
              </button>
            </div>

            {/* Progress Bars */}
            <div className="space-y-6">
              {/* Simulations */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Simulations Completed</span>
                  <span className="text-sm text-gray-500">
                    {progressionReqs.currentProgress?.simulationsCompleted || 0} / {progressionReqs.requirements?.simulationsRequired || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min(100, ((progressionReqs.currentProgress?.simulationsCompleted || 0) / (progressionReqs.requirements?.simulationsRequired || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Average Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Average Score</span>
                  <span className="text-sm text-gray-500">
                    {progressionReqs.currentProgress?.currentAverageScore || 0}% / {progressionReqs.requirements?.averageScoreRequired || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min(100, ((progressionReqs.currentProgress?.currentAverageScore || 0) / (progressionReqs.requirements?.averageScoreRequired || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Competencies */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Competencies Achieved</span>
                  <span className="text-sm text-gray-500">
                    {progressionReqs.currentProgress?.competenciesAchieved?.length || 0} / {progressionReqs.requirements?.competenciesRequired?.length || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.min(100, ((progressionReqs.currentProgress?.competenciesAchieved?.length || 0) / (progressionReqs.requirements?.competenciesRequired?.length || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transition History */}
        {transitionHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-gray-600" />
              Progression History
            </h3>
            <div className="space-y-4">
              {transitionHistory.slice(0, 5).map((transition, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transition.approval?.status === 'approved' ? 'bg-green-100 text-green-600' :
                      transition.approval?.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {transition.approval?.status === 'approved' ? <CheckCircle className="h-5 w-5" /> :
                       transition.approval?.status === 'pending' ? <Clock className="h-5 w-5" /> :
                       <AlertCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transition.transitionDetails?.fromRole?.replace(/_/g, ' ')} → {transition.transitionDetails?.toRole?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transition.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    transition.approval?.status === 'approved' ? 'bg-green-100 text-green-800' :
                    transition.approval?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transition.approval?.status || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressionPage;