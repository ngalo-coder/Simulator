// ai-patient-sim-frontend/src/utils/simulationApi.js
import api from './api';

export const simulationAPI = {
  // Get available cases
  getCases: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/api/simulations/cases?${params}`);
    return response.data;
  },

  // Start new simulation
  startSimulation: async (caseId, difficulty = 'student') => {
    const response = await api.post('/api/simulations/start', {
      caseId,
      difficulty
    });
    return response.data;
  },

  // Send message to patient/guardian
  sendMessage: async (simulationId, message, messageType = 'chat') => {
    const response = await api.post(`/api/simulations/${simulationId}/message`, {
      message,
      messageType
    });
    return response.data;
  },

  // Perform clinical action
  performAction: async (simulationId, action, details, category = null) => {
    const response = await api.post(`/api/simulations/${simulationId}/action`, {
      action,
      details,
      category
    });
    return response.data;
  },

  // Get simulation details
  getSimulation: async (simulationId) => {
    const response = await api.get(`/api/simulations/${simulationId}`);
    return response.data;
  },

  // Complete simulation
  completeSimulation: async (simulationId, reason = 'completed') => {
    const response = await api.post(`/api/simulations/${simulationId}/complete`, {
      reason
    });
    return response.data;
  },

  // Pause simulation
  pauseSimulation: async (simulationId) => {
    const response = await api.post(`/api/simulations/${simulationId}/pause`);
    return response.data;
  },

  // Resume simulation
  resumeSimulation: async (simulationId) => {
    const response = await api.post(`/api/simulations/${simulationId}/resume`);
    return response.data;
  },

  // Get user's simulation history
  getSimulationHistory: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    const response = await api.get(`/api/simulations/user/history?${params}`);
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/api/simulations/stats/overview');
    return response.data;
  }
};

export default simulationAPI;