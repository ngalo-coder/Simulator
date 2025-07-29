// ai-patient-sim-frontend/src/components/UserProgressionDashboard.js
// Example component showing how to use the new user management features
import React, { useState, useEffect } from 'react';
import { userManagementAPI } from '../utils/userManagementApi';
import { authAPI } from '../utils/api'; // Existing API still works
import { User, Award, TrendingUp, Clock } from 'lucide-react';

const UserProgressionDashboard = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [progressionReqs, setProgressionReqs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load extended profile (NEW - doesn't break existing)
      const profileResponse = await userManagementAPI.getExtendedProfile();
      setUserProfile(profileResponse.user);

      // Load permissions (NEW)
      const permissionsResponse = await userManagementAPI.getUserPermissions();
      setPermissions(permissionsResponse.permissions);

      // Load progression requirements (NEW)
      const progressionResponse = await userManagementAPI.getProgressionRequirements();
      setProgressionReqs(progressionResponse);

      // Existing authAPI.getProfile() still works unchanged
      // const basicProfile = await authAPI.getProfile();
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestProgression = async () => {
    try {
      if (!progressionReqs?.nextRole) return;
      
      const response = await userManagementAPI.requestRoleTransition(
        progressionReqs.nextRole,
        'Ready for advancement based on performance'
      );
      
      if (response.success) {
        alert('Progression request submitted successfully!');
        loadUserData(); // Refresh data
      }
    } catch (error) {
      console.error('Error requesting progression:', error);
      alert('Failed to request progression');
    }
  };

  const checkAutoProgression = async () => {
    try {
      const response = await userManagementAPI.checkAutoProgression();
      
      if (response.eligible && response.newRole) {
        alert(`Congratulations! You've been automatically promoted to ${response.newRole}`);
        loadUserData(); // Refresh data
      } else {
        alert('Not yet eligible for automatic progression');
      }
    } catch (error) {
      console.error('Error checking auto progression:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <User className="h-12 w-12 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">
              {userProfile?.profile?.firstName} {userProfile?.profile?.lastName}
            </h2>
            <p className="text-gray-600">
              {userProfile?.extendedProfile?.enhancedRole?.roleType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            <p className="text-sm text-gray-500">
              Level {userProfile?.extendedProfile?.enhancedRole?.level} • 
              {userProfile?.extendedProfile?.academicProfile?.institution?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </div>
      </div>

      {/* Progression Status */}
      {progressionReqs && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Progression Status
            </h3>
            <div className="space-x-2">
              <button
                onClick={checkAutoProgression}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Check Auto Progression
              </button>
              {progressionReqs.nextRole && (
                <button
                  onClick={handleRequestProgression}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Request Advancement
                </button>
              )}
            </div>
          </div>

          {progressionReqs.nextRole ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Next Role: <span className="font-medium">{progressionReqs.nextRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Simulations</p>
                  <p className="text-lg font-semibold">
                    {progressionReqs.currentProgress?.simulationsCompleted || 0} / {progressionReqs.requirements?.simulationsRequired || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-lg font-semibold">
                    {progressionReqs.currentProgress?.currentAverageScore || 0}% / {progressionReqs.requirements?.averageScoreRequired || 0}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Competencies</p>
                  <p className="text-lg font-semibold">
                    {progressionReqs.currentProgress?.competenciesAchieved?.length || 0} / {progressionReqs.requirements?.competenciesRequired?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">You are at the highest available level for your program.</p>
          )}
        </div>
      )}

      {/* Permissions & Access */}
      {permissions && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold flex items-center mb-4">
            <Award className="h-5 w-5 mr-2" />
            Current Access & Permissions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Simulation Access</h4>
              <ul className="space-y-1">
                {permissions.simulationAccess?.map((access, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {access.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Competency Levels</h4>
              <div className="space-y-2">
                {Object.entries(permissions.competencyLevels || {}).map(([skill, level]) => (
                  <div key={skill} className="flex justify-between text-sm">
                    <span className="capitalize">{skill.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      level === 'expert' ? 'bg-green-100 text-green-800' :
                      level === 'proficient' ? 'bg-blue-100 text-blue-800' :
                      level === 'competent' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProgressionDashboard;