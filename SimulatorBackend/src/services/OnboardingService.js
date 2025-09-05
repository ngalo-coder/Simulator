import User from '../models/UserModel.js';
import StudentProgress from '../models/StudentProgressModel.js';
import LearningGoal from '../models/LearningGoalModel.js';
import LearningPath from '../models/LearningPathModel.js';
import mongoose from 'mongoose';

/**
 * Onboarding Service
 * Provides comprehensive onboarding workflows and interactive tutorials
 */
class OnboardingService {
  constructor() {
    this.onboardingWorkflows = {
      medicine: {
        name: 'Medicine Onboarding',
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Medical Simulation',
            description: 'Get started with your medical education journey',
            type: 'welcome',
            duration: 2,
            required: true
          },
          {
            id: 'platform_tour',
            title: 'Platform Tour',
            description: 'Learn how to navigate the simulation platform',
            type: 'tutorial',
            duration: 5,
            required: true
          },
          {
            id: 'first_case',
            title: 'Complete Your First Case',
            description: 'Practice with a beginner-level medical case',
            type: 'case',
            duration: 15,
            required: true,
            caseCriteria: {
              difficulty: 'beginner',
              specialty: 'medicine'
            }
          },
          {
            id: 'goal_setting',
            title: 'Set Learning Goals',
            description: 'Define your learning objectives and targets',
            type: 'goal_setting',
            duration: 5,
            required: true
          },
          {
            id: 'progress_review',
            title: 'Review Your Progress',
            description: 'Understand how to track your learning journey',
            type: 'tutorial',
            duration: 3,
            required: true
          }
        ]
      },
      nursing: {
        name: 'Nursing Onboarding',
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Nursing Simulation',
            description: 'Begin your nursing clinical practice',
            type: 'welcome',
            duration: 2,
            required: true
          },
          {
            id: 'patient_care_basics',
            title: 'Patient Care Basics',
            description: 'Learn fundamental patient care techniques',
            type: 'tutorial',
            duration: 8,
            required: true
          },
          {
            id: 'medication_safety',
            title: 'Medication Safety',
            description: 'Practice safe medication administration',
            type: 'tutorial',
            duration: 10,
            required: true
          },
          {
            id: 'first_nursing_case',
            title: 'Complete Nursing Case',
            description: 'Handle a patient care scenario',
            type: 'case',
            duration: 20,
            required: true,
            caseCriteria: {
              difficulty: 'beginner',
              specialty: 'nursing'
            }
          }
        ]
      },
      laboratory: {
        name: 'Laboratory Onboarding',
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Lab Simulation',
            description: 'Start your laboratory diagnostics training',
            type: 'welcome',
            duration: 2,
            required: true
          },
          {
            id: 'safety_protocols',
            title: 'Lab Safety Protocols',
            description: 'Learn essential laboratory safety procedures',
            type: 'tutorial',
            duration: 10,
            required: true
          },
          {
            id: 'specimen_handling',
            title: 'Specimen Handling',
            description: 'Practice proper specimen collection and processing',
            type: 'tutorial',
            duration: 8,
            required: true
          },
          {
            id: 'first_lab_case',
            title: 'Complete Lab Analysis',
            description: 'Perform diagnostic test interpretation',
            type: 'case',
            duration: 15,
            required: true,
            caseCriteria: {
              difficulty: 'beginner',
              specialty: 'laboratory'
            }
          }
        ]
      },
      radiology: {
        name: 'Radiology Onboarding',
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Radiology Simulation',
            description: 'Begin your medical imaging training',
            type: 'welcome',
            duration: 2,
            required: true
          },
          {
            id: 'image_interpretation',
            title: 'Image Interpretation Basics',
            description: 'Learn fundamental radiology interpretation skills',
            type: 'tutorial',
            duration: 12,
            required: true
          },
          {
            id: 'radiation_safety',
            title: 'Radiation Safety',
            description: 'Understand radiation protection principles',
            type: 'tutorial',
            duration: 8,
            required: true
          },
          {
            id: 'first_radiology_case',
            title: 'Complete Radiology Case',
            description: 'Interpret diagnostic images',
            type: 'case',
            duration: 18,
            required: true,
            caseCriteria: {
              difficulty: 'beginner',
              specialty: 'radiology'
            }
          }
        ]
      },
      pharmacy: {
        name: 'Pharmacy Onboarding',
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Pharmacy Simulation',
            description: 'Start your pharmaceutical care training',
            type: 'welcome',
            duration: 2,
            required: true
          },
          {
            id: 'medication_therapy',
            title: 'Medication Therapy Management',
            description: 'Learn drug therapy optimization principles',
            type: 'tutorial',
            duration: 10,
            required: true
          },
          {
            id: 'patient_counseling',
            title: 'Patient Counseling',
            description: 'Practice effective patient communication',
            type: 'tutorial',
            duration: 8,
            required: true
          },
          {
            id: 'first_pharmacy_case',
            title: 'Complete Pharmacy Case',
            description: 'Handle medication-related scenarios',
            type: 'case',
            duration: 15,
            required: true,
            caseCriteria: {
              difficulty: 'beginner',
              specialty: 'pharmacy'
            }
          }
        ]
      }
    };

    this.competencyAssessments = {
      beginner: [
        {
          competency: 'clinical_reasoning',
          questions: [
            {
              question: 'When presented with a patient, what is your first step?',
              options: [
                'Immediate treatment',
                'Complete patient assessment',
                'Order diagnostic tests',
                'Consult with senior clinician'
              ],
              correctAnswer: 1
            }
          ]
        },
        {
          competency: 'communication',
          questions: [
            {
              question: 'How do you approach patient communication?',
              options: [
                'Direct and authoritative',
                'Patient-centered and empathetic',
                'Technical and detailed',
                'Minimal and efficient'
              ],
              correctAnswer: 1
            }
          ]
        }
      ],
      intermediate: [
        {
          competency: 'diagnosis',
          questions: [
            {
              question: 'How do you prioritize differential diagnoses?',
              options: [
                'By probability based on prevalence',
                'By severity of potential outcomes',
                'By ease of testing',
                'By personal experience'
              ],
              correctAnswer: 0
            }
          ]
        }
      ]
    };
  }

  /**
   * Start onboarding process for a new student
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Onboarding status and next steps
   */
  async startOnboarding(user) {
    try {
      const discipline = user.profile?.discipline || 'medicine';
      const workflow = this.onboardingWorkflows[discipline];
      
      if (!workflow) {
        throw new Error(`No onboarding workflow found for discipline: ${discipline}`);
      }

      // Create onboarding progress record
      const onboardingProgress = {
        userId: user._id,
        discipline: discipline,
        currentStep: 0,
        completedSteps: [],
        status: 'in_progress',
        startedAt: new Date(),
        estimatedCompletion: this.calculateEstimatedCompletion(workflow)
      };

      // Store onboarding progress
      await mongoose.connection.db.collection('onboarding_progress').insertOne(onboardingProgress);

      // Create initial learning goals
      await this.createInitialLearningGoals(user, discipline);

      return {
        success: true,
        workflow: {
          name: workflow.name,
          totalSteps: workflow.steps.length,
          currentStep: 0,
          nextStep: workflow.steps[0]
        },
        progress: onboardingProgress
      };
    } catch (error) {
      console.error('Start onboarding error:', error);
      throw error;
    }
  }

  /**
   * Get current onboarding status for student
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Current onboarding status
   */
  async getOnboardingStatus(user) {
    try {
      const onboardingDoc = await mongoose.connection.db.collection('onboarding_progress')
        .findOne({ userId: user._id });

      if (!onboardingDoc) {
        return { status: 'not_started' };
      }

      const discipline = onboardingDoc.discipline;
      const workflow = this.onboardingWorkflows[discipline];
      const currentStep = workflow.steps[onboardingDoc.currentStep];

      return {
        status: onboardingDoc.status,
        progress: {
          currentStep: onboardingDoc.currentStep,
          totalSteps: workflow.steps.length,
          completedSteps: onboardingDoc.completedSteps.length,
          percentage: Math.round((onboardingDoc.completedSteps.length / workflow.steps.length) * 100)
        },
        currentStep: currentStep,
        nextStep: workflow.steps[onboardingDoc.currentStep + 1] || null,
        startedAt: onboardingDoc.startedAt,
        estimatedCompletion: onboardingDoc.estimatedCompletion
      };
    } catch (error) {
      console.error('Get onboarding status error:', error);
      throw error;
    }
  }

  /**
   * Complete an onboarding step
   * @param {Object} user - User object
   * @param {string} stepId - Step ID to complete
   * @param {Object} stepData - Step completion data
   * @returns {Promise<Object>} - Updated onboarding status
   */
  async completeOnboardingStep(user, stepId, stepData = {}) {
    try {
      const onboardingDoc = await mongoose.connection.db.collection('onboarding_progress')
        .findOne({ userId: user._id });

      if (!onboardingDoc) {
        throw new Error('Onboarding not started');
      }

      const discipline = onboardingDoc.discipline;
      const workflow = this.onboardingWorkflows[discipline];
      const currentStepIndex = onboardingDoc.currentStep;
      const currentStep = workflow.steps[currentStepIndex];

      if (currentStep.id !== stepId) {
        throw new Error('Invalid step completion sequence');
      }

      // Update onboarding progress
      const completedSteps = [...onboardingDoc.completedSteps, {
        stepId: currentStep.id,
        completedAt: new Date(),
        data: stepData
      }];

      const nextStepIndex = currentStepIndex + 1;
      const isComplete = nextStepIndex >= workflow.steps.length;

      await mongoose.connection.db.collection('onboarding_progress').updateOne(
        { userId: user._id },
        {
          $set: {
            currentStep: isComplete ? currentStepIndex : nextStepIndex,
            completedSteps: completedSteps,
            status: isComplete ? 'completed' : 'in_progress',
            completedAt: isComplete ? new Date() : undefined
          }
        }
      );

      // Handle step-specific completion actions
      await this.handleStepCompletion(user, currentStep, stepData);

      return {
        success: true,
        completedStep: currentStep,
        nextStep: !isComplete ? workflow.steps[nextStepIndex] : null,
        isComplete: isComplete,
        progress: {
          completed: completedSteps.length,
          total: workflow.steps.length,
          percentage: Math.round((completedSteps.length / workflow.steps.length) * 100)
        }
      };
    } catch (error) {
      console.error('Complete onboarding step error:', error);
      throw error;
    }
  }

  /**
   * Handle step-specific completion actions
   */
  async handleStepCompletion(user, step, stepData) {
    switch (step.type) {
      case 'goal_setting':
        await this.processGoalSetting(user, stepData);
        break;
      case 'case':
        await this.processCaseCompletion(user, stepData);
        break;
      case 'assessment':
        await this.processAssessment(user, stepData);
        break;
      default:
        // No specific action for other step types
        break;
    }
  }

  /**
   * Process goal setting step
   */
  async processGoalSetting(user, goalData) {
    const defaultGoals = [
      {
        title: 'Complete 10 cases in first month',
        category: 'completion',
        targetScore: 75,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        priority: 'high'
      },
      {
        title: 'Achieve 80% average score',
        category: 'performance',
        targetScore: 80,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        priority: 'medium'
      },
      {
        title: 'Master clinical reasoning skills',
        category: 'clinical_skills',
        targetScore: 85,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        priority: 'high'
      }
    ];

    for (const goal of defaultGoals) {
      await LearningGoal.create({
        userId: user._id,
        ...goal,
        status: 'not_started',
        progress: 0
      });
    }
  }

  /**
   * Process case completion step
   */
  async processCaseCompletion(user, caseData) {
    // This would typically integrate with the case completion system
    // For now, we'll just record the completion
    await mongoose.connection.db.collection('onboarding_activities').insertOne({
      userId: user._id,
      activityType: 'case_completion',
      caseId: caseData.caseId,
      score: caseData.score,
      completedAt: new Date(),
      metadata: caseData
    });
  }

  /**
   * Process assessment step
   */
  async processAssessment(user, assessmentData) {
    const score = this.calculateAssessmentScore(assessmentData);
    const competencyLevels = this.assessCompetencies(assessmentData);

    // Store assessment results
    await mongoose.connection.db.collection('competency_assessments').insertOne({
      userId: user._id,
      type: 'onboarding',
      score: score,
      competencyLevels: competencyLevels,
      completedAt: new Date(),
      assessmentData: assessmentData
    });

    // Update student progress with initial competencies
    await this.updateInitialCompetencies(user, competencyLevels);
  }

  /**
   * Calculate assessment score
   */
  calculateAssessmentScore(assessmentData) {
    // Simple scoring - could be enhanced with more complex logic
    const totalQuestions = assessmentData.answers.length;
    const correctAnswers = assessmentData.answers.filter(ans => ans.isCorrect).length;
    return Math.round((correctAnswers / totalQuestions) * 100);
  }

  /**
   * Assess competencies based on assessment
   */
  assessCompetencies(assessmentData) {
    const competencies = {};
    assessmentData.answers.forEach(answer => {
      if (answer.isCorrect) {
        competencies[answer.competency] = (competencies[answer.competency] || 0) + 1;
      }
    });

    // Convert counts to proficiency levels
    Object.keys(competencies).forEach(competency => {
      const score = competencies[competency];
      if (score >= 3) competencies[competency] = 'proficient';
      else if (score >= 2) competencies[competency] = 'competent';
      else if (score >= 1) competencies[competency] = 'beginner';
      else competencies[competency] = 'novice';
    });

    return competencies;
  }

  /**
   * Update initial competencies in student progress
   */
  async updateInitialCompetencies(user, competencyLevels) {
    let studentProgress = await StudentProgress.findOne({ userId: user._id });
    
    if (!studentProgress) {
      studentProgress = new StudentProgress({
        userId: user._id,
        competencies: [],
        caseAttempts: [],
        learningPaths: [],
        milestones: [],
        achievements: []
      });
    }

    // Add initial competency assessments
    Object.entries(competencyLevels).forEach(([competencyName, level]) => {
      const proficiencyMap = {
        'novice': 'Novice',
        'beginner': 'Beginner',
        'competent': 'Competent',
        'proficient': 'Proficient'
      };

      studentProgress.competencies.push({
        competencyName: competencyName,
        proficiencyLevel: proficiencyMap[level] || 'Novice',
        score: this.proficiencyToScore(level),
        casesAttempted: 0,
        casesMastered: 0,
        lastAssessed: new Date()
      });
    });

    await studentProgress.save();
  }

  /**
   * Convert proficiency level to numerical score
   */
  proficiencyToScore(level) {
    const scoreMap = {
      'novice': 30,
      'beginner': 50,
      'competent': 70,
      'proficient': 85
    };
    return scoreMap[level] || 30;
  }

  /**
   * Calculate estimated completion time for workflow
   */
  calculateEstimatedCompletion(workflow) {
    const totalDuration = workflow.steps.reduce((sum, step) => sum + step.duration, 0);
    const completionDate = new Date();
    completionDate.setMinutes(completionDate.getMinutes() + totalDuration);
    return completionDate;
  }

  /**
   * Create initial learning goals based on discipline
   */
  async createInitialLearningGoals(user, discipline) {
    const disciplineGoals = {
      medicine: [
        {
          title: 'Master patient diagnosis skills',
          category: 'clinical_skills',
          targetScore: 85,
          description: 'Develop proficiency in diagnosing common medical conditions'
        },
        {
          title: 'Improve treatment planning',
          category: 'knowledge',
          targetScore: 80,
          description: 'Learn evidence-based treatment protocols'
        }
      ],
      nursing: [
        {
          title: 'Excel in patient care',
          category: 'patient_care',
          targetScore: 90,
          description: 'Develop excellent patient care and monitoring skills'
        },
        {
          title: 'Master medication administration',
          category: 'procedural',
          targetScore: 85,
          description: 'Become proficient in safe medication practices'
        }
      ],
      laboratory: [
        {
          title: 'Perfect specimen handling',
          category: 'procedural',
          targetScore: 90,
          description: 'Master laboratory specimen collection and processing'
        },
        {
          title: 'Excel in test interpretation',
          category: 'knowledge',
          targetScore: 85,
          description: 'Develop expertise in diagnostic test analysis'
        }
      ]
    };

    const goals = disciplineGoals[discipline] || disciplineGoals.medicine;

    for (const goal of goals) {
      await LearningGoal.create({
        userId: user._id,
        ...goal,
        status: 'not_started',
        progress: 0,
        priority: 'medium'
      });
    }
  }

  /**
   * Get interactive tutorial content for a step
   * @param {string} stepId - Step ID
   * @param {string} discipline - Student discipline
   * @returns {Object} - Tutorial content
   */
  getTutorialContent(stepId, discipline) {
    const tutorials = {
      platform_tour: {
        title: 'Platform Navigation Tutorial',
        steps: [
          'Welcome to the healthcare simulation platform!',
          'Your dashboard shows personalized recommendations and progress',
          'Use the navigation menu to access cases, progress, and help resources',
          'Cases are organized by difficulty and specialty',
          'Track your competencies and achievements in the progress section'
        ],
        media: {
          type: 'video',
          url: '/tutorials/platform-overview.mp4',
          duration: '3:45'
        }
      },
      patient_care_basics: {
        title: 'Patient Care Fundamentals',
        steps: [
          'Always start with thorough patient assessment',
          'Monitor vital signs regularly',
          'Document all care activities accurately',
          'Communicate effectively with healthcare team',
          'Follow infection control protocols'
        ],
        media: {
          type: 'interactive',
          url: '/tutorials/patient-care-simulation',
          duration: '8:00'
        }
      }
    };

    return tutorials[stepId] || {
      title: 'Tutorial Content',
      steps: ['Step-by-step guidance will be provided here'],
      media: null
    };
  }

  /**
   * Skip an onboarding step (admin/educator function)
   * @param {Object} user - User object
   * @param {string} stepId - Step ID to skip
   * @returns {Promise<Object>} - Skip result
   */
  async skipOnboardingStep(user, stepId) {
    try {
      const onboardingDoc = await mongoose.connection.db.collection('onboarding_progress')
        .findOne({ userId: user._id });

      if (!onboardingDoc) {
        throw new Error('Onboarding not started');
      }

      const discipline = onboardingDoc.discipline;
      const workflow = this.onboardingWorkflows[discipline];
      const stepIndex = workflow.steps.findIndex(step => step.id === stepId);

      if (stepIndex === -1) {
        throw new Error('Step not found in workflow');
      }

      // Mark step as skipped
      const completedSteps = [...onboardingDoc.completedSteps, {
        stepId: stepId,
        completedAt: new Date(),
        status: 'skipped',
        skipped: true
      }];

      const nextStepIndex = stepIndex + 1;
      const isComplete = nextStepIndex >= workflow.steps.length;

      await mongoose.connection.db.collection('onboarding_progress').updateOne(
        { userId: user._id },
        {
          $set: {
            currentStep: isComplete ? stepIndex : nextStepIndex,
            completedSteps: completedSteps,
            status: isComplete ? 'completed' : 'in_progress'
          }
        }
      );

      return {
        success: true,
        skippedStep: stepId,
        nextStep: !isComplete ? workflow.steps[nextStepIndex] : null
      };
    } catch (error) {
      console.error('Skip onboarding step error:', error);
      throw error;
    }
  }

  /**
   * Reset onboarding progress (admin/educator function)
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Reset result
   */
  async resetOnboarding(user) {
    try {
      await mongoose.connection.db.collection('onboarding_progress').deleteOne({
        userId: user._id
      });

      return {
        success: true,
        message: 'Onboarding progress reset successfully'
      };
    } catch (error) {
      console.error('Reset onboarding error:', error);
      throw error;
    }
  }
}

export default new OnboardingService();