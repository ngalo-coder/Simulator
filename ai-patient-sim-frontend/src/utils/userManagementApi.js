// ai-patient-sim-frontend/src/utils/userManagementApi.js
// EXTENDS existing authAPI without breaking it
import api from './api';

export const userManagementAPI = {
  // Extended Profile Management (NEW - doesn't break existing)
  getExtendedProfile: async () => {
    try {
      console.log('🔍 Fetching extended user profile...');
      const response = await api.get('/api/users/profile');
      console.log('✅ Extended profile fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching extended profile:', error);
      throw error;
    }
  },

  updateExtendedProfile: async (profileData) => {
    try {
      console.log('📝 Updating extended profile:', profileData);
      const response = await api.put('/api/users/profile', profileData);
      console.log('✅ Extended profile updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating extended profile:', error);
      throw error;
    }
  },

  // Role & Permissions Management (NEW)
  getUserPermissions: async () => {
    try {
      console.log('🔐 Fetching user permissions...');
      const response = await api.get('/api/users/profile/permissions');
      console.log('✅ Permissions fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching permissions:', error);
      throw error;
    }
  },

  getProgressionRequirements: async () => {
    try {
      console.log('📈 Fetching progression requirements...');
      const response = await api.get('/api/users/profile/progression-requirements');
      console.log('✅ Progression requirements fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching progression requirements:', error);
      throw error;
    }
  },

  // Transition Management (NEW)
  getTransitionHistory: async () => {
    try {
      console.log('📚 Fetching transition history...');
      const response = await api.get('/api/users/transitions/history');
      console.log('✅ Transition history fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching transition history:', error);
      throw error;
    }
  },

  requestRoleTransition: async (targetRole, reason) => {
    try {
      console.log('🔄 Requesting role transition:', { targetRole, reason });
      const response = await api.post('/api/users/transitions/request', {
        targetRole,
        reason
      });
      console.log('✅ Transition requested:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error requesting transition:', error);
      throw error;
    }
  },

  checkAutoProgression: async () => {
    try {
      console.log('🤖 Checking automatic progression...');
      const response = await api.post('/api/users/transitions/check-auto-progression');
      console.log('✅ Auto progression checked:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error checking auto progression:', error);
      throw error;
    }
  },

  // Instructor/Admin Functions (NEW)
  getPendingTransitions: async () => {
    try {
      console.log('📋 Fetching pending transitions...');
      const response = await api.get('/api/users/transitions/pending');
      console.log('✅ Pending transitions fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching pending transitions:', error);
      throw error;
    }
  },

  reviewTransition: async (transitionId, action, conditions, notes) => {
    try {
      console.log('⚖️ Reviewing transition:', { transitionId, action });
      const response = await api.put(`/api/users/transitions/${transitionId}/review`, {
        action,
        conditions,
        notes
      });
      console.log('✅ Transition reviewed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error reviewing transition:', error);
      throw error;
    }
  }
};

// Backward compatibility - existing authAPI remains unchanged
export default userManagementAPI;