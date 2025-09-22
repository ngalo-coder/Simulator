import React from 'react';
import Card from './ui/Card';

interface ActivityItem {
  id: string;
  title: string;
  caseId: string;
  score?: number;
  endTime: Date;
  status: 'completed' | 'in_progress' | 'pending_feedback';
  specialty?: string;
  feedbackStatus?: 'received' | 'pending' | 'none';
  duration?: number; // in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  title?: string;
  subtitle?: string;
  maxItems?: number;
  showFeedbackStatus?: boolean;
  className?: string;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  title = "Recent Activity",
  subtitle = "Your latest patient case simulations and progress",
  maxItems = 5,
  showFeedbackStatus = true,
  className = ""
}) => {
  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'pending_feedback':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: ActivityItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending_feedback':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getFeedbackStatusColor = (status?: ActivityItem['feedbackStatus']) => {
    switch (status) {
      case 'received':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getDifficultyColor = (difficulty?: ActivityItem['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'advanced':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card variant="elevated" className={`bg-gradient-to-br from-stable-50 via-white to-stable-50 border-stable-200 ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-stable-900 mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{subtitle}</p>
        </div>

        {displayActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500 dark:text-gray-400">No recent activity to display</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Complete some cases to see your activity timeline</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {index < displayActivities.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200 dark:bg-gray-700"></div>
                )}

                <div className="flex items-start space-x-4">
                  {/* Status Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}>
                    {getStatusIcon(activity.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {activity.title || 'Unknown Case'}
                        </h3>

                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(activity.endTime)}
                          </span>

                          {activity.specialty && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {activity.specialty}
                              </span>
                            </>
                          )}

                          {activity.duration && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDuration(activity.duration)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Score and badges */}
                      <div className="flex items-center space-x-2">
                        {activity.score !== undefined && (
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {Math.round(activity.score)}%
                          </div>
                        )}

                        {showFeedbackStatus && activity.feedbackStatus && (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getFeedbackStatusColor(activity.feedbackStatus)}`}>
                            {activity.feedbackStatus === 'received' ? 'Feedback' :
                             activity.feedbackStatus === 'pending' ? 'Pending' : 'No Feedback'}
                          </div>
                        )}

                        {activity.difficulty && (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(activity.difficulty)}`}>
                            {activity.difficulty}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status description */}
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status === 'completed' ? 'Completed' :
                         activity.status === 'in_progress' ? 'In Progress' :
                         activity.status === 'pending_feedback' ? 'Awaiting Feedback' : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        {activities.length > maxItems && (
          <div className="mt-6 pt-4 border-t border-stable-200 text-center">
            <button className="text-stable-600 hover:text-stable-700 dark:text-stable-400 dark:hover:text-stable-300 text-sm font-medium">
              View all {activities.length} activities
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityTimeline;