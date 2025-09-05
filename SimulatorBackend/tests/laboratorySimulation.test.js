import LaboratorySimulationService from '../src/services/LaboratorySimulationService.js';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import Case from '../src/models/CaseModel.js';

/**
 * Laboratory Simulation Service Tests
 * Tests for laboratory-specific case simulation functionality
 */
describe('LaboratorySimulationService', () => {
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

  describe('processLaboratoryAction', () => {
    it('should process specimen receipt action correctly', async () => {
      const sessionState = {
        clinicalDossier: {
          specimen_information: {
            specimen_quality: 'acceptable',
            labeling_accuracy: 'correct',
            volume_adequacy: 'sufficient'
          }
        }
      };

      const action = {
        type: 'specimen_receipt',
        data: {
          specimen_id: 'SP123',
          verification_steps: ['check_label', 'check_volume']
        }
      };

      const response = await LaboratorySimulationService.processLaboratoryAction(sessionState, action);
      
      expect(response.type).toBe('specimen_verification');
      expect(response.data.acceptance_status).toBe('accepted');
      expect(response.data.verification_results.length).toBeGreaterThan(0);
    });

    it('should reject specimen with quality issues', async () => {
      const sessionState = {
        clinicalDossier: {
          specimen_information: {
            specimen_quality: 'hemolyzed',
            labeling_accuracy: 'correct',
            volume_adequacy: 'sufficient'
          }
        }
      };

      const action = {
        type: 'specimen_receipt',
        data: {
          specimen_id: 'SP124',
          verification_steps: ['check_label', 'check_volume']
        }
      };

      const response = await LaboratorySimulationService.processLaboratoryAction(sessionState, action);
      
      expect(response.data.acceptance_status).toBe('rejected');
      expect(response.data.verification_results[0].issues).toContain('Specimen quality issue: hemolyzed');
    });

    it('should process quality control action', async () => {
      const sessionState = {
        clinicalDossier: {
          quality_control: {
            qc_rules: {
              'Glucose': { upper_limit: 100, lower_limit: 70 }
            }
          },
          hidden_results: {
            'Glucose': 85
          }
        }
      };

      const action = {
        type: 'quality_control',
        data: {
          qc_type: 'internal',
          instrument: 'Analyzer A',
          test_name: 'Glucose'
        }
      };

      const response = await LaboratorySimulationService.processLaboratoryAction(sessionState, action);
      
      expect(response.type).toBe('quality_control');
      expect(response.data.overall_status).toBe('pass');
    });

    it('should process test execution action', async () => {
      const sessionState = {
        clinicalDossier: {
          test_requests: {
            reference_ranges: {
              'Glucose': '70-100 mg/dL'
            }
          },
          hidden_results: {
            'Glucose': 95
          }
        }
      };

      const action = {
        type: 'test_execution',
        data: {
          test_name: 'Glucose',
          instrument: 'Analyzer A',
          parameters: {}
        }
      };

      const response = await LaboratorySimulationService.processLaboratoryAction(sessionState, action);
      
      expect(response.type).toBe('test_results');
      expect(response.data.test_results[0].result).toBe('95');
      expect(response.data.interpretation).toContain('Normal');
    });

    it('should process result interpretation action', async () => {
      const sessionState = {
        clinicalDossier: {
          test_requests: {
            reference_ranges: {
              'Glucose': '70-100 mg/dL'
            }
          }
        }
      };

      const action = {
        type: 'result_interpretation',
        data: {
          test_name: 'Glucose',
          result: 95,
          clinical_correlation: 'Fasting sample'
        }
      };

      const response = await LaboratorySimulationService.processLaboratoryAction(sessionState, action);
      
      expect(response.type).toBe('result_interpretation');
      expect(response.data.interpretation).toContain('Within reference range');
      expect(response.data.recommendations.length).toBeGreaterThan(0);
    });

    it('should process safety incident action', async () => {
      const action = {
        type: 'safety_incident',
        data: {
          incident_type: 'chemical_spill',
          severity: 'moderate',
          location: 'Chemistry lab'
        }
      };

      const response = await LaboratorySimulationService.processLaboratoryAction({}, action);
      
      expect(response.type).toBe('safety_incident');
      expect(response.data.emergency_procedures).toContain('Evacuate immediate area');
      expect(response.data.reporting_requirements).toContain('Complete incident report');
    });

    it('should process critical value action', async () => {
      const action = {
        type: 'critical_value',
        data: {
          test_name: 'Potassium',
          result: '6.5 mmol/L',
          patient_info: 'Patient ID: 123'
        }
      };

      const response = await LaboratorySimulationService.processLaboratoryAction({}, action);
      
      expect(response.type).toBe('critical_value');
      expect(response.data.critical).toBe(true);
      expect(response.data.communication_protocol).toContain('Notify ordering physician immediately');
    });
  });

  describe('utility methods', () => {
    it('should generate test results for known test types', () => {
      const result = LaboratorySimulationService.generateTestResult('CBC WBC');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should interpret results against reference ranges', () => {
      const interpretation = LaboratorySimulationService.interpretResult('85', '70-100', 'Glucose');
      expect(interpretation).toContain('Normal');

      const lowInterpretation = LaboratorySimulationService.interpretResult('65', '70-100', 'Glucose');
      expect(lowInterpretation).toContain('Low');

      const highInterpretation = LaboratorySimulationService.interpretResult('105', '70-100', 'Glucose');
      expect(highInterpretation).toContain('High');
    });

    it('should return evaluation criteria for laboratory cases', () => {
      const criteria = LaboratorySimulationService.getLaboratoryEvaluationCriteria();
      expect(criteria).toHaveProperty('specimen_handling');
      expect(criteria).toHaveProperty('quality_control');
      expect(criteria).toHaveProperty('technical_competency');
      expect(criteria).toHaveProperty('result_interpretation');
      expect(criteria).toHaveProperty('safety_protocols');
      expect(criteria).toHaveProperty('timeliness');
    });
  });

  describe('integration with simulation service', () => {
    it('should handle laboratory actions through simulation service', async () => {
      // This test would require mocking the simulation service handleAsk function
      // For now, we'll verify that the laboratory service can be imported and used
      expect(LaboratorySimulationService).toBeDefined();
      expect(typeof LaboratorySimulationService.processLaboratoryAction).toBe('function');
    });
  });
});