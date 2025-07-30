// ai-patient-sim-frontend/src/utils/simulationApi.js - UPDATED WITH REPORT FEATURES
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
        difficulty,
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
        messageType,
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
        category,
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

  // Complete simulation (ENHANCED with report support)
  completeSimulation: async (simulationId, reason = 'completed') => {
    try {
      console.log('🏁 Completing simulation:', { simulationId, reason });
      const response = await api.post(`/api/simulations/${simulationId}/complete`, {
        reason,
      });
      console.log('✅ Simulation completed with report:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error completing simulation:', error);
      throw error;
    }
  },

  // NEW: Get detailed simulation report
  getSimulationReport: async (simulationId) => {
    try {
      console.log('📊 Fetching simulation report:', simulationId);
      const response = await api.get(`/api/simulations/${simulationId}/report`);
      console.log('✅ Report fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching simulation report:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch simulation report',
        report: null,
      };
    }
  },

  // NEW: Download simulation report as PDF
  downloadReportPDF: async (simulationId) => {
    try {
      console.log('📄 Downloading PDF report:', simulationId);
      const response = await api.get(`/api/simulations/${simulationId}/report/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `simulation-report-${simulationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ PDF downloaded successfully');
      return { success: true, message: 'Report downloaded successfully' };
    } catch (error) {
      console.error('❌ Error downloading PDF report:', error);
      throw error;
    }
  },

  // NEW: Get AI-generated feedback
  getAIFeedback: async (simulationId) => {
    try {
      console.log('🤖 Fetching AI feedback:', simulationId);
      const response = await api.get(`/api/simulations/${simulationId}/feedback`);
      console.log('✅ AI feedback fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching AI feedback:', error);
      return {
        success: false,
        feedback:
          'AI feedback is temporarily unavailable. Please review your performance with your instructor.',
        error: error.message,
      };
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

  // Get user's simulation history (ENHANCED with better error handling)
  getSimulationHistory: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') params.append(key, value);
      });

      console.log('📚 Fetching simulation history:', { page, limit, filters });
      const response = await api.get(`/api/simulations/user/history?${params}`);
      console.log('✅ History fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching history:', error);
      return {
        success: false,
        simulations: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        },
        error: error.message,
      };
    }
  },

  // Get statistics and analytics (ENHANCED)
  getStatistics: async () => {
    try {
      console.log('📊 Fetching statistics...');
      const response = await api.get('/api/simulations/stats/overview');
      console.log('✅ Statistics fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      return {
        success: false,
        overview: {
          totalSimulations: 0,
          completedSimulations: 0,
          activeSimulations: 0,
          completionRate: 0,
        },
        programBreakdown: [],
        availablePrograms: [],
        error: error.message,
      };
    }
  },

  // NEW: Get program-specific statistics
  getProgramStatistics: async (programArea) => {
    try {
      console.log('📈 Fetching program statistics:', programArea);
      const params = programArea ? `?programArea=${programArea}` : '';
      const response = await api.get(`/api/simulations/stats/program${params}`);
      console.log('✅ Program statistics fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching program statistics:', error);
      return {
        success: false,
        statistics: {},
        error: error.message,
      };
    }
  },

  // NEW: Submit user feedback about simulation
  submitUserFeedback: async (simulationId, feedback) => {
    try {
      console.log('💭 Submitting user feedback:', { simulationId, feedback });
      const response = await api.post(`/api/simulations/${simulationId}/user-feedback`, feedback);
      console.log('✅ Feedback submitted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      throw error;
    }
  },

  // NEW: Share simulation results
  shareSimulation: async (simulationId, shareOptions = {}) => {
    try {
      console.log('🔗 Sharing simulation:', { simulationId, shareOptions });
      const response = await api.post(`/api/simulations/${simulationId}/share`, shareOptions);
      console.log('✅ Simulation shared:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sharing simulation:', error);
      throw error;
    }
  },

  // NEW: Delete simulation
  deleteSimulation: async (simulationId) => {
    try {
      console.log('🗑️ Deleting simulation:', simulationId);
      const response = await api.delete(`/api/simulations/${simulationId}`);
      console.log('✅ Simulation deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting simulation:', error);
      throw error;
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
  },

  // NEW: Test connection to simulation service
  testConnection: async () => {
    try {
      console.log('🔧 Testing simulation service connection...');
      const response = await api.get('/api/simulations/test');
      console.log('✅ Connection test successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        message: 'Connection test failed',
        error: error.message,
      };
    }
  },

  // ====================
  // UTILITY FUNCTIONS
  // ====================

  // Format simulation data for display
  formatSimulationData: (simulation) => {
    if (!simulation) return null;

    return {
      ...simulation,
      formattedDuration: simulation.sessionMetrics?.totalDuration
        ? `${simulation.sessionMetrics.totalDuration} minutes`
        : simulation.duration || 'In progress',
      formattedStartTime: simulation.sessionMetrics?.startTime
        ? new Date(simulation.sessionMetrics.startTime).toLocaleString()
        : simulation.createdAt
        ? new Date(simulation.createdAt).toLocaleString()
        : 'Unknown',
      overallGrade: simulation.learningProgress?.overallProgress
        ? getGradeFromScore(simulation.learningProgress.overallProgress)
        : simulation.overallScore
        ? getGradeFromScore(simulation.overallScore)
        : 'N/A',
      statusColor: getStatusColor(simulation.status),
      difficultyColor: getDifficultyColor(simulation.difficulty),
    };
  },

  // Get available difficulty levels
  getDifficultyLevels: () => [
    { value: 'student', label: 'Student', description: 'Basic level with straightforward cases' },
    {
      value: 'resident',
      label: 'Resident',
      description: 'Intermediate level with complex scenarios',
    },
    { value: 'fellow', label: 'Fellow', description: 'Advanced level with rare and complex cases' },
  ],

  // Get available program areas
  getProgramAreas: () => [
    { value: 'internal_medicine', label: 'Internal Medicine' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'family_medicine', label: 'Family Medicine' },
    { value: 'emergency_medicine', label: 'Emergency Medicine' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'obstetrics_gynecology', label: 'Obstetrics & Gynecology' },
    { value: 'cardiology_fellowship', label: 'Cardiology Fellowship' },
  ],

  // Validate simulation data
  validateSimulationData: (data) => {
    const errors = [];

    if (!data.caseId) {
      errors.push('Case ID is required');
    }

    if (!data.difficulty || !['student', 'resident', 'fellow'].includes(data.difficulty)) {
      errors.push('Valid difficulty level is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Generate comprehensive simulation report
  generateReport: async (simulationId) => {
    try {
      console.log('📊 Generating comprehensive report for simulation:', simulationId);
      const response = await api.get(`/api/simulations/${simulationId}/report`);
      console.log('✅ Report generated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error generating report:', error);
      throw error;
    }
  },

  // Get simulation report summary
  getReportSummary: async (simulationId) => {
    try {
      console.log('📋 Fetching report summary for simulation:', simulationId);
      const response = await api.get(`/api/simulations/${simulationId}/report/summary`);
      console.log('✅ Report summary fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching report summary:', error);
      throw error;
    }
  },

  // ====================
  // TEMPLATE SIMULATION METHODS
  // ====================

  // Get template cases
  getTemplateCases: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(','));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      console.log('📋 Fetching template cases with filters:', filters);
      const response = await api.get(`/api/template-simulations/cases?${queryParams}`);
      console.log('✅ Template cases fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching template cases:', error);
      throw error;
    }
  },

  // Get specific template case
  getTemplateCaseById: async (caseId) => {
    try {
      console.log('📋 Fetching template case:', caseId);
      const response = await api.get(`/api/template-simulations/cases/${caseId}`);
      console.log('✅ Template case fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching template case:', error);
      throw error;
    }
  },

  // Start template simulation
  startTemplateSimulation: async (caseId) => {
    try {
      console.log('🚀 Starting template simulation:', caseId);
      const response = await api.post('/api/template-simulations/start', { caseId });
      console.log('✅ Template simulation started:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error starting template simulation:', error);
      throw error;
    }
  },

  // Send message in template simulation
  sendTemplateMessage: async (simulationId, message) => {
    try {
      console.log('💬 Sending template message:', { simulationId, message });
      const response = await api.post(`/api/template-simulations/${simulationId}/message`, {
        message,
      });
      console.log('✅ Template message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending template message:', error);
      throw error;
    }
  },

  // Get template simulation
  getTemplateSimulation: async (simulationId) => {
    try {
      console.log('📋 Fetching template simulation:', simulationId);
      const response = await api.get(`/api/template-simulations/${simulationId}`);
      console.log('✅ Template simulation fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching template simulation:', error);
      throw error;
    }
  },

  // Complete template simulation
  completeTemplateSimulation: async (simulationId) => {
    try {
      console.log('🏁 Completing template simulation:', simulationId);
      const response = await api.post(`/api/template-simulations/${simulationId}/complete`);
      console.log('✅ Template simulation completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error completing template simulation:', error);
      throw error;
    }
  },

  // Perform clinical action in template simulation
  performTemplateAction: async (simulationId, action, details, category = null) => {
    try {
      console.log('🔬 Performing template action:', { simulationId, action, details, category });
      const response = await api.post(`/api/template-simulations/${simulationId}/action`, {
        action,
        details,
        category,
      });
      console.log('✅ Template action performed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error performing template action:', error);
      throw error;
    }
  },

  // Pause template simulation
  pauseTemplateSimulation: async (simulationId) => {
    try {
      console.log('⏸️ Pausing template simulation:', simulationId);
      const response = await api.post(`/api/template-simulations/${simulationId}/pause`);
      console.log('✅ Template simulation paused:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error pausing template simulation:', error);
      throw error;
    }
  },

  // Resume template simulation
  resumeTemplateSimulation: async (simulationId) => {
    try {
      console.log('▶️ Resuming template simulation:', simulationId);
      const response = await api.post(`/api/template-simulations/${simulationId}/resume`);
      console.log('✅ Template simulation resumed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error resuming template simulation:', error);
      throw error;
    }
  },

  // Get detailed template simulation results
  getTemplateSimulationResults: async (simulationId) => {
    try {
      console.log('📊 Fetching template simulation results:', simulationId);
      const response = await api.get(`/api/template-simulations/${simulationId}/results`);
      console.log('✅ Template results fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching template results:', error);
      throw error;
    }
  },

  // Template simulation health check
  templateHealthCheck: async () => {
    try {
      const response = await api.get('/api/template-simulations/health');
      return response.data;
    } catch (error) {
      console.error('❌ Template simulation health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  },
};

// Export default for backward compatibility
export default simulationAPI;

// Named export for consistency
export const simulationApi = simulationAPI;

/**
 * Handle API errors with user-friendly messages
 */
export const handleSimulationError = (error) => {
  console.error('Simulation API Error:', error);

  const errorMessage =
    error.message || error.response?.data?.error || 'An unexpected error occurred';

  if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
    return 'Please log in again to continue';
  }

  if (errorMessage.includes('404')) {
    return 'The requested simulation was not found';
  }

  if (errorMessage.includes('403')) {
    return 'You do not have permission to access this simulation';
  }

  if (errorMessage.includes('429')) {
    return 'Too many requests. Please try again in a moment';
  }

  if (errorMessage.includes('500')) {
    return 'Server error. Please try again later';
  }

  if (errorMessage.includes('Network')) {
    return 'Network error. Please check your connection';
  }

  return errorMessage;
};

/**
 * Get grade letter from numerical score
 */
const getGradeFromScore = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

/**
 * Get color class for simulation status
 */
const getStatusColor = (status) => {
  const colors = {
    active: 'text-green-600 bg-green-100',
    paused: 'text-yellow-600 bg-yellow-100',
    completed: 'text-blue-600 bg-blue-100',
    abandoned: 'text-red-600 bg-red-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Get color class for difficulty level
 */
const getDifficultyColor = (difficulty) => {
  const colors = {
    student: 'text-green-600 bg-green-100',
    resident: 'text-blue-600 bg-blue-100',
    fellow: 'text-purple-600 bg-purple-100',
  };
  return colors[difficulty] || 'text-gray-600 bg-gray-100';
};
