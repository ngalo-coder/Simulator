import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reviewService } from '../services/reviewService';
import { caseService } from '../services/caseService';
import { CaseReview, Annotation, ReviewDecision } from '../types/review';
import { ContributedCase } from '../types/case';
import LoadingSpinner from './LoadingSpinner';
import NotificationToast from './NotificationToast';

interface CaseReviewInterfaceProps {
  reviewId?: string;
}

const CaseReviewInterface: React.FC<CaseReviewInterfaceProps> = ({ reviewId: propReviewId }) => {
  const { reviewId: paramReviewId } = useParams<{ reviewId: string }>();
  const reviewId = propReviewId || paramReviewId;
  const { user } = useAuth();
  
  const [review, setReview] = useState<CaseReview | null>(null);
  const [caseData, setCaseData] = useState<ContributedCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [decision, setDecision] = useState<ReviewDecision>(ReviewDecision.PENDING);
  const [feedback, setFeedback] = useState('');
  const [ratings, setRatings] = useState({
    clinicalAccuracy: 0,
    educationalValue: 0,
    completeness: 0,
    clarity: 0,
    culturalAppropriateness: 0
  });
  
  const [newAnnotation, setNewAnnotation] = useState({
    type: 'comment',
    fieldPath: '',
    content: '',
    suggestedValue: '',
    severity: 'medium'
  });

  useEffect(() => {
    if (reviewId) {
      fetchReviewData();
    }
  }, [reviewId]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const reviewData = await reviewService.getReview(reviewId!);
      setReview(reviewData);
      
      if (reviewData.caseId) {
        const caseData = await caseService.getContributedCase(reviewData.caseId);
        setCaseData(caseData);
      }
    } catch (err) {
      setError('Failed to fetch review data');
      console.error('Review data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startReview = async () => {
    try {
      await reviewService.startReview(reviewId!);
      setReview(prev => prev ? { ...prev, status: 'in_progress' } : null);
      setSuccess('Review started successfully');
    } catch (err) {
      setError('Failed to start review');
    }
  };

  const addAnnotation = async () => {
    if (!newAnnotation.content || !newAnnotation.fieldPath) {
      setError('Annotation content and field path are required');
      return;
    }

    try {
      const updatedReview = await reviewService.addAnnotation(
        reviewId!,
        newAnnotation
      );
      setReview(updatedReview);
      setNewAnnotation({
        type: 'comment',
        fieldPath: '',
        content: '',
        suggestedValue: '',
        severity: 'medium'
      });
      setSuccess('Annotation added successfully');
    } catch (err) {
      setError('Failed to add annotation');
    }
  };

  const resolveAnnotation = async (index: number) => {
    try {
      const updatedReview = await reviewService.resolveAnnotation(reviewId!, index);
      setReview(updatedReview);
      setSuccess('Annotation resolved successfully');
    } catch (err) {
      setError('Failed to resolve annotation');
    }
  };

  const submitReview = async () => {
    if (!decision || !feedback) {
      setError('Decision and feedback are required');
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.completeReview(reviewId!, {
        decision,
        feedback,
        ratings: Object.values(ratings).some(r => r > 0) ? ratings : undefined
      });
      setSuccess('Review submitted successfully');
      // Redirect to dashboard or show success message
      setTimeout(() => {
        window.location.href = '/review/dashboard';
      }, 2000);
    } catch (err) {
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!review) return <div>Review not found</div>;

  return (
    <div className="case-review-interface">
      <div className="review-header">
        <h1>Case Review: {caseData?.caseData.case_metadata.title || 'Untitled Case'}</h1>
        <div className="review-meta">
          <p>Status: <span className={`status-${review.status}`}>{review.status}</span></p>
          <p>Priority: <span className={`priority-${review.priority}`}>{review.priority}</span></p>
          <p>Deadline: {new Date(review.deadline).toLocaleDateString()}</p>
        </div>
      </div>

      {error && (
        <NotificationToast
          message={error}
          type="error"
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <NotificationToast
          message={success}
          type="success"
          onClose={() => setSuccess(null)}
        />
      )}

      {review.status === 'pending' && (
        <div className="review-actions">
          <button className="btn btn-primary" onClick={startReview}>
            Start Review
          </button>
        </div>
      )}

      {review.status === 'in_progress' && (
        <div className="review-content">
          {/* Case Content Display */}
          <div className="case-content">
            <h2>Case Content</h2>
            <div className="case-section">
              <h3>Metadata</h3>
              <pre>{JSON.stringify(caseData?.caseData.case_metadata, null, 2)}</pre>
            </div>
            <div className="case-section">
              <h3>Patient Persona</h3>
              <pre>{JSON.stringify(caseData?.caseData.patient_persona, null, 2)}</pre>
            </div>
            <div className="case-section">
              <h3>Clinical Dossier</h3>
              <pre>{JSON.stringify(caseData?.caseData.clinical_dossier, null, 2)}</pre>
            </div>
          </div>

          {/* Annotation Tools */}
          <div className="annotation-tools">
            <h2>Annotation Tools</h2>
            <div className="annotation-form">
              <select
                value={newAnnotation.type}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, type: e.target.value })}
              >
                <option value="comment">Comment</option>
                <option value="suggestion">Suggestion</option>
                <option value="correction">Correction</option>
                <option value="question">Question</option>
                <option value="highlight">Highlight</option>
              </select>
              
              <input
                type="text"
                placeholder="Field Path (e.g., case_metadata.title)"
                value={newAnnotation.fieldPath}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, fieldPath: e.target.value })}
              />
              
              <textarea
                placeholder="Annotation content"
                value={newAnnotation.content}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, content: e.target.value })}
                rows={3}
              />
              
              <input
                type="text"
                placeholder="Suggested value (for corrections)"
                value={newAnnotation.suggestedValue}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, suggestedValue: e.target.value })}
              />
              
              <select
                value={newAnnotation.severity}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, severity: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              
              <button className="btn btn-secondary" onClick={addAnnotation}>
                Add Annotation
              </button>
            </div>

            {/* Annotations List */}
            <div className="annotations-list">
              <h3>Annotations</h3>
              {review.annotations?.map((annotation, index) => (
                <div key={index} className={`annotation ${annotation.resolved ? 'resolved' : ''}`}>
                  <p><strong>{annotation.type}</strong> on {annotation.fieldPath}</p>
                  <p>{annotation.content}</p>
                  {annotation.suggestedValue && (
                    <p>Suggested: {annotation.suggestedValue}</p>
                  )}
                  <p>Severity: {annotation.severity}</p>
                  {!annotation.resolved && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => resolveAnnotation(index)}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Review Decision Form */}
          <div className="decision-form">
            <h2>Review Decision</h2>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value as ReviewDecision)}
            >
              <option value={ReviewDecision.PENDING}>Pending</option>
              <option value={ReviewDecision.APPROVED}>Approve</option>
              <option value={ReviewDecision.REJECTED}>Reject</option>
              <option value={ReviewDecision.NEEDS_REVISION}>Needs Revision</option>
            </select>

            <textarea
              placeholder="Overall feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
            />

            <div className="ratings">
              <h3>Ratings (Optional)</h3>
              {Object.entries(ratings).map(([key, value]) => (
                <div key={key} className="rating-item">
                  <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <select
                    value={value}
                    onChange={(e) => setRatings({ ...ratings, [key]: parseInt(e.target.value) })}
                  >
                    <option value={0}>Not rated</option>
                    <option value={1}>1 - Poor</option>
                    <option value={2}>2 - Fair</option>
                    <option value={3}>3 - Good</option>
                    <option value={4}>4 - Very Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={submitReview}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseReviewInterface;