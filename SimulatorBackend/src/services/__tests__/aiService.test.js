import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import OpenAI from 'openai';
import { getPatientResponseStream, getEvaluation } from '../aiService.js';
import logger from '../../config/logger.js';

// Mock dependencies
jest.mock('openai');
jest.mock('../../config/logger.js');

describe('aiService', () => {
  const mockCaseData = {
    patient_persona: {
      name: 'John Doe',
      age: 45,
      speaks_for: 'Self',
      emotional_tone: 'concerned'
    },
    clinical_dossier: {
      hidden_diagnosis: 'Acute Coronary Syndrome',
      history_of_presenting_illness: {
        onset: 'Sudden',
        location: 'Chest',
        character: 'Pressure',
        severity: 8,
        timing_and_duration: '30 minutes',
        exacerbating_factors: 'Exertion',
        relieving_factors: 'Rest',
        associated_symptoms: ['Shortness of breath', 'Diaphoresis']
      },
      past_medical_history: ['Hypertension', 'Hyperlipidemia'],
      medications: ['Lisinopril 10mg daily', 'Atorvastatin 20mg daily'],
      allergies: ['Penicillin'],
      surgical_history: ['Appendectomy 2005'],
      family_history: ['Father with CAD at age 50'],
      social_history: {
        smoking_status: 'Former smoker, quit 5 years ago',
        alcohol_use: 'Social drinker',
        substance_use: 'None',
        diet_and_exercise: 'Sedentary lifestyle, poor diet'
      },
      review_of_systems: {
        comment: 'Generally unwell',
        positive: ['Chest pain', 'Shortness of breath'],
        negative: ['Fever', 'Cough']
      }
    },
    evaluation_criteria: {
      History_Taking: 'Completeness of history gathered',
      Risk_Factor_Assessment: 'Identification of relevant risk factors',
      Differential_Diagnosis_Generation: 'Appropriate differential generation',
      Diagnostic_Reasoning: 'Logical progression to diagnosis',
      Clinical_Decision_Making: 'Appropriate management decisions',
      Communication_and_Empathy: 'Patient-centered communication',
      Clinical_Urgency_Recognition: 'Recognition of time-sensitive conditions'
    }
  };

  const mockConversationHistory = [
    { role: 'Patient', content: 'Hello doctor, I have chest pain.', timestamp: new Date() },
    { role: 'Clinician', content: 'Can you describe the pain?', timestamp: new Date() }
  ];

  const mockQuestion = 'What makes the pain better or worse?';
  const mockSessionId = 'test-session-123';
  const mockResponse = {
    write: jest.fn(),
    end: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    logger.child = jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getPatientResponseStream', () => {
    it('should stream patient response successfully', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: jest.fn().mockReturnValue(async function* () {
          yield { choices: [{ delta: { content: 'The pain gets worse with activity' } }] };
          yield { choices: [{ delta: { content: ' and better with rest.' } }] };
        }())
      };

      OpenAI.prototype.chat.completions.create = jest.fn().mockResolvedValue(mockStream);

      const result = await getPatientResponseStream(
        mockCaseData,
        mockConversationHistory,
        mockQuestion,
        mockSessionId,
        mockResponse,
        false
      );

      expect(OpenAI.prototype.chat.completions.create).toHaveBeenCalledWith({
        model: 'openai/gpt-4o',
        messages: [{ role: 'system', content: expect.any(String) }],
        temperature: 0.7,
        max_tokens: 100,
        stream: true
      });

      expect(mockResponse.write).toHaveBeenCalled();
      expect(mockResponse.end).toHaveBeenCalled();
      expect(result.fullResponse).toBe('The pain gets worse with activity and better with rest.');
      expect(result.sessionShouldBeMarkedEnded).toBe(false);
    });

    it('should handle streaming errors gracefully', async () => {
      OpenAI.prototype.chat.completions.create = jest.fn().mockRejectedValue(
        new Error('API error')
      );

      const result = await getPatientResponseStream(
        mockCaseData,
        mockConversationHistory,
        mockQuestion,
        mockSessionId,
        mockResponse,
        false
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"')
      );
      expect(mockResponse.end).toHaveBeenCalled();
      expect(result.fullResponse).toBe('');
    });

    it('should mark session ended when willEndCurrentResponse is true', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: jest.fn().mockReturnValue(async function* () {
          yield { choices: [{ delta: { content: 'Thank you doctor' } }] };
        }())
      };

      OpenAI.prototype.chat.completions.create = jest.fn().mockResolvedValue(mockStream);

      const result = await getPatientResponseStream(
        mockCaseData,
        mockConversationHistory,
        mockQuestion,
        mockSessionId,
        mockResponse,
        true
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"type":"session_end"')
      );
      expect(result.sessionShouldBeMarkedEnded).toBe(true);
    });
  });

  describe('getEvaluation', () => {
    it('should generate comprehensive evaluation successfully', async () => {
      const mockEvaluationResponse = {
        choices: [{
          message: {
            content: `SESSION END
Thank you for completing the simulation. Here is a comprehensive evaluation of your clinical reasoning performance based on the case of John Doe.
Hidden Diagnosis: Acute Coronary Syndrome

CLINICAL REASONING EVALUATION:
1. History Taking: (Rating: Excellent)
Comprehensive history gathered including onset, location, character, severity, and associated symptoms.

2. Risk Factor Assessment: (Rating: Very Good)
Identified hypertension and hyperlipidemia but missed family history significance.

3. Differential Diagnosis Generation: (Rating: Good)
Generated appropriate differential including ACS but could have considered more possibilities.

4. Diagnostic Reasoning: (Rating: Very Good)
Logical progression from history to differential diagnosis.

5. Clinical Decision Making: (Rating: Excellent)
Appropriate management decisions including ECG and cardiac markers.

6. Communication and Empathy: (Rating: Excellent)
Patient-centered communication with good rapport.

7. Clinical Urgency Recognition: (Rating: Excellent)
Recognized time-sensitive nature and escalated appropriately.

CLINICAL REASONING ANALYSIS:
Strong pattern recognition and hypothesis-driven questioning. Good diagnostic efficiency.

DIAGNOSTIC ACCURACY: Reached

Overall Clinical Reasoning Score: 88%
Performance Label: Very good

KEY RECOMMENDATIONS:
1. Consider family history more thoroughly in risk assessment
2. Expand differential to include pulmonary embolism
3. Practice time management in urgent scenarios`
          }
        }]
      };

      OpenAI.prototype.chat.completions.create = jest.fn().mockResolvedValue(mockEvaluationResponse);

      const result = await getEvaluation(mockCaseData, mockConversationHistory);

      expect(OpenAI.prototype.chat.completions.create).toHaveBeenCalledWith({
        model: 'openai/gpt-4o',
        messages: [{ role: 'system', content: expect.any(String) }],
        temperature: 0.4,
        max_tokens: 2000
      });

      expect(result.evaluationText).toBe(mockEvaluationResponse.choices[0].message.content);
      expect(result.extractedMetrics).toEqual({
        history_taking_rating: 'Excellent',
        risk_factor_assessment_rating: 'Very Good',
        differential_diagnosis_questioning_rating: 'Good',
        communication_and_empathy_rating: 'Excellent',
        clinical_urgency_rating: 'Excellent',
        overall_diagnosis_accuracy: 'Reached',
        evaluation_summary: expect.any(String),
        overall_score: 88,
        performance_label: 'Very good'
      });
    });

    it('should handle missing hidden diagnosis or evaluation criteria', async () => {
      const caseWithoutDiagnosis = { ...mockCaseData };
      delete caseWithoutDiagnosis.clinical_dossier.hidden_diagnosis;

      const result = await getEvaluation(caseWithoutDiagnosis, mockConversationHistory);

      expect(result.evaluationText).toBe('Evaluation data is missing from the case file.');
      expect(result.extractedMetrics.overall_score).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      OpenAI.prototype.chat.completions.create = jest.fn().mockRejectedValue(
        new Error('Evaluation API error')
      );

      const result = await getEvaluation(mockCaseData, mockConversationHistory);

      expect(result.evaluationText).toBe('An error occurred while generating the comprehensive evaluation.');
      expect(result.extractedMetrics.overall_score).toBeNull();
    });

    it('should parse evaluation metrics from text correctly', async () => {
      const evaluationText = `SESSION END
Thank you for completing the simulation.
Hidden Diagnosis: Test Diagnosis

CLINICAL REASONING EVALUATION:
1. History Taking: (Rating: Excellent)
Good job.

2. Risk Factor Assessment: (Rating: Very Good)
Well done.

3. Differential Diagnosis Generation: (Rating: Good)
Average.

4. Diagnostic Reasoning: (Rating: Very Good)
Logical.

5. Clinical Decision Making: (Rating: Excellent)
Appropriate.

6. Communication and Empathy: (Rating: Excellent)
Empathetic.

7. Clinical Urgency Recognition: (Rating: Excellent)
Timely.

CLINICAL REASONING ANALYSIS:
Good overall.

DIAGNOSTIC ACCURACY: Reached

Overall Clinical Reasoning Score: 92%
Performance Label: Excellent

KEY RECOMMENDATIONS:
Keep it up.`;

      // Mock the OpenAI call to return our test text
      OpenAI.prototype.chat.completions.create = jest.fn().mockResolvedValue({
        choices: [{ message: { content: evaluationText } }]
      });

      const result = await getEvaluation(mockCaseData, mockConversationHistory);

      expect(result.extractedMetrics).toEqual({
        history_taking_rating: 'Excellent',
        risk_factor_assessment_rating: 'Very Good',
        differential_diagnosis_questioning_rating: 'Good',
        communication_and_empathy_rating: 'Excellent',
        clinical_urgency_rating: 'Excellent',
        overall_diagnosis_accuracy: 'Reached',
        evaluation_summary: expect.any(String),
        overall_score: 92,
        performance_label: 'Excellent'
      });
    });
  });
});