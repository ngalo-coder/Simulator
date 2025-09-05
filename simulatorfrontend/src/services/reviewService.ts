import { CaseReview, ReviewDecision, Annotation } from '../types/review';
import { ContributedCase } from '../types/case';
import api from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

export const reviewService = {
  // Get a specific review by ID
  async getReview(reviewId: string): Promise<CaseReview> {
    try {
      const response = await api.authenticatedFetch(`${API_BASE_URL}/api/reviews/${reviewId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch review');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching review:', error);
      throw error;
    }
  },

  // Get pending reviews for the current user
  async getPendingReviews(): Promise<CaseReview[]> {
    try {
      const response = await api.authenticatedFetch(`${API_BASE_URL}/api/reviews/pending`);
      if (!response.ok) {
        throw new Error('Failed to fetch pending reviews');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      throw error;
    }
  },

  // Start a review
  async startReview(reviewId: string): Promise<CaseReview> {
    try {
      const response = await api.authenticatedFetch(`${API_BASE_URL}/api/reviews/${reviewId}/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start review');
      }
      const data = await response.json();
      return data.review;
    } catch (error) {
      console.error('Error starting review:', error);
      throw error;
    }
  },

  // Complete a review with decision
  async completeReview(
    reviewId: string,
    reviewData: {
      decision: ReviewDecision;
      feedback: string;
      ratings?: {
        clinicalAccuracy?: number;
        educationalValue?: number;
        completeness?: number;
        clarity?: number;
        culturalAppropriateness?: number;
      };
    }
  ): Promise<{ review: CaseReview; case: ContributedCase }> {
    try {
      const response = await api.authenticatedFetch(`${API_BASE_URL}/api/reviews/${reviewId}/complete`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
      if (!response.ok) {
        throw new Error('Failed to complete review');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error completing review:', error);
      throw error;
    }
  },

  // Add annotation to a review
  async addAnnotation(
    reviewId: string,
    annotationData: {
      type: string;
      fieldPath: string;
      content: string;
      suggestedValue?: string;
      severity?: string;
    }
  ): Promise<CaseReview> {
    try {
      const response = await api.authenticatedFetch(`${API_BASE_URL}/api/reviews/${reviewId}/annotations`, {
        method: 'POST',
        body: JSON.stringify(annotationData),
      });
      if (!response.ok) {
        throw new Error('Failed to add annotation');
      }
      const data = await response.json();
      return data.review;
    } catch (error) {
      console.error('Error adding annotation:', error);
      throw error;
    }
  },

  // Resolve an annotation
  async resolveAnnotation(reviewId: string, annotationIndex: number): Promise<CaseReview> {
    try {
      const response = await api.authenticatedFetch(
        `${API_BASE_URL}/api/reviews/${reviewId}/annotations/${annotationIndex}/resolve`,
        {
          method: 'PATCH',
        }
      );
      if (!response.ok) {
        throw new Error('Failed to resolve annotation');
      }
      const data = await response.json();
      return data.review;
    } catch (error) {
      console.error('Error resolving annotation:', error);
      throw error;
    }
  },

  // Get reviews for a specific case
  async getCaseReviews(caseId: string): Promise<CaseReview[]> {
    try {
      const response = await api.authenticatedFetch(`${API_BASE_URL}/api/reviews/case/${caseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch case reviews');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching case reviews:', error);
      throw error;
    }
  },

  // Reassign a review to another reviewer
  async reassignReview(reviewId: string, newReviewerId: string): Promise<CaseReview> {
    try {
      const response = await api.authenticatedFetch(`${API_BASE_URL}/api/reviews/${reviewId}/reassign`, {
        method: 'PATCH',
        body: JSON.stringify({ newReviewerId }),
      });
      if (!response.ok) {
        throw new Error('Failed to reassign review');
      }
      const data = await response.json();
      return data.review;
    } catch (error) {
      console.error('Error reassigning review:', error);
      throw error;
    }
  },

  // Get review statistics
  async getReviewStatistics(): Promise<any> {
    try {
      const response = await api.authenticatedFetch(`${API_BASE_URL}/api/reviews/statistics`);
      if (!response.ok) {
        throw new Error('Failed to fetch review statistics');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching review statistics:', error);
      throw error;
    }
  },

  // Get review queue (for admins)
  async getReviewQueue(params?: {
    status?: string;
    specialty?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{ cases: ContributedCase[]; totalPages: number; currentPage: number; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await api.authenticatedFetch(
        `${API_BASE_URL}/api/reviews/queue?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch review queue');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching review queue:', error);
      throw error;
    }
  },
};

export default reviewService;