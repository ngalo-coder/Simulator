const RadiologySimulationService = require('../src/services/RadiologySimulationService');
const { mongoose } = require('../src/config/db');

describe('RadiologySimulationService', () => {
  let sessionState;
  let clinicalDossier;

  beforeEach(() => {
    clinicalDossier = {
      imaging_study: {
        modality: 'CT',
        study_type: 'Chest CT',
        technique: {
          contrast_used: true,
          contrast_type: 'IV contrast',
          acquisition_parameters: { kvp: 120, ma: 200 },
          patient_positioning: 'supine'
        },
        image_quality: {
          technical_adequacy: 'excellent',
          artifacts: ['minimal motion artifact'],
          limitations: ['body habitus limitations']
        }
      },
      systematic_review: {
        anatomical_structures: ['lungs', 'heart', 'mediastinum', 'bones'],
        normal_variants: ['accessory fissure'],
        pathological_findings: ['pulmonary nodule', 'pleural effusion'],
        measurements: { nodule_size: '8mm' },
        comparison_studies: ['CXR 2023-01-15']
      },
      imaging_findings: {
        primary_findings: ['Right lower lobe nodule'],
        secondary_findings: ['Minimal pleural effusion'],
        incidental_findings: ['Thyroid nodule'],
        normal_structures: ['Heart size normal', 'No pneumothorax']
      },
      radiation_safety: {
        dose_considerations: 'ALARA principles followed',
        justification: 'Suspected lung cancer',
        optimization: ['Dose modulation enabled', 'Iterative reconstruction used']
      },
      patient_persona: {
        clinical_history: '55-year-old smoker with cough and weight loss',
        referring_physician: 'Dr. Smith',
        clinical_question: 'Rule out lung cancer',
        previous_imaging: ['CXR 2023-01-15 showed right lower lobe opacity']
      },
      hidden_diagnosis: 'Primary lung adenocarcinoma'
    };

    sessionState = {
      clinicalDossier
    };
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('processStudySelection', () => {
    it('should assess study selection appropriateness', async () => {
      const data = { 
        clinical_indication: 'chest_pain', 
        patient_factors: { renal_impairment: false, pregnancy: false },
        priority: 'routine'
      };
      const result = await RadiologySimulationService.processStudySelection(sessionState, data);
      
      expect(result.type).toBe('study_selection');
      expect(result.data.selected_modality).toBe('CT');
      expect(result.data.appropriateness_score).toBeGreaterThan(50);
      expect(result.data.contraindications).toContain('No contraindications identified');
    });

    it('should identify contraindications for contrast studies', async () => {
      const data = { 
        clinical_indication: 'chest_pain', 
        patient_factors: { renal_impairment: true, pregnancy: false },
        priority: 'routine'
      };
      const result = await RadiologySimulationService.processStudySelection(sessionState, data);
      
      expect(result.type).toBe('study_selection');
      expect(result.data.contraindications).toContain('Contrast contraindicated due to renal impairment');
      expect(result.data.appropriateness_score).toBeLessThan(70);
    });

    it('should identify pregnancy contraindications for radiation studies', async () => {
      const data = { 
        clinical_indication: 'chest_pain', 
        patient_factors: { renal_impairment: false, pregnancy: true },
        priority: 'routine'
      };
      const result = await RadiologySimulationService.processStudySelection(sessionState, data);
      
      expect(result.type).toBe('study_selection');
      expect(result.data.contraindications).toContain('Radiation exposure risk in pregnancy');
    });
  });

  describe('processImagingTechnique', () => {
    it('should assess imaging technique optimization', async () => {
      const data = { 
        protocol_parameters: { slice_thickness: '1mm', reconstruction_kernel: 'lung' },
        patient_positioning: 'supine',
        contrast_considerations: 'renal function normal'
      };
      const result = await RadiologySimulationService.processImagingTechnique(sessionState, data);
      
      expect(result.type).toBe('imaging_technique');
      expect(result.data.technique_assessment.length).toBeGreaterThan(0);
      expect(result.data.estimated_dose).toBe('5-10 mSv');
      expect(result.data.next_steps).toContain('Proceed with image acquisition and interpretation');
    });
  });

  describe('processImageInterpretation', () => {
    it('should assess image interpretation accuracy', async () => {
      const data = { 
        anatomical_region: 'chest',
        findings: [
          { description: 'Right lower lobe pulmonary nodule', location: 'RLL', size: '8mm' },
          { description: 'Minimal right pleural effusion', location: 'right pleural space' }
        ],
        measurements: { nodule_size: '8mm' }
      };
      const result = await RadiologySimulationService.processImageInterpretation(sessionState, data);
      
      expect(result.type).toBe('image_interpretation');
      expect(result.data.identified_findings.length).toBeGreaterThan(0);
      expect(result.data.normal_structures.length).toBeGreaterThan(0);
      expect(result.data.interpretation_quality).toBeDefined();
    });

    it('should identify missed findings', async () => {
      const data = { 
        anatomical_region: 'chest',
        findings: [
          { description: 'Minimal right pleural effusion', location: 'right pleural space' }
        ], // Missing the nodule finding
        measurements: {}
      };
      const result = await RadiologySimulationService.processImageInterpretation(sessionState, data);
      
      const missedFinding = result.data.identified_findings.find(f => f.status === 'missed');
      expect(missedFinding).toBeDefined();
      expect(missedFinding.finding).toContain('pulmonary nodule');
    });
  });

  describe('processFindingDocumentation', () => {
    it('should assess finding documentation completeness', async () => {
      const data = { 
        findings: [
          { 
            description: 'Right lower lobe pulmonary nodule', 
            location: 'RLL', 
            size: '8mm', 
            characteristics: 'solid, spiculated',
            significance: 'suspicious for malignancy'
          }
        ],
        categorization: [
          { type: 'primary', findings: ['pulmonary nodule'] },
          { type: 'secondary', findings: ['pleural effusion'] }
        ],
        urgency_level: 'routine'
      };
      const result = await RadiologySimulationService.processFindingDocumentation(sessionState, data);
      
      expect(result.type).toBe('finding_documentation');
      expect(result.data.documentation_assessment.length).toBeGreaterThan(0);
      expect(result.data.quality_metrics.completeness).toBeGreaterThan(80);
    });

    it('should identify incomplete documentation', async () => {
      const data = { 
        findings: [
          { description: 'Right lower lobe pulmonary nodule' } // Missing location, size, etc.
        ],
        categorization: [],
        urgency_level: 'routine'
      };
      const result = await RadiologySimulationService.processFindingDocumentation(sessionState, data);
      
      const assessment = result.data.documentation_assessment[0];
      expect(assessment.missing_elements.length).toBeGreaterThan(0);
      expect(assessment.completeness_score).toBeLessThan(100);
    });
  });

  describe('processReportGeneration', () => {
    it('should assess report quality', async () => {
      const data = { 
        report_structure: ['clinical_history', 'technique', 'findings', 'impression', 'recommendations'],
        findings_summary: 'Right lower lobe 8mm solid nodule. Minimal right pleural effusion.',
        impressions: 'Suspicious right lower lobe nodule, recommend PET-CT for further evaluation.',
        recommendations: ['PET-CT', '3-month follow-up CT']
      };
      const result = await RadiologySimulationService.processReportGeneration(sessionState, data);
      
      expect(result.type).toBe('report_generation');
      expect(result.data.structured_report).toBeDefined();
      expect(result.data.report_assessment.length).toBeGreaterThan(0);
    });

    it('should identify missing report sections', async () => {
      const data = { 
        report_structure: ['clinical_history', 'findings'], // Missing technique, impression, recommendations
        findings_summary: 'Right lower lobe nodule',
        impressions: '',
        recommendations: []
      };
      const result = await RadiologySimulationService.processReportGeneration(sessionState, data);
      
      expect(result.data.quality_issues.length).toBeGreaterThan(0);
      expect(result.data.quality_issues[0]).toContain('Missing report sections');
    });
  });

  describe('processRadiationSafety', () => {
    it('should assess radiation safety compliance', async () => {
      const data = { 
        dose_optimization: { dose_reduction: true, modulation: true },
        safety_protocols: { shielding: true, pregnancy_screening: true },
        patient_protection: { lead_apron: true, thyroid_shield: true }
      };
      const result = await RadiologySimulationService.processRadiationSafety(sessionState, data);
      
      expect(result.type).toBe('radiation_safety');
      expect(result.data.safety_assessment.length).toBeGreaterThan(0);
      expect(result.data.alara_principles.length).toBe(4);
    });
  });

  describe('processCriticalFinding', () => {
    it('should handle critical finding communication', async () => {
      const data = { 
        finding: 'Aortic dissection',
        severity: 'immediate',
        communication_method: 'phone',
        recipient: 'emergency_physician'
      };
      const result = await RadiologySimulationService.processCriticalFinding(sessionState, data);
      
      expect(result.type).toBe('critical_finding');
      expect(result.data.communication_protocol).toContain('Direct phone call to ordering physician');
      expect(result.data.documentation_requirements.length).toBeGreaterThan(0);
    });
  });

  describe('processConsultationRequest', () => {
    it('should assess consultation appropriateness', async () => {
      const data = { 
        consult_reason: 'complex thoracic mass',
        requested_specialty: 'thoracic_surgery',
        urgency: 'routine',
        clinical_question: 'Surgical resectability assessment'
      };
      const result = await RadiologySimulationService.processConsultationRequest(sessionState, data);
      
      expect(result.type).toBe('consultation_request');
      expect(result.data.consultation_assessment[0].appropriateness_score).toBe(85);
      expect(result.data.communication_requirements.length).toBeGreaterThan(0);
    });
  });

  describe('getRadiologyEvaluationCriteria', () => {
    it('should return radiology evaluation criteria', () => {
      const criteria = RadiologySimulationService.getRadiologyEvaluationCriteria();
      
      expect(criteria.systematic_approach.weight).toBe(0.25);
      expect(criteria.finding_identification.weight).toBe(0.30);
      expect(criteria.differential_diagnosis.weight).toBe(0.25);
      expect(criteria.reporting_quality.weight).toBe(0.15);
      expect(criteria.radiation_safety.weight).toBe(0.05);
      expect(criteria.systematic_approach.description).toContain('Structured image review');
    });
  });
});