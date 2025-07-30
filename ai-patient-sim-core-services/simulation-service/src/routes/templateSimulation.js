// ai-patient-sim-core-services/simulation-service/src/routes/templateSimulation.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const TemplateCaseService = require('../services/templateCaseService');
const TemplateSimulationEngine = require('../services/templateSimulationEngine');
const Simulation = require('../models/Simulation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const templateCaseService = new TemplateCaseService();
const simulationEngine = new TemplateSimulationEngine();

// Store active template simulations in memory (in production, use Redis)
const activeSimulations = new Map();

/**
 * Health check for template simulation routes
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'template-simulation-routes',
    timestamp: new Date().toISOString(),
    activeSimulations: activeSimulations.size,
    memoryUsage: process.memoryUsage()
  });
});

/**
 * Get all available template cases
 */
router.get('/cases', async (req, res) => {
  try {
    console.log('📋 Fetching template cases with filters:', req.query);
    
    const filters = {
      programArea: req.query.programArea,
      specialty: req.query.specialty,
      difficulty: req.query.difficulty,
      location: req.query.location,
      tags: req.query.tags ? req.query.tags.split(',') : undefined
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const cases = await templateCaseService.getCases(filters);
    const filterOptions = await templateCaseService.getFilterOptions();

    // Filter out any null cases from transformation
    const validCases = cases.filter(caseItem => caseItem !== null);

    res.json({
      success: true,
      cases: validCases,
      filterOptions,
      total: validCases.length,
      appliedFilters: filters,
      message: validCases.length === 0 ? 'No cases match the selected filters' : undefined
    });
  } catch (error) {
    console.error('❌ Error fetching template cases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template cases',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get specific case details (public information only)
 */
router.get('/cases/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log(`📖 Fetching case details for: ${caseId}`);
    
    const caseData = await templateCaseService.getCaseById(caseId);
    
    // Transform for frontend (hide clinical dossier)
    const publicCaseData = templateCaseService.transformCaseForFrontend(caseData);
    
    if (!publicCaseData) {
      return res.status(404).json({
        success: false,
        error: 'Case not found or invalid case structure'
      });
    }

    // Add additional public information
    const enhancedCaseData = {
      ...publicCaseData,
      initialPrompt: caseData.initial_prompt,
      evaluationAreas: Object.keys(caseData.evaluation_criteria || {}),
      estimatedDuration: '15-30 minutes', // Could be calculated based on case complexity
      learningLevel: caseData.case_metadata.difficulty,
      prerequisites: this.getPrerequisites(caseData.case_metadata.specialty, caseData.case_metadata.difficulty)
    };

    res.json({
      success: true,
      case: enhancedCaseData
    });
  } catch (error) {
    console.error('❌ Error fetching case details:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Start new template-based simulation
 */
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { caseId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`🚀 Starting template simulation - Case: ${caseId}, User: ${userId}`);

    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: 'Case ID is required'
      });
    }

    // Check for existing active simulation (any type)
    const existingSimulation = await Simulation.findOne({
      userId,
      status: { $in: ['active', 'paused'] }
    });

    if (existingSimulation) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active simulation. Please complete it first.',
        activeSimulationId: existingSimulation.id,
        activeSimulationType: existingSimulation.caseId.startsWith('VP-') ? 'template' : 'regular'
      });
    }

    // Initialize template simulation
    const simulationState = await simulationEngine.initializeSimulation(
      caseId,
      userId,
      userRole
    );

    const simulationId = uuidv4();
    simulationState.id = simulationId;

    // Store in memory for active processing
    activeSimulations.set(simulationId, simulationState);

    // Create database record for persistence
    const simulation = new Simulation({
      id: simulationId,
      userId,
      userRole,
      programArea: simulationState.caseData.case_metadata.program_area?.replace(' ', '_').toLowerCase() || 'template_based',
      caseId,
      caseName: simulationState.caseData.case_metadata.title,
      patientPersona: {
        patient: {
          name: simulationState.caseData.patient_persona.name,
          age: simulationState.caseData.patient_persona.age,
          gender: simulationState.caseData.patient_persona.gender,
          presentation: simulationState.caseData.patient_persona.chief_complaint
        },
        guardian: simulationState.caseData.patient_persona.speaks_for !== "Self" ? {
          name: simulationState.caseData.patient_persona.speaks_for,
          relationship: simulationState.caseData.patient_persona.speaks_for,
          primaryLanguage: 'English'
        } : null,
        demographics: {
          primaryLanguage: 'English',
          location: simulationState.caseData.case_metadata.location
        },
        currentCondition: simulationState.caseData.clinical_dossier.hidden_diagnosis,
        personality: {
          emotionalTone: simulationState.caseData.patient_persona.emotional_tone,
          backgroundStory: simulationState.caseData.patient_persona.background_story
        },
        learningObjectives: Object.keys(simulationState.evaluationCriteria),
        chiefComplaint: simulationState.caseData.patient_persona.chief_complaint
      },
      difficulty: simulationState.caseData.case_metadata.difficulty.toLowerCase(),
      conversationHistory: simulationState.conversationHistory,
      clinicalActions: [],
      learningProgress: simulationState.learningProgress,
      sessionMetrics: simulationState.sessionMetrics,
      status: 'active'
    });

    await simulation.save();

    console.log(`✅ Template simulation started: ${simulationId} for case ${caseId}`);

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
          emotionalTone: simulationState.caseData.patient_persona.emotional_tone
        },
        guardianInfo: simulationState.caseData.patient_persona.speaks_for !== "Self" ? {
          relationship: simulationState.caseData.patient_persona.speaks_for,
          patientAge: simulationState.caseData.patient_persona.patient_age_for_communication
        } : null,
        conversationHistory: simulationState.conversationHistory,
        evaluationCriteria: Object.keys(simulationState.evaluationCriteria),
        status: 'active'
      }
    });
  } catch (error) {
    console.error('❌ Error starting template simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start simulation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Send message in template simulation
 */
router.post('/:id/message', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and cannot be empty'
      });
    }

    console.log(`💬 Template message from ${userId} in ${id}: ${message.substring(0, 50)}...`);

    // Get simulation from memory
    const simulationState = activeSimulations.get(id);
    if (!simulationState || simulationState.userId !== userId) {
      // Try to load from database if not in memory
      const dbSimulation = await Simulation.findOne({ id, userId });
      if (!dbSimulation) {
        return res.status(404).json({
          success: false,
          error: 'Simulation not found or access denied'
        });
      }

      return res.status(410).json({
        success: false,
        error: 'Simulation session expired. Please restart the simulation.',
        code: 'SESSION_EXPIRED'
      });
    }

    if (simulationState.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Simulation is ${simulationState.status}, not active`
      });
    }

    // Add student message to conversation
    simulationState.conversationHistory.push({
      sender: 'student',
      message: message.trim(),
      messageType: 'chat',
      timestamp: new Date()
    });

    // Generate AI response
    const aiResponse = await simulationEngine.generatePatientResponse(
      simulationState,
      message
    );

    // Add patient/guardian response
    if (aiResponse.response) {
      const sender = simulationState.caseData.patient_persona.speaks_for !== "Self" && 
                    Math.random() < 0.7 ? 'guardian' : 'patient';
      
      simulationState.conversationHistory.push({
        sender,
        message: aiResponse.response,
        messageType: 'chat',
        timestamp: new Date(),
        clinicalInfo: aiResponse.clinicalInfo,
        dialogueMetadata: aiResponse.dialogueMetadata
      });
    }

    // Update metrics
    simulationState.sessionMetrics.messageCount = simulationState.conversationHistory.length;
    simulationState.sessionMetrics.lastActivity = new Date();

    // Update database
    await Simulation.findOneAndUpdate(
      { id, userId },
      {
        conversationHistory: simulationState.conversationHistory,
        sessionMetrics: simulationState.sessionMetrics,
        updatedAt: new Date()
      }
    );

    // Check if simulation should end
    let simulationEnded = false;
    if (aiResponse.triggerActivated === 'end_session') {
      simulationState.status = 'completed';
      simulationEnded = true;
      
      await Simulation.findOneAndUpdate(
        { id, userId },
        { 
          status: 'completed', 
          'sessionMetrics.endTime': new Date(),
          'sessionMetrics.totalDuration': Math.round((new Date() - simulationState.sessionMetrics.startTime) / (1000 * 60))
        }
      );

      // Remove from active simulations
      activeSimulations.delete(id);
    }

    res.json({
      success: true,
      response: aiResponse.response,
      clinicalInfo: aiResponse.clinicalInfo,
      dialogueMetadata: aiResponse.dialogueMetadata,
      conversationHistory: simulationState.conversationHistory.slice(-10), // Last 10 messages
      sessionMetrics: {
        messageCount: simulationState.sessionMetrics.messageCount,
        duration: Math.round((new Date() - simulationState.sessionMetrics.startTime) / (1000 * 60))
      },
      simulationEnded,
      triggerActivated: aiResponse.triggerActivated,
      usage: aiResponse.usage
    });
  } catch (error) {
    console.error('❌ Error processing template message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Perform clinical action in template simulation
 */
router.post('/:id/action', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, details } = req.body;
    const userId = req.user.id;

    const validActions = [
      'history_taking',
      'physical_exam',
      'order_labs',
      'order_imaging',
      'diagnosis',
      'treatment_plan'
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action type',
        validActions
      });
    }

    console.log(`🔬 Template clinical action by ${userId}: ${action} - ${details}`);

    // Get simulation from memory
    const simulationState = activeSimulations.get(id);
    if (!simulationState || simulationState.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied'
      });
    }

    if (simulationState.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Simulation is not active'
      });
    }

    // Perform clinical action
    const actionResult = await simulationEngine.performClinicalAction(
      simulationState,
      action,
      details
    );

    // Update database
    await Simulation.findOneAndUpdate(
      { id, userId },
      {
        conversationHistory: simulationState.conversationHistory,
        clinicalActions: simulationState.clinicalActions,
        sessionMetrics: simulationState.sessionMetrics,
        learningProgress: simulationState.learningProgress,
        updatedAt: new Date()
      }
    );

    res.json({
      success: true,
      ...actionResult
    });

  } catch (error) {
    console.error('❌ Error performing template clinical action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform clinical action',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Complete template simulation and get evaluation
 */
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'completed' } = req.body;
    const userId = req.user.id;

    console.log(`🏁 Completing template simulation: ${id}, reason: ${reason}`);

    // Get simulation from memory
    const simulationState = activeSimulations.get(id);
    if (!simulationState || simulationState.userId !== userId) {
      // Try to get from database
      const dbSimulation = await Simulation.findOne({ id, userId });
      if (!dbSimulation) {
        return res.status(404).json({
          success: false,
          error: 'Simulation not found or access denied'
        });
      }

      return res.status(410).json({
        success: false,
        error: 'Simulation session expired, but completion recorded',
        code: 'SESSION_EXPIRED'
      });
    }

    // Generate evaluation
    const evaluation = simulationEngine.evaluatePerformance(simulationState);

    // Calculate session duration
    const endTime = new Date();
    const duration = Math.round((endTime - simulationState.sessionMetrics.startTime) / (1000 * 60));

    // Update database
    await Simulation.findOneAndUpdate(
      { id, userId },
      {
        status: 'completed',
        'sessionMetrics.endTime': endTime,
        'sessionMetrics.totalDuration': duration,
        'learningProgress.overallProgress': evaluation.overallScore,
        'learningProgress.diagnosticAccuracy': evaluation.criteriaEvaluation.Clinical_Reasoning?.score || 0,
        'learningProgress.communicationScore': evaluation.sessionSummary.communicationQuality,
        feedbackProvided: true,
        conversationHistory: simulationState.conversationHistory,
        clinicalActions: simulationState.clinicalActions
      }
    );

    // Remove from active simulations
    activeSimulations.delete(id);

    console.log(`✅ Template simulation completed: ${id}, Overall Score: ${evaluation.overallScore}%`);

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
          location: simulationState.caseData.case_metadata.location
        }
      },
      sessionSummary: {
        duration: `${duration} minutes`,
        messageCount: simulationState.sessionMetrics.messageCount,
        clinicalActionsCount: simulationState.sessionMetrics.clinicalActionsCount,
        communicationQuality: evaluation.sessionSummary.communicationQuality,
        appropriateActionsPercentage: simulationState.clinicalActions.length > 0 ? 
          Math.round((evaluation.sessionSummary.appropriateActions / simulationState.clinicalActions.length) * 100) : 0
      }
    });
  } catch (error) {
    console.error('❌ Error completing template simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete simulation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Pause template simulation
 */
router.post('/:id/pause', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const simulationState = activeSimulations.get(id);
    if (!simulationState || simulationState.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied'
      });
    }

    if (simulationState.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only pause active simulations'
      });
    }

    simulationState.status = 'paused';
    simulationState.sessionMetrics.pausedAt = new Date();

    // Update database
    await Simulation.findOneAndUpdate(
      { id, userId },
      { 
        status: 'paused',
        'sessionMetrics.pausedAt': new Date(),
        conversationHistory: [
          ...simulationState.conversationHistory,
          {
            sender: 'system',
            message: 'Simulation paused',
            messageType: 'system_feedback',
            timestamp: new Date()
          }
        ]
      }
    );

    res.json({
      success: true,
      message: 'Template simulation paused successfully'
    });
  } catch (error) {
    console.error('❌ Error pausing template simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause simulation'
    });
  }
});

/**
 * Resume template simulation
 */
router.post('/:id/resume', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if simulation exists in memory
    let simulationState = activeSimulations.get(id);
    
    if (!simulationState || simulationState.userId !== userId) {
      // Try to restore from database
      const dbSimulation = await Simulation.findOne({ id, userId });
      if (!dbSimulation) {
        return res.status(404).json({
          success: false,
          error: 'Simulation not found'
        });
      }

      if (dbSimulation.status !== 'paused') {
        return res.status(400).json({
          success: false,
          error: 'Can only resume paused simulations'
        });
      }

      // Attempt to restore simulation state (this is a limitation of memory storage)
      return res.status(410).json({
        success: false,
        error: 'Simulation session expired. Please start a new simulation.',
        code: 'SESSION_EXPIRED'
      });
    }

    if (simulationState.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: 'Can only resume paused simulations'
      });
    }

    simulationState.status = 'active';
    simulationState.sessionMetrics.resumedAt = new Date();

    // Update database
    await Simulation.findOneAndUpdate(
      { id, userId },
      { 
        status: 'active',
        'sessionMetrics.resumedAt': new Date(),
        conversationHistory: [
          ...simulationState.conversationHistory,
          {
            sender: 'system',
            message: 'Simulation resumed',
            messageType: 'system_feedback',
            timestamp: new Date()
          }
        ]
      }
    );

    res.json({
      success: true,
      message: 'Template simulation resumed successfully'
    });
  } catch (error) {
    console.error('❌ Error resuming template simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume simulation'
    });
  }
});

/**
 * Get template simulation status and details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📖 Fetching template simulation: ${id} for user ${userId}`);

    // Check memory first
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
            emotionalTone: simulationState.caseData.patient_persona.emotional_tone
          },
          guardianInfo: simulationState.caseData.patient_persona.speaks_for !== "Self" ? {
            relationship: simulationState.caseData.patient_persona.speaks_for,
            patientAge: simulationState.caseData.patient_persona.patient_age_for_communication
          } : null,
          conversationHistory: simulationState.conversationHistory,
          clinicalActions: simulationState.clinicalActions,
          sessionMetrics: {
            ...simulationState.sessionMetrics,
            currentDuration: Math.round((new Date() - simulationState.sessionMetrics.startTime) / (1000 * 60))
          },
          learningProgress: simulationState.learningProgress,
          evaluationCriteria: Object.keys(simulationState.evaluationCriteria)
        }
      });
    }

    // Check database
    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
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
          chiefComplaint: simulation.patientPersona.patient?.presentation || simulation.patientPersona.chiefComplaint
        },
        guardianInfo: simulation.patientPersona.guardian,
        conversationHistory: simulation.conversationHistory,
        clinicalActions: simulation.clinicalActions,
        sessionMetrics: {
          ...simulation.sessionMetrics,
          currentDuration: simulation.sessionMetrics.totalDuration || 
            Math.round((new Date() - simulation.sessionMetrics.startTime) / (1000 * 60))
        },
        learningProgress: simulation.learningProgress,
        isMemoryExpired: !simulationState && simulation.status === 'active'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching template simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get detailed simulation results (for completed simulations)
 */
router.get('/:id/results', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found'
      });
    }

    if (simulation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Results only available for completed simulations',
        currentStatus: simulation.status
      });
    }

    // Get case data for additional context
    let caseData = null;
    try {
      caseData = await templateCaseService.getCaseById(simulation.caseId);
    } catch (error) {
      console.warn('Could not load case data for results:', error.message);
    }

    // Calculate additional metrics
    const sessionDuration = simulation.sessionMetrics.totalDuration || 0;
    const messageCount = simulation.sessionMetrics.messageCount || 0;
    const clinicalActionsCount = simulation.clinicalActions?.length || 0;
    const averageResponseTime = messageCount > 0 ? Math.round(sessionDuration / messageCount * 60) : 0; // seconds

    res.json({
      success: true,
      results: {
        simulationInfo: {
          id: simulation.id,
          caseId: simulation.caseId,
          caseName: simulation.caseName,
          completedAt: simulation.sessionMetrics.endTime,
          duration: sessionDuration
        },
        performance: {
          overallScore: simulation.learningProgress.overallProgress || 0,
          diagnosticAccuracy: simulation.learningProgress.diagnosticAccuracy || 0,
          communicationScore: simulation.learningProgress.communicationScore || 0,
          clinicalReasoningScore: simulation.learningProgress.clinicalReasoningScore || 0
        },
        sessionMetrics: {
          totalMessages: messageCount,
          clinicalActionsPerformed: clinicalActionsCount,
          averageResponseTime: `${averageResponseTime} seconds`,
          sessionDuration: `${sessionDuration} minutes`
        },
        caseInfo: caseData ? {
          title: caseData.case_metadata.title,
          specialty: caseData.case_metadata.specialty,
          difficulty: caseData.case_metadata.difficulty,
          location: caseData.case_metadata.location,
          hiddenDiagnosis: caseData.clinical_dossier.hidden_diagnosis
        } : null,
        conversationSummary: {
          totalInteractions: simulation.conversationHistory?.length || 0,
          patientResponses: simulation.conversationHistory?.filter(msg => msg.sender === 'patient').length || 0,
          guardianResponses: simulation.conversationHistory?.filter(msg => msg.sender === 'guardian').length || 0,
          studentQuestions: simulation.conversationHistory?.filter(msg => msg.sender === 'student').length || 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching simulation results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation results',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Helper function to get prerequisites based on specialty and difficulty
 */
function getPrerequisites(specialty, difficulty) {
  const prerequisites = {
    'Internal Medicine': {
      'Easy': ['Basic pathophysiology', 'Physical examination skills'],
      'Intermediate': ['Clinical reasoning', 'Diagnostic workup'],
      'Hard': ['Advanced clinical decision making', 'Complex case management']
    },
    'Pediatrics': {
      'Easy': ['Child development', 'Pediatric vital signs'],
      'Intermediate': ['Pediatric pathophysiology', 'Family communication'],
      'Hard': ['Complex pediatric conditions', 'Adolescent medicine']
    },
    'Emergency Medicine': {
      'Easy': ['Triage principles', 'Basic life support'],
      'Intermediate': ['Emergency protocols', 'Rapid assessment'],
      'Hard': ['Critical care', 'Multi-trauma management']
    }
  };

  return prerequisites[specialty]?.[difficulty] || ['Basic medical knowledge'];
}

/**
 * Cleanup expired simulations (run periodically)
 */
function cleanupExpiredSimulations() {
  const now = new Date();
  const expirationTime = 2 * 60 * 60 * 1000; // 2 hours

  for (const [id, simulation] of activeSimulations.entries()) {
    const lastActivity = simulation.sessionMetrics.lastActivity || simulation.sessionMetrics.startTime;
    if (now - lastActivity > expirationTime) {
      console.log(`🧹 Cleaning up expired simulation: ${id}`);
      activeSimulations.delete(id);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupExpiredSimulations, 30 * 60 * 1000);

module.exports = router;