import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import Case from '../src/models/CaseModel.js';
import Session from '../src/models/SessionModel.js';
import { getNursingEvaluation } from '../src/services/nursingEvaluationService.js';
import NursingInterventionService from '../src/services/nursingInterventionService.js';
import NursingMetricsService from '../src/services/nursingMetricsService.js';
import logger from '../src/config/logger.js';

// Mock logger to avoid console output during tests
jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'error').mockImplementation(() => {});

describe('Nursing Simulation System Integration', () => {
  let testCase;
  let testSession;
  let mockConversationHistory;

  beforeAll(async () => {
    // Connect to test database if needed
    // This assumes a test database is set up separately
  });

  beforeEach(async () => {
    // Create a test nursing case
    testCase = new Case({
      version: 1,
      description: 'Test nursing case for simulation',
      system_instruction: 'Simulate a patient with nursing care needs',
      case_metadata: {
        case_id: 'NURS-TEST-001',
        title: 'Test Nursing Case',
        specialty: 'Medical-Surgical Nursing',
        program_area: 'Specialty Program',
        difficulty: 'Intermediate',
        tags: ['nursing', 'medical-surgical', 'test'],
        location: 'Hospital Ward'
      },
      patient_persona: {
        name: 'John Doe',
        age: 65,
        gender: 'Male',
        occupation: 'Retired',
        chief_complaint: 'Shortness of breath and fatigue',
        emotional_tone: 'Anxious',
        background_story: 'Recent hospitalization for heart failure',
        speaks_for: 'self',
        patient_is_present: true
      },
      initial_prompt: 'Hello, I\'m feeling very short of breath today.',
      clinical_dossier: {
        comment: 'Patient with congestive heart failure',
        hidden_diagnosis: 'Congestive Heart Failure',
        history_of_presenting_illness: {
          onset: 'Gradual over 2 days',
          location: 'Chest',
          character: 'Tightness',
          severity: 7,
          timing_and_duration: 'Constant',
          exacerbating_factors: 'Lying flat',
          relieving_factors: 'Sitting upright',
          associated_symptoms: ['fatigue', 'swollen ankles']
        },
        past_medical_history: ['Hypertension', 'Diabetes'],
        medications: ['Lisinopril 10mg daily', 'Furosemide 40mg daily'],
        allergies: ['Penicillin'],
        surgical_history: ['Appendectomy 1990'],
        family_history: ['Father with heart disease'],
        social_history: {
          smoking_status: 'Former smoker',
          alcohol_use: 'Occasional',
          substance_use: 'None',
          diet_and_exercise: 'Sedentary lifestyle',
          living_situation: 'Lives alone'
        },
        review_of_systems: {
          comment: 'Positive for respiratory symptoms',
          positive: ['dyspnea', 'orthopnea'],
          negative: ['fever', 'chills']
        }
      },
      simulation_triggers: {
        end_session: {
          condition_keyword: 'admit to hospital',
          patient_response: 'Thank you for helping me. I feel better knowing I\'m in good hands.'
        },
        invalid_input: {
          condition_keyword: 'nonsense',
          patient_response: 'I\'m not sure what you mean. Could you explain?'
        }
      },
      evaluation_criteria: {
        Assessment_Skills: 'Comprehensive patient assessment including vital signs and physical exam',
        Nursing_Diagnosis_Accuracy: 'Accurate identification of nursing diagnoses using NANDA terminology',
        Care_Planning_Effectiveness: 'Development of individualized care plans with appropriate goals',
        Intervention_Selection: 'Appropriate selection of nursing interventions based on diagnoses',
        Patient_Education_Quality: 'Effective patient education and health teaching',
        Communication_and_Empathy: 'Therapeutic communication and empathetic care',
        Safety_Protocols_Adherence: 'Adherence to patient safety protocols and standards',
        Documentation_Quality: 'Accurate and timely documentation of care'
      },
      // Nursing-specific data
      nursing_diagnoses: [
        {
          diagnosis: 'Impaired Gas Exchange',
          related_factors: ['fluid overload', 'decreased cardiac output'],
          defining_characteristics: ['dyspnea', 'tachypnea', 'oxygen saturation 88%'],
          priority: 'High',
          nanda_code: '00030'
        },
        {
          diagnosis: 'Activity Intolerance',
          related_factors: ['imbalance between oxygen supply and demand'],
          defining_characteristics: ['verbal report of fatigue', 'exertional dyspnea'],
          priority: 'Medium',
          nanda_code: '00092'
        }
      ],
      nursing_interventions: [
        {
          intervention: 'Monitor respiratory status and oxygen saturation',
          category: 'Assessment',
          description: 'Regular assessment of breath sounds and SpO2',
          nic_code: '3350',
          parameters: ['q4h', 'PRN'],
          expected_outcomes: ['Maintain SpO2 >92%', 'Improved breathing pattern']
        },
        {
          intervention: 'Administer oxygen therapy as prescribed',
          category: 'Treatment',
          description: 'Provide supplemental oxygen via nasal cannula',
          nic_code: '6680',
          parameters: ['2L/min', 'titrate to maintain SpO2 >92%'],
          expected_outcomes: ['Improved oxygenation', 'Reduced respiratory distress']
        },
        {
          intervention: 'Educate patient on energy conservation techniques',
          category: 'Education',
          description: 'Teach pacing strategies and activity modification',
          nic_code: '5510',
          parameters: ['daily', 'reinforce as needed'],
          expected_outcomes: ['Patient demonstrates energy conservation', 'Reports decreased fatigue']
        }
      ],
      nursing_outcomes: [
        {
          outcome: 'Improved Respiratory Status',
          indicators: ['normal breath sounds', 'SpO2 >92%', 'respiratory rate 12-20'],
          measurement_scale: 'Likert scale 1-5',
          noc_code: '0410'
        },
        {
          outcome: 'Enhanced Activity Tolerance',
          indicators: ['performs ADLs without excessive fatigue', 'reports increased energy'],
          measurement_scale: 'Functional Independence Measure',
          noc_code: '0005'
        }
      ],
      patient_safety_metrics: {
        fall_risk_assessment: true,
        pressure_ulcer_risk: false,
        infection_control_measures: true,
        medication_safety: true,
        patient_education_provided: true,
        hand_hygiene_compliance: true,
        pain_assessment_documentation: true,
        vital_signs_monitoring: true
      },
      quality_metrics: {
        patient_satisfaction_score: 85,
        medication_administration_errors: 0,
        fall_incidents: 0,
        pressure_ulcer_incidence: 0,
        hospital_acquired_infections: 0,
        readmission_rate: 10,
        patient_education_completion: 90,
        care_plan_adherence: 95
      }
    });

    await testCase.save();

    // Create a test session
    testSession = new Session({
      case_ref: testCase._id,
      original_case_id: testCase.case_metadata.case_id,
      history: [
        {
          role: 'Patient',
          content: 'Hello, I\'m feeling very short of breath today.',
          timestamp: new Date()
        },
        {
          role: 'Clinician',
          content: 'Can you tell me more about your breathing difficulty?',
          timestamp: new Date()
        },
        {
          role: 'Patient',
          content: 'It started yesterday and gets worse when I lie down.',
          timestamp: new Date()
        }
      ]
    });

    await testSession.save();

    // Mock conversation history for evaluation
    mockConversationHistory = [
      {
        role: 'Clinician',
        content: 'Can you describe your breathing difficulty?',
        timestamp: new Date()
      },
      {
        role: 'Patient',
        content: 'I feel like I can\'t catch my breath, especially when lying down.',
        timestamp: new Date()
      },
      {
        role: 'Clinician',
        content: 'Are you having any chest pain or palpitations?',
        timestamp: new Date()
      },
      {
        role: 'Patient',
        content: 'No chest pain, but my heart feels like it\'s racing.',
        timestamp: new Date()
      },
      {
        role: 'Clinician',
        content: 'Let me check your oxygen saturation and listen to your lungs.',
        timestamp: new Date()
      },
      {
        role: 'Clinician',
        content: 'I\'m going to elevate the head of your bed and start oxygen therapy.',
        timestamp: new Date()
      },
      {
        role: 'Patient',
        content: 'Thank you, that helps me breathe better.',
        timestamp: new Date()
      }
    ];
  });

  afterEach(async () => {
    // Clean up test data
    await Case.deleteMany({ 'case_metadata.case_id': 'NURS-TEST-001' });
    await Session.deleteMany({ original_case_id: 'NURS-TEST-001' });
  });

  afterAll(async () => {
    // Close database connection if needed
  });

  describe('Nursing Evaluation Service', () => {
    test('should generate nursing-specific evaluation for nursing cases', async () => {
      const evaluationResult = await getNursingEvaluation(testCase, mockConversationHistory);
      
      expect(evaluationResult).toHaveProperty('evaluationText');
      expect(evaluationResult).toHaveProperty('extractedMetrics');
      expect(evaluationResult.extractedMetrics).toHaveProperty('assessment_skills_rating');
      expect(evaluationResult.extractedMetrics).toHaveProperty('nursing_diagnosis_accuracy');
      expect(evaluationResult.extractedMetrics).toHaveProperty('care_planning_effectiveness');
      expect(evaluationResult.extractedMetrics).toHaveProperty('overall_nursing_score');
    });

    test('should parse nursing evaluation metrics correctly', async () => {
      const sampleEvaluationText = `
        NURSING EVALUATION
        Thank you for completing the nursing simulation.
        Hidden Diagnosis: Congestive Heart Failure

        NURSING COMPETENCIES EVALUATION:
        1. Assessment Skills: (Rating: Excellent)
        Comprehensive assessment performed including vital signs and respiratory assessment.

        2. Nursing Diagnosis Accuracy: (Rating: Very good)
        Correctly identified impaired gas exchange and activity intolerance.

        Overall Nursing Score: 85%
        Performance Label: Very good
      `;

      const metrics = require('../src/services/nursingEvaluationService.js').parseNursingEvaluationMetrics(sampleEvaluationText, logger);
      
      expect(metrics.assessment_skills_rating).toBe('Excellent');
      expect(metrics.nursing_diagnosis_accuracy).toBe('Very good');
      expect(metrics.overall_nursing_score).toBe(85);
      expect(metrics.performance_label).toBe('Very good');
    });
  });

  describe('Nursing Intervention Service', () => {
    test('should analyze nursing interventions appropriately', async () => {
      const testInterventions = [
        {
          intervention: 'Monitor oxygen saturation every 4 hours',
          category: 'Assessment',
          parameters: ['q4h'],
          expected_outcomes: ['Maintain SpO2 >92%']
        },
        {
          intervention: 'Elevate head of bed to 45 degrees',
          category: 'Comfort',
          parameters: ['continuous'],
          expected_outcomes: ['Improved breathing', 'Reduced orthopnea']
        },
        {
          intervention: 'Educate on energy conservation techniques',
          category: 'Education',
          parameters: ['daily'],
          expected_outcomes: ['Improved activity tolerance']
        }
      ];

      const analysis = await NursingInterventionService.analyzeNursingInterventions(
        testSession._id.toString(),
        testInterventions
      );

      expect(analysis).toHaveProperty('appropriateness_score');
      expect(analysis).toHaveProperty('nursing_diagnosis_coverage');
      expect(analysis).toHaveProperty('safety_metrics_score');
      expect(analysis).toHaveProperty('feedback');
      expect(Array.isArray(analysis.feedback)).toBe(true);
    });

    test('should simulate nursing outcomes based on interventions', async () => {
      const testInterventions = [
        {
          intervention: 'Administer oxygen therapy 2L/min via nasal cannula',
          category: 'Treatment',
          parameters: ['continuous'],
          expected_outcomes: ['SpO2 >92%']
        }
      ];

      const result = await NursingInterventionService.simulateNursingOutcomes(
        testSession._id.toString(),
        testInterventions
      );

      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('outcomes');
      expect(result.outcomes).toHaveProperty('patient_response');
      expect(result.outcomes).toHaveProperty('nursing_outcomes');
      expect(result.outcomes).toHaveProperty('safety_indicators');
    });
  });

  describe('Nursing Metrics Service', () => {
    test('should track patient safety metrics from interventions', async () => {
      const testInterventions = [
        { intervention: 'Perform fall risk assessment' },
        { intervention: 'Monitor vital signs every 4 hours' },
        { intervention: 'Educate patient on infection control' }
      ];

      const testOutcomes = {
        overall_nursing_outcome: 'Excellent nursing care outcomes'
      };

      const safetyMetrics = await NursingMetricsService.trackPatientSafetyMetrics(
        testSession._id.toString(),
        testInterventions,
        testOutcomes
      );

      expect(safetyMetrics.fall_risk_assessment).toBe(true);
      expect(safetyMetrics.vital_signs_monitoring).toBe(true);
      expect(safetyMetrics.infection_control_measures).toBe(true);
    });

    test('should calculate quality metrics from outcomes and analysis', async () => {
      const testOutcomes = {
        overall_nursing_outcome: 'Excellent nursing care outcomes',
        complications: []
      };

      const testAnalysis = {
        appropriateness_score: 90,
        feedback: [
          { intervention: 'Educate patient on medication safety', status: 'appropriate' },
          { intervention: 'Monitor pain level', status: 'appropriate' }
        ]
      };

      const qualityMetrics = await NursingMetricsService.calculateQualityMetrics(
        testSession._id.toString(),
        testOutcomes,
        testAnalysis
      );

      expect(qualityMetrics).toHaveProperty('patient_satisfaction_score');
      expect(qualityMetrics).toHaveProperty('care_plan_adherence');
      expect(qualityMetrics.patient_satisfaction_score).toBeGreaterThan(0);
    });

    test('should generate quality reports for sessions', async () => {
      const report = await NursingMetricsService.generateQualityReport(testSession._id.toString());
      
      expect(report).toHaveProperty('type', 'session');
      expect(report).toHaveProperty('case_id', 'NURS-TEST-001');
      expect(report).toHaveProperty('quality_metrics');
      expect(report).toHaveProperty('safety_metrics');
    });
  });

  describe('End-to-End Nursing Simulation', () => {
    test('should complete full nursing simulation workflow', async () => {
      // 1. Start simulation
      const sessionInfo = {
        sessionId: testSession._id.toString(),
        initialPrompt: testCase.initial_prompt,
        patientName: testCase.patient_persona.name
      };

      expect(sessionInfo.sessionId).toBeDefined();
      expect(sessionInfo.patientName).toBe('John Doe');

      // 2. Submit nursing care plan
      const carePlan = {
        interventions: [
          {
            intervention: 'Monitor respiratory status and oxygen saturation q4h',
            category: 'Assessment',
            parameters: ['q4h'],
            expected_outcomes: ['SpO2 >92%', 'RR 12-20']
          },
          {
            intervention: 'Administer oxygen therapy 2L/min via nasal cannula',
            category: 'Treatment',
            parameters: ['titrate to SpO2 >92%'],
            expected_outcomes: ['Improved oxygenation']
          },
          {
            intervention: 'Educate patient on energy conservation techniques',
            category: 'Education',
            parameters: ['daily'],
            expected_outcomes: ['Improved activity tolerance']
          }
        ],
        goals: [
          'Maintain oxygen saturation >92%',
          'Improve activity tolerance',
          'Prevent complications'
        ]
      };

      const carePlanResult = await NursingInterventionService.submitNursingCarePlan(
        testSession._id.toString(),
        carePlan
      );

      expect(carePlanResult).toHaveProperty('analysis');
      expect(carePlanResult).toHaveProperty('outcomes');

      // 3. Track metrics
      const safetyMetrics = await NursingMetricsService.trackPatientSafetyMetrics(
        testSession._id.toString(),
        carePlan.interventions,
        carePlanResult.outcomes
      );

      const qualityMetrics = await NursingMetricsService.calculateQualityMetrics(
        testSession._id.toString(),
        carePlanResult.outcomes,
        carePlanResult.analysis
      );

      expect(safetyMetrics).toBeDefined();
      expect(qualityMetrics).toBeDefined();

      // 4. Generate evaluation
      const evaluationResult = await getNursingEvaluation(testCase, mockConversationHistory);
      
      expect(evaluationResult.extractedMetrics.overall_nursing_score).toBeGreaterThan(0);
      expect(evaluationResult.extractedMetrics.performance_label).toBeDefined();

      // 5. Verify all components integrated
      const updatedSession = await Session.findById(testSession._id);
      expect(updatedSession.nursing_interventions.length).toBeGreaterThan(0);
      expect(updatedSession.nursing_care_plan).toBeDefined();
      expect(updatedSession.safety_metrics).toBeDefined();
      expect(updatedSession.quality_metrics).toBeDefined();
    });
  });
});