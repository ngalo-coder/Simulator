// ai-patient-sim-core-services/simulation-service/src/routes/templateSimulation.js - OPTIMIZED
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const TemplateCaseService = require('../services/templateCaseService');
const TemplateSimulationEngine = require('../services/templateSimulationEngine');
const Simulation = require('../models/Simulation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const templateCaseService = new TemplateCaseService();
const simulationEngine = new TemplateSimulationEngine();

// Store active template simulations in memory with TTL
const activeSimulations = new Map();
const SIMULATION_TTL = 2 * 60 * 60 * 1000; // 2 hours

// Request timeout middleware
const timeoutMiddleware = (timeoutMs) => (req, res, next) => {
  req.setTimeout(timeoutMs, () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT',
      });
    }
  });
  next();
};

/**
 * Health check for template simulation routes
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'template-simulation-routes',
    timestamp: new Date().toISOString(),
    activeSimulations: activeSimulations.size,
    memoryUsage: process.memoryUsage(),
    optimizations: [
      'Request timeouts',
      'Memory cleanup',
      'Fast AI responses',
      'Simplified evaluation',
    ],
  });
});

/**
 * Test authentication endpoint
 */
router.get('/auth-test', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working',
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Get all available template cases - OPTIMIZED (No auth required for browsing)
 */
router.get('/cases', async (req, res) => {
  try {
    console.log('📋 Fetching template cases (optimized)');

    const filters = {
      programArea: req.query.programArea,
      specialty: req.query.specialty,
      difficulty: req.query.difficulty,
      location: req.query.location,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) delete filters[key];
    });

    // Use Promise.race to timeout the operation
    const casesPromise = templateCaseService.getCases(filters);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Cases loading timeout')), 5000)
    );

    const cases = await Promise.race([casesPromise, timeoutPromise]);
    const validCases = cases.filter((caseItem) => caseItem !== null);

    // Get filter options only if no specific filters applied
    let filterOptions = {};
    if (Object.keys(filters).length === 0) {
      try {
        filterOptions = await Promise.race([
          templateCaseService.getFilterOptions(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Filter options timeout')), 2000)
          ),
        ]);
      } catch (error) {
        console.warn('Filter options loading failed:', error.message);
        filterOptions = {
          programAreas: [],
          specialties: [],
          difficulties: [],
          locations: [],
          tags: [],
        };
      }
    }

    res.json({
      success: true,
      cases: validCases,
      filterOptions,
      total: validCases.length,
      appliedFilters: filters,
      cached: false, // Could implement caching here
    });
  } catch (error) {
    console.error('❌ Error fetching template cases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template cases',
      details:
        process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
    });
  }
});

/**
 * Start new template-based simulation - OPTIMIZED
 */
router.post('/start', authMiddleware, timeoutMiddleware(10000), async (req, res) => {
  try {
    const { caseId } = req.body;
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to start simulation',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role || 'student';

    console.log(`🚀 Starting optimized template simulation - Case: ${caseId}, User: ${userId}`);

    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: 'Case ID is required',
      });
    }

    // Quick check for existing active simulation
    const existingSimulation = await Simulation.findOne({
      userId,
      status: { $in: ['active', 'paused'] },
    })
      .select('id caseId status')
      .lean(); // Use lean() for faster query

    if (existingSimulation) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active simulation. Please complete it first.',
        activeSimulationId: existingSimulation.id,
        activeSimulationType: existingSimulation.caseId.startsWith('VP-') ? 'template' : 'regular',
      });
    }

    // Initialize simulation with timeout protection
    const initPromise = simulationEngine.initializeSimulation(caseId, userId, userRole);
    const simulationState = await Promise.race([
      initPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Simulation initialization timeout')), 8000)
      ),
    ]);

    const simulationId = uuidv4();
    simulationState.id = simulationId;
    simulationState.lastActivity = new Date();

    // Store in memory for active processing
    activeSimulations.set(simulationId, simulationState);

    // Create database record asynchronously (don't wait)
    const dbPromise = createDatabaseRecord(simulationState, userId, userRole);
    dbPromise.catch((error) => console.error('Database record creation failed:', error));

    console.log(`✅ Template simulation started quickly: ${simulationId}`);

    // Send response immediately
    res.status(201).json({
      success: true,
      message: 'Template simulation started successfully',
      simulation: {
        id: simulationId,
        caseId,
        caseName: simulationState.caseData.case_metadata.title,
        specialty: simulationState.caseData.case_metadata.specialty,
        difficulty: simulationState.caseData.case_metadata.difficulty,
        programArea: simulationState.caseData.case_metadata.program_area,
        patientInfo: {
          name: simulationState.caseData.patient_persona.name,
          age: simulationState.caseData.patient_persona.age,
          gender: simulationState.caseData.patient_persona.gender,
          chiefComplaint: simulationState.caseData.patient_persona.chief_complaint,
          emotionalTone: simulationState.caseData.patient_persona.emotional_tone,
        },
        guardianInfo:
          simulationState.caseData.patient_persona.speaks_for !== 'Self'
            ? {
                relationship: simulationState.caseData.patient_persona.speaks_for,
                patientAge: simulationState.caseData.patient_persona.patient_age_for_communication,
              }
            : null,
        conversationHistory: simulationState.conversationHistory,
        evaluationCriteria: Object.keys(simulationState.evaluationCriteria),
        status: 'active',
      },
    });

    // Wait for database record creation to complete
    await dbPromise;
  } catch (error) {
    console.error('❌ Error starting template simulation:', error);

    if (error.message.includes('timeout')) {
      return res.status(408).json({
        success: false,
        error: 'Simulation startup timeout - please try again',
        code: 'STARTUP_TIMEOUT',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to start simulation',
      details:
        process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
    });
  }
});

/**
 * Send message in template simulation - OPTIMIZED
 */
router.post('/:id/message', authMiddleware, timeoutMiddleware(15000), async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and cannot be empty',
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Message too long (max 500 characters)',
      });
    }

    console.log(`💬 Optimized template message from ${userId}: ${message.substring(0, 50)}...`);

    // Get simulation from memory quickly
    const simulationState = activeSimulations.get(id);
    if (!simulationState || simulationState.userId !== userId) {
      return handleSimulationNotFound(id, userId, res);
    }

    if (simulationState.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Simulation is ${simulationState.status}, not active`,
      });
    }

    // Update last activity
    simulationState.lastActivity = new Date();

    // Add student message immediately
    const studentMessage = {
      sender: 'student',
      message: message.trim(),
      messageType: 'chat',
      timestamp: new Date(),
    };
    simulationState.conversationHistory.push(studentMessage);

    // Generate AI response with timeout protection
    let aiResponse;
    try {
      const responsePromise = simulationEngine.generatePatientResponse(simulationState, message);
      aiResponse = await Promise.race([
        responsePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI response timeout')), 12000)
        ),
      ]);
    } catch (error) {
      console.error('AI response failed:', error.message);
      // Use immediate fallback
      aiResponse = {
        response: getEmergencyFallback(simulationState.caseData),
        clinicalInfo: null,
        error: error.message,
      };
    }

    // Add AI response if available
    if (aiResponse.response) {
      const sender =
        simulationState.caseData.patient_persona.speaks_for !== 'Self' && Math.random() < 0.7
          ? 'guardian'
          : 'patient';

      simulationState.conversationHistory.push({
        sender,
        message: aiResponse.response,
        messageType: 'chat',
        timestamp: new Date(),
        clinicalInfo: aiResponse.clinicalInfo,
      });
    }

    // Update metrics
    simulationState.sessionMetrics.messageCount = simulationState.conversationHistory.length;

    // Check if simulation should end
    let simulationEnded = false;
    if (aiResponse.triggerActivated === 'end_session') {
      simulationState.status = 'completed';
      simulationEnded = true;
      activeSimulations.delete(id);
    }

    // Update database asynchronously (don't wait)
    updateDatabaseAsync(id, userId, simulationState, simulationEnded);

    // Send response immediately
    res.json({
      success: true,
      response: aiResponse.response,
      clinicalInfo: aiResponse.clinicalInfo,
      conversationHistory: simulationState.conversationHistory.slice(-8), // Last 8 messages
      sessionMetrics: {
        messageCount: simulationState.sessionMetrics.messageCount,
        duration: Math.round((new Date() - simulationState.sessionMetrics.startTime) / (1000 * 60)),
      },
      simulationEnded,
      triggerActivated: aiResponse.triggerActivated,
      responseTime: aiResponse.responseTime || 'unknown',
    });
  } catch (error) {
    console.error('❌ Error processing template message:', error);

    if (error.message.includes('timeout')) {
      return res.status(408).json({
        success: false,
        error: 'Response timeout - please try again',
        code: 'RESPONSE_TIMEOUT',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      details:
        process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
    });
  }
});

/**
 * Complete template simulation - OPTIMIZED
 */
router.post('/:id/complete', authMiddleware, timeoutMiddleware(10000), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'completed' } = req.body;
    const userId = req.user.id;

    console.log(`🏁 Completing template simulation quickly: ${id}`);

    // Get simulation from memory
    const simulationState = activeSimulations.get(id);
    if (!simulationState || simulationState.userId !== userId) {
      return handleSimulationNotFound(id, userId, res);
    }

    // Generate evaluation quickly
    const evaluation = simulationEngine.evaluatePerformance(simulationState);
    const endTime = new Date();
    const duration = Math.round((endTime - simulationState.sessionMetrics.startTime) / (1000 * 60));

    // Remove from active simulations immediately
    activeSimulations.delete(id);

    // Update database asynchronously
    completeDatabaseRecordAsync(id, userId, endTime, duration, evaluation);

    // Send response immediately
    res.json({
      success: true,
      message: 'Template simulation completed successfully',
      evaluation: {
        overallScore: evaluation.overallScore,
        criteriaEvaluation: evaluation.criteriaEvaluation,
        recommendations: evaluation.recommendations,
        strengths: evaluation.strengths,
        improvementAreas: evaluation.improvementAreas,
        caseInfo: {
          title: simulationState.caseData.case_metadata.title,
          specialty: simulationState.caseData.case_metadata.specialty,
          difficulty: simulationState.caseData.case_metadata.difficulty,
          hiddenDiagnosis: simulationState.caseData.clinical_dossier.hidden_diagnosis,
          location: simulationState.caseData.case_metadata.location,
        },
      },
      sessionSummary: {
        duration: `${duration} minutes`,
        messageCount: simulationState.sessionMetrics.messageCount,
        clinicalActionsCount: simulationState.sessionMetrics.clinicalActionsCount,
        communicationQuality: evaluation.sessionSummary?.communicationQuality || 0,
        appropriateActionsPercentage:
          simulationState.clinicalActions.length > 0
            ? Math.round(
                (evaluation.sessionSummary.appropriateActions /
                  simulationState.clinicalActions.length) *
                  100
              )
            : 0,
      },
    });
  } catch (error) {
    console.error('❌ Error completing template simulation:', error);

    // Remove from memory even if there's an error
    activeSimulations.delete(id);

    res.status(500).json({
      success: false,
      error: 'Failed to complete simulation',
      details:
        process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
    });
  }
});

/**
 * Get simulation status - OPTIMIZED
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check memory first (fastest)
    const simulationState = activeSimulations.get(id);
    if (simulationState && simulationState.userId === userId) {
      return res.json({
        success: true,
        simulation: {
          id,
          status: simulationState.status,
          caseId: simulationState.caseId,
          caseName: simulationState.caseData.case_metadata.title,
          specialty: simulationState.caseData.case_metadata.specialty,
          difficulty: simulationState.caseData.case_metadata.difficulty,
          patientInfo: {
            name: simulationState.caseData.patient_persona.name,
            age: simulationState.caseData.patient_persona.age,
            gender: simulationState.caseData.patient_persona.gender,
            chiefComplaint: simulationState.caseData.patient_persona.chief_complaint,
            emotionalTone: simulationState.caseData.patient_persona.emotional_tone,
          },
          conversationHistory: simulationState.conversationHistory,
          sessionMetrics: {
            ...simulationState.sessionMetrics,
            currentDuration: Math.round(
              (new Date() - simulationState.sessionMetrics.startTime) / (1000 * 60)
            ),
          },
          isMemoryActive: true,
        },
      });
    }

    // Check database (slower)
    const simulation = await Simulation.findOne({ id, userId })
      .select(
        'id status caseId caseName patientPersona conversationHistory sessionMetrics learningProgress'
      )
      .lean();

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
    }

    res.json({
      success: true,
      simulation: {
        id: simulation.id,
        status: simulation.status,
        caseId: simulation.caseId,
        caseName: simulation.caseName,
        patientInfo: {
          name: simulation.patientPersona.patient?.name,
          age: simulation.patientPersona.patient?.age,
          gender: simulation.patientPersona.patient?.gender,
          chiefComplaint:
            simulation.patientPersona.patient?.presentation ||
            simulation.patientPersona.chiefComplaint,
        },
        conversationHistory: simulation.conversationHistory,
        sessionMetrics: simulation.sessionMetrics,
        isMemoryActive: false,
        needsRestart: simulation.status === 'active', // Suggests user should restart if memory expired
      },
    });
  } catch (error) {
    console.error('❌ Error fetching template simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation',
    });
  }
});

// Helper methods
function handleSimulationNotFound(id, userId, res) {
  return res.status(404).json({
    success: false,
    error: 'Simulation not found or session expired',
    code: 'SIMULATION_NOT_FOUND',
    suggestion: 'Please start a new simulation',
  });
}

function getEmergencyFallback(caseData) {
  const tone = caseData.patient_persona?.emotional_tone?.toLowerCase() || 'concerned';
  const fallbacks = {
    anxious: "I'm sorry, I'm feeling quite anxious right now. Could you repeat that?",
    scared: "I'm scared and didn't catch what you said. Can you ask again?",
    tired: "I'm so tired. What did you want to know?",
    frustrated: "I'm getting frustrated. Could you repeat that?",
    calm: 'Could you please repeat your question?',
    worried: "I'm worried and missed what you said. Can you ask again?",
  };

  return fallbacks[tone] || fallbacks['concerned'];
}

async function createDatabaseRecord(simulationState, userId, userRole) {
  try {
    const simulation = new Simulation({
      id: simulationState.id,
      userId,
      userRole,
      programArea:
        simulationState.caseData.case_metadata.program_area?.replace(' ', '_').toLowerCase() ||
        'template_based',
      caseId: simulationState.caseId,
      caseName: simulationState.caseData.case_metadata.title,
      patientPersona: {
        patient: {
          name: simulationState.caseData.patient_persona.name,
          age: simulationState.caseData.patient_persona.age,
          gender: simulationState.caseData.patient_persona.gender,
          presentation: simulationState.caseData.patient_persona.chief_complaint,
        },
        currentCondition: simulationState.caseData.clinical_dossier.hidden_diagnosis,
        personality: {
          emotionalTone: simulationState.caseData.patient_persona.emotional_tone,
        },
        chiefComplaint: simulationState.caseData.patient_persona.chief_complaint,
      },
      difficulty: simulationState.caseData.case_metadata.difficulty.toLowerCase(),
      conversationHistory: simulationState.conversationHistory,
      clinicalActions: [],
      learningProgress: simulationState.learningProgress,
      sessionMetrics: simulationState.sessionMetrics,
      status: 'active',
    });

    await simulation.save();
    console.log(`💾 Database record created for simulation ${simulationState.id}`);
  } catch (error) {
    console.error('❌ Database record creation failed:', error);
    throw error;
  }
}

async function updateDatabaseAsync(id, userId, simulationState, simulationEnded) {
  try {
    const updateData = {
      conversationHistory: simulationState.conversationHistory,
      sessionMetrics: simulationState.sessionMetrics,
      updatedAt: new Date(),
    };

    if (simulationEnded) {
      updateData.status = 'completed';
      updateData['sessionMetrics.endTime'] = new Date();
      updateData['sessionMetrics.totalDuration'] = Math.round(
        (new Date() - simulationState.sessionMetrics.startTime) / (1000 * 60)
      );
    }

    await Simulation.findOneAndUpdate({ id, userId }, updateData);
    console.log(`💾 Database updated for simulation ${id}`);
  } catch (error) {
    console.error(`❌ Database update failed for simulation ${id}:`, error);
  }
}

async function completeDatabaseRecordAsync(id, userId, endTime, duration, evaluation) {
  try {
    await Simulation.findOneAndUpdate(
      { id, userId },
      {
        status: 'completed',
        'sessionMetrics.endTime': endTime,
        'sessionMetrics.totalDuration': duration,
        'learningProgress.overallProgress': evaluation.overallScore,
        'learningProgress.communicationScore': evaluation.sessionSummary?.communicationQuality || 0,
        feedbackProvided: true,
        updatedAt: endTime,
      }
    );
    console.log(`💾 Simulation completion recorded in database: ${id}`);
  } catch (error) {
    console.error(`❌ Database completion update failed for simulation ${id}:`, error);
  }
}

/**
 * Cleanup expired simulations - OPTIMIZED
 */
function cleanupExpiredSimulations() {
  const now = new Date();
  let cleanedCount = 0;

  for (const [id, simulation] of activeSimulations.entries()) {
    const lastActivity = simulation.lastActivity || simulation.sessionMetrics.startTime;
    if (now - lastActivity > SIMULATION_TTL) {
      console.log(`🧹 Cleaning up expired simulation: ${id}`);
      activeSimulations.delete(id);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(
      `🧹 Cleaned up ${cleanedCount} expired simulations. Active: ${activeSimulations.size}`
    );
  }
}

/**
 * Get simulation statistics
 */
router.get('/stats/memory', authMiddleware, (req, res) => {
  const stats = {
    activeSimulations: activeSimulations.size,
    memoryUsage: process.memoryUsage(),
    simulationList: Array.from(activeSimulations.entries()).map(([id, sim]) => ({
      id,
      userId: sim.userId,
      caseId: sim.caseId,
      status: sim.status,
      startTime: sim.sessionMetrics.startTime,
      lastActivity: sim.lastActivity,
      messageCount: sim.sessionMetrics.messageCount,
    })),
  };

  res.json({
    success: true,
    stats,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Force cleanup endpoint (admin only)
 */
router.post('/admin/cleanup', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  const beforeCount = activeSimulations.size;
  cleanupExpiredSimulations();
  const afterCount = activeSimulations.size;

  res.json({
    success: true,
    message: `Cleanup completed. Removed ${beforeCount - afterCount} expired simulations.`,
    before: beforeCount,
    after: afterCount,
  });
});

/**
 * Emergency fallback endpoint for when AI is completely down
 */
router.post('/:id/fallback-message', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const simulationState = activeSimulations.get(id);
    if (!simulationState || simulationState.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
    }

    // Add student message
    simulationState.conversationHistory.push({
      sender: 'student',
      message: message.trim(),
      messageType: 'chat',
      timestamp: new Date(),
    });

    // Add simple fallback response
    const fallbackResponse = getEmergencyFallback(simulationState.caseData);
    simulationState.conversationHistory.push({
      sender: 'patient',
      message: fallbackResponse,
      messageType: 'chat',
      timestamp: new Date(),
      fallback: true,
    });

    simulationState.sessionMetrics.messageCount = simulationState.conversationHistory.length;

    res.json({
      success: true,
      response: fallbackResponse,
      fallback: true,
      message: 'Using fallback response due to AI service issues',
      conversationHistory: simulationState.conversationHistory.slice(-5),
    });
  } catch (error) {
    console.error('❌ Fallback message error:', error);
    res.status(500).json({
      success: false,
      error: 'Fallback failed',
    });
  }
});

// Helper methods are now available as regular functions

// Run cleanup every 30 minutes
setInterval(cleanupExpiredSimulations, 30 * 60 * 1000);

// Run initial cleanup after 5 minutes
setTimeout(cleanupExpiredSimulations, 5 * 60 * 1000);

module.exports = router;
