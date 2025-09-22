import React from 'react';
import Card from './ui/Card';
import EnhancedProgressBar from './ui/EnhancedProgressBar';

interface SkillArea {
  name: string;
  currentScore: number;
  maxScore: number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
}

interface SkillBreakdownProps {
  skills: SkillArea[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const SkillBreakdown: React.FC<SkillBreakdownProps> = ({
  skills,
  title = "Competency Areas",
  subtitle = "Breakdown of your performance across different medical skills",
  className = ""
}) => {
  const getSkillColor = (score: number): 'medical' | 'stable' | 'warning' | 'emergency' | 'info' => {
    if (score >= 85) return 'stable';
    if (score >= 70) return 'medical';
    if (score >= 50) return 'warning';
    return 'emergency';
  };

  const getTrendIcon = (trend?: { value: number; direction: 'up' | 'down' | 'stable' }) => {
    if (!trend) return null;

    const { direction, value } = trend;
    const iconClass = "w-4 h-4";

    switch (direction) {
      case 'up':
        return (
          <svg className={`${iconClass} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'stable':
        return (
          <svg className={`${iconClass} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const getTrendText = (trend?: { value: number; direction: 'up' | 'down' | 'stable' }) => {
    if (!trend) return '';

    const { direction, value } = trend;
    const prefix = direction === 'up' ? '+' : direction === 'down' ? '' : '';
    const suffix = direction === 'stable' ? 'no change' : 'this week';

    return `${prefix}${value}% ${suffix}`;
  };

  return (
    <Card variant="elevated" className={`bg-gradient-to-br from-medical-50 via-white to-medical-50 border-medical-200 ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-medical-900 mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((skill, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center text-medical-600">
                    {skill.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{skill.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{skill.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-medical-700">
                    {Math.round(skill.currentScore)}%
                  </div>
                  {skill.trend && (
                    <div className="flex items-center space-x-1 text-xs">
                      {getTrendIcon(skill.trend)}
                      <span className={`font-medium ${
                        skill.trend.direction === 'up' ? 'text-green-600' :
                        skill.trend.direction === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {getTrendText(skill.trend)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <EnhancedProgressBar
                value={skill.currentScore}
                max={skill.maxScore}
                size="sm"
                showLabel={false}
                milestones={[
                  { value: 25, label: "Novice" },
                  { value: 50, label: "Developing" },
                  { value: 75, label: "Proficient" },
                  { value: 90, label: "Expert" }
                ]}
              />
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-medical-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-medical-700">
                {Math.round(skills.reduce((acc, skill) => acc + skill.currentScore, 0) / skills.length)}%
              </div>
              <div className="text-xs text-gray-600">Average Score</div>
            </div>
            <div>
              <div className="text-lg font-bold text-stable-600">
                {skills.filter(skill => skill.currentScore >= 70).length}
              </div>
              <div className="text-xs text-gray-600">Above 70%</div>
            </div>
            <div>
              <div className="text-lg font-bold text-warning-600">
                {skills.filter(skill => skill.trend?.direction === 'up').length}
              </div>
              <div className="text-xs text-gray-600">Improving</div>
            </div>
            <div>
              <div className="text-lg font-bold text-info-600">
                {skills.length}
              </div>
              <div className="text-xs text-gray-600">Total Skills</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SkillBreakdown;