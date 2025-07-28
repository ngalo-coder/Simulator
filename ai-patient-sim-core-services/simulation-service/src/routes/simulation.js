// ai-patient-sim-core-services/simulation-service/src/routes/simulation.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Simulation = require('../models/Simulation');
const PatientCase = require('../models/PatientCase');
const OpenRouterService = require('../services/openRouterService');
const { PATIENT_PERSONAS, PROGRAM_AREAS } = require('../data/patientPersonas');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();
const openRouterService = new OpenRouterService();

// Get available cases
router.get('/cases', authMiddleware, async (req, res) => {
  try {
    const { programArea, difficulty, patientType } = req.query;

    let filter = { isActive: true };
    if (programArea) filter.programArea = programArea;
    if (difficulty) filter.difficulty = difficulty;
    if (patientType) filter.patientType = patientType;

    // Get cases from database
    let cases = await PatientCase.find(filter).select('-systemPrompts').sort({ createdAt: -1 });

    // If no cases in database, return built-in personas
    if (cases.length === 0) {
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

    console.log(`💬 Message from ${userId} in simulation ${id}: ${message.substring(0, 50)}...`);

    // Add student message to conversation
    simulation.conversationHistory.push({
      sender: 'student',
      message: message.trim(),
      messageType,
      timestamp: new Date(),
    });

    // Generate AI response
    const aiResponse = await openRouterService.generatePatientResponse(simulation, message);

    let responseCount = 0;

    // Add patient response
    if (aiResponse.patientResponse) {
      simulation.conversationHistory.push({
        sender: 'patient',
        message: aiResponse.patientResponse,
        clinicalInfo: aiResponse.clinicalInfo,
        messageType: 'chat',
        timestamp: new Date(),
      });
      responseCount++;
    }

    // Add guardian response if present
    if (aiResponse.guardianResponse) {
      simulation.conversationHistory.push({
        sender: 'guardian',
        message: aiResponse.guardianResponse,
        messageType: 'chat',
        timestamp: new Date(),
      });
      responseCount++;
    }

    // Update metrics and progress
    simulation.sessionMetrics.messageCount = simulation.conversationHistory.length;
    simulation.updatedAt = new Date();

    // Update learning progress based on clinical info revealed
    if (aiResponse.clinicalInfo && Object.keys(aiResponse.clinicalInfo).length > 0) {
      // Track communication effectiveness
      const communicationScore = calculateCommunicationScore(simulation.conversationHistory);
      simulation.learningProgress.communicationScore = communicationScore;
    }

    await simulation.save();

    res.json({
      success: true,
      responses: {
        patient: aiResponse.patientResponse,
        guardian: aiResponse.guardianResponse,
        clinicalInfo: aiResponse.clinicalInfo,
      },
      conversationHistory: simulation.conversationHistory.slice(-20), // Return last 20 messages
      sessionMetrics: {
        messageCount: simulation.sessionMetrics.messageCount,
        duration: Math.round((new Date() - simulation.sessionMetrics.startTime) / (1000 * 60)), // minutes
      },
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
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

// Export the router
module.exports = router;
