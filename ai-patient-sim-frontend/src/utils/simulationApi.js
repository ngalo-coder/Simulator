// ai-patient-sim-frontend/src/utils/simulationApi.js - COMPLETE SIMULATION API
import api from './api';

export const simulationAPI = {
  // Get available cases
  getCases: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      console.log('🔍 Fetching cases with filters:', filters);
      const response = await api.get(`/api/simulations/cases?${params}`);
      console.log('✅ Cases fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching cases:', error);
      throw error;
    }
  },

  // Start new simulation
  startSimulation: async (caseId, difficulty = 'student') => {
    try {
      console.log('🚀 Starting simulation:', { caseId, difficulty });
      const response = await api.post('/api/simulations/start', {
        caseId,
        difficulty
      });
      console.log('✅ Simulation started:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error starting simulation:', error);
      throw error;
    }
  },

  // Send message to patient/guardian
  sendMessage: async (simulationId, message, messageType = 'chat') => {
    try {
      console.log('💬 Sending message:', { simulationId, message, messageType });
      const response = await api.post(`/api/simulations/${simulationId}/message`, {
        message,
        messageType
      });
      console.log('✅ Message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  },

  // Perform clinical action
  performAction: async (simulationId, action, details, category = null) => {
    try {
      console.log('🔬 Performing action:', { simulationId, action, details, category });
      const response = await api.post(`/api/simulations/${simulationId}/action`, {
        action,
        details,
        category
      });
      console.log('✅ Action performed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error performing action:', error);
      throw error;
    }
  },

  // Get simulation details
  getSimulation: async (simulationId) => {
    try {
      console.log('📋 Fetching simulation:', simulationId);
      const response = await api.get(`/api/simulations/${simulationId}`);
      console.log('✅ Simulation fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching simulation:', error);
      throw error;
    }
  },

  // Complete simulation
  completeSimulation: async (simulationId, reason = 'completed') => {
    try {
      console.log('🏁 Completing simulation:', { simulationId, reason });
      const response = await api.post(`/api/simulations/${simulationId}/complete`, {
        reason
      });
      console.log('✅ Simulation completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error completing simulation:', error);
      throw error;
    }
  },

  // Pause simulation
  pauseSimulation: async (simulationId) => {
    try {
      console.log('⏸️ Pausing simulation:', simulationId);
      const response = await api.post(`/api/simulations/${simulationId}/pause`);
      console.log('✅ Simulation paused:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error pausing simulation:', error);
      throw error;
    }
  },

  // Resume simulation
  resumeSimulation: async (simulationId) => {
    try {
      console.log('▶️ Resuming simulation:', simulationId);
      const response = await api.post(`/api/simulations/${simulationId}/resume`);
      console.log('✅ Simulation resumed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error resuming simulation:', error);
      throw error;
    }
  },

  // Get user's simulation history
  getSimulationHistory: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      console.log('📚 Fetching simulation history:', { page, limit, filters });
      const response = await api.get(`/api/simulations/user/history?${params}`);
      console.log('✅ History fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching history:', error);
      // Return empty data structure for graceful degradation
      return {
        success: false,
        simulations: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        error: error.message
      };
    }
  },

  // Get statistics and analytics
  getStatistics: async () => {
    try {
      console.log('📊 Fetching statistics...');
      const response = await api.get('/api/simulations/stats/overview');
      console.log('✅ Statistics fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      // Return basic structure for graceful degradation
      return {
        success: false,
        overview: {
          totalSimulations: 0,
          completedSimulations: 0,
          activeSimulations: 0,
          completionRate: 0
        },
        programBreakdown: [],
        error: error.message
      };
    }
  },

  // Health check for simulation service
  healthCheck: async () => {
    try {
      const response = await api.get('/api/simulations/health');
      return response.data;
    } catch (error) {
      console.error('❌ Simulation service health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }
};

// Export default for backward compatibility
export default simulationAPI;