import PharmacySimulationService from '../src/services/PharmacySimulationService.js';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import Case from '../src/models/CaseModel.js';

/**
 * Pharmacy Simulation Service Tests
 * Tests for pharmacy-specific case simulation functionality
 */
describe('PharmacySimulationService', () => {
  beforeAll(async () => {
    // Connect to test database if needed
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/test_simulator', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('processPharmacyAction', () => {
    it('should process medication review action correctly', async () => {
      const sessionState = {
        clinicalDossier: {
          medication_therapy: {
            appropriate_indications: [
              { medication: 'Aspirin', condition: 'pain' },
              { medication: 'Lisinopril', condition: 'hypertension' }
            ],
            standard_dosages: [
              { medication: 'Aspirin', dose: '81 mg daily' },
              { medication: 'Lisinopril', dose: '10 mg daily' }
            ],
            drug_disease_interactions: [
              { medication: 'Aspirin', condition: 'peptic_ulcer', risk: 'High' }
            ]
          }
        }
      };

      const action = {
        type: 'medication_review',
        data: {
          medication_list: [
            { name: 'Aspirin', dose: '81 mg daily' },
            { name: 'Lisinopril', dose: '10 mg daily' }
          ],
          clinical_condition: 'hypertension',
          patient_factors: {
            comorbidities: ['peptic_ulcer']
          }
        }
      };

      const response = await PharmacySimulationService.processPharmacyAction(sessionState, action);
      
      expect(response.type).toBe('medication_review');
      expect(response.data.clinical_condition).toBe('hypertension');
      expect(response.data.therapy_issues).toContain('Drug-disease interaction: Aspirin may exacerbate peptic_ulcer');
    });

    it('should process therapy optimization action', async () => {
      const sessionState = {
        clinicalDossier: {
          therapy_options: {
            alternative_therapies: [
              {
                medication: 'Losartan',
                rationale: 'Better side effect profile',
                benefit: 'improved_tolerability',
                evidence_level: 'High'
              }
            ],
            cost_comparison: [
              { medication: 'Lisinopril', cost: '$10/month', coverage: 'Full' },
              { medication: 'Losartan', cost: '$15/month', coverage: 'Partial' }
            ]
          }
        }
      };

      const action = {
        type: 'therapy_optimization',
        data: {
          current_therapy: [{ name: 'Lisinopril', dose: '10 mg daily' }],
          optimization_goals: ['improved_tolerability'],
          patient_preferences: { contraindications: [] }
        }
      };

      const response = await PharmacySimulationService.processPharmacyAction(sessionState, action);
      
      expect(response.type).toBe('therapy_optimization');
      expect(response.data.optimization_recommendations.length).toBeGreaterThan(0);
      expect(response.data.cost_considerations.length).toBeGreaterThan(0);
    });

    it('should process drug interaction check action', async () => {
      const sessionState = {
        clinicalDossier: {
          drug_interactions: [
            {
              medication1: 'Warfarin',
              medication2: 'Aspirin',
              type: 'pharmacodynamic',
              severity: 'High',
              mechanism: 'Increased bleeding risk',
              effects: 'Hemorrhage',
              management: ['Monitor INR closely', 'Consider alternative antiplatelet']
            }
          ]
        }
      };

      const action = {
        type: 'drug_interaction_check',
        data: {
          medication_list: [
            { name: 'Warfarin', dose: '5 mg daily' }
          ],
          existing_medications: [
            { name: 'Aspirin', dose: '81 mg daily' }
          ]
        }
      };

      const response = await PharmacySimulationService.processPharmacyAction(sessionState, action);
      
      expect(response.type).toBe('drug_interaction_check');
      expect(response.data.overall_severity).toBe('High');
      expect(response.data.interaction_findings[0].medications).toContain('Warfarin and Aspirin');
    });

    it('should process allergy check action', async () => {
      const sessionState = {
        clinicalDossier: {
          allergy_cross_reactivity: [
            {
              allergen: 'Penicillin',
              cross_reactive_meds: ['Amoxicillin', 'Ampicillin'],
              risk_level: 'High',
              recommendation: 'Avoid all beta-lactam antibiotics'
            }
          ]
        }
      };

      const action = {
        type: 'allergy_check',
        data: {
          medication_list: [
            { name: 'Amoxicillin', dose: '500 mg TID' }
          ],
          patient_allergies: ['Penicillin']
        }
      };

      const response = await PharmacySimulationService.processPharmacyAction(sessionState, action);
      
      expect(response.type).toBe('allergy_check');
      expect(response.data.cross_reactivity_warnings.length).toBeGreaterThan(0);
      expect(response.data.cross_reactivity_warnings[0].recommendation).toContain('Avoid all beta-lactam antibiotics');
    });

    it('should process patient counseling action', async () => {
      const sessionState = {
        clinicalDossier: {
          patient_counseling: {
            medication_counseling: [
              {
                medication: 'Warfarin',
                topics: [
                  {
                    topic: 'dietary_considerations',
                    key_points: ['Avoid vitamin K rich foods', 'Maintain consistent diet'],
                    visual_aids: ['Diet chart'],
                    teach_back_questions: ['What foods should you avoid?']
                  }
                ]
              }
            ]
          }
        }
      };

      const action = {
        type: 'patient_counseling',
        data: {
          medication: 'Warfarin',
          counseling_topics: ['dietary_considerations'],
          patient_understanding: {
            'dietary_considerations': 'Good'
          }
        }
      };

      const response = await PharmacySimulationService.processPharmacyAction(sessionState, action);
      
      expect(response.type).toBe('patient_counseling');
      expect(response.data.counseling_points.length).toBeGreaterThan(0);
      expect(response.data.counseling_points[0].key_points).toContain('Avoid vitamin K rich foods');
    });

    it('should process monitoring parameters action', async () => {
      const sessionState = {
        clinicalDossier: {
          monitoring_parameters: {
            medication_monitoring: [
              {
                medication: 'Warfarin',
                base_frequency: 'Weekly',
                parameters: [
                  {
                    parameter: 'INR',
                    baseline_value: '2.0',
                    target_range: '2.0-3.0',
                    significance: 'Therapeutic anticoagulation',
                    risk_level: 'High',
                    safety_concerns: 'Bleeding risk',
                    emergency_action: 'Hold dose and contact provider'
                  }
                ]
              }
            ]
          }
        }
      };

      const action = {
        type: 'monitoring_parameters',
        data: {
          medication: 'Warfarin',
          therapy_duration: 'Long-term',
          patient_factors: {
            age: 70,
            renal_impairment: true
          }
        }
      };

      const response = await PharmacySimulationService.processPharmacyAction(sessionState, action);
      
      expect(response.type).toBe('monitoring_parameters');
      expect(response.data.monitoring_plan.length).toBeGreaterThan(0);
      expect(response.data.safety_alerts.length).toBeGreaterThan(0);
    });

    it('should process outcome tracking action', async () => {
      const sessionState = {
        clinicalDossier: {
          outcome_tracking: {
            therapeutic_outcomes: [
              {
                medication: 'Lisinopril',
                outcome_type: 'blood_pressure_control',
                target_value: 120,
                base_achievement_rate: 0.8
              }
            ],
            quality_of_life: [
              {
                domain: 'physical_function',
                baseline_score: 60,
                improvement_rate: 0.15
              }
            ],
            economic_impact: [
              {
                aspect: 'hospitalization_rate',
                base_cost: 5000,
                savings_rate: 0.2,
                investment_cost: 1000
              }
            ]
          }
        }
      };

      const action = {
        type: 'outcome_tracking',
        data: {
          medication: 'Lisinopril',
          outcomes_measured: ['blood_pressure_control'],
          time_period: 'Long-term'
        }
      };

      const response = await PharmacySimulationService.processPharmacyAction(sessionState, action);
      
      expect(response.type).toBe('outcome_tracking');
      expect(response.data.outcome_results.length).toBeGreaterThan(0);
      expect(response.data.effectiveness_assessment).toBeDefined();
    });

    it('should process medication reconciliation action', async () => {
      const action = {
        type: 'medication_reconciliation',
        data: {
          current_meds: [
            { name: 'Lisinopril', dose: '10 mg daily' },
            { name: 'Metformin', dose: '500 mg BID' }
          ],
          previous_meds: [
            { name: 'Lisinopril', dose: '5 mg daily' },
            { name: 'Glyburide', dose: '2.5 mg daily' }
          ],
          transition_point: 'hospital_discharge'
        }
      };

      const response = await PharmacySimulationService.processPharmacyAction({}, action);
      
      expect(response.type).toBe('medication_reconciliation');
      expect(response.data.discrepancies.length).toBeGreaterThan(0);
      expect(response.data.resolution_actions.length).toBeGreaterThan(0);
    });
  });

  describe('utility methods', () => {
    it('should convert severity levels correctly', () => {
      expect(PharmacySimulationService.severityToNumber('Low')).toBe(1);
      expect(PharmacySimulationService.severityToNumber('High')).toBe(3);
      expect(PharmacySimulationService.numberToSeverity(2)).toBe('Medium');
      expect(PharmacySimulationService.numberToSeverity(4)).toBe('Severe');
    });

    it('should assess clinical significance correctly', () => {
      const significance = PharmacySimulationService.assessClinicalSignificance(95, 100);
      expect(significance).toContain('Highly significant');
      
      const minimalSignificance = PharmacySimulationService.assessClinicalSignificance(55, 100);
      expect(minimalSignificance).toContain('Minimally significant');
    });

    it('should adjust monitoring frequency for patient factors', () => {
      const frequency = PharmacySimulationService.determineMonitoringFrequency(
        { base_frequency: 'Monthly' },
        'Long-term',
        { renal_impairment: true, age: 75 }
      );
      expect(frequency).toBe('Weekly');
    });
  });

  describe('evaluation criteria', () => {
    it('should return evaluation criteria for pharmacy cases', () => {
      const criteria = PharmacySimulationService.getPharmacyEvaluationCriteria();
      expect(criteria).toHaveProperty('medication_safety');
      expect(criteria).toHaveProperty('therapy_optimization');
      expect(criteria).toHaveProperty('patient_education');
      expect(criteria).toHaveProperty('monitoring_planning');
      expect(criteria).toHaveProperty('outcome_assessment');
      expect(criteria).toHaveProperty('documentation');
    });
  });

  describe('integration with simulation service', () => {
    it('should handle pharmacy actions through simulation service', async () => {
      // Verify that the pharmacy service can be imported and used
      expect(PharmacySimulationService).toBeDefined();
      expect(typeof PharmacySimulationService.processPharmacyAction).toBe('function');
    });
  });
});