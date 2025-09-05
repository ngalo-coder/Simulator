import User from '../models/UserModel.js';
import Case from '../models/CaseModel.js';
import StudentProgress from '../models/StudentProgressModel.js';
import LearningGoal from '../models/LearningGoalModel.js';
import LearningPath from '../models/LearningPathModel.js';
import mongoose from 'mongoose';

/**
 * Intelligent Recommendation Service
 * Provides personalized recommendations for cases, resources, peers, and career development
 */
class IntelligentRecommendationService {
  constructor() {
    this.recommendationWeights = {
      performance: 0.4,
      learningGaps: 0.3,
      goals: 0.2,
      preferences: 0.1
    };

    this.resourceTypes = {
      article: 'article',
      video: 'video',
      interactive: 'interactive',
      practice: 'practice',
      reference: 'reference'
    };

    this.careerStages = {
      student: 'student',
      intern: 'intern',
      resident: 'resident',
      fellow: 'fellow',
      practitioner: 'practitioner'
    };
  }

  /**
   * Get comprehensive personalized recommendations
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Complete recommendation package
   */
  async getPersonalizedRecommendations(user) {
    try {
      const [
        caseRecommendations,
        resourceRecommendations,
        peerRecommendations,
        careerRecommendations,
        studyPlan
      ] = await Promise.all([
        this.getCaseRecommendations(user),
        this.getResourceRecommendations(user),
        this.getPeerRecommendations(user),
        this.getCareerRecommendations(user),
        this.generateStudyPlan(user)
      ]);

      return {
        caseRecommendations,
        resourceRecommendations,
        peerRecommendations,
        careerRecommendations,
        studyPlan,
        lastUpdated: new Date(),
        confidenceScore: await this.calculateConfidenceScore(user)
      };
    } catch (error) {
      console.error('Get personalized recommendations error:', error);
      throw error;
    }
  }

  /**
   * Get personalized case recommendations
   * @param {Object} user - User object
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} - Recommended cases
   */
  async getCaseRecommendations(user, limit = 6) {
    try {
      const studentProgress = await StudentProgress.findOne({ userId: user._id });
      const learningGoals = await LearningGoal.find({ userId: user._id, status: 'in_progress' });
      const discipline = user.profile?.discipline || 'medicine';

      // Get available cases for student's discipline
      const availableCases = await Case.find({
        status: 'published',
        'case_metadata.specialty': discipline
      }).lean();

      // Score cases based on multiple factors
      const scoredCases = await Promise.all(
        availableCases.map(async (caseDoc) => {
          const score = await this.calculateCaseScore(caseDoc, user, studentProgress, learningGoals);
          return {
            ...caseDoc,
            recommendationScore: score,
            recommendationReason: this.generateCaseRecommendationReason(caseDoc, score)
          };
        })
      );

      // Sort by score and return top recommendations
      return scoredCases
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)
        .map(caseDoc => this.formatCaseRecommendation(caseDoc));
    } catch (error) {
      console.error('Get case recommendations error:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive case score
   */
  async calculateCaseScore(caseDoc, user, studentProgress, learningGoals) {
    let score = 0;

    // Performance-based scoring (40%)
    const performanceScore = await this.calculatePerformanceScore(caseDoc, user, studentProgress);
    score += performanceScore * this.recommendationWeights.performance;

    // Learning gap scoring (30%)
    const gapScore = await this.calculateGapScore(caseDoc, user, studentProgress);
    score += gapScore * this.recommendationWeights.learningGaps;

    // Goal alignment scoring (20%)
    const goalScore = this.calculateGoalScore(caseDoc, learningGoals);
    score += goalScore * this.recommendationWeights.goals;

    // Preference scoring (10%)
    const preferenceScore = await this.calculatePreferenceScore(caseDoc, user);
    score += preferenceScore * this.recommendationWeights.preferences;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate performance-based score
   */
  async calculatePerformanceScore(caseDoc, user, studentProgress) {
    const caseDifficulty = caseDoc.case_metadata?.difficulty || 'intermediate';
    const studentLevel = await this.calculateStudentLevel(user, studentProgress);

    const levelMap = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4
    };

    const difficultyLevel = levelMap[caseDifficulty] || 2;
    const levelDifference = Math.abs(studentLevel - difficultyLevel);

    // Higher score for appropriate challenge level
    if (levelDifference === 0) return 90;
    if (levelDifference === 1) return 80;
    if (levelDifference === 2) return 60;
    return 30;
  }

  /**
   * Calculate learning gap score
   */
  async calculateGapScore(caseDoc, user, studentProgress) {
    if (!studentProgress || !caseDoc.case_metadata?.competencies) return 50;

    const caseCompetencies = caseDoc.case_metadata.competencies;
    let gapScore = 0;

    for (const competency of caseCompetencies) {
      const studentCompetency = studentProgress.competencies.find(c => 
        c.competencyName === competency || c.competencyId?.toString() === competency
      );

      if (studentCompetency && studentCompetency.score < 70) {
        // Higher score for cases that address weak competencies
        gapScore += (70 - studentCompetency.score) * 2;
      }
    }

    return Math.min(100, gapScore / caseCompetencies.length * 100);
  }

  /**
   * Calculate goal alignment score
   */
  calculateGoalScore(caseDoc, learningGoals) {
    if (learningGoals.length === 0) return 50;

    const caseCompetencies = caseDoc.case_metadata?.competencies || [];
    let alignmentScore = 0;

    learningGoals.forEach(goal => {
      if (caseCompetencies.includes(goal.category)) {
        alignmentScore += goal.priority === 'high' ? 30 : goal.priority === 'medium' ? 20 : 10;
      }
    });

    return Math.min(100, alignmentScore);
  }

  /**
   * Calculate preference score
   */
  async calculatePreferenceScore(caseDoc, user) {
    // Analyze user's past preferences
    const preferences = await this.analyzeUserPreferences(user);
    const caseType = caseDoc.case_metadata?.case_type;
    const difficulty = caseDoc.case_metadata?.difficulty;

    let score = 50;

    // Prefer cases similar to highly rated ones
    if (preferences.preferredCaseTypes.includes(caseType)) {
      score += 20;
    }

    // Prefer difficulty levels the user performs well in
    if (preferences.preferredDifficulties.includes(difficulty)) {
      score += 15;
    }

    // Consider time of day preferences
    const currentHour = new Date().getHours();
    if (preferences.preferredTimes.includes(this.getTimeOfDay(currentHour))) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Analyze user preferences from interaction history
   */
  async analyzeUserPreferences(user) {
    const interactions = await mongoose.connection.db.collection('user_interactions')
      .find({ user_id: user._id })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    const preferences = {
      preferredCaseTypes: [],
      preferredDifficulties: [],
      preferredTimes: []
    };

    interactions.forEach(interaction => {
      if (interaction.case_type) {
        preferences.preferredCaseTypes.push(interaction.case_type);
      }
      if (interaction.difficulty) {
        preferences.preferredDifficulties.push(interaction.difficulty);
      }
      if (interaction.timestamp) {
        const hour = new Date(interaction.timestamp).getHours();
        preferences.preferredTimes.push(this.getTimeOfDay(hour));
      }
    });

    // Remove duplicates and keep most frequent
    preferences.preferredCaseTypes = this.getMostFrequent(preferences.preferredCaseTypes, 3);
    preferences.preferredDifficulties = this.getMostFrequent(preferences.preferredDifficulties, 2);
    preferences.preferredTimes = this.getMostFrequent(preferences.preferredTimes, 2);

    return preferences;
  }

  /**
   * Get most frequent items from array
   */
  getMostFrequent(array, limit) {
    const frequency = {};
    array.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, limit);
  }

  /**
   * Get time of day category
   */
  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Calculate student level (1-4)
   */
  async calculateStudentLevel(user, studentProgress) {
    if (!studentProgress || studentProgress.competencies.length === 0) return 1;

    const avgScore = studentProgress.competencies.reduce((sum, comp) => sum + comp.score, 0) /
                    studentProgress.competencies.length;

    if (avgScore < 50) return 1;
    if (avgScore < 70) return 2;
    if (avgScore < 85) return 3;
    return 4;
  }

  /**
   * Generate case recommendation reason
   */
  generateCaseRecommendationReason(caseDoc, score) {
    if (score >= 85) return 'Excellent match for your current level and learning goals';
    if (score >= 70) return 'Good opportunity to strengthen your competencies';
    if (score >= 60) return 'Relevant case for your discipline and interests';
    return 'General recommendation based on available cases';
  }

  /**
   * Format case recommendation for response
   */
  formatCaseRecommendation(caseDoc) {
    return {
      id: caseDoc._id,
      title: caseDoc.case_metadata?.title || 'Untitled Case',
      description: caseDoc.description,
      difficulty: caseDoc.case_metadata?.difficulty || 'intermediate',
      specialty: caseDoc.case_metadata?.specialty,
      estimatedDuration: caseDoc.case_metadata?.estimated_duration || 30,
      recommendationScore: caseDoc.recommendationScore,
      recommendationReason: caseDoc.recommendationReason,
      competencies: caseDoc.case_metadata?.competencies || [],
      patientAge: caseDoc.patient_persona?.age,
      patientGender: caseDoc.patient_persona?.gender,
      chiefComplaint: caseDoc.patient_persona?.chief_complaint
    };
  }

  /**
   * Get learning resource recommendations
   * @param {Object} user - User object
   * @returns {Promise<Array>} - Recommended resources
   */
  async getResourceRecommendations(user) {
    try {
      const studentProgress = await StudentProgress.findOne({ userId: user._id });
      const weakCompetencies = this.identifyWeakCompetencies(studentProgress);
      const learningGoals = await LearningGoal.find({ userId: user._id, status: 'in_progress' });

      const recommendations = [];

      // Add resources for weak competencies
      for (const competency of weakCompetencies.slice(0, 3)) {
        recommendations.push(...await this.getCompetencyResources(competency));
      }

      // Add resources for current learning goals
      for (const goal of learningGoals.slice(0, 2)) {
        recommendations.push(...await this.getGoalResources(goal));
      }

      // Add general discipline resources
      recommendations.push(...await this.getDisciplineResources(user.profile?.discipline));

      // Remove duplicates and limit
      return this.deduplicateResources(recommendations).slice(0, 8);
    } catch (error) {
      console.error('Get resource recommendations error:', error);
      throw error;
    }
  }

  /**
   * Identify weak competencies (score < 70)
   */
  identifyWeakCompetencies(studentProgress) {
    if (!studentProgress) return [];

    return studentProgress.competencies
      .filter(comp => comp.score < 70)
      .sort((a, b) => a.score - b.score)
      .map(comp => comp.competencyName || comp.competencyId?.toString());
  }

  /**
   * Get resources for a specific competency
   */
  async getCompetencyResources(competency) {
    // This would integrate with a resource database
    return [
      {
        type: this.resourceTypes.article,
        title: `Mastering ${competency}`,
        description: `Comprehensive guide to improve your ${competency} skills`,
        url: `/resources/competencies/${competency}`,
        duration: '15 min',
        competency: competency,
        priority: 'high'
      },
      {
        type: this.resourceTypes.video,
        title: `${competency} Best Practices`,
        description: `Video tutorial demonstrating effective ${competency} techniques`,
        url: `/resources/videos/${competency}`,
        duration: '10 min',
        competency: competency,
        priority: 'medium'
      }
    ];
  }

  /**
   * Get resources for a learning goal
   */
  async getGoalResources(goal) {
    return [
      {
        type: this.resourceTypes.interactive,
        title: `${goal.title} Practice`,
        description: `Interactive exercises to help achieve: ${goal.title}`,
        url: `/goals/${goal._id}/practice`,
        duration: '20 min',
        goalId: goal._id,
        priority: 'high'
      }
    ];
  }

  /**
   * Get discipline-specific resources
   */
  async getDisciplineResources(discipline = 'medicine') {
    const disciplineResources = {
      medicine: [
        {
          type: this.resourceTypes.reference,
          title: 'Medical Diagnosis Handbook',
          description: 'Quick reference for common medical conditions',
          url: '/resources/medicine/diagnosis-handbook',
          duration: 'N/A',
          priority: 'medium'
        }
      ],
      nursing: [
        {
          type: this.resourceTypes.reference,
          title: 'Nursing Care Plans',
          description: 'Comprehensive nursing care planning guide',
          url: '/resources/nursing/care-plans',
          duration: 'N/A',
          priority: 'medium'
        }
      ]
    };

    return disciplineResources[discipline] || disciplineResources.medicine;
  }

  /**
   * Remove duplicate resources
   */
  deduplicateResources(resources) {
    const seen = new Set();
    return resources.filter(resource => {
      const key = `${resource.type}-${resource.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Get peer learning recommendations
   * @param {Object} user - User object
   * @returns {Promise<Array>} - Peer recommendations
   */
  async getPeerRecommendations(user) {
    try {
      // Find peers with similar competencies and goals
      const similarUsers = await this.findSimilarUsers(user);
      
      return similarUsers.slice(0, 5).map(peer => ({
        userId: peer._id,
        name: peer.profile?.firstName ? `${peer.profile.firstName} ${peer.profile.lastName}` : peer.username,
        similarityScore: peer.similarityScore,
        commonCompetencies: peer.commonCompetencies,
        suggestedActivities: this.generatePeerActivities(peer)
      }));
    } catch (error) {
      console.error('Get peer recommendations error:', error);
      throw error;
    }
  }

  /**
   * Find users with similar learning profiles
   */
  async findSimilarUsers(user) {
    const allUsers = await User.find({
      _id: { $ne: user._id },
      'profile.discipline': user.profile?.discipline
    }).populate('studentProgress');

    const userProgress = await StudentProgress.findOne({ userId: user._id });
    
    return allUsers
      .map(peer => {
        const similarity = this.calculateUserSimilarity(user, userProgress, peer);
        return {
          ...peer.toObject(),
          similarityScore: similarity.score,
          commonCompetencies: similarity.commonCompetencies
        };
      })
      .filter(peer => peer.similarityScore > 0.3)
      .sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * Calculate similarity between users
   */
  calculateUserSimilarity(user, userProgress, peer) {
    if (!userProgress || !peer.studentProgress) return { score: 0, commonCompetencies: [] };

    const userCompetencies = userProgress.competencies || [];
    const peerCompetencies = peer.studentProgress.competencies || [];

    // Find common competencies with similar scores
    const commonCompetencies = userCompetencies.filter(userComp =>
      peerCompetencies.some(peerComp =>
        (userComp.competencyName === peerComp.competencyName ||
         userComp.competencyId?.toString() === peerComp.competencyId?.toString()) &&
        Math.abs(userComp.score - peerComp.score) < 20
      )
    ).map(comp => comp.competencyName || comp.competencyId?.toString());

    const score = commonCompetencies.length / Math.max(userCompetencies.length, peerCompetencies.length);
    
    return { score, commonCompetencies };
  }

  /**
   * Generate suggested peer activities
   */
  generatePeerActivities(peer) {
    return [
      {
        type: 'case_review',
        title: 'Case Discussion',
        description: 'Review and discuss a recent case together',
        estimatedTime: '30 min'
      },
      {
        type: 'study_group',
        title: 'Study Session',
        description: 'Joint study session on common competencies',
        estimatedTime: '60 min'
      }
    ];
  }

  /**
   * Get career development recommendations
   * @param {Object} user - User object
   * @returns {Promise<Array>} - Career recommendations
   */
  async getCareerRecommendations(user) {
    try {
      const careerStage = this.determineCareerStage(user);
      const competencies = await this.analyzeCareerCompetencies(user);

      return [
        {
          type: 'certification',
          title: 'Professional Certification',
          description: 'Consider pursuing relevant professional certifications',
          timeline: '3-6 months',
          requirements: this.getCertificationRequirements(careerStage),
          resources: await this.getCareerResources('certification')
        },
        {
          type: 'skill_development',
          title: 'Skill Enhancement',
          description: 'Focus on developing these key competencies for career advancement',
          competencies: competencies.slice(0, 3),
          timeline: '1-3 months',
          resources: await this.getCareerResources('skills')
        },
        {
          type: 'networking',
          title: 'Professional Networking',
          description: 'Connect with professionals in your field',
          opportunities: this.getNetworkingOpportunities(user.profile?.discipline),
          timeline: 'Ongoing'
        }
      ];
    } catch (error) {
      console.error('Get career recommendations error:', error);
      throw error;
    }
  }

  /**
   * Determine user's career stage
   */
  determineCareerStage(user) {
    const yearOfStudy = user.profile?.yearOfStudy || 1;
    
    if (yearOfStudy <= 2) return this.careerStages.student;
    if (yearOfStudy <= 4) return this.careerStages.intern;
    return this.careerStages.practitioner;
  }

  /**
   * Analyze competencies for career development
   */
  async analyzeCareerCompetencies(user) {
    const studentProgress = await StudentProgress.findOne({ userId: user._id });
    if (!studentProgress) return [];

    return studentProgress.competencies
      .filter(comp => comp.score < 80)
      .sort((a, b) => a.score - b.score)
      .map(comp => ({
        name: comp.competencyName || comp.competencyId?.toString(),
        currentScore: comp.score,
        targetScore: 85,
        importance: 'high'
      }));
  }

  /**
   * Get certification requirements for career stage
   */
  getCertificationRequirements(careerStage) {
    const requirements = {
      [this.careerStages.student]: ['Basic life support', 'Infection control'],
      [this.careerStages.intern]: ['Advanced cardiac life support', 'Specialty-specific certifications'],
      [this.careerStages.practitioner]: ['Board certification', 'Continuing education units']
    };

    return requirements[careerStage] || requirements[this.careerStages.student];
  }

  /**
   * Get career development resources
   */
  async getCareerResources(resourceType) {
    const resources = {
      certification: [
        {
          type: this.resourceTypes.article,
          title: 'Certification Preparation Guide',
          url: '/career/certification-guide',
          duration: '20 min'
        }
      ],
      skills: [
        {
          type: this.resourceTypes.video,
          title: 'Professional Skill Development',
          url: '/career/skills-video',
          duration: '15 min'
        }
      ]
    };

    return resources[resourceType] || [];
  }

  /**
   * Get networking opportunities
   */
  getNetworkingOpportunities(discipline) {
    const opportunities = {
      medicine: ['Medical conferences', 'Hospital grand rounds', 'Specialty societies'],
      nursing: ['Nursing associations', 'Clinical workshops', 'Unit meetings'],
      laboratory: ['Lab professional organizations', 'Quality improvement teams', 'Research symposia']
    };

    return opportunities[discipline] || opportunities.medicine;
  }

  /**
   * Generate personalized study plan
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Study plan
   */
  async generateStudyPlan(user) {
    try {
      const weakCompetencies = await this.identifyWeakCompetencies(
        await StudentProgress.findOne({ userId: user._id })
      );
      const learningGoals = await LearningGoal.find({ userId: user._id, status: 'in_progress' });

      const weeklyPlan = this.createWeeklySchedule(weakCompetencies, learningGoals);
      const monthlyGoals = this.setMonthlyGoals(weakCompetencies, learningGoals);

      return {
        weeklyPlan,
        monthlyGoals,
        studyHours: this.recommendStudyHours(user),
        focusAreas: weakCompetencies.slice(0, 3),
        estimatedImprovement: await this.estimateImprovement(user, weakCompetencies)
      };
    } catch (error) {
      console.error('Generate study plan error:', error);
      throw error;
    }
  }

  /**
   * Create weekly study schedule
   */
  createWeeklySchedule(weakCompetencies, learningGoals) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const schedule = {};

    days.forEach(day => {
      schedule[day] = {
        focusCompetency: weakCompetencies[Math.floor(Math.random() * weakCompetencies.length)],
        activities: [
          'Case practice (30 min)',
          'Resource review (20 min)',
          'Skill reinforcement (25 min)'
        ],
        goals: learningGoals.slice(0, 2).map(goal => goal.title)
      };
    });

    return schedule;
  }

  /**
   * Set monthly learning goals
   */
  setMonthlyGoals(weakCompetencies, learningGoals) {
    return [
      {
        type: 'competency',
        target: `Improve ${weakCompetencies[0]} by 15 points`,
        timeline: '4 weeks',
        measurement: 'Competency score increase'
      },
      {
        type: 'completion',
        target: 'Complete 8 cases',
        timeline: '4 weeks',
        measurement: 'Case completion count'
      },
      {
        type: 'mastery',
        target: 'Achieve 80% average score',
        timeline: '4 weeks',
        measurement: 'Overall performance'
      }
    ];
  }

  /**
   * Recommend study hours based on user profile
   */
  recommendStudyHours(user) {
    const yearOfStudy = user.profile?.yearOfStudy || 1;
    
    if (yearOfStudy <= 2) return { weekly: 10, daily: 2 };
    if (yearOfStudy <= 4) return { weekly: 15, daily: 3 };
    return { weekly: 8, daily: 2 }; // Practitioners - maintenance mode
  }

  /**
   * Estimate competency improvement
   */
  async estimateImprovement(user, weakCompetencies) {
    const studentProgress = await StudentProgress.findOne({ userId: user._id });
    if (!studentProgress) return {};

    const estimates = {};
    weakCompetencies.forEach(competency => {
      const compData = studentProgress.competencies.find(c => 
        c.competencyName === competency || c.competencyId?.toString() === competency
      );
      
      if (compData) {
        const currentScore = compData.score;
        estimates[competency] = {
          current: currentScore,
          projected: Math.min(100, currentScore + 15),
          timeline: '4 weeks',
          confidence: 'high'
        };
      }
    });

    return estimates;
  }

  /**
   * Calculate confidence score for recommendations
   */
  async calculateConfidenceScore(user) {
    const studentProgress = await StudentProgress.findOne({ userId: user._id });
    const interactionCount = await mongoose.connection.db.collection('user_interactions')
      .countDocuments({ user_id: user._id });

    if (!studentProgress || interactionCount < 5) return 60; // Low confidence for new users
    
    const dataPoints = studentProgress.competencies.length + interactionCount;
    return Math.min(95, 60 + (dataPoints / 100 * 35)); // Scale confidence with data
  }

  /**
   * Update recommendation preferences based on user feedback
   * @param {Object} user - User object
   * @param {string} recommendationId - Recommendation ID
   * @param {boolean} wasHelpful - Whether recommendation was helpful
   * @param {string} feedback - Additional feedback
   */
  async updateRecommendationPreference(user, recommendationId, wasHelpful, feedback = '') {
    try {
      await mongoose.connection.db.collection('recommendation_feedback').insertOne({
        userId: user._id,
        recommendationId,
        wasHelpful,
        feedback,
        timestamp: new Date(),
        userAgent: 'system'
      });

      // Adjust weights based on feedback
      if (!wasHelpful) {
        // Reduce weight for this type of recommendation in future
        await this.adjustRecommendationWeights(recommendationId, -0.05);
      }

      return { success: true };
    } catch (error) {
      console.error('Update recommendation preference error:', error);
      throw error;
    }
  }

  /**
   * Adjust recommendation weights based on feedback
   */
  async adjustRecommendationWeights(recommendationId, adjustment) {
    // This would implement more sophisticated weight adjustment logic
    // For now, we'll just acknowledge the need for adjustment
    console.log(`Adjusting weights for ${recommendationId} by ${adjustment}`);
  }
}

export default new IntelligentRecommendationService();