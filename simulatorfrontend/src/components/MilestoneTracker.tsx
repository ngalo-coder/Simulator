import React from 'react';
import Card from './ui/Card';

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  icon: React.ReactNode;
  color: 'medical' | 'stable' | 'warning' | 'emergency' | 'info';
  badge?: string;
  isCompleted: boolean;
  completedAt?: Date;
  reward?: {
    type: 'badge' | 'title' | 'feature';
    name: string;
    description: string;
  };
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  className?: string;
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  milestones,
  title = "Learning Milestones",
  subtitle = "Track your progress towards important medical training goals",
  showProgress = true,
  className = ""
}) => {
  const getMilestoneColor = (milestone: Milestone) => {
    const colorClasses = {
      medical: {
        bg: 'bg-medical-50 border-medical-200',
        icon: 'bg-medical-100 text-medical-600',
        progress: 'bg-medical-500',
        text: 'text-medical-700'
      },
      stable: {
        bg: 'bg-stable-50 border-stable-200',
        icon: 'bg-stable-100 text-stable-600',
        progress: 'bg-stable-500',
        text: 'text-stable-700'
      },
      warning: {
        bg: 'bg-warning-50 border-warning-200',
        icon: 'bg-warning-100 text-warning-600',
        progress: 'bg-warning-500',
        text: 'text-warning-700'
      },
      emergency: {
        bg: 'bg-emergency-50 border-emergency-200',
        icon: 'bg-emergency-100 text-emergency-600',
        progress: 'bg-emergency-500',
        text: 'text-emergency-700'
      },
      info: {
        bg: 'bg-info-50 border-info-200',
        icon: 'bg-info-100 text-info-600',
        progress: 'bg-info-500',
        text: 'text-info-700'
      }
    };

    return colorClasses[milestone.color];
  };

  const getMotivationalMessage = (milestone: Milestone) => {
    const progress = (milestone.currentValue / milestone.targetValue) * 100;

    if (milestone.isCompleted) {
      return "🎉 Congratulations! You've achieved this milestone!";
    }

    if (progress >= 90) {
      return "🚀 Almost there! You're so close to achieving this goal!";
    }

    if (progress >= 75) {
      return "💪 Great progress! Keep up the excellent work!";
    }

    if (progress >= 50) {
      return "📈 You're making solid progress. Stay focused!";
    }

    if (progress >= 25) {
      return "🌱 Good start! Every journey begins with a single step.";
    }

    return "🎯 Ready to begin your journey? Let's get started!";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const completedMilestones = milestones.filter(m => m.isCompleted);
  const inProgressMilestones = milestones.filter(m => !m.isCompleted);
  const nextMilestone = inProgressMilestones[0];

  return (
    <Card variant="elevated" className={`bg-gradient-to-br from-info-50 via-white to-info-50 border-info-200 ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-info-900 mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{subtitle}</p>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-info-600 mb-1">
              {completedMilestones.length}
            </div>
            <div className="text-sm text-gray-600">Milestones Achieved</div>
          </div>

          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-warning-600 mb-1">
              {inProgressMilestones.length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>

          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-stable-600 mb-1">
              {Math.round((completedMilestones.length / milestones.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Overall Progress</div>
          </div>
        </div>

        {/* Next Milestone Highlight */}
        {nextMilestone && (
          <div className="mb-6 p-4 bg-gradient-to-r from-info-100 to-info-50 rounded-lg border border-info-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-info-500 rounded-lg flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-info-900">Next Goal: {nextMilestone.title}</h3>
                <p className="text-sm text-info-700">{nextMilestone.description}</p>
              </div>
            </div>
            <div className="text-sm text-info-600">
              {nextMilestone.currentValue} / {nextMilestone.targetValue} {nextMilestone.unit}
            </div>
          </div>
        )}

        {/* Milestones List */}
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const colors = getMilestoneColor(milestone);
            const progress = (milestone.currentValue / milestone.targetValue) * 100;

            return (
              <div
                key={milestone.id}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  milestone.isCompleted
                    ? `${colors.bg} opacity-75`
                    : 'bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                    {milestone.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-semibold ${colors.text} ${milestone.isCompleted ? 'line-through' : ''}`}>
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {milestone.description}
                        </p>
                      </div>

                      {/* Badge */}
                      {milestone.badge && (
                        <div className="flex-shrink-0 ml-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            🏆 {milestone.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    {showProgress && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{milestone.currentValue} / {milestone.targetValue} {milestone.unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${colors.progress}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Motivational Message */}
                    <div className="text-sm text-gray-600 dark:text-gray-300 italic">
                      {getMotivationalMessage(milestone)}
                    </div>

                    {/* Completion Info */}
                    {milestone.isCompleted && milestone.completedAt && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        ✓ Completed on {formatDate(milestone.completedAt)}
                      </div>
                    )}

                    {/* Reward */}
                    {milestone.reward && milestone.isCompleted && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600">🎁</span>
                          <div>
                            <div className="text-sm font-medium text-yellow-800">
                              Reward Unlocked: {milestone.reward.name}
                            </div>
                            <div className="text-xs text-yellow-700">
                              {milestone.reward.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Encouragement Section */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="text-green-600 text-2xl">🎯</div>
            <div>
              <h4 className="font-semibold text-green-800">Keep Up the Great Work!</h4>
              <p className="text-sm text-green-700">
                Each milestone you achieve brings you closer to becoming an exceptional medical professional.
                Your dedication and progress are truly inspiring!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MilestoneTracker;