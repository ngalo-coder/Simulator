const serviceUrls = {
  users: process.env.USER_SERVICE_URL || 'https://ai-patient-sim-user-service.onrender.com',
  simulation: process.env.SIMULATION_SERVICE_URL,
  clinical: process.env.CLINICAL_SERVICE_URL,
  cases: process.env.CASE_SERVICE_URL,
  analytics: process.env.ANALYTICS_SERVICE_URL,
};

module.exports = serviceUrls;
