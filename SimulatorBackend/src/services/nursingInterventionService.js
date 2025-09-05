import TreatmentService from './treatmentService.js';
import Case from '../models/CaseModel.js';
import Session from '../models/SessionModel.js';
import logger from '../config/logger.js';

class NursingInterventionService extends TreatmentService {
  /**
   * Analyze nursing interventions based on nursing diagnoses
   * @param {string} sessionId - The session ID
   * @param {Array} nursingInterventions - Array of nursing interventions
   * @returns {Object} Analysis of nursing interventions
   */
  static async analyzeNursingInterventions(sessionId, nursingInterventions) {
    try {
      const session = await Session.findById(sessionId).populate('case_ref');
      if (!session) {
        throw new Error('Session not found');
      }

      const caseData = session.case_ref;
      const nursingDiagnoses = caseData.nursing_diagnoses || [];
      const expectedInterventions = caseData.nursing_interventions || [];

      const analysis = {
        appropriateness_score: 0,
        nursing_diagnosis_coverage: 0,
        safety_metrics_score: 0,
        feedback: [],
        correct_interventions: 0,
        incorrect_interventions: 0,
        missing_interventions: expectedInterventions.length,
        covered_diagnoses: [],
        uncovered_diagnoses: nursingDiagnoses.map(d => d.diagnosis)
      };

      // Check each proposed nursing intervention
      nursingInterventions.forEach(intervention => {
        const isAppropriate = this.isNursingInterventionAppropriate(
          intervention, 
          expectedInterventions, 
          nursingDiagnoses
        );
        
        if (isAppropriate) {
          analysis.correct_interventions++;
          analysis.feedback.push({
            intervention: intervention.intervention,
            status: 'appropriate',
            feedback: 'This nursing intervention is appropriate for the patient needs',
            covered_diagnoses: this.getCoveredDiagnoses(intervention, nursingDiagnoses)
          });
          
          // Update covered diagnoses
          analysis.covered_diagnoses = [
            ...new Set([...analysis.covered_diagnoses, ...this.getCoveredDiagnoses(intervention, nursingDiagnoses)])
          ];
        } else {
          analysis.incorrect_interventions++;
          analysis.feedback.push({
            intervention: intervention.intervention,
            status: 'inappropriate',
            feedback: 'This intervention may not address the patient nursing needs effectively'
          });
        }
      });

      // Calculate scores
      analysis.appropriateness_score = analysis.correct_interventions > 0 
        ? Math.round((analysis.correct_interventions / nursingInterventions.length) * 100)
        : 0;

      analysis.nursing_diagnosis_coverage = nursingDiagnoses.length > 0
        ? Math.round((analysis.covered_diagnoses.length / nursingDiagnoses.length) * 100)
        : 0;

      analysis.missing_interventions = Math.max(0, expectedInterventions.length - analysis.correct_interventions);
      analysis.uncovered_diagnoses = nursingDiagnoses
        .filter(d => !analysis.covered_diagnoses.includes(d.diagnosis))
        .map(d => d.diagnosis);

      // Calculate safety metrics score based on safety-focused interventions
      analysis.safety_metrics_score = this.calculateSafetyMetricsScore(nursingInterventions, caseData);

      return analysis;
    } catch (error) {
      logger.error('Error analyzing nursing interventions:', error);
      throw error;
    }
  }

  /**
   * Check if a nursing intervention is appropriate
   */
  static isNursingInterventionAppropriate(intervention, expectedInterventions, nursingDiagnoses) {
    const interventionLower = intervention.intervention.toLowerCase();
    
    // Check if intervention matches any expected nursing interventions
    const matchesExpected = expectedInterventions.some(expected => 
      expected.intervention.toLowerCase().includes(interventionLower) ||
      interventionLower.includes(expected.intervention.toLowerCase())
    );

    // Check if intervention addresses any nursing diagnoses
    const addressesDiagnosis = this.doesInterventionAddressDiagnosis(intervention, nursingDiagnoses);

    return matchesExpected && addressesDiagnosis;
  }

  /**
   * Check if intervention addresses any nursing diagnoses
   */
  static doesInterventionAddressDiagnosis(intervention, nursingDiagnoses) {
    const interventionLower = intervention.intervention.toLowerCase();
    
    return nursingDiagnoses.some(diagnosis => {
      const diagnosisLower = diagnosis.diagnosis.toLowerCase();
      const relatedFactors = diagnosis.related_factors || [];
      
      // Check if intervention mentions diagnosis or related factors
      return interventionLower.includes(diagnosisLower) ||
             relatedFactors.some(factor => interventionLower.includes(factor.toLowerCase()));
    });
  }

  /**
   * Get diagnoses covered by an intervention
   */
  static getCoveredDiagnoses(intervention, nursingDiagnoses) {
    const interventionLower = intervention.intervention.toLowerCase();
    const covered = [];

    nursingDiagnoses.forEach(diagnosis => {
      const diagnosisLower = diagnosis.diagnosis.toLowerCase();
      const relatedFactors = diagnosis.related_factors || [];

      if (interventionLower.includes(diagnosisLower) ||
          relatedFactors.some(factor => interventionLower.includes(factor.toLowerCase()))) {
        covered.push(diagnosis.diagnosis);
      }
    });

    return covered;
  }

  /**
   * Calculate safety metrics score based on safety interventions
   */
  static calculateSafetyMetricsScore(interventions, caseData) {
    const safetyInterventions = [
      'fall prevention', 'fall risk', 'bed alarm', 'non-slip socks',
      'infection control', 'hand hygiene', 'gloves', 'mask',
      'medication safety', 'medication verification', 'five rights',
      'pain assessment', 'pain scale', 'pain management',
      'vital signs', 'monitoring', 'assessment'
    ];

    const safetyCount = interventions.filter(intervention => {
      const interventionLower = intervention.intervention.toLowerCase();
      return safetyInterventions.some(safety => interventionLower.includes(safety));
    }).length;

    return interventions.length > 0 
      ? Math.round((safetyCount / interventions.length) * 100)
      : 0;
  }

  /**
   * Simulate nursing care outcomes
   */
  static async simulateNursingOutcomes(sessionId, nursingInterventions) {
    try {
      const session = await Session.findById(sessionId).populate('case_ref');
      if (!session) {
        throw new Error('Session not found');
      }

      const caseData = session.case_ref;
      const analysis = await this.analyzeNursingInterventions(sessionId, nursingInterventions);

      // Simulate outcomes based on nursing intervention appropriateness
      const outcomes = {
        patient_response: '',
        nursing_outcomes: {},
        safety_indicators: {},
        complications: [],
        overall_nursing_outcome: ''
      };

      if (analysis.appropriateness_score >= 80 && analysis.nursing_diagnosis_coverage >= 80) {
        outcomes.patient_response = 'Patient shows excellent response to nursing care. Comfort and safety maintained.';
        outcomes.nursing_outcomes = {
          pain_level: '2/10 (well controlled)',
          mobility: 'Improved with assistance',
          comfort: 'Comfortable and resting',
          hygiene: 'Maintained appropriately'
        };
        outcomes.safety_indicators = {
          fall_risk: 'Low',
          infection_risk: 'Low',
          pressure_ulcer_risk: 'Low'
        };
        outcomes.overall_nursing_outcome = 'Excellent nursing care outcomes';
      } else if (analysis.appropriateness_score >= 50) {
        outcomes.patient_response = 'Patient shows some improvement but requires continued nursing attention.';
        outcomes.nursing_outcomes = {
          pain_level: '5/10 (moderate control)',
          mobility: 'Limited improvement',
          comfort: 'Some discomfort reported',
          hygiene: 'Requires prompting'
        };
        outcomes.safety_indicators = {
          fall_risk: 'Moderate',
          infection_risk: 'Moderate',
          pressure_ulcer_risk: 'Moderate'
        };
        outcomes.overall_nursing_outcome = 'Adequate nursing care with areas for improvement';
      } else {
        outcomes.patient_response = 'Patient condition shows minimal improvement. Nursing care needs reassessment.';
        outcomes.nursing_outcomes = {
          pain_level: '8/10 (poorly controlled)',
          mobility: 'No improvement',
          comfort: 'Significant discomfort',
          hygiene: 'Needs assistance'
        };
        outcomes.safety_indicators = {
          fall_risk: 'High',
          infection_risk: 'High',
          pressure_ulcer_risk: 'High'
        };
        outcomes.complications = [
          'Potential for falls',
          'Infection risk increased',
          'Pain management inadequate'
        ];
        outcomes.overall_nursing_outcome = 'Poor nursing care outcomes - immediate reassessment needed';
      }

      // Add patient safety metrics based on analysis
      outcomes.patient_safety_metrics = this.generateSafetyMetrics(analysis, caseData);

      return {
        analysis,
        outcomes
      };
    } catch (error) {
      logger.error('Error simulating nursing outcomes:', error);
      throw error;
    }
  }

  /**
   * Generate patient safety metrics based on nursing interventions
   */
  static generateSafetyMetrics(analysis, caseData) {
    const metrics = {
      fall_risk_assessment_completed: analysis.safety_metrics_score > 0,
      infection_control_measures: analysis.safety_metrics_score >= 50,
      medication_safety_practices: analysis.feedback.some(f => 
        f.intervention.toLowerCase().includes('medication')
      ),
      patient_education_provided: analysis.feedback.some(f => 
        f.intervention.toLowerCase().includes('educate') || 
        f.intervention.toLowerCase().includes('teach')
      ),
      pain_assessment_documented: analysis.feedback.some(f => 
        f.intervention.toLowerCase().includes('pain') ||
        f.intervention.toLowerCase().includes('comfort')
      ),
      vital_signs_monitored: analysis.feedback.some(f => 
        f.intervention.toLowerCase().includes('vital') ||
        f.intervention.toLowerCase().includes('monitor')
      )
    };

    return metrics;
  }

  /**
   * Record nursing interventions in session
   */
  static async recordNursingInterventions(sessionId, nursingInterventions) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Initialize nursing_interventions array if not exists
      if (!session.nursing_interventions) {
        session.nursing_interventions = [];
      }

      // Add nursing interventions to session
      nursingInterventions.forEach(intervention => {
        session.nursing_interventions.push({
          intervention: intervention.intervention,
          category: intervention.category,
          parameters: intervention.parameters,
          expected_outcomes: intervention.expected_outcomes,
          timestamp: new Date()
        });
      });

      await session.save();
      return session;
    } catch (error) {
      logger.error('Error recording nursing interventions:', error);
      throw error;
    }
  }

  /**
   * Submit nursing care plan for evaluation
   */
  static async submitNursingCarePlan(sessionId, carePlan) {
    try {
      // Record interventions
      await this.recordNursingInterventions(sessionId, carePlan.interventions || []);
      
      // Simulate outcomes
      const result = await this.simulateNursingOutcomes(sessionId, carePlan.interventions || []);
      
      // Update session with care plan data
      const session = await Session.findById(sessionId);
      if (session) {
        session.nursing_care_plan = {
          interventions: carePlan.interventions,
          goals: carePlan.goals,
          evaluation: result.analysis,
          outcomes: result.outcomes,
          submitted_at: new Date()
        };
        await session.save();
      }

      return result;
    } catch (error) {
      logger.error('Error submitting nursing care plan:', error);
      throw error;
    }
  }
}

export default NursingInterventionService;