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

    res.json({
      success: true,
      cases,
      filterOptions,
      total: cases.length,
      appliedFilters: filters
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
 * Get specific case details
 */
router.get('/cases/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await templateCaseService.getCaseById(caseId);
    
    // Transform for frontend (hide clinical dossier)
    const publicCaseData = {
      id: caseData.case_metadata.case_id,
      title: caseData.case_metadata.title,
      specialty: caseData.case_metadata.specialty,
      difficulty: caseData.case_metadata.difficulty,
      programArea: caseData.case_metadata.program_area,
      tags: caseData.case_metadata.tags,
      location: caseData.case_metadata.location,
      patientInfo: {
        name: caseData.patient_persona.name,
        age: caseData.patient_persona.age,
        gender: caseData.patient_persona.gender,
        occupation: caseData.patient_persona.occupation,
        chiefComplaint: caseData.patient_persona.chief_complaint,
        emotionalTone: caseData.patient_persona.emotional_tone,
        backgroundStory: caseData.patient_persona.background_story
      },
      description: caseData.description,
      version: caseData.version,
      initialPrompt: caseData.initial_prompt
    };

    res.json({
      success: true,
      case: publicCaseData
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

    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: 'Case ID is required'
      });
    }

    // Check for existing active simulation
    const existingSimulation = await Simulation.findOne({
      userId,
      status: 'active'
    });

    if (existingSimulation) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active simulation. Please complete it first.',
        activeSimulationId: existingSimulation.id
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

    // Create database record
    const simulation = new Simulation({
      id: simulationId,
      userId,
      userRole,
      programArea: simulationState.caseData.case_metadata.program_area,
      caseId,
      caseName: simulationState.caseData.case_metadata.title,
      patientPersona: {
        patient: {
          name: simulationState.caseData.patient_persona.name,
          age: simulationState.caseData.patient_persona.age,
          gender: simulationState.caseData.patient_persona.gender,
          presentation: simulationState.caseData.patient_persona.chief_complaint
        },
        demographics: {
          primaryLanguage: 'English', // Default, could be extracted from case
          location: simulationState.caseData.case_metadata.location
        },
        currentCondition: simulationState.caseData.clinical_dossier.hidden_diagnosis,
        personality: {
          emotionalTone: simulationState.caseData.patient_persona.emotional_tone,
          backgroundStory: simulationState.caseData.patient_persona.background_story
        }
      },
      difficulty: simulationState.caseData.case_metadata.difficulty.toLowerCase(),
      conversationHistory: simulationState.conversationHistory,
      clinicalActions: [],
      learningProgress: simulationState.learningProgress,
      sessionMetrics: simulationState.sessionMetrics,
      status: 'active'
    });

    await simulation.save();

    console.log(`🏥 Template simulation started: ${simulationId} for case ${caseId}`);

    res.status(201).json({
      success: true,
      message: 'Template simulation started successfully',
      simulation: {
        id: simulationId,
        caseId,
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
        conversationHistory: simulationState.conversationHistory,
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

    // Get simulation from memory
    const simulationState = activeSimulations.get(id);
    if (!simulationState || simulationState.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied'
      });
    }

    console.log(`💬 Template message from ${userId}: ${message.substring(0, 50)}...`);

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

    // Add patient response
    if (aiResponse.response) {
      simulationState.conversationHistory.push({
        sender: 'patient',
        message: aiResponse.response,
        messageType: 'chat',
        timestamp: new Date(),
        clinicalInfo: aiResponse.clinicalInfo,
        dialogueMetadata: aiResponse.dialogueMetadata
      });
    }

    // Update metrics
    simulationState.sessionMetrics.messageCount = simulationState.conversationHistory.length;

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
        { status: 'completed', 'sessionMetrics.endTime': new Date() }
      );
    }

    res.json({
      success: true,
      response: aiResponse.response,
      clinicalInfo: aiResponse.clinicalInfo,
      dialogueMetadata: aiResponse.dialogueMetadata,
      conversationHistory: simulationState.conversationHistory.slice(-10),
      sessionMetrics: {
        messageCount: simulationState.sessionMetrics.messageCount,
        duration: Math.round((new Date() - simulationState.sessionMetrics.startTime) / (1000 * 60))
      },
      simulationEnded,
      triggerActivated: aiResponse.triggerActivated
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
 * Complete template simulation and get evaluation
 */
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get simulation from memory
    const simulationState = activeSimulations.get(id);
    if (!simulationState || simulationState.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied'
      });
    }

    console.log(`🏁 Completing template simulation: ${id}`);

    // Generate evaluation
    const evaluation = simulationEngine.evaluatePerformance(simulationState);

    // Update database
    await Simulation.findOneAndUpdate(
      { id, userId },
      {
        status: 'completed',
        'sessionMetrics.endTime': new Date(),
        'sessionMetrics.totalDuration': Math.round(
          (new Date() - simulationState.sessionMetrics.startTime) / (1000 * 60)
        ),
        'learningProgress.overallProgress': evaluation.overallScore,
        feedbackProvided: true
      }
    );

    // Remove from active simulations
    activeSimulations.delete(id);

    res.json({
      success: true,
      message: 'Simulation completed successfully',
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
          hiddenDiagnosis: simulationState.caseData.clinical_dossier.hidden_diagnosis
        }
      },
      sessionSummary: {
        duration: Math.round((new Date() - simulationState.sessionMetrics.startTime) / (1000 * 60)),
        messageCount: simulationState.sessionMetrics.messageCount,
        clinicalActionsCount: simulationState.sessionMetrics.clinicalActionsCount
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
 * Get template simulation status
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check memory first
    const simulationState = activeSimulations.get(id);
    if (simulationState && simulationState.userId === userId) {
      return res.json({
        success: true,
        simulation: {
          id,
          status: 'active',
          caseId: simulationState.caseId,
          caseName: simulationState.caseData.case_metadata.title,
          patientInfo: {
            name: simulationState.caseData.patient_persona.name,
            age: simulationState.caseData.patient_persona.age,
            gender: simulationState.caseData.patient_persona.gender,
            chiefComplaint: simulationState.caseData.patient_persona.chief_complaint
          },
          conversationHistory: simulationState.conversationHistory,
          sessionMetrics: simulationState.sessionMetrics
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
          chiefComplaint: simulation.patientPersona.patient?.presentation
        },
        conversationHistory: simulation.conversationHistory,
        sessionMetrics: simulation.sessionMetrics,
        learningProgress: simulation.learningProgress
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
 * Health check for template routes
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

module.exports = router;