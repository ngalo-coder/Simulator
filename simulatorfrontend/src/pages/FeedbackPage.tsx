import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import FeedbackModal from '../components/FeedbackModal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface FeedbackItem {
  id: string;
  caseId?: string;
  feedbackType: string;
  rating: number;
  comments: string;
  createdAt: string;
  metadata?: {
    pageUrl?: string;
    userAgent?: string;
  };
}

interface FeedbackType {
  value: string;
  label: string;
  description: string;
}

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [feedbackTypes, setFeedbackTypes] = useState<Record<string, FeedbackType>>({});
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedbackData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError('');

        // Fetch feedback types
        const typesResponse = await fetch('/api/feedback/types');
        if (typesResponse.ok) {
          const typesData = await typesResponse.json();
          setFeedbackTypes(typesData.data);
        }

        // Fetch user's feedback history
        const historyResponse = await fetch('/api/feedback/user/history', {
          credentials: 'include'
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setFeedbackHistory(historyData.data || []);
        }
      } catch (error) {
        console.error('Error fetching feedback data:', error);
        setError('Failed to load feedback data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackData();
  }, [user]);

  const getFeedbackTypeLabel = (typeValue: string) => {
    const type = Object.values(feedbackTypes).find(t => t.value === typeValue);
    return type ? type.label : typeValue;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Feedback & Support
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Share your thoughts, report issues, and help us improve the platform
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="bg-medical-500 hover:bg-medical-600"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit New Feedback
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Quick Feedback Types */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Feedback Options
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(feedbackTypes).map((type) => (
            <Card
              key={type.value}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setIsFeedbackModalOpen(true);
                // You could pass the feedback type to pre-select it
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-medical-100 dark:bg-medical-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-medical-600 dark:text-medical-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {type.label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {type.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Feedback History */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Your Feedback History
        </h2>

        {feedbackHistory.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No feedback submitted yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your feedback helps us improve the platform. Share your thoughts to get started.
            </p>
            <Button
              variant="primary"
              onClick={() => setIsFeedbackModalOpen(true)}
            >
              Submit Your First Feedback
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedbackHistory.map((feedback) => (
              <Card key={feedback.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {getFeedbackTypeLabel(feedback.feedbackType)}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(feedback.rating)}
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          {feedback.rating}/5
                        </span>
                      </div>
                    </div>

                    {feedback.comments && (
                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {feedback.comments}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDate(feedback.createdAt)}</span>
                      {feedback.caseId && (
                        <span>Case: {feedback.caseId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};

export default FeedbackPage;