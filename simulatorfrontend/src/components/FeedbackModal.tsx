import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  sessionId?: string;
  initialFeedbackType?: string;
  context?: 'case' | 'session' | 'general';
  onSuccess?: () => void;
}

interface FeedbackType {
  value: string;
  label: string;
  description: string;
  icon?: string;
}

interface FeedbackData {
  caseId?: string;
  sessionId?: string;
  feedbackType: string;
  rating: number;
  comments: string;
  metadata: {
    pageUrl: string;
    userAgent: string;
    timestamp: string;
    context?: string;
  };
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  caseId,
  sessionId,
  initialFeedbackType = 'general_feedback',
  context = 'general',
  onSuccess
}) => {
  const { user } = useAuth();
  const [feedbackTypes, setFeedbackTypes] = useState<Record<string, FeedbackType>>({});
  const [selectedType, setSelectedType] = useState(initialFeedbackType);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Default feedback types if API fails
  const defaultFeedbackTypes: Record<string, FeedbackType> = {
    case_feedback: {
      value: 'case_feedback',
      label: 'Case Content',
      description: 'Feedback about the medical case content, realism, or difficulty',
      icon: '📋'
    },
    technical_issue: {
      value: 'technical_issue',
      label: 'Technical Issue',
      description: 'Report bugs, performance issues, or technical problems',
      icon: '🐛'
    },
    ui_ux_feedback: {
      value: 'ui_ux_feedback',
      label: 'Interface & Usability',
      description: 'Suggestions for improving the user interface and experience',
      icon: '🎨'
    },
    medical_accuracy: {
      value: 'medical_accuracy',
      label: 'Medical Accuracy',
      description: 'Concerns about medical accuracy or clinical content',
      icon: '⚕️'
    },
    general_feedback: {
      value: 'general_feedback',
      label: 'General Feedback',
      description: 'General suggestions, comments, or other feedback',
      icon: '💬'
    }
  };

  // Fetch feedback types on mount
  useEffect(() => {
    const fetchFeedbackTypes = async () => {
      try {
        const response = await fetch('/api/feedback/types');
        if (response.ok) {
          const data = await response.json();
          setFeedbackTypes(data.data || defaultFeedbackTypes);
        } else {
          setFeedbackTypes(defaultFeedbackTypes);
        }
      } catch (error) {
        console.error('Failed to fetch feedback types:', error);
        setFeedbackTypes(defaultFeedbackTypes);
      }
    };

    if (isOpen) {
      fetchFeedbackTypes();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialFeedbackType);
      setRating(5);
      setComments('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, initialFeedbackType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in to submit feedback');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const feedbackData: FeedbackData = {
        caseId: caseId || undefined,
        sessionId: sessionId || undefined,
        feedbackType: selectedType,
        rating,
        comments: comments.trim(),
        metadata: {
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          context
        }
      };

      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const getContextDescription = () => {
    switch (context) {
      case 'case':
        return caseId ? `for Case ${caseId}` : 'about this case';
      case 'session':
        return sessionId ? `for Session ${sessionId}` : 'about this simulation session';
      default:
        return 'about your experience';
    }
  };

  if (success) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Thank You!"
        description="Your feedback has been submitted successfully."
        size="md"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            We appreciate your input and will use it to improve our platform.
          </p>
          <Button
            variant="primary"
            onClick={onClose}
            className="mt-6"
          >
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Your Feedback"
      description={`Help us improve by sharing your thoughts ${getContextDescription()}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feedback Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            What type of feedback would you like to share?
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {Object.values(feedbackTypes).map((type) => (
              <div
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedType === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="feedbackType"
                    value={type.value}
                    checked={selectedType === type.value}
                    onChange={() => setSelectedType(type.value)}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {type.icon && <span className="text-sm">{type.icon}</span>}
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {type.label}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {type.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            How would you rate your experience?
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1 transition-transform hover:scale-110"
                disabled={isSubmitting}
              >
                <svg
                  className={`w-8 h-8 transition-colors ${
                    star <= rating
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
              {rating === 5 ? 'Excellent' : 
               rating === 4 ? 'Good' : 
               rating === 3 ? 'Average' : 
               rating === 2 ? 'Poor' : 'Very Poor'}
            </span>
          </div>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Comments {comments.length > 0 && `(${comments.length}/500)`}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value.slice(0, 500))}
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            placeholder="Please share any additional thoughts, suggestions, or details about your experience..."
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Optional but greatly appreciated</span>
            <span>{comments.length}/500 characters</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!selectedType || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedbackModal;