import User from '../models/UserModel.js';
import Case from '../models/CaseModel.js';
import StudentProgress from '../models/StudentProgressModel.js';
import LearningGoal from '../models/LearningGoalModel.js';
import mongoose from 'mongoose';

/**
 * Intelligent Tutoring Service
 * Provides adaptive hints, step-by-step guidance, and intelligent tutoring
 */
class IntelligentTutoringService {
  constructor() {
    this.hintLevels = {
      minimal: 1,
      moderate: 2,
      detailed: 3,
      explicit: 4
    };

    this.learningStyles = {
      visual: 'visual',
      auditory: 'auditory',
      kinesthetic: 'kinesthetic',
      reading: 'reading'
    };

    this.competencyDomains = {
      clinical_reasoning: 'Clinical Reasoning',
      diagnosis: 'Diagnosis',
      treatment: 'Treatment Planning',
      communication: 'Patient Communication',
      procedural: 'Procedural Skills',
      knowledge: 'Medical Knowledge'
    };
  }

  /**
   * Get adaptive hints based on student performance and context
   * @param {Object} user - User object
   * @param {Object} context - Current case context
   * @param {string} currentStep - Current step in the case
   * @returns {Promise<Object>} - Adaptive hints and guidance
   */
  async getAdaptiveHints(user, context, currentStep) {
    try {
      const { caseId, difficulty, stepNumber } = context;
      const studentProgress = await StudentProgress.findOne({ userId: user._id });
      const learningStyle = await this.detectLearningStyle(user);
      const hintLevel = await this.determineHintLevel(user, caseId);

      const caseDoc = await Case.findById(caseId);
      if (!caseDoc) {
        throw new Error('Case not found');
      }

      // Get step-specific hints
      const stepHints = this.generateStepHints(
        caseDoc,
        currentStep,
        stepNumber,
        hintLevel,
        learningStyle
      );

      // Get competency-based guidance
      const competencyGuidance = await this.getCompetencyGuidance(
        user,
        studentProgress,
        caseDoc
      );

      // Get learning path integration
      const learningPathIntegration = await this.integrateWithLearningPath(
        user,
        caseDoc
      );

      return {
        hints: stepHints,
        competencyGuidance,
        learningPathIntegration,
        hintLevel: this.getHintLevelName(hintLevel),
        learningStyle,
        nextRecommendedSteps: await this.predictNextSteps(user, caseDoc, currentStep)
      };
    } catch (error) {
      console.error('Get adaptive hints error:', error);
      throw error;
    }
  }

  /**
   * Generate step-specific hints based on learning style and hint level
   */
  generateStepHints(caseDoc, currentStep, stepNumber, hintLevel, learningStyle) {
    const hints = [];
    const stepConfig = caseDoc.case_workflow?.steps?.[stepNumber] || {};

    // Base hint for all learning styles
    if (hintLevel >= this.hintLevels.minimal) {
      hints.push({
        type: 'general',
        content: this.formatHintForLearningStyle(
          stepConfig.hint_general || 'Consider the patient\'s presentation and vital signs.',
          learningStyle
        ),
        priority: 'low'
      });
    }

    // Moderate hints
    if (hintLevel >= this.hintLevels.moderate) {
      hints.push({
        type: 'diagnostic',
        content: this.formatHintForLearningStyle(
          stepConfig.hint_diagnostic || 'Think about differential diagnoses based on symptoms.',
          learningStyle
        ),
        priority: 'medium'
      });
    }

    // Detailed hints
    if (hintLevel >= this.hintLevels.detailed) {
      hints.push({
        type: 'procedural',
        content: this.formatHintForLearningStyle(
          stepConfig.hint_procedural || 'Follow standard clinical protocols for this presentation.',
          learningStyle
        ),
        priority: 'high'
      });
    }

    // Explicit hints (only when really struggling)
    if (hintLevel >= this.hintLevels.explicit) {
      hints.push({
        type: 'explicit',
        content: this.formatHintForLearningStyle(
          stepConfig.hint_explicit || 'The correct next step is to order specific diagnostic tests.',
          learningStyle
        ),
        priority: 'critical'
      });
    }

    return hints;
  }

  /**
   * Format hints based on learning style preferences
   */
  formatHintForLearningStyle(content, learningStyle) {
    const formats = {
      [this.learningStyles.visual]: `📊 ${content} (Visual: Consider diagrams or charts)`,
      [this.learningStyles.auditory]: `🎧 ${content} (Auditory: Say this out loud)`,
      [this.learningStyles.kinesthetic]: `👐 ${content} (Hands-on: Practice this physically)`,
      [this.learningStyles.reading]: `📖 ${content} (Reading: Review related materials)`
    };

    return formats[learningStyle] || content;
  }

  /**
   * Determine appropriate hint level based on student performance
   */
  async determineHintLevel(user, caseId) {
    const recentAttempts = await mongoose.connection.db.collection('case_attempts')
      .find({
        user_id: user._id,
        case_id: new mongoose.Types.ObjectId(caseId),
        status: 'completed'
      })
      .sort({ start_time: -1 })
      .limit(3)
      .toArray();

    if (recentAttempts.length === 0) {
      return this.hintLevels.moderate; // New student - moderate hints
    }

    const averageScore = recentAttempts.reduce((sum, attempt) => 
      sum + (attempt.score?.overall || 0), 0) / recentAttempts.length;

    if (averageScore < 50) return this.hintLevels.explicit;
    if (averageScore < 70) return this.hintLevels.detailed;
    if (averageScore < 85) return this.hintLevels.moderate;
    return this.hintLevels.minimal;
  }

  /**
   * Detect student's preferred learning style
   */
  async detectLearningStyle(user) {
    // Analyze interaction patterns to determine learning style
    const interactions = await mongoose.connection.db.collection('user_interactions')
      .find({ user_id: user._id })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    const styleScores = {
      [this.learningStyles.visual]: 0,
      [this.learningStyles.auditory]: 0,
      [this.learningStyles.kinesthetic]: 0,
      [this.learningStyles.reading]: 0
    };

    interactions.forEach(interaction => {
      if (interaction.content_type === 'video' || interaction.content_type === 'image') {
        styleScores[this.learningStyles.visual] += 2;
      } else if (interaction.content_type === 'audio') {
        styleScores[this.learningStyles.auditory] += 2;
      } else if (interaction.interaction_type === 'practice') {
        styleScores[this.learningStyles.kinesthetic] += 2;
      } else if (interaction.content_type === 'text') {
        styleScores[this.learningStyles.reading] += 2;
      }
    });

    return Object.keys(styleScores).reduce((a, b) => 
      styleScores[a] > styleScores[b] ? a : b);
  }

  /**
   * Get competency-specific guidance
   */
  async getCompetencyGuidance(user, studentProgress, caseDoc) {
    const guidance = [];
    const caseCompetencies = caseDoc.case_metadata?.competencies || [];

    for (const competency of caseCompetencies) {
      const studentCompetency = studentProgress?.competencies.find(c => 
        c.competencyName === competency || c.competencyId?.toString() === competency
      );

      if (studentCompetency && studentCompetency.score < 70) {
        guidance.push({
          competency,
          currentScore: studentCompetency.score,
          recommendation: this.getCompetencyRecommendation(competency, studentCompetency.score),
          resources: await this.getCompetencyResources(competency)
        });
      }
    }

    return guidance;
  }

  /**
   * Get competency-specific recommendations
   */
  getCompetencyRecommendation(competency, score) {
    const recommendations = {
      clinical_reasoning: score < 50 
        ? 'Focus on systematic approach to patient assessment' 
        : 'Practice differential diagnosis development',
      diagnosis: score < 50 
        ? 'Review common diagnostic criteria and patterns'
        : 'Work on rapid and accurate diagnosis',
      treatment: 'Study evidence-based treatment guidelines',
      communication: 'Practice patient-centered communication techniques',
      procedural: 'Review procedural checklists and safety protocols',
      knowledge: 'Focus on foundational medical knowledge review'
    };

    return recommendations[competency] || 'Review related learning materials';
  }

  /**
   * Get competency-specific learning resources
   */
  async getCompetencyResources(competency) {
    // This would integrate with a resource database
    // For now, return placeholder resources
    return [
      {
        type: 'article',
        title: `${this.competencyDomains[competency]} Best Practices`,
        url: `/resources/${competency}/best-practices`,
        duration: '15 min'
      },
      {
        type: 'video',
        title: `Mastering ${this.competencyDomains[competency]}`,
        url: `/resources/${competency}/video-tutorial`,
        duration: '10 min'
      }
    ];
  }

  /**
   * Integrate with student's learning path
   */
  async integrateWithLearningPath(user, caseDoc) {
    const learningGoals = await LearningGoal.find({
      userId: user._id,
      status: { $in: ['not_started', 'in_progress'] }
    });

    const relevantGoals = learningGoals.filter(goal =>
      goal.category && caseDoc.case_metadata?.competencies?.includes(goal.category)
    );

    return {
      relevantGoals,
      progressImpact: await this.calculateProgressImpact(user, caseDoc),
      goalAlignment: this.assessGoalAlignment(relevantGoals, caseDoc)
    };
  }

  /**
   * Calculate impact on learning progress
   */
  async calculateProgressImpact(user, caseDoc) {
    const studentProgress = await StudentProgress.findOne({ userId: user._id });
    if (!studentProgress) return 'unknown';

    const competencyImprovement = caseDoc.case_metadata?.competencies?.map(competency => {
      const studentComp = studentProgress.competencies.find(c => 
        c.competencyName === competency || c.competencyId?.toString() === competency
      );
      return studentComp ? Math.max(0, 85 - studentComp.score) * 0.1 : 5;
    }).reduce((sum, improvement) => sum + improvement, 0) || 5;

    return competencyImprovement > 10 ? 'high' : competencyImprovement > 5 ? 'medium' : 'low';
  }

  /**
   * Assess alignment with learning goals
   */
  assessGoalAlignment(goals, caseDoc) {
    if (goals.length === 0) return 'neutral';

    const alignmentScores = goals.map(goal => {
      const caseCompetencies = caseDoc.case_metadata?.competencies || [];
      return caseCompetencies.includes(goal.category) ? 1 : 0;
    });

    const averageAlignment = alignmentScores.reduce((sum, score) => sum + score, 0) / goals.length;
    return averageAlignment > 0.7 ? 'high' : averageAlignment > 0.3 ? 'medium' : 'low';
  }

  /**
   * Predict next recommended steps
   */
  async predictNextSteps(user, caseDoc, currentStep) {
    // Simple prediction based on case workflow
    // Could be enhanced with ML in the future
    const workflowSteps = caseDoc.case_workflow?.steps || [];
    const currentIndex = workflowSteps.findIndex(step => step.id === currentStep);

    if (currentIndex === -1 || currentIndex >= workflowSteps.length - 1) {
      return [];
    }

    const nextSteps = workflowSteps.slice(currentIndex + 1, currentIndex + 4);
    return nextSteps.map(step => ({
      step: step.id,
      description: step.description,
      estimatedTime: step.estimated_duration || '5-10 min',
      priority: step.priority || 'medium'
    }));
  }

  /**
   * Get hint level name for display
   */
  getHintLevelName(level) {
    return Object.keys(this.hintLevels).find(key => this.hintLevels[key] === level) || 'moderate';
  }

  /**
   * Update hint level based on student response
   */
  async updateHintLevel(user, caseId, hintUsed, wasHelpful) {
    const currentLevel = await this.determineHintLevel(user, caseId);
    let newLevel = currentLevel;

    if (wasHelpful && hintUsed) {
      // Student used hint successfully - reduce hint level
      newLevel = Math.max(this.hintLevels.minimal, currentLevel - 1);
    } else if (!wasHelpful && hintUsed) {
      // Hint wasn't helpful - increase hint level
      newLevel = Math.min(this.hintLevels.explicit, currentLevel + 1);
    }

    // Store hint level adjustment for future reference
    await mongoose.connection.db.collection('hint_adjustments').insertOne({
      user_id: user._id,
      case_id: new mongoose.Types.ObjectId(caseId),
      previous_level: currentLevel,
      new_level: newLevel,
      hint_used: hintUsed,
      was_helpful: wasHelpful,
      adjusted_at: new Date()
    });

    return newLevel;
  }
}

export default new IntelligentTutoringService();