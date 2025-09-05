import Session from '../models/SessionModel.js';
import Case from '../models/CaseModel.js';
import logger from '../config/logger.js';

class NursingMetricsService {
  /**
   * Track and update patient safety metrics during nursing simulation
   * @param {string} sessionId - The session ID
   * @param {Array} interventions - Array of nursing interventions performed
   * @param {Object} outcomes - Outcomes from the simulation
   * @returns {Object} Updated safety metrics
   */
  static async trackPatientSafetyMetrics(sessionId, interventions, outcomes) {
    try {
      const session = await Session.findById(sessionId).populate('case_ref');
      if (!session) {
        throw new Error('Session not found');
      }

      const caseData = session.case_ref;
      const safetyMetrics = {
        fall_risk_assessment: false,
        pressure_ulcer_risk: false,
        infection_control_measures: false,
        medication_safety: false,
        patient_education_provided: false,
        hand_hygiene_compliance: false,
        pain_assessment_documentation: false,
        vital_signs_monitoring: false
      };

      // Analyze interventions for safety metrics
      interventions.forEach(intervention => {
        const interventionText = intervention.intervention?.toLowerCase() || '';
        
        // Fall risk assessment
        if (interventionText.includes('fall') || interventionText.includes('risk assessment')) {
          safetyMetrics.fall_risk_assessment = true;
        }
        
        // Pressure ulcer risk
        if (interventionText.includes('pressure') || interventionText.includes('ulcer') || interventionText.includes('skin')) {
          safetyMetrics.pressure_ulcer_risk = true;
        }
        
        // Infection control
        if (interventionText.includes('infection') || interventionText.includes('hygiene') || interventionText.includes('gloves')) {
          safetyMetrics.infection_control_measures = true;
        }
        
        // Medication safety
        if (interventionText.includes('medication') || interventionText.includes('drug') || interventionText.includes('dose')) {
          safetyMetrics.medication_safety = true;
        }
        
        // Patient education
        if (interventionText.includes('educate') || interventionText.includes('teach') || interventionText.includes('instruction')) {
          safetyMetrics.patient_education_provided = true;
        }
        
        // Hand hygiene
        if (interventionText.includes('hand') || interventionText.includes('wash') || interventionText.includes('sanitize')) {
          safetyMetrics.hand_hygiene_compliance = true;
        }
        
        // Pain assessment
        if (interventionText.includes('pain') || interventionText.includes('comfort') || interventionText.includes('scale')) {
          safetyMetrics.pain_assessment_documentation = true;
        }
        
        // Vital signs monitoring
        if (interventionText.includes('vital') || interventionText.includes('blood pressure') || interventionText.includes('temp') || interventionText.includes('heart rate')) {
          safetyMetrics.vital_signs_monitoring = true;
        }
      });

      // Update session with safety metrics
      if (!session.safety_metrics) {
        session.safety_metrics = {};
      }

      session.safety_metrics = { ...session.safety_metrics, ...safetyMetrics };
      await session.save();

      logger.info({ sessionId, safetyMetrics }, 'Patient safety metrics tracked successfully');
      return safetyMetrics;
    } catch (error) {
      logger.error({ sessionId, error }, 'Error tracking patient safety metrics');
      throw error;
    }
  }

  /**
   * Calculate quality metrics based on simulation outcomes
   * @param {string} sessionId - The session ID
   * @param {Object} outcomes - Simulation outcomes
   * @param {Object} analysis - Intervention analysis
   * @returns {Object} Quality metrics
   */
  static async calculateQualityMetrics(sessionId, outcomes, analysis) {
    try {
      const session = await Session.findById(sessionId).populate('case_ref');
      if (!session) {
        throw new Error('Session not found');
      }

      const qualityMetrics = {
        patient_satisfaction_score: this.calculateSatisfactionScore(outcomes),
        medication_administration_errors: this.calculateMedicationErrors(analysis),
        fall_incidents: this.calculateFallIncidents(outcomes),
        pressure_ulcer_incidence: this.calculatePressureUlcerIncidence(outcomes),
        hospital_acquired_infections: this.calculateInfectionRates(outcomes),
        readmission_rate: this.calculateReadmissionRisk(outcomes),
        patient_education_completion: this.calculateEducationCompletion(analysis),
        care_plan_adherence: this.calculateCarePlanAdherence(analysis)
      };

      // Update session with quality metrics
      if (!session.quality_metrics) {
        session.quality_metrics = {};
      }

      session.quality_metrics = { ...session.quality_metrics, ...qualityMetrics };
      await session.save();

      logger.info({ sessionId, qualityMetrics }, 'Quality metrics calculated successfully');
      return qualityMetrics;
    } catch (error) {
      logger.error({ sessionId, error }, 'Error calculating quality metrics');
      throw error;
    }
  }

  /**
   * Calculate patient satisfaction score based on outcomes
   */
  static calculateSatisfactionScore(outcomes) {
    if (outcomes.overall_nursing_outcome?.includes('Excellent')) {
      return 95;
    } else if (outcomes.overall_nursing_outcome?.includes('Adequate')) {
      return 75;
    } else if (outcomes.overall_nursing_outcome?.includes('Poor')) {
      return 45;
    }
    return 65; // Default score
  }

  /**
   * Calculate medication administration errors
   */
  static calculateMedicationErrors(analysis) {
    const errorInterventions = analysis.feedback?.filter(f => 
      f.status === 'inappropriate' && 
      f.intervention?.toLowerCase().includes('medication')
    ) || [];
    
    return errorInterventions.length;
  }

  /**
   * Calculate fall incidents based on outcomes
   */
  static calculateFallIncidents(outcomes) {
    if (outcomes.complications?.some(c => c.toLowerCase().includes('fall'))) {
      return 1;
    }
    return 0;
  }

  /**
   * Calculate pressure ulcer incidence
   */
  static calculatePressureUlcerIncidence(outcomes) {
    if (outcomes.complications?.some(c => c.toLowerCase().includes('pressure') || c.toLowerCase().includes('ulcer'))) {
      return 1;
    }
    return 0;
  }

  /**
   * Calculate infection rates
   */
  static calculateInfectionRates(outcomes) {
    if (outcomes.complications?.some(c => c.toLowerCase().includes('infection'))) {
      return 1;
    }
    return 0;
  }

  /**
   * Calculate readmission risk
   */
  static calculateReadmissionRisk(outcomes) {
    if (outcomes.overall_nursing_outcome?.includes('Poor')) {
      return 25; // Higher readmission risk for poor outcomes
    } else if (outcomes.overall_nursing_outcome?.includes('Adequate')) {
      return 10; // Moderate risk
    }
    return 5; // Low risk for excellent outcomes
  }

  /**
   * Calculate patient education completion rate
   */
  static calculateEducationCompletion(analysis) {
    const educationInterventions = analysis.feedback?.filter(f => 
      f.intervention?.toLowerCase().includes('educate') || 
      f.intervention?.toLowerCase().includes('teach')
    ) || [];
    
    const completed = educationInterventions.filter(f => f.status === 'appropriate').length;
    return educationInterventions.length > 0 ? Math.round((completed / educationInterventions.length) * 100) : 0;
  }

  /**
   * Calculate care plan adherence
   */
  static calculateCarePlanAdherence(analysis) {
    if (analysis.appropriateness_score >= 80) {
      return 95;
    } else if (analysis.appropriateness_score >= 50) {
      return 75;
    }
    return 45;
  }

  /**
   * Aggregate metrics across multiple sessions for reporting
   * @param {string} userId - User ID to aggregate metrics for
   * @returns {Object} Aggregated quality and safety metrics
   */
  static async getAggregatedMetrics(userId) {
    try {
      const sessions = await Session.find({ 'user_ref': userId })
        .where('quality_metrics').exists()
        .where('safety_metrics').exists();

      const aggregated = {
        total_sessions: sessions.length,
        patient_satisfaction_avg: 0,
        total_medication_errors: 0,
        total_fall_incidents: 0,
        total_pressure_ulcers: 0,
        total_infections: 0,
        avg_readmission_rate: 0,
        avg_education_completion: 0,
        avg_care_plan_adherence: 0,
        safety_metrics_compliance: {
          fall_risk_assessment: 0,
          pressure_ulcer_risk: 0,
          infection_control_measures: 0,
          medication_safety: 0,
          patient_education_provided: 0,
          hand_hygiene_compliance: 0,
          pain_assessment_documentation: 0,
          vital_signs_monitoring: 0
        }
      };

      if (sessions.length === 0) {
        return aggregated;
      }

      // Calculate averages and totals
      sessions.forEach(session => {
        const qm = session.quality_metrics || {};
        const sm = session.safety_metrics || {};

        aggregated.patient_satisfaction_avg += qm.patient_satisfaction_score || 0;
        aggregated.total_medication_errors += qm.medication_administration_errors || 0;
        aggregated.total_fall_incidents += qm.fall_incidents || 0;
        aggregated.total_pressure_ulcers += qm.pressure_ulcer_incidence || 0;
        aggregated.total_infections += qm.hospital_acquired_infections || 0;
        aggregated.avg_readmission_rate += qm.readmission_rate || 0;
        aggregated.avg_education_completion += qm.patient_education_completion || 0;
        aggregated.avg_care_plan_adherence += qm.care_plan_adherence || 0;

        // Safety metrics compliance
        Object.keys(aggregated.safety_metrics_compliance).forEach(key => {
          if (sm[key]) {
            aggregated.safety_metrics_compliance[key]++;
          }
        });
      });

      // Calculate averages
      aggregated.patient_satisfaction_avg = Math.round(aggregated.patient_satisfaction_avg / sessions.length);
      aggregated.avg_readmission_rate = Math.round(aggregated.avg_readmission_rate / sessions.length);
      aggregated.avg_education_completion = Math.round(aggregated.avg_education_completion / sessions.length);
      aggregated.avg_care_plan_adherence = Math.round(aggregated.avg_care_plan_adherence / sessions.length);

      // Calculate safety compliance percentages
      Object.keys(aggregated.safety_metrics_compliance).forEach(key => {
        aggregated.safety_metrics_compliance[key] = Math.round(
          (aggregated.safety_metrics_compliance[key] / sessions.length) * 100
        );
      });

      logger.info({ userId, aggregated }, 'Aggregated metrics calculated successfully');
      return aggregated;
    } catch (error) {
      logger.error({ userId, error }, 'Error aggregating metrics');
      throw error;
    }
  }

  /**
   * Generate quality report for a session or user
   * @param {string} sessionId - Session ID (optional)
   * @param {string} userId - User ID (optional)
   * @returns {Object} Quality and safety report
   */
  static async generateQualityReport(sessionId = null, userId = null) {
    try {
      let reportData;

      if (sessionId) {
        const session = await Session.findById(sessionId)
          .populate('case_ref', 'case_metadata.title case_metadata.case_id')
          .populate('user_ref', 'name email');
        
        if (!session) {
          throw new Error('Session not found');
        }

        reportData = {
          type: 'session',
          session_id: sessionId,
          case_title: session.case_ref?.case_metadata?.title,
          case_id: session.case_ref?.case_metadata?.case_id,
          user_name: session.user_ref?.name,
          user_email: session.user_ref?.email,
          timestamp: session.createdAt,
          quality_metrics: session.quality_metrics || {},
          safety_metrics: session.safety_metrics || {},
          overall_score: session.quality_metrics?.care_plan_adherence || 0
        };
      } else if (userId) {
        const aggregated = await this.getAggregatedMetrics(userId);
        reportData = {
          type: 'user_aggregate',
          user_id: userId,
          total_sessions: aggregated.total_sessions,
          quality_metrics: {
            patient_satisfaction_avg: aggregated.patient_satisfaction_avg,
            total_medication_errors: aggregated.total_medication_errors,
            total_fall_incidents: aggregated.total_fall_incidents,
            total_pressure_ulcers: aggregated.total_pressure_ulcers,
            total_infections: aggregated.total_infections,
            avg_readmission_rate: aggregated.avg_readmission_rate,
            avg_education_completion: aggregated.avg_education_completion,
            avg_care_plan_adherence: aggregated.avg_care_plan_adherence
          },
          safety_metrics_compliance: aggregated.safety_metrics_compliance,
          overall_score: aggregated.avg_care_plan_adherence
        };
      } else {
        throw new Error('Either sessionId or userId must be provided');
      }

      // Add performance rating
      reportData.performance_rating = this.getPerformanceRating(reportData.overall_score);

      logger.info({ reportData }, 'Quality report generated successfully');
      return reportData;
    } catch (error) {
      logger.error({ sessionId, userId, error }, 'Error generating quality report');
      throw error;
    }
  }

  /**
   * Get performance rating based on score
   */
  static getPerformanceRating(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  }
}

export default NursingMetricsService;