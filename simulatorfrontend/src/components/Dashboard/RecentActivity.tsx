import React from 'react';

interface Activity {
  _id: string;
  type: 'case_completed' | 'achievement_unlocked' | 'level_up';
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const iconMap = {
    case_completed: '📄',
    achievement_unlocked: '🏆',
    level_up: '⭐',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <ul className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <li key={activity._id} className="py-4 flex">
            <div className="text-2xl mr-4">{iconMap[activity.type]}</div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{activity.description}</p>
              <p className="text-sm text-gray-500">{new Date(activity.timestamp).toLocaleDateString()}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};