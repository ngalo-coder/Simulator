const express = require('express');
const router = express.Router();

// Mock function to generate report data
const generateMockReport = (simulationId) => {
  return {
    success: true,
    report: {
      simulationOverview: {
        scenarioDetails: {
          caseName: 'Pediatric Asthma Exacerbation',
          patientDescription: 'A 7-year-old with a history of asthma presenting with acute respiratory distress.',
          programArea: 'Pediatrics',
        },
        sessionInfo: {
          duration: '30',
        },
        difficultyLevel: 'Resident',
        learningObjectives: [
          'Recognize and assess the severity of an acute asthma exacerbation.',
          'Initiate appropriate and timely management of pediatric asthma.',
          'Demonstrate effective communication with the patient and family.',
        ],
      },
      overallScore: 85,
      performanceMetrics: {
        scoringRubric: {
          historyTaking: 90,
          physicalExam: 85,
          clinicalDecisionMaking: 80,
          communication: 88,
        },
        checklistEvaluation: {
          completedActions: [
            { action: 'Administer albuterol', details: '5mg via nebulizer', appropriate: true, timing: 'appropriate' },
            { action: 'Administer corticosteroids', details: 'Oral prednisolone 2mg/kg', appropriate: true, timing: 'appropriate' },
            { action: 'Assess vital signs', details: 'Checked HR, RR, O2 sat', appropriate: true, timing: 'early' },
            { action: 'Auscultate lungs', details: 'Listened for wheezing', appropriate: true, timing: 'appropriate' },
          ],
        },
      },
      clinicalDecisionMaking: {
        strengths: [
          'Prompt initiation of bronchodilator therapy.',
          'Correct dosage calculation for corticosteroids.',
        ],
        areasForImprovement: [
          'Consideration of ipratropium bromide for severe exacerbation.',
          'Could have provided more reassurance to the patient.',
        ],
        alternativeApproaches: [
          'For a more severe presentation, IV magnesium sulfate could have been considered.',
        ],
      },
      communicationAssessment: {
        patientInteraction: {
          empathy: 90,
          clarity: 85,
        },
        professionalBehavior: {
          professionalism: 95,
          teamwork: 'N/A',
        },
        feedback: 'Excellent use of age-appropriate language. Try to explain procedures before performing them.',
      },
      timelineAnalysis: {
        timeline: [
          { minutesFromStart: 0, type: 'simulation_start', description: 'Simulation started.' },
          { minutesFromStart: 2, type: 'clinical_action', description: 'Assessed vital signs.' },
          { minutesFromStart: 5, type: 'clinical_action', description: 'Administered albuterol.' },
          { minutesFromStart: 15, type: 'clinical_action', description: 'Administered corticosteroids.' },
          { minutesFromStart: 30, type: 'simulation_end', description: 'Simulation completed.' },
        ],
      },
      debriefingQuestions: {
        reflectionQuestions: [
          'What were the key signs that indicated this was a severe exacerbation?',
          'How would your management change if the patient did not respond to initial therapy?',
          'What are the key discharge criteria for a pediatric patient with asthma?',
        ],
        expertFeedback: 'The user demonstrated a solid understanding of pediatric asthma management. The initial treatment was appropriate and timely. Key areas for development include considering adjunct therapies in severe cases and enhancing patient-centered communication.',
      },
      actionableNextSteps: {
        personalizedLearningPlan: [
          'Review the latest GINA guidelines for pediatric asthma management.',
          'Practice communication strategies for pediatric patients in distress.',
        ],
        recommendedResources: [
          'National Asthma Education and Prevention Program (NAEPP) guidelines.',
          'Article: "Management of Acute Asthma Exacerbations" in Pediatrics in Review.',
        ],
      },
    },
    simulationId: simulationId,
    generatedAt: new Date().toISOString(),
  };
};

router.get('/:simulationId', (req, res) => {
  const { simulationId } = req.params;
  if (!simulationId) {
    return res.status(400).json({ success: false, error: 'Simulation ID is required' });
  }

  try {
    const report = generateMockReport(simulationId);
    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

module.exports = router;
