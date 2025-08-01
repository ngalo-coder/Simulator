// ai-patient-sim-core-services/simulation-service/src/routes/simulation.js
const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Simulation = require('../models/Simulation');
const PatientCase = require('../models/PatientCase');
const OpenRouterService = require('../services/openRouterService');
const ReportGenerator = require('../services/reportGenerator');
const { PATIENT_PERSONAS, PROGRAM_AREAS } = require('../data/patientPersonas');
const { authMiddleware, authorize } = require('../middleware/auth');
const DialogueEnhancer = require('../services/dialogue/dialogueEnhancer');
const axios = require('axios');


const router = express.Router();
const openRouterService = new OpenRouterService();
const reportGenerator = new ReportGenerator();

// Health check for simulation service (add this route)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'simulation-service-routes',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    openRouter: !!process.env.OPENROUTER_API_KEY ? 'configured' : 'not-configured'
  });
});

// Test route to verify routing is working
router.get('/test', (req, res) => {
  res.json({
    message: 'Simulation routes are working',
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    personasAvailable: Object.keys(PATIENT_PERSONAS).length,
    samplePersona: Object.keys(PATIENT_PERSONAS)[0]
  });
});

// Debug endpoint to test authentication
router.get('/debug-auth', (req, res) => {
  const token = req.header('Authorization');
  const bearerToken = token?.replace('Bearer ', '');
  
  res.json({
    message: 'Auth debug endpoint',
    timestamp: new Date().toISOString(),
    hasAuthHeader: !!token,
    authHeaderLength: token?.length || 0,
    authHeaderPrefix: token?.substring(0, 20) + '...',
    hasBearerToken: !!bearerToken,
    bearerTokenLength: bearerToken?.length || 0,
    jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    environment: process.env.NODE_ENV
  });
});

// Debug endpoint with auth middleware
router.get('/debug-auth-protected', authMiddleware, (req, res) => {
  res.json({
    message: 'Protected auth debug endpoint',
    timestamp: new Date().toISOString(),
    user: req.user,
    environment: process.env.NODE_ENV
  });
});

// Get available cases - temporarily remove auth for debugging
router.get('/cases', async (req, res) => {
  try {
    console.log('📋 Fetching cases with query:', req.query);
    const { programArea, difficulty, patientType } = req.query;

    let filter = { isActive: true };
    if (programArea) filter.programArea = programArea;
    if (difficulty) filter.difficulty = difficulty;
    if (patientType) filter.patientType = patientType;

    let cases = [];

    // Try to get cases from database first
    try {
      if (mongoose.connection.readyState === 1) {
        cases = await PatientCase.find(filter).select('-systemPrompts').sort({ createdAt: -1 });
        console.log(`📊 Found ${cases.length} cases in database`);
      } else {
        console.log('⚠️ Database not connected, using built-in personas');
      }
    } catch (dbError) {
      console.log('⚠️ Database query failed, using built-in personas:', dbError.message);
    }

    // If no cases in database or database unavailable, return built-in personas
    if (cases.length === 0) {
      console.log('🔄 Using built-in patient personas');
      cases = Object.values(PATIENT_PERSONAS)
        .filter((persona) => {
          if (programArea && persona.programArea !== programArea) return false;
          if (difficulty && persona.difficulty !== difficulty) return false;
          if (patientType && persona.patientType !== patientType) return false;
          return true;
        })
        .map((persona) => ({
          id: persona.id,
          name: persona.chiefComplaint,
          programArea: persona.programArea,
          specialty: persona.specialty,
          difficulty: persona.difficulty,
          patientType: persona.patientType,
          learningObjectives: persona.learningObjectives,
          chiefComplaint: persona.chiefComplaint,
          patientAge: persona.demographics?.age || persona.patient?.age,
          patientName: persona.patient?.name || 'Patient',
          guardianInfo: persona.guardian
            ? {
                name: persona.guardian.name,
                relationship: persona.guardian.relationship,
                primaryLanguage: persona.demographics?.primaryLanguage || 'English',
              }
            : null,
          isBuiltIn: true,
        }));
      
      console.log(`✅ Returning ${cases.length} built-in cases`);
    }

    function generatePhysicalExamFindings(condition, examType, physicalExam) {
      // Realistic physical exam findings based on condition
      const findings = {
        acute_inferior_stemi: {
          general: 'Diaphoretic, anxious, clutching chest',
          cardiac: 'Tachycardic regular rhythm, S4 gallop present, no murmurs',
          lungs: 'Bibasilar fine rales, no wheezes',
          abdomen: 'Soft, non-tender, bowel sounds present',
          extremities: 'No peripheral edema, pulses intact',
          neurological: 'Alert and oriented x3, no focal deficits',
        },
        viral_upper_respiratory_infection: {
          general: 'Fussy but consolable, good color when calm',
          eent: 'Clear rhinorrhea, mildly erythematous throat, no exudate',
          cardiac: 'Tachycardic regular rhythm, no murmurs',
          lungs: 'Clear to auscultation bilaterally',
          abdomen: 'Soft, non-distended, bowel sounds present',
          skin: 'Warm, dry, no rash',
        },
        moderate_asthma_exacerbation: {
          general: 'Mild respiratory distress, sitting upright',
          lungs: 'Expiratory wheeze bilateral, decreased air entry bases',
          cardiac: 'Tachycardic regular rhythm',
          extremities: 'No clubbing or cyanosis',
          peak_flow: '60% of predicted value',
        },
        classic_migraine_with_aura: {
          general: 'Photophobic, phonophobic, appears uncomfortable',
          neurological: 'Cranial nerves II-XII intact, no focal motor deficits',
          neck: 'Supple, no nuchal rigidity or meningismus',
          fundoscopic: 'Discs sharp, no papilledema',
        },
        acute_appendicitis_without_perforation: {
          general: 'Appears ill, guarding abdomen when walking',
          abdomen: "McBurney's point tenderness, positive Rovsing's sign, no rebound",
          bowel_sounds: 'Hypoactive bowel sounds',
          rectal: 'Deferred in pediatric patient',
        },
        ventricular_septal_defect_moderate_with_chf: {
          general: 'Failure to thrive, mild tachypnea at rest',
          cardiac: 'Grade 3/6 systolic murmur at LLSB, thrill palpable',
          lungs: 'Clear, mild subcostal retractions with feeding',
          extremities: 'No cyanosis or clubbing, good perfusion',
        },
      };

      const conditionFindings = findings[condition] || {
        general: 'Physical examination findings documented',
        system_specific: `${examType} examination completed`,
      };

      return {
        category: 'physical_exam',
        findings: conditionFindings,
        examType: examType,
        clinicalSignificance: getExamSignificance(condition, examType),
      };
    }

    function generateLabResults(condition, labType, expectedFindings) {
      const results = {
        acute_inferior_stemi: {
          troponin: { value: '15.2 ng/mL', reference: '<0.04', status: 'CRITICAL HIGH' },
          ck_mb: { value: '45 ng/mL', reference: '<6.3', status: 'HIGH' },
          basic_metabolic: {
            sodium: '138 mEq/L',
            potassium: '4.2 mEq/L',
            chloride: '102 mEq/L',
            co2: '24 mEq/L',
            glucose: '145 mg/dL',
            bun: '18 mg/dL',
            creatinine: '1.1 mg/dL',
          },
          lipid_panel: {
            total_cholesterol: '285 mg/dL',
            ldl: '185 mg/dL',
            hdl: '35 mg/dL',
            triglycerides: '220 mg/dL',
          },
        },
        viral_upper_respiratory_infection: {
          cbc: {
            wbc: '8.5 K/uL (normal)',
            neutrophils: '35%',
            lymphocytes: '55%',
            hemoglobin: '11.2 g/dL',
            platelets: '285 K/uL',
          },
          basic_metabolic: 'Within normal limits for age',
        },
        moderate_asthma_exacerbation: {
          abg: {
            ph: '7.42',
            pco2: '38 mmHg',
            po2: '78 mmHg',
            hco3: '24 mEq/L',
            o2_sat: '92%',
          },
          peak_flow: '180 L/min (60% predicted)',
        },
        acute_appendicitis_without_perforation: {
          cbc: {
            wbc: '14.2 K/uL',
            neutrophils: '78%',
            bands: '8%',
            hemoglobin: '12.1 g/dL',
          },
          basic_metabolic: 'Normal',
          urinalysis: 'Few WBCs, no bacteria',
        },
      };

      const conditionResults = results[condition] || {
        pending: `${labType} results will be available in 30-60 minutes`,
      };

      return {
        category: 'laboratory',
        results: conditionResults,
        orderType: labType,
        interpretation: getLabInterpretation(condition, labType, conditionResults),
      };
    }

    function generateImagingResults(condition, imagingType, expectedFindings) {
      const results = {
        acute_inferior_stemi: {
          chest_xray: {
            findings: 'Mild cardiomegaly, no acute pulmonary edema, clear lung fields',
            impression: 'Borderline cardiac enlargement',
          },
          ecg: {
            findings: 'ST elevation 2-3mm in leads II, III, aVF. Reciprocal depression in I, aVL',
            impression: 'Acute inferior STEMI',
          },
        },
        viral_upper_respiratory_infection: {
          chest_xray: {
            findings: 'Clear lung fields bilaterally, normal cardiac silhouette',
            impression: 'No acute pulmonary process',
          },
        },
        moderate_asthma_exacerbation: {
          chest_xray: {
            findings: 'Hyperinflation, flattened diaphragms, no infiltrates',
            impression: 'Changes consistent with asthma, no pneumonia',
          },
        },
        acute_appendicitis_without_perforation: {
          ultrasound: {
            findings: 'Thickened appendiceal wall (8mm), no free fluid',
            impression: 'Findings consistent with acute appendicitis',
          },
          ct_abdomen: {
            findings: 'Appendiceal wall thickening and periappendiceal fat stranding',
            impression: 'Acute appendicitis without perforation',
          },
        },
        ventricular_septal_defect_moderate_with_chf: {
          chest_xray: {
            findings: 'Cardiomegaly, increased pulmonary vascular markings',
            impression: 'Cardiac enlargement with pulmonary overcirculation',
          },
          echocardiogram: {
            findings: 'Moderate perimembranous VSD (8mm), left-to-right shunt, mild LV enlargement',
            impression: 'Moderate VSD with volume overload',
          },
        },
      };

      const conditionResults = results[condition] || {
        pending: `${imagingType} scheduled, results pending`,
      };

      return {
        category: 'imaging',
        results: conditionResults,
        modality: imagingType,
        clinicalCorrelation: getImagingCorrelation(condition, imagingType),
      };
    }

    function getHistoryRelevance(details, condition) {
      const relevanceMap = {
        acute_inferior_stemi: {
          'chest pain': 'Highly relevant - central to diagnosis',
          smoking: 'Major risk factor for coronary artery disease',
          'family history': 'Important risk stratification',
          medications: 'Critical for treatment planning',
        },
        viral_upper_respiratory_infection: {
          fever: 'Key symptom for viral illness',
          appetite: 'Important for hydration status',
          'daycare exposure': 'Common source of viral infections',
          immunizations: 'Rule out vaccine-preventable diseases',
        },
      };

      const conditionMap = relevanceMap[condition] || {};
      const lowerDetails = details.toLowerCase();

      for (const [key, relevance] of Object.entries(conditionMap)) {
        if (lowerDetails.includes(key)) {
          return relevance;
        }
      }

      return 'Additional clinical context obtained';
    }

    function evaluateDiagnosticAccuracy(diagnosis, actualCondition) {
      const diagnosisMap = {
        acute_inferior_stemi: ['stemi', 'myocardial infarction', 'heart attack', 'mi'],
        viral_upper_respiratory_infection: ['viral', 'uri', 'cold', 'respiratory infection'],
        moderate_asthma_exacerbation: ['asthma', 'bronchospasm', 'reactive airway'],
        classic_migraine_with_aura: ['migraine', 'headache', 'cephalgia'],
        acute_appendicitis_without_perforation: ['appendicitis', 'appendix'],
        ventricular_septal_defect_moderate_with_chf: ['vsd', 'septal defect', 'heart defect'],
      };

      const correctTerms = diagnosisMap[actualCondition] || [];
      const diagnosisLower = diagnosis.toLowerCase();

      const isCorrect = correctTerms.some((term) => diagnosisLower.includes(term));

      return {
        accuracy: isCorrect ? 'correct' : 'needs_review',
        feedback: isCorrect
          ? 'Diagnostic assessment aligns with clinical presentation'
          : 'Consider reviewing clinical findings and differential diagnosis',
        score: isCorrect ? 90 : 60,
      };
    }

    function evaluateTreatmentPlan(plan, condition) {
      const appropriateTreatments = {
        acute_inferior_stemi: [
          'aspirin',
          'clopidogrel',
          'statin',
          'beta blocker',
          'ace inhibitor',
          'cardiac catheterization',
        ],
        viral_upper_respiratory_infection: [
          'supportive care',
          'fluids',
          'rest',
          'fever reducer',
          'follow up',
        ],
        moderate_asthma_exacerbation: [
          'albuterol',
          'corticosteroids',
          'oxygen',
          'peak flow monitoring',
        ],
        classic_migraine_with_aura: ['sumatriptan', 'nsaids', 'rest', 'dark room', 'hydration'],
        acute_appendicitis_without_perforation: [
          'surgery',
          'appendectomy',
          'antibiotics',
          'iv fluids',
        ],
        ventricular_septal_defect_moderate_with_chf: [
          'diuretics',
          'ace inhibitor',
          'nutrition support',
          'cardiology consult',
        ],
      };

      const appropriateList = appropriateTreatments[condition] || [];
      const planLower = plan.toLowerCase();

      const matchedTreatments = appropriateList.filter((treatment) =>
        planLower.includes(treatment)
      );

      const appropriatenessScore =
        matchedTreatments.length > 0
          ? Math.min(100, (matchedTreatments.length / appropriateList.length) * 100)
          : 50;

      return {
        appropriateness: appropriatenessScore > 70 ? 'appropriate' : 'needs_optimization',
        matchedTreatments,
        suggestions: appropriateList.slice(0, 3),
        score: Math.round(appropriatenessScore),
      };
    }

    function getExamSignificance(condition, examType) {
      const significanceMap = {
        acute_inferior_stemi: {
          cardiac: 'Critical for detecting heart failure signs and murmurs',
          pulmonary: 'Important for assessing pulmonary edema',
          general: 'Overall assessment of hemodynamic stability',
        },
        viral_upper_respiratory_infection: {
          general: 'Assess overall appearance and hydration status',
          eent: 'Key to identifying viral vs bacterial causes',
          pulmonary: 'Rule out lower respiratory involvement',
        },
      };

      return significanceMap[condition]?.[examType] || 'Standard physical examination component';
    }

    function getLabInterpretation(condition, labType, results) {
      if (condition === 'acute_inferior_stemi' && labType.includes('cardiac')) {
        return 'Elevated cardiac enzymes confirm myocardial injury';
      }
      if (condition === 'viral_upper_respiratory_infection' && labType.includes('cbc')) {
        return 'Lymphocytic predominance suggests viral etiology';
      }
      return 'Laboratory results provide clinical context';
    }

    function getImagingCorrelation(condition, imagingType) {
      const correlationMap = {
        acute_inferior_stemi: {
          ecg: 'Diagnostic for STEMI location and extent',
          chest_xray: 'Assesses for complications like pulmonary edema',
        },
        acute_appendicitis_without_perforation: {
          ultrasound: 'First-line imaging in pediatric patients',
          ct: 'High sensitivity and specificity for appendicitis',
        },
      };

      return correlationMap[condition]?.[imagingType] || 'Imaging supports clinical assessment';
    }

    res.json({
      success: true,
      cases,
      programAreas: PROGRAM_AREAS,
      total: cases.length,
      filters: {
        programArea: programArea || 'all',
        difficulty: difficulty || 'all',
        patientType: patientType || 'all',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching cases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cases',
    });
  }
});

// Start new simulation
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { caseId, difficulty } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        error: 'Case ID is required',
      });
    }

    // Check if user has an active simulation already
    const activeSimulation = await Simulation.findOne({
      userId,
      status: 'active',
    });

    if (activeSimulation) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active simulation. Please complete it first.',
        activeSimulationId: activeSimulation.id,
      });
    }

    // Get case from database or built-in personas
    let caseData = await PatientCase.findOne({ id: caseId });

    if (!caseData) {
      // Look in built-in personas by ID field
      caseData = Object.values(PATIENT_PERSONAS).find(persona => persona.id === caseId);
      if (!caseData) {
        return res.status(404).json({
          success: false,
          error: 'Case not found',
        });
      }
    }

    // Create new simulation
    const simulationId = uuidv4();
    const simulation = new Simulation({
      id: simulationId,
      userId,
      userRole,
      programArea: caseData.programArea,
      caseId,
      caseName: caseData.chiefComplaint || caseData.name,
      patientPersona: {
        patient: caseData.patient,
        guardian: caseData.guardian,
        demographics: caseData.demographics,
        medicalHistory: caseData.medicalHistory,
        socialHistory: caseData.socialHistory,
        currentCondition: caseData.currentCondition,
        personality: caseData.personality,
        vitalSigns: caseData.vitalSigns,
        physicalExam: caseData.physicalExam,
        culturalFactors: caseData.culturalFactors,
        expectedFindings: caseData.expectedFindings,
        clinicalPearls: caseData.clinicalPearls,
        learningObjectives: caseData.learningObjectives,
        chiefComplaint: caseData.chiefComplaint,
      },
      difficulty: difficulty || caseData.difficulty,
      conversationHistory: [
        {
          sender: 'system',
          message: `Simulation started: ${caseData.chiefComplaint}`,
          messageType: 'system_feedback',
          timestamp: new Date(),
        },
      ],
      clinicalActions: [],
      learningProgress: {
        objectivesCompleted: [],
        clinicalSkillsAssessed: [],
        diagnosticAccuracy: 0,
        communicationScore: 0,
        overallProgress: 0,
      },
      sessionMetrics: {
        startTime: new Date(),
        messageCount: 0,
        clinicalActionsCount: 0,
      },
    });

    await simulation.save();
    console.log(`🏥 New simulation started: ${simulationId} for user ${userId}`);

    // Generate initial patient/guardian presentation
    const initialContext = `This is the beginning of the medical encounter. The patient/guardian has just arrived at your clinic/hospital. Please provide a natural opening statement that establishes the scene and presents the chief complaint. Remember to stay in character based on your persona.`;

    const initialResponse = await openRouterService.generatePatientResponse(
      simulation,
      initialContext
    );

    // Add initial responses to conversation
    if (initialResponse.patientResponse) {
      simulation.conversationHistory.push({
        sender: 'patient',
        message: initialResponse.patientResponse,
        clinicalInfo: initialResponse.clinicalInfo,
        messageType: 'chat',
        timestamp: new Date(),
      });
    }

    if (initialResponse.guardianResponse) {
      simulation.conversationHistory.push({
        sender: 'guardian',
        message: initialResponse.guardianResponse,
        messageType: 'chat',
        timestamp: new Date(),
      });
    }

    simulation.sessionMetrics.messageCount = simulation.conversationHistory.length;
    await simulation.save();

    res.status(201).json({
      success: true,
      message: 'Simulation started successfully',
      simulation: {
        id: simulation.id,
        caseId: simulation.caseId,
        caseName: simulation.caseName,
        programArea: simulation.programArea,
        difficulty: simulation.difficulty,
        status: simulation.status,
        patientInfo: {
          name: simulation.patientPersona.patient?.name,
          age: simulation.patientPersona.patient?.age,
          gender: simulation.patientPersona.patient?.gender,
          chiefComplaint: simulation.patientPersona.chiefComplaint,
        },
        guardianInfo: simulation.patientPersona.guardian
          ? {
              name: simulation.patientPersona.guardian.name,
              relationship: simulation.patientPersona.guardian.relationship,
              primaryLanguage: simulation.patientPersona.demographics?.primaryLanguage || 'English',
              anxietyLevel: simulation.patientPersona.guardian.anxietyLevel,
            }
          : null,
        conversationHistory: simulation.conversationHistory,
        learningObjectives: simulation.patientPersona.learningObjectives,
        vitalSigns: simulation.patientPersona.vitalSigns,
      },
    });
  } catch (error) {
    console.error('❌ Error starting simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start simulation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Send message to patient/guardian
router.post('/:id/message', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, messageType = 'chat' } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and cannot be empty',
      });
    }

    // Find simulation
    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied',
      });
    }

    if (simulation.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Simulation is ${simulation.status}, not active`,
      });
    }

    console.log(`💬 Enhanced message from ${userId} in simulation ${id}: ${message.substring(0, 50)}...`);

    // Add student message to conversation
    simulation.conversationHistory.push({
      sender: 'student',
      message: message.trim(),
      messageType,
      timestamp: new Date(),
    });

    // Generate AI response with dialogue enhancement
    const aiResponse = await openRouterService.generatePatientResponse(simulation, message);

    let responseCount = 0;

    // Add patient response with enhanced metadata
    if (aiResponse.patientResponse) {
      simulation.conversationHistory.push({
        sender: 'patient',
        message: aiResponse.patientResponse,
        clinicalInfo: aiResponse.clinicalInfo,
        messageType: 'chat',
        timestamp: new Date(),
        // ADD ENHANCED METADATA
        dialogueMetadata: {
          emotionalState: aiResponse.dialogueMetadata?.patientEmotionalState,
          physicalCues: aiResponse.dialogueMetadata?.physicalCues || [],
          culturalElements: aiResponse.dialogueMetadata?.culturalElements || [],
          responseDelay: aiResponse.dialogueMetadata?.responseDelays?.patient || 1000
        }
      });
      responseCount++;
    }

    // Add guardian response if present with enhanced metadata
    if (aiResponse.guardianResponse) {
      simulation.conversationHistory.push({
        sender: 'guardian',
        message: aiResponse.guardianResponse,
        messageType: 'chat',
        timestamp: new Date(),
        // ADD ENHANCED METADATA
        dialogueMetadata: {
          emotionalState: aiResponse.dialogueMetadata?.guardianEmotionalState,
          culturalElements: aiResponse.dialogueMetadata?.culturalElements || [],
          responseDelay: aiResponse.dialogueMetadata?.responseDelays?.guardian || 1000
        }
      });
      responseCount++;
    }

    // Update metrics and progress
    simulation.sessionMetrics.messageCount = simulation.conversationHistory.length;
    simulation.updatedAt = new Date();

    // Enhanced progress tracking with dialogue quality
    if (aiResponse.clinicalInfo && Object.keys(aiResponse.clinicalInfo).length > 0) {
      const communicationScore = calculateEnhancedCommunicationScore(
        simulation.conversationHistory, 
        aiResponse.dialogueMetadata
      );
      simulation.learningProgress.communicationScore = communicationScore;
    }

    await simulation.save();

    res.json({
      success: true,
      responses: {
        patient: aiResponse.patientResponse,
        guardian: aiResponse.guardianResponse,
        clinicalInfo: aiResponse.clinicalInfo,
        // ADD ENHANCED RESPONSE METADATA
        dialogueEnhancements: {
          patientEmotionalState: aiResponse.dialogueMetadata?.patientEmotionalState,
          guardianEmotionalState: aiResponse.dialogueMetadata?.guardianEmotionalState,
          physicalCues: aiResponse.dialogueMetadata?.physicalCues || [],
          culturalElements: aiResponse.dialogueMetadata?.culturalElements || [],
          responseTimings: aiResponse.dialogueMetadata?.responseDelays || {}
        }
      },
      conversationHistory: simulation.conversationHistory.slice(-20),
      sessionMetrics: {
        messageCount: simulation.sessionMetrics.messageCount,
        duration: Math.round((new Date() - simulation.sessionMetrics.startTime) / (1000 * 60)),
      },
    });
  } catch (error) {
    console.error('❌ Error sending enhanced message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Perform clinical action (history, physical exam, orders)
router.post('/:id/action', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, details, category } = req.body;
    const userId = req.user.id;

    const validActions = [
      'history_taking',
      'physical_exam',
      'order_labs',
      'order_imaging',
      'diagnosis',
      'treatment_plan',
    ];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action type',
        validActions,
      });
    }

    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied',
      });
    }

    if (simulation.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Simulation is not active',
      });
    }

    console.log(`🔬 Clinical action by ${userId}: ${action} - ${details}`);

    // Create clinical action
    const clinicalAction = {
      action,
      details: details || '',
      category: category || getActionCategory(action),
      timestamp: new Date(),
    };

    // Generate realistic results based on the patient's condition
    clinicalAction.result = await generateClinicalResult(
      action,
      details,
      simulation.patientPersona
    );

    simulation.clinicalActions.push(clinicalAction);
    simulation.sessionMetrics.clinicalActionsCount = simulation.clinicalActions.length;

    // Add system message about the action
    const actionMessage = formatActionMessage(action, details, clinicalAction.result);
    simulation.conversationHistory.push({
      sender: 'system',
      message: actionMessage,
      messageType: 'action',
      timestamp: new Date(),
    });

    // Update learning progress based on action appropriateness
    updateLearningProgress(simulation, action, clinicalAction.result);

    await simulation.save();

    res.json({
      success: true,
      action: clinicalAction,
      systemMessage: actionMessage,
      learningProgress: simulation.learningProgress,
    });
  } catch (error) {
    console.error('❌ Error performing clinical action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform clinical action',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Get simulation details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied',
      });
    }

    // Calculate current session duration
    const currentDuration = simulation.sessionMetrics.endTime
      ? simulation.sessionMetrics.totalDuration
      : Math.round((new Date() - simulation.sessionMetrics.startTime) / (1000 * 60));

    res.json({
      success: true,
      simulation: {
        id: simulation.id,
        caseId: simulation.caseId,
        caseName: simulation.caseName,
        programArea: simulation.programArea,
        difficulty: simulation.difficulty,
        status: simulation.status,
        patientInfo: {
          name: simulation.patientPersona.patient?.name,
          age: simulation.patientPersona.patient?.age,
          gender: simulation.patientPersona.patient?.gender,
          vitalSigns: simulation.patientPersona.vitalSigns,
        },
        guardianInfo: simulation.patientPersona.guardian,
        conversationHistory: simulation.conversationHistory,
        clinicalActions: simulation.clinicalActions,
        learningProgress: simulation.learningProgress,
        learningObjectives: simulation.patientPersona.learningObjectives,
        sessionMetrics: {
          ...simulation.sessionMetrics,
          currentDuration: `${currentDuration} minutes`,
        },
        createdAt: simulation.createdAt,
        updatedAt: simulation.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation',
    });
  }
});

// Pause simulation
router.post('/:id/pause', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
    }

    if (simulation.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only pause active simulations',
      });
    }

    simulation.status = 'paused';
    simulation.conversationHistory.push({
      sender: 'system',
      message: 'Simulation paused',
      messageType: 'system_feedback',
      timestamp: new Date(),
    });

    await simulation.save();

    res.json({
      success: true,
      message: 'Simulation paused successfully',
    });
  } catch (error) {
    console.error('❌ Error pausing simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause simulation',
    });
  }
});

// Resume simulation
router.post('/:id/resume', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
    }

    if (simulation.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: 'Can only resume paused simulations',
      });
    }

    simulation.status = 'active';
    simulation.conversationHistory.push({
      sender: 'system',
      message: 'Simulation resumed',
      messageType: 'system_feedback',
      timestamp: new Date(),
    });

    await simulation.save();

    res.json({
      success: true,
      message: 'Simulation resumed successfully',
    });
  } catch (error) {
    console.error('❌ Error resuming simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume simulation',
    });
  }
});

// End simulation and provide feedback
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'completed' } = req.body;
    const userId = req.user.id;

    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
    }

    if (simulation.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Simulation already completed',
      });
    }

    console.log(`🏁 Completing simulation ${id} for user ${userId}, reason: ${reason}`);

    // Calculate session duration
    const endTime = new Date();
    const duration = Math.round((endTime - simulation.sessionMetrics.startTime) / (1000 * 60)); // minutes

    // Generate AI feedback
    let feedback = 'Simulation completed. Please review your performance with your instructor.';
    try {
      feedback = await openRouterService.generateClinicalFeedback(
        simulation,
        simulation.clinicalActions
      );
    } catch (feedbackError) {
      console.error('⚠️ Feedback generation failed:', feedbackError.message);
    }

    // Calculate final scores
    const finalScores = calculateFinalScores(simulation);

    // Update simulation
    simulation.status = 'completed';
    simulation.sessionMetrics.endTime = endTime;
    simulation.sessionMetrics.totalDuration = duration;
    simulation.feedbackProvided = true;
    simulation.learningProgress = { ...simulation.learningProgress, ...finalScores };

    // Add feedback to conversation
    simulation.conversationHistory.push({
      sender: 'system',
      message: feedback,
      messageType: 'system_feedback',
      timestamp: new Date(),
    });

    await simulation.save();

    res.json({
      success: true,
      message: 'Simulation completed successfully',
      feedback,
      sessionSummary: {
        duration: `${duration} minutes`,
        messagesExchanged: simulation.sessionMetrics.messageCount,
        clinicalActions: simulation.sessionMetrics.clinicalActionsCount,
        completionStatus: simulation.status,
        finalScores: finalScores,
      },
      learningProgress: simulation.learningProgress,
    });
  } catch (error) {
    console.error('❌ Error completing simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete simulation',
    });
  }
});

// Get user's simulation history
router.get('/user/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, programArea } = req.query;

    let filter = { userId };
    if (status) filter.status = status;
    if (programArea) filter.programArea = programArea;

    const simulations = await Simulation.find(filter)
      .select(
        'id caseName programArea difficulty status sessionMetrics learningProgress createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Simulation.countDocuments(filter);

    // Add calculated fields
    const enrichedSimulations = simulations.map((sim) => ({
      ...sim.toObject(),
      duration: sim.sessionMetrics.totalDuration
        ? `${sim.sessionMetrics.totalDuration} minutes`
        : 'In progress',
      overallScore: sim.learningProgress.overallProgress || 0,
    }));

    res.json({
      success: true,
      simulations: enrichedSimulations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        totalSimulations: total,
        completedSimulations: await Simulation.countDocuments({ userId, status: 'completed' }),
        activeSimulations: await Simulation.countDocuments({ userId, status: 'active' }),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching simulation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation history',
    });
  }
});

// Get program areas and statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Promise.all([
      Simulation.countDocuments({ userId }),
      Simulation.countDocuments({ userId, status: 'completed' }),
      Simulation.countDocuments({ userId, status: 'active' }),
      Simulation.aggregate([
        { $match: { userId, status: 'completed' } },
        {
          $group: {
            _id: '$programArea',
            count: { $sum: 1 },
            avgProgress: { $avg: '$learningProgress.overallProgress' },
          },
        },
      ]),
    ]);

    const [total, completed, active, programStats] = stats;

    res.json({
      success: true,
      overview: {
        totalSimulations: total,
        completedSimulations: completed,
        activeSimulations: active,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      programBreakdown: programStats.map((stat) => ({
        programArea: stat._id,
        simulationsCompleted: stat.count,
        averageProgress: Math.round(stat.avgProgress || 0),
      })),
      availablePrograms: Object.keys(PROGRAM_AREAS).map((key) => ({
        key,
        name: PROGRAM_AREAS[key].name,
        levels: PROGRAM_AREAS[key].levels,
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

// Helper functions
function getActionCategory(action) {
  const categories = {
    history_taking: 'assessment',
    physical_exam: 'assessment',
    order_labs: 'diagnostic',
    order_imaging: 'diagnostic',
    diagnosis: 'clinical_reasoning',
    treatment_plan: 'management',
  };
  return categories[action] || 'other';
}

function formatActionMessage(action, details, result) {
  const actionNames = {
    history_taking: 'History Taking',
    physical_exam: 'Physical Examination',
    order_labs: 'Laboratory Orders',
    order_imaging: 'Imaging Orders',
    diagnosis: 'Diagnostic Assessment',
    treatment_plan: 'Treatment Planning',
  };

  let message = `${actionNames[action] || action}: ${details}`;

  if (result && typeof result === 'object') {
    if (result.findings) {
      message += `\n\nFindings: ${result.findings}`;
    }
    if (result.values) {
      message += `\n\nResults: ${JSON.stringify(result.values, null, 2)}`;
    }
  }

  return message;
}

function calculateEnhancedCommunicationScore(conversationHistory, dialogueMetadata) {
  // Simple scoring based on interaction quality
  const studentMessages = conversationHistory.filter((msg) => msg.sender === 'student');
  const totalMessages = studentMessages.length;

  if (totalMessages === 0) return 0;

  // Basic scoring criteria
  let score = 0;
  studentMessages.forEach((msg) => {
    const message = msg.message.toLowerCase();

    // Positive indicators
    if (message.includes('how are you feeling') || message.includes('tell me about')) score += 5;
    if (message.includes('when did') || message.includes('how long')) score += 3;
    if (message.includes('can you describe') || message.includes('what does it feel like'))
      score += 4;
    if (message.includes('thank you') || message.includes('i understand')) score += 2;

    // Length and thoughtfulness
    if (message.length > 50) score += 2;
    if (message.split(' ').length > 10) score += 1;
  });

  return Math.min(100, Math.round((score / totalMessages) * 10));
}

function calculateCommunicationScore(conversationHistory) {
  // Simple scoring based on interaction quality
  const studentMessages = conversationHistory.filter((msg) => msg.sender === 'student');
  const totalMessages = studentMessages.length;

  if (totalMessages === 0) return 0;

  // Basic scoring criteria
  let score = 0;
  studentMessages.forEach((msg) => {
    const message = msg.message.toLowerCase();

    // Positive indicators
    if (message.includes('how are you feeling') || message.includes('tell me about')) score += 5;
    if (message.includes('when did') || message.includes('how long')) score += 3;
    if (message.includes('can you describe') || message.includes('what does it feel like'))
      score += 4;
    if (message.includes('thank you') || message.includes('i understand')) score += 2;

    // Length and thoughtfulness
    if (message.length > 50) score += 2;
    if (message.split(' ').length > 10) score += 1;
  });

  return Math.min(100, Math.round((score / totalMessages) * 10));
}

function updateLearningProgress(simulation, action, result) {
  // Update based on clinical actions taken
  const skillMapping = {
    history_taking: 'History Taking',
    physical_exam: 'Physical Examination',
    order_labs: 'Laboratory Interpretation',
    order_imaging: 'Diagnostic Imaging',
    diagnosis: 'Clinical Reasoning',
    treatment_plan: 'Treatment Planning',
  };

  const skill = skillMapping[action];
  if (skill) {
    const existingSkill = simulation.learningProgress.clinicalSkillsAssessed.find(
      (s) => s.skill === skill
    );
    if (existingSkill) {
      // Update existing skill assessment
      existingSkill.assessmentDate = new Date();
    } else {
      // Add new skill assessment
      simulation.learningProgress.clinicalSkillsAssessed.push({
        skill,
        competencyLevel: 'competent', // This would be more sophisticated in production
        assessmentDate: new Date(),
      });
    }
  }

  // Update overall progress
  const progressWeights = {
    messageCount: 0.3,
    clinicalActions: 0.4,
    communication: 0.3,
  };

  const messageProgress = Math.min(100, (simulation.sessionMetrics.messageCount / 20) * 100);
  const actionProgress = Math.min(100, (simulation.sessionMetrics.clinicalActionsCount / 10) * 100);
  const commProgress = simulation.learningProgress.communicationScore || 0;

  simulation.learningProgress.overallProgress = Math.round(
    messageProgress * progressWeights.messageCount +
      actionProgress * progressWeights.clinicalActions +
      commProgress * progressWeights.communication
  );
}

function calculateFinalScores(simulation) {
  const { conversationHistory, clinicalActions, learningProgress } = simulation;

  // Communication effectiveness
  const communicationScore = calculateCommunicationScore(conversationHistory);

  // Clinical reasoning score based on actions taken
  const expectedActions = ['history_taking', 'physical_exam', 'order_labs'];
  const actionsTaken = clinicalActions.map((a) => a.action);
  const clinicalScore = Math.round(
    (expectedActions.filter((action) => actionsTaken.includes(action)).length /
      expectedActions.length) *
      100
  );

  // Overall diagnostic accuracy (simplified)
  const diagnosticScore = clinicalActions.some((a) => a.action === 'diagnosis') ? 85 : 60;

  return {
    communicationScore,
    clinicalReasoningScore: clinicalScore,
    diagnosticAccuracy: diagnosticScore,
    overallProgress: Math.round((communicationScore + clinicalScore + diagnosticScore) / 3),
  };
}

// Helper function to generate clinical results
async function generateClinicalResult(action, details, patientPersona) {
  const { currentCondition, vitalSigns, physicalExam, expectedFindings } = patientPersona;

  switch (action) {
    case 'physical_exam':
      return generatePhysicalExamFindings(currentCondition, details, physicalExam);

    case 'order_labs':
      return generateLabResults(currentCondition, details, expectedFindings);

    case 'order_imaging':
      return generateImagingResults(currentCondition, details, expectedFindings);

    case 'history_taking':
      return {
        category: 'history',
        findings: `Additional history obtained regarding ${details}`,
        clinicalRelevance: getHistoryRelevance(details, currentCondition),
      };

    case 'diagnosis':
      return {
        category: 'diagnosis',
        assessment: details,
        accuracy: evaluateDiagnosticAccuracy(details, currentCondition),
      };

    case 'treatment_plan':
      return {
        category: 'treatment',
        plan: details,
        appropriateness: evaluateTreatmentPlan(details, currentCondition),
      };

    default:
      return {
        category: 'general',
        status: 'completed',
        details: `${action} performed: ${details}`,
      };
  }
}

function generatePhysicalExamFindings(condition, examType, physicalExam) {
  // Realistic physical exam findings based on condition
  const findings = {
    acute_inferior_stemi: {
      general: 'Diaphoretic, anxious, clutching chest',
      cardiac: 'Tachycardic regular rhythm, S4 gallop present, no murmurs',
      lungs: 'Bibasilar fine rales, no wheezes',
      abdomen: 'Soft, non-tender, bowel sounds present',
      extremities: 'No peripheral edema, pulses intact',
      neurological: 'Alert and oriented x3, no focal deficits',
    },
    viral_upper_respiratory_infection: {
      general: 'Fussy but consolable, good color when calm',
      eent: 'Clear rhinorrhea, mildly erythematous throat, no exudate',
      cardiac: 'Tachycardic regular rhythm, no murmurs',
      lungs: 'Clear to auscultation bilaterally',
      abdomen: 'Soft, non-distended, bowel sounds present',
      skin: 'Warm, dry, no rash',
    },
    moderate_asthma_exacerbation: {
      general: 'Mild respiratory distress, sitting upright',
      lungs: 'Expiratory wheeze bilateral, decreased air entry bases',
      cardiac: 'Tachycardic regular rhythm',
      extremities: 'No clubbing or cyanosis',
      peak_flow: '60% of predicted value',
    },
    classic_migraine_with_aura: {
      general: 'Photophobic, phonophobic, appears uncomfortable',
      neurological: 'Cranial nerves II-XII intact, no focal motor deficits',
      neck: 'Supple, no nuchal rigidity or meningismus',
      fundoscopic: 'Discs sharp, no papilledema',
    },
    acute_appendicitis_without_perforation: {
      general: 'Appears ill, guarding abdomen when walking',
      abdomen: 'McBurney point tenderness, positive Rovsing sign, no rebound',
      bowel_sounds: 'Hypoactive bowel sounds',
      rectal: 'Deferred in pediatric patient',
    },
    ventricular_septal_defect_moderate_with_chf: {
      general: 'Failure to thrive, mild tachypnea at rest',
      cardiac: 'Grade 3/6 systolic murmur at LLSB, thrill palpable',
      lungs: 'Clear, mild subcostal retractions with feeding',
      extremities: 'No cyanosis or clubbing, good perfusion',
    },
    adjustment_disorder_substance_experimentation: {
      general: 'Well-appearing adolescent, appropriate dress and hygiene',
      psychiatric: 'Cooperative but guarded, normal speech and thought process',
      neurological: 'Alert and oriented x3, no focal deficits',
    },
    major_depressive_episode_with_self_harm: {
      general: 'Thin-appearing, minimal eye contact, appears sad',
      psychiatric: 'Depressed mood, constricted affect, denies current SI',
      arms: 'Multiple superficial healing cuts on bilateral wrists',
    },
    closed_radius_ulna_fracture_no_other_injuries: {
      xray_forearm: 'Urgent - needed for fracture assessment and surgical planning',
    },
  };

  return urgencyMap[condition]?.[imagingType] || 'Routine - order based on clinical indication';
}
function getExpectedActions(condition) {
  const expectedActionsMap = {
    acute_inferior_stemi: [
      'history_taking',
      'physical_exam',
      'order_labs',
      'order_imaging',
      'diagnosis',
      'treatment_plan',
    ],
    viral_upper_respiratory_infection: [
      'history_taking',
      'physical_exam',
      'diagnosis',
      'treatment_plan',
    ],
    moderate_asthma_exacerbation: [
      'history_taking',
      'physical_exam',
      'order_labs',
      'diagnosis',
      'treatment_plan',
    ],
    classic_migraine_with_aura: ['history_taking', 'physical_exam', 'diagnosis', 'treatment_plan'],
    acute_appendicitis_without_perforation: [
      'history_taking',
      'physical_exam',
      'order_labs',
      'order_imaging',
      'diagnosis',
      'treatment_plan',
    ],
    ventricular_septal_defect_moderate_with_chf: [
      'history_taking',
      'physical_exam',
      'order_labs',
      'order_imaging',
      'diagnosis',
      'treatment_plan',
    ],
  };

  return (
    expectedActionsMap[condition] || [
      'history_taking',
      'physical_exam',
      'diagnosis',
      'treatment_plan',
    ]
  );
}

// Add these helper functions at the END of your simulation-service/src/routes/simulation.js file
// (after all the routes but before module.exports)

// Helper function to generate clinical results
async function generateClinicalResult(action, details, patientPersona) {
  const { currentCondition, vitalSigns, physicalExam, expectedFindings } = patientPersona;

  switch (action) {
    case 'physical_exam':
      return generatePhysicalExamFindings(currentCondition, details, physicalExam);

    case 'order_labs':
      return generateLabResults(currentCondition, details, expectedFindings);

    case 'order_imaging':
      return generateImagingResults(currentCondition, details, expectedFindings);

    case 'history_taking':
      return {
        category: 'history',
        findings: `Additional history obtained regarding ${details}`,
        clinicalRelevance: getHistoryRelevance(details, currentCondition),
      };

    case 'diagnosis':
      return {
        category: 'diagnosis',
        assessment: details,
        accuracy: evaluateDiagnosticAccuracy(details, currentCondition),
      };

    case 'treatment_plan':
      return {
        category: 'treatment',
        plan: details,
        appropriateness: evaluateTreatmentPlan(details, currentCondition),
      };

    default:
      return {
        category: 'general',
        status: 'completed',
        details: `${action} performed: ${details}`,
      };
  }
}

function generatePhysicalExamFindings(condition, examType, physicalExam) {
  // Realistic physical exam findings based on condition
  const findings = {
    acute_inferior_stemi: {
      general: 'Diaphoretic, anxious, clutching chest',
      cardiac: 'Tachycardic regular rhythm, S4 gallop present, no murmurs',
      lungs: 'Bibasilar fine rales, no wheezes',
      abdomen: 'Soft, non-tender, bowel sounds present',
      extremities: 'No peripheral edema, pulses intact',
      neurological: 'Alert and oriented x3, no focal deficits',
    },
    viral_upper_respiratory_infection: {
      general: 'Fussy but consolable, good color when calm',
      eent: 'Clear rhinorrhea, mildly erythematous throat, no exudate',
      cardiac: 'Tachycardic regular rhythm, no murmurs',
      lungs: 'Clear to auscultation bilaterally',
      abdomen: 'Soft, non-distended, bowel sounds present',
      skin: 'Warm, dry, no rash',
    },
    moderate_asthma_exacerbation: {
      general: 'Mild respiratory distress, sitting upright',
      lungs: 'Expiratory wheeze bilateral, decreased air entry bases',
      cardiac: 'Tachycardic regular rhythm',
      extremities: 'No clubbing or cyanosis',
      peak_flow: '60% of predicted value',
    },
    classic_migraine_with_aura: {
      general: 'Photophobic, phonophobic, appears uncomfortable',
      neurological: 'Cranial nerves II-XII intact, no focal motor deficits',
      neck: 'Supple, no nuchal rigidity or meningismus',
      fundoscopic: 'Discs sharp, no papilledema',
    },
    acute_appendicitis_without_perforation: {
      general: 'Appears ill, guarding abdomen when walking',
      abdomen: "McBurney's point tenderness, positive Rovsing's sign, no rebound",
      bowel_sounds: 'Hypoactive bowel sounds',
      rectal: 'Deferred in pediatric patient',
    },
    ventricular_septal_defect_moderate_with_chf: {
      general: 'Failure to thrive, mild tachypnea at rest',
      cardiac: 'Grade 3/6 systolic murmur at LLSB, thrill palpable',
      lungs: 'Clear, mild subcostal retractions with feeding',
      extremities: 'No cyanosis or clubbing, good perfusion',
    },
  };

  const conditionFindings = findings[condition] || {
    general: 'Physical examination findings documented',
    system_specific: `${examType} examination completed`,
  };

  return {
    category: 'physical_exam',
    findings: conditionFindings,
    examType: examType,
    clinicalSignificance: getExamSignificance(condition, examType),
  };
}

function generateLabResults(condition, labType, expectedFindings) {
  const results = {
    acute_inferior_stemi: {
      troponin: { value: '15.2 ng/mL', reference: '<0.04', status: 'CRITICAL HIGH' },
      ck_mb: { value: '45 ng/mL', reference: '<6.3', status: 'HIGH' },
      basic_metabolic: {
        sodium: '138 mEq/L',
        potassium: '4.2 mEq/L',
        chloride: '102 mEq/L',
        co2: '24 mEq/L',
        glucose: '145 mg/dL',
        bun: '18 mg/dL',
        creatinine: '1.1 mg/dL',
      },
    },
    viral_upper_respiratory_infection: {
      cbc: {
        wbc: '8.5 K/uL (normal)',
        neutrophils: '35%',
        lymphocytes: '55%',
        hemoglobin: '11.2 g/dL',
        platelets: '285 K/uL',
      },
      basic_metabolic: 'Within normal limits for age',
    },
    moderate_asthma_exacerbation: {
      abg: {
        ph: '7.42',
        pco2: '38 mmHg',
        po2: '78 mmHg',
        hco3: '24 mEq/L',
        o2_sat: '92%',
      },
      peak_flow: '180 L/min (60% predicted)',
    },
    acute_appendicitis_without_perforation: {
      cbc: {
        wbc: '14.2 K/uL',
        neutrophils: '78%',
        bands: '8%',
        hemoglobin: '12.1 g/dL',
      },
      basic_metabolic: 'Normal',
      urinalysis: 'Few WBCs, no bacteria',
    },
  };

  const conditionResults = results[condition] || {
    pending: `${labType} results will be available in 30-60 minutes`,
  };

  return {
    category: 'laboratory',
    results: conditionResults,
    orderType: labType,
    interpretation: getLabInterpretation(condition, labType, conditionResults),
  };
}

function generateImagingResults(condition, imagingType, expectedFindings) {
  const results = {
    acute_inferior_stemi: {
      chest_xray: {
        findings: 'Mild cardiomegaly, no acute pulmonary edema, clear lung fields',
        impression: 'Borderline cardiac enlargement',
      },
      ecg: {
        findings: 'ST elevation 2-3mm in leads II, III, aVF. Reciprocal depression in I, aVL',
        impression: 'Acute inferior STEMI',
      },
    },
    viral_upper_respiratory_infection: {
      chest_xray: {
        findings: 'Clear lung fields bilaterally, normal cardiac silhouette',
        impression: 'No acute pulmonary process',
      },
    },
    moderate_asthma_exacerbation: {
      chest_xray: {
        findings: 'Hyperinflation, flattened diaphragms, no infiltrates',
        impression: 'Changes consistent with asthma, no pneumonia',
      },
    },
    acute_appendicitis_without_perforation: {
      ultrasound: {
        findings: 'Thickened appendiceal wall (8mm), no free fluid',
        impression: 'Findings consistent with acute appendicitis',
      },
      ct_abdomen: {
        findings: 'Appendiceal wall thickening and periappendiceal fat stranding',
        impression: 'Acute appendicitis without perforation',
      },
    },
    ventricular_septal_defect_moderate_with_chf: {
      chest_xray: {
        findings: 'Cardiomegaly, increased pulmonary vascular markings',
        impression: 'Cardiac enlargement with pulmonary overcirculation',
      },
      echocardiogram: {
        findings: 'Moderate perimembranous VSD (8mm), left-to-right shunt, mild LV enlargement',
        impression: 'Moderate VSD with volume overload',
      },
    },
  };

  const conditionResults = results[condition] || {
    pending: `${imagingType} scheduled, results pending`,
  };

  return {
    category: 'imaging',
    results: conditionResults,
    modality: imagingType,
    clinicalCorrelation: getImagingCorrelation(condition, imagingType),
  };
}

function getHistoryRelevance(details, condition) {
  const relevanceMap = {
    acute_inferior_stemi: {
      'chest pain': 'Highly relevant - central to diagnosis',
      'smoking': 'Major risk factor for coronary artery disease',
      'family history': 'Important risk stratification',
      'medications': 'Critical for treatment planning',
    },
    viral_upper_respiratory_infection: {
      'fever': 'Key symptom for viral illness',
      'appetite': 'Important for hydration status',
      'daycare exposure': 'Common source of viral infections',
      'immunizations': 'Rule out vaccine-preventable diseases',
    },
    moderate_asthma_exacerbation: {
      'triggers': 'Important for identifying precipitating factors',
      'inhaler use': 'Assessment of current treatment adequacy',
      'previous attacks': 'Risk stratification for severity',
    },
    acute_appendicitis_without_perforation: {
      'abdominal pain': 'Central symptom for diagnosis',
      'nausea': 'Common associated symptom',
      'fever': 'May indicate progression',
    },
  };

  const conditionMap = relevanceMap[condition] || {};
  const lowerDetails = details.toLowerCase();

  for (const [key, relevance] of Object.entries(conditionMap)) {
    if (lowerDetails.includes(key)) {
      return relevance;
    }
  }

  return 'Additional clinical context obtained';
}

function evaluateDiagnosticAccuracy(diagnosis, actualCondition) {
  const diagnosisMap = {
    acute_inferior_stemi: ['stemi', 'myocardial infarction', 'heart attack', 'mi'],
    viral_upper_respiratory_infection: ['viral', 'uri', 'cold', 'respiratory infection'],
    moderate_asthma_exacerbation: ['asthma', 'bronchospasm', 'reactive airway'],
    classic_migraine_with_aura: ['migraine', 'headache', 'cephalgia'],
    acute_appendicitis_without_perforation: ['appendicitis', 'appendix'],
    ventricular_septal_defect_moderate_with_chf: ['vsd', 'septal defect', 'heart defect'],
  };

  const correctTerms = diagnosisMap[actualCondition] || [];
  const diagnosisLower = diagnosis.toLowerCase();

  const isCorrect = correctTerms.some((term) => diagnosisLower.includes(term));

  return {
    accuracy: isCorrect ? 'correct' : 'needs_review',
    feedback: isCorrect
      ? 'Diagnostic assessment aligns with clinical presentation'
      : 'Consider reviewing clinical findings and differential diagnosis',
    score: isCorrect ? 90 : 60,
  };
}

function evaluateTreatmentPlan(plan, condition) {
  const appropriateTreatments = {
    acute_inferior_stemi: [
      'aspirin',
      'clopidogrel',
      'statin',
      'beta blocker',
      'ace inhibitor',
      'cardiac catheterization',
    ],
    viral_upper_respiratory_infection: [
      'supportive care',
      'fluids',
      'rest',
      'fever reducer',
      'follow up',
    ],
    moderate_asthma_exacerbation: [
      'albuterol',
      'corticosteroids',
      'oxygen',
      'peak flow monitoring',
    ],
    classic_migraine_with_aura: ['sumatriptan', 'nsaids', 'rest', 'dark room', 'hydration'],
    acute_appendicitis_without_perforation: [
      'surgery',
      'appendectomy',
      'antibiotics',
      'iv fluids',
    ],
    ventricular_septal_defect_moderate_with_chf: [
      'diuretics',
      'ace inhibitor',
      'nutrition support',
      'cardiology consult',
    ],
  };

  const appropriateList = appropriateTreatments[condition] || [];
  const planLower = plan.toLowerCase();

  const matchedTreatments = appropriateList.filter((treatment) =>
    planLower.includes(treatment)
  );

  const appropriatenessScore =
    matchedTreatments.length > 0
      ? Math.min(100, (matchedTreatments.length / appropriateList.length) * 100)
      : 50;

  return {
    appropriateness: appropriatenessScore > 70 ? 'appropriate' : 'needs_optimization',
    matchedTreatments,
    suggestions: appropriateList.slice(0, 3),
    score: Math.round(appropriatenessScore),
  };
}

function getExamSignificance(condition, examType) {
  const significanceMap = {
    acute_inferior_stemi: {
      cardiac: 'Critical for detecting heart failure signs and murmurs',
      pulmonary: 'Important for assessing pulmonary edema',
      general: 'Overall assessment of hemodynamic stability',
    },
    viral_upper_respiratory_infection: {
      general: 'Assess overall appearance and hydration status',
      eent: 'Key to identifying viral vs bacterial causes',
      pulmonary: 'Rule out lower respiratory involvement',
    },
  };

  return significanceMap[condition]?.[examType] || 'Standard physical examination component';
}

function getLabInterpretation(condition, labType, results) {
  if (condition === 'acute_inferior_stemi' && labType.includes('cardiac')) {
    return 'Elevated cardiac enzymes confirm myocardial injury';
  }
  if (condition === 'viral_upper_respiratory_infection' && labType.includes('cbc')) {
    return 'Lymphocytic predominance suggests viral etiology';
  }
  return 'Laboratory results provide clinical context';
}

function getImagingCorrelation(condition, imagingType) {
  const correlationMap = {
    acute_inferior_stemi: {
      ecg: 'Diagnostic for STEMI location and extent',
      chest_xray: 'Assesses for complications like pulmonary edema',
    },
    acute_appendicitis_without_perforation: {
      ultrasound: 'First-line imaging in pediatric patients',
      ct: 'High sensitivity and specificity for appendicitis',
    },
  };

  return correlationMap[condition]?.[imagingType] || 'Imaging supports clinical assessment';
}

// NEW ROUTE: Generate detailed simulation report
router.get('/:id/report', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied',
      });
    }

    // Only generate reports for completed simulations
    if (simulation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Report can only be generated for completed simulations',
        currentStatus: simulation.status
      });
    }

    console.log(`📊 Generating report for simulation ${id} by calling analytics service`);

    const analyticsServiceUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004';
    const reportResponse = await axios.get(`${analyticsServiceUrl}/reports/${id}`);

    res.json(reportResponse.data);

  } catch (error) {
    console.error('❌ Error generating simulation report:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        url: error.config.url,
        method: error.config.method,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : 'No response',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to generate simulation report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ENHANCED: Update the complete simulation route to include report generation
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'completed' } = req.body;
    const userId = req.user.id;

    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found',
      });
    }

    if (simulation.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Simulation already completed',
      });
    }

    console.log(`🏁 Completing simulation ${id} for user ${userId}, reason: ${reason}`);

    // Calculate session duration
    const endTime = new Date();
    const duration = Math.round((endTime - simulation.sessionMetrics.startTime) / (1000 * 60));

    // Generate AI feedback
    let feedback = 'Simulation completed. Please review your performance with your instructor.';
    try {
      feedback = await openRouterService.generateClinicalFeedback(
        simulation,
        simulation.clinicalActions
      );
    } catch (feedbackError) {
      console.error('⚠️ Feedback generation failed:', feedbackError.message);
    }

    // Calculate final scores
    const finalScores = calculateFinalScores(simulation);

    // Update simulation
    simulation.status = 'completed';
    simulation.sessionMetrics.endTime = endTime;
    simulation.sessionMetrics.totalDuration = duration;
    simulation.feedbackProvided = true;
    simulation.learningProgress = { ...simulation.learningProgress, ...finalScores };

    // Add feedback to conversation
    simulation.conversationHistory.push({
      sender: 'system',
      message: feedback,
      messageType: 'system_feedback',
      timestamp: new Date(),
    });

    await simulation.save();

    // Generate detailed report using ReportGenerator service
    let detailedReport = null;
    try {
      const reportResult = await reportGenerator.generateSimulationReport(simulation);
      if (reportResult.success) {
        detailedReport = reportResult.report;
      } else {
        console.error('Report generation failed:', reportResult.error);
      }
    } catch (reportError) {
      console.error('Error generating report:', reportError);
    }

    res.json({
      success: true,
      message: 'Simulation completed successfully',
      feedback,
      sessionSummary: {
        duration: `${duration} minutes`,
        messagesExchanged: simulation.sessionMetrics.messageCount,
        clinicalActions: simulation.sessionMetrics.clinicalActionsCount,
        completionStatus: simulation.status,
        finalScores: finalScores,
      },
      learningProgress: simulation.learningProgress,
      // ADD: Include detailed report for immediate access
      detailedReport: detailedReport,
      reportUrl: `/api/simulations/${id}/report`
    });

  } catch (error) {
    console.error('❌ Error completing simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete simulation',
    });
  }
});

// HELPER FUNCTION: Generate comprehensive simulation report
async function generateSimulationReport(simulation) {
  const startTime = simulation.sessionMetrics.startTime;
  const endTime = simulation.sessionMetrics.endTime || new Date();
  const duration = Math.round((endTime - startTime) / (1000 * 60));

  // 1. Simulation Overview
  const overview = {
    scenarioDetails: {
      caseName: simulation.caseName,
      patientName: simulation.patientPersona.patient?.name || 'Patient',
      patientAge: simulation.patientPersona.patient?.age || 'Unknown',
      chiefComplaint: simulation.patientPersona.chiefComplaint,
      condition: simulation.patientPersona.currentCondition,
      programArea: simulation.programArea?.replace('_', ' ').toUpperCase(),
      specialty: simulation.patientPersona.specialty || 'General'
    },
    learningObjectives: simulation.patientPersona.learningObjectives || [],
    difficultyLevel: simulation.difficulty,
    sessionInfo: {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration: `${duration} minutes`,
      completionStatus: simulation.status
    }
  };

  // 2. Performance Metrics & Scoring
  const performanceMetrics = calculatePerformanceMetrics(simulation);

  // 3. Clinical Decision-Making Analysis
  const clinicalAnalysis = analyzeClinicalDecisionMaking(simulation);

  // 4. Communication & Professionalism Assessment
  const communicationAssessment = assessCommunicationSkills(simulation);

  // 5. Timeline Analysis
  const timelineAnalysis = generateTimelineAnalysis(simulation);

  // 6. Detailed Action Review
  const actionReview = generateActionReview(simulation);

  // 7. Areas for Improvement & Recommendations
  const recommendations = generateRecommendations(simulation, performanceMetrics);

  return {
    overview,
    performanceMetrics,
    clinicalAnalysis,
    communicationAssessment,
    timelineAnalysis,
    actionReview,
    recommendations,
    generatedAt: new Date().toISOString(),
    reportVersion: '1.0'
  };
}

function calculatePerformanceMetrics(simulation) {
  const expectedActions = getExpectedActions(simulation.patientPersona.currentCondition);
  const completedActions = simulation.clinicalActions.map(action => action.action);
  
  // Calculate completion rates
  const criticalActionsCompleted = expectedActions.filter(action => 
    completedActions.includes(action)
  );
  
  const missedActions = expectedActions.filter(action => 
    !completedActions.includes(action)
  );

  // Time-based scoring
  const conversationMessages = simulation.conversationHistory.filter(msg => 
    msg.sender === 'student'
  ).length;

  const clinicalActionsCount = simulation.clinicalActions.length;

  return {
    overallScore: simulation.learningProgress.overallProgress || 0,
    completionRate: Math.round((criticalActionsCompleted.length / expectedActions.length) * 100),
    criticalActions: {
      expected: expectedActions,
      completed: criticalActionsCompleted,
      missed: missedActions
    },
    efficiency: {
      messagesExchanged: conversationMessages,
      clinicalActionsPerformed: clinicalActionsCount,
      averageTimePerAction: clinicalActionsCount > 0 ? 
        Math.round(simulation.sessionMetrics.totalDuration / clinicalActionsCount) : 0
    },
    scores: {
      clinicalReasoning: simulation.learningProgress.clinicalReasoningScore || 0,
      communication: simulation.learningProgress.communicationScore || 0,
      diagnosticAccuracy: simulation.learningProgress.diagnosticAccuracy || 0
    }
  };
}

function analyzeClinicalDecisionMaking(simulation) {
  const actions = simulation.clinicalActions;
  const condition = simulation.patientPersona.currentCondition;
  
  const strengths = [];
  const improvements = [];
  const alternatives = [];

  // Analyze action sequence
  const actionSequence = actions.map(action => action.action);
  
  // Check if followed logical sequence
  if (actionSequence.includes('history_taking')) {
    strengths.push('Appropriately gathered patient history');
  } else {
    improvements.push('Should have taken detailed history before proceeding');
    alternatives.push('Start with comprehensive history taking to understand the presenting complaint');
  }

  if (actionSequence.includes('physical_exam')) {
    strengths.push('Performed physical examination');
  } else {
    improvements.push('Physical examination was not documented');
    alternatives.push('Physical exam is crucial for clinical assessment');
  }

  // Check for appropriate diagnostic workup
  if (actionSequence.includes('order_labs') || actionSequence.includes('order_imaging')) {
    strengths.push('Ordered appropriate diagnostic tests');
  }

  // Check diagnostic reasoning
  const diagnosisActions = actions.filter(action => action.action === 'diagnosis');
  if (diagnosisActions.length > 0) {
    const lastDiagnosis = diagnosisActions[diagnosisActions.length - 1];
    if (lastDiagnosis.result && lastDiagnosis.result.accuracy === 'correct') {
      strengths.push('Accurate diagnostic assessment');
    } else {
      improvements.push('Diagnostic accuracy could be improved');
      alternatives.push('Consider reviewing differential diagnosis and clinical findings');
    }
  }

  return {
    strengths,
    areasForImprovement: improvements,
    alternativeApproaches: alternatives,
    actionSequence: actionSequence,
    clinicalReasoningScore: simulation.learningProgress.clinicalReasoningScore || 0
  };
}

function assessCommunicationSkills(simulation) {
  const studentMessages = simulation.conversationHistory.filter(msg => msg.sender === 'student');
  const totalMessages = studentMessages.length;
  
  let empathyScore = 0;
  let clarityScore = 0;
  let professionalismScore = 0;
  
  // Analyze communication patterns
  studentMessages.forEach(msg => {
    const message = msg.message.toLowerCase();
    
    // Empathy indicators
    if (message.includes('understand') || message.includes('sorry') || 
        message.includes('worry') || message.includes('concern')) {
      empathyScore += 1;
    }
    
    // Clarity indicators
    if (message.includes('can you') || message.includes('please') || 
        message.includes('tell me') || message.includes('explain')) {
      clarityScore += 1;
    }
    
    // Professionalism indicators
    if (message.includes('thank you') || message.includes('appreciate') || 
        !message.includes('bad') || !message.includes('wrong')) {
      professionalismScore += 1;
    }
  });

  // Calculate percentages
  const empathyPercentage = totalMessages > 0 ? Math.round((empathyScore / totalMessages) * 100) : 0;
  const clarityPercentage = totalMessages > 0 ? Math.round((clarityScore / totalMessages) * 100) : 0;
  const professionalismPercentage = totalMessages > 0 ? Math.round((professionalismScore / totalMessages) * 100) : 0;

  return {
    overallCommunicationScore: simulation.learningProgress.communicationScore || 0,
    patientInteraction: {
      empathy: empathyPercentage,
      clarity: clarityPercentage,
      professionalism: professionalismPercentage
    },
    messageAnalysis: {
      totalMessages: totalMessages,
      averageMessageLength: totalMessages > 0 ? 
        Math.round(studentMessages.reduce((sum, msg) => sum + msg.message.length, 0) / totalMessages) : 0,
      questioningTechnique: studentMessages.filter(msg => msg.message.includes('?')).length
    },
    communicationStrengths: generateCommunicationStrengths(empathyPercentage, clarityPercentage, professionalismPercentage),
    communicationImprovements: generateCommunicationImprovements(empathyPercentage, clarityPercentage, professionalismPercentage)
  };
}

function generateTimelineAnalysis(simulation) {
  const actions = simulation.clinicalActions;
  const messages = simulation.conversationHistory;
  const startTime = simulation.sessionMetrics.startTime;

  const timeline = [];

  // Add conversation milestones
  messages.forEach((msg, index) => {
    if (msg.sender === 'student' && index % 3 === 0) { // Every 3rd student message
      timeline.push({
        timestamp: new Date(msg.timestamp),
        relativeTime: Math.round((new Date(msg.timestamp) - startTime) / (1000 * 60)),
        type: 'conversation',
        description: `Patient interaction: ${msg.message.substring(0, 50)}...`,
        significance: 'Information gathering'
      });
    }
  });

  // Add clinical actions
  actions.forEach(action => {
    timeline.push({
      timestamp: new Date(action.timestamp),
      relativeTime: Math.round((new Date(action.timestamp) - startTime) / (1000 * 60)),
      type: 'clinical_action',
      description: `${action.action.replace('_', ' ').toUpperCase()}: ${action.details}`,
      significance: getActionSignificance(action.action)
    });
  });

  // Sort by time
  timeline.sort((a, b) => a.timestamp - b.timestamp);

  return {
    timeline,
    totalDuration: Math.round((simulation.sessionMetrics.endTime - startTime) / (1000 * 60)),
    criticalMilestones: timeline.filter(item => item.type === 'clinical_action'),
    pacing: timeline.length > 0 ? 'Appropriate' : 'Could be more structured'
  };
}

function generateActionReview(simulation) {
  const actions = simulation.clinicalActions;
  
  return actions.map((action, index) => ({
    sequence: index + 1,
    action: action.action.replace('_', ' ').toUpperCase(),
    details: action.details,
    timestamp: action.timestamp,
    result: action.result,
    feedback: getActionFeedback(action),
    appropriateness: getActionAppropriateness(action, simulation.patientPersona.currentCondition)
  }));
}

function generateRecommendations(simulation, performanceMetrics) {
  const recommendations = [];
  const resources = [];
  const nextSteps = [];

  // Based on completion rate
  if (performanceMetrics.completionRate < 70) {
    recommendations.push('Focus on systematic approach to patient assessment');
    nextSteps.push('Practice structured clinical examination techniques');
  }

  // Based on communication score
  if (performanceMetrics.scores.communication < 75) {
    recommendations.push('Improve patient communication and empathy');
    nextSteps.push('Complete communication skills training module');
    resources.push('Calgary-Cambridge Communication Guide');
  }

  // Based on diagnostic accuracy
  if (performanceMetrics.scores.diagnosticAccuracy < 80) {
    recommendations.push('Strengthen diagnostic reasoning skills');
    nextSteps.push('Review differential diagnosis frameworks');
    resources.push('Clinical reasoning textbooks and case studies');
  }

  // Condition-specific recommendations
  const condition = simulation.patientPersona.currentCondition;
  if (condition) {
    resources.push(getConditionSpecificResources(condition));
  }

  return {
    keyRecommendations: recommendations,
    nextSteps: nextSteps,
    studyResources: resources.flat(),
    personalizedLearningPlan: generatePersonalizedPlan(simulation, performanceMetrics)
  };
}

// Helper functions for recommendations
function generateCommunicationStrengths(empathy, clarity, professionalism) {
  const strengths = [];
  if (empathy > 60) strengths.push('Shows good empathy and understanding');
  if (clarity > 70) strengths.push('Asks clear and appropriate questions');
  if (professionalism > 80) strengths.push('Maintains professional communication');
  return strengths.length > 0 ? strengths : ['Demonstrated basic communication skills'];
}

function generateCommunicationImprovements(empathy, clarity, professionalism) {
  const improvements = [];
  if (empathy < 50) improvements.push('Could show more empathy and understanding');
  if (clarity < 60) improvements.push('Could ask clearer, more focused questions');
  if (professionalism < 70) improvements.push('Could maintain more professional tone');
  return improvements;
}

function getActionSignificance(action) {
  const significance = {
    'history_taking': 'Foundation for diagnosis',
    'physical_exam': 'Clinical assessment',
    'order_labs': 'Diagnostic workup',
    'order_imaging': 'Advanced diagnostics',
    'diagnosis': 'Clinical reasoning',
    'treatment_plan': 'Patient management'
  };
  return significance[action] || 'Clinical action';
}

function getActionFeedback(action) {
  // This would be more sophisticated in production
  if (action.result && action.result.accuracy === 'correct') {
    return 'Excellent clinical decision';
  } else if (action.result && action.result.appropriateness === 'appropriate') {
    return 'Good clinical approach';
  }
  return 'Consider alternative approaches';
}

function getActionAppropriateness(action, condition) {
  // Simplified appropriateness check
  const expectedActions = getExpectedActions(condition);
  return expectedActions.includes(action.action) ? 'Appropriate' : 'Consider timing';
}

function getConditionSpecificResources(condition) {
  const resources = {
    'acute_inferior_stemi': [
      'AHA/ACC STEMI Guidelines',
      'ECG interpretation resources',
      'Cardiac catheterization protocols'
    ],
    'viral_upper_respiratory_infection': [
      'Pediatric fever management guidelines',
      'Viral vs bacterial infection differentiation',
      'Family communication in pediatric care'
    ],
    'acute_appendicitis_without_perforation': [
      'Pediatric appendicitis diagnosis',
      'Imaging in pediatric abdominal pain',
      'Surgical consultation guidelines'
    ]
  };
  return resources[condition] || ['General medical resources'];
}

function generatePersonalizedPlan(simulation, metrics) {
  const plan = [];
  
  if (metrics.scores.clinicalReasoning < 75) {
    plan.push({
      area: 'Clinical Reasoning',
      priority: 'High',
      activities: ['Complete diagnostic reasoning cases', 'Practice differential diagnosis'],
      timeframe: '2 weeks'
    });
  }

  if (metrics.scores.communication < 70) {
    plan.push({
      area: 'Communication Skills',
      priority: 'Medium',
      activities: ['Patient interview practice', 'Empathy training exercises'],
      timeframe: '1 week'
    });
  }

  plan.push({
    area: 'Skill Reinforcement',
    priority: 'Ongoing',
    activities: ['Repeat similar cases', 'Focus on missed learning objectives'],
    timeframe: 'Continuous'
  });

  return plan;
}

// Generate comprehensive simulation report
router.get('/:id/report', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📊 Generating report for simulation ${id} by user ${userId}`);

    // Find the simulation
    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied'
      });
    }

    // Only generate reports for completed simulations
    if (simulation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Report can only be generated for completed simulations',
        currentStatus: simulation.status
      });
    }

    // Generate the comprehensive report
    const reportResult = await reportGenerator.generateSimulationReport(simulation);

    if (!reportResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate simulation report',
        details: reportResult.error
      });
    }

    console.log(`✅ Report generated successfully for simulation ${id}`);

    res.json({
      success: true,
      simulationId: id,
      report: reportResult.report,
      generatedAt: reportResult.generatedAt,
      metadata: {
        caseName: simulation.caseName,
        programArea: simulation.programArea,
        difficulty: simulation.difficulty,
        duration: simulation.sessionMetrics.totalDuration || 0
      }
    });

  } catch (error) {
    console.error('❌ Error generating simulation report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate simulation report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get simulation report summary (lighter version)
router.get('/:id/report/summary', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const simulation = await Simulation.findOne({ id, userId });
    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: 'Simulation not found or access denied'
      });
    }

    // Generate summary report
    const summary = {
      simulationOverview: reportGenerator.generateSimulationOverview(simulation),
      performanceMetrics: reportGenerator.calculatePerformanceMetrics(simulation),
      overallScore: reportGenerator.calculateOverallScore(simulation),
      keyInsights: {
        strengths: simulation.learningProgress.objectivesCompleted || [],
        areasForImprovement: simulation.learningProgress.clinicalSkillsAssessed
          .filter(skill => skill.competencyLevel === 'novice' || skill.competencyLevel === 'advanced_beginner')
          .map(skill => skill.skill) || [],
        totalActions: simulation.clinicalActions.length,
        communicationScore: simulation.learningProgress.communicationScore || 0
      }
    };

    res.json({
      success: true,
      simulationId: id,
      summary,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating report summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report summary'
    });
  }
});

// Export the router
module.exports = router;
