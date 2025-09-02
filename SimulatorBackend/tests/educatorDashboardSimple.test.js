import { expect } from 'chai';
import educatorDashboardService from '../src/services/EducatorDashboardService.js';
import caseManagementService from '../src/services/CaseManagementService.js';

describe('Educator Dashboard - Simple Tests', () => {
  describe('EducatorDashboardService', () => {
    it('should be properly instantiated', () => {
      expect(educatorDashboardService).to.be.an('object');
      expect(educatorDashboardService.getDashboardOverview).to.be.a('function');
      expect(educatorDashboardService.getAssignedStudents).to.be.a('function');
      expect(educatorDashboardService.getStudentProgress).to.be.a('function');
      expect(educatorDashboardService.getCaseManagementData).to.be.a('function');
      expect(educatorDashboardService.getCaseAnalytics).to.be.a('function');
      expect(educatorDashboardService.createClass).to.be.a('function');
      expect(educatorDashboardService.getEducatorClasses).to.be.a('function');
    });

    it('should have correct default configuration', () => {
      expect(educatorDashboardService.defaultPageSize).to.equal(20);
      expect(educatorDashboardService.maxPageSize).to.equal(100);
    });

    it('should have helper methods', () => {
      expect(educatorDashboardService.calculateCompetencyScores).to.be.a('function');
      expect(educatorDashboardService.calculateRecentTrend).to.be.a('function');
      expect(educatorDashboardService.buildUserCaseQuery).to.be.a('function');
      expect(educatorDashboardService.canUserAccessCase).to.be.a('function');
    });
  });

  describe('CaseManagementService', () => {
    it('should be properly instantiated', () => {
      expect(caseManagementService).to.be.an('object');
      expect(caseManagementService.createCase).to.be.a('function');
      expect(caseManagementService.getCaseById).to.be.a('function');
      expect(caseManagementService.updateCase).to.be.a('function');
      expect(caseManagementService.deleteCase).to.be.a('function');
      expect(caseManagementService.submitForReview).to.be.a('function');
      expect(caseManagementService.reviewCase).to.be.a('function');
      expect(caseManagementService.publishCase).to.be.a('function');
    });

    it('should have correct case statuses', () => {
      expect(caseManagementService.caseStatuses).to.deep.equal({
        DRAFT: 'draft',
        PENDING_REVIEW: 'pending_review',
        APPROVED: 'approved',
        PUBLISHED: 'published',
        ARCHIVED: 'archived',
        REJECTED: 'rejected'
      });
    });

    it('should have permission checking methods', () => {
      expect(caseManagementService.canUserAccessCase).to.be.a('function');
      expect(caseManagementService.canUserEditCase).to.be.a('function');
      expect(caseManagementService.canUserDeleteCase).to.be.a('function');
      expect(caseManagementService.canUserReviewCase).to.be.a('function');
      expect(caseManagementService.canUserPublishCase).to.be.a('function');
      expect(caseManagementService.canUserShareCase).to.be.a('function');
    });

    it('should validate case data', () => {
      expect(() => {
        caseManagementService.validateCaseData({});
      }).to.throw('Case metadata is required');

      expect(() => {
        caseManagementService.validateCaseData({ case_metadata: {} });
      }).to.throw('Case title is required');

      expect(() => {
        caseManagementService.validateCaseData({ 
          case_metadata: { title: 'Test Case' } 
        });
      }).to.not.throw();
    });

    it('should generate case IDs', async () => {
      const caseId = await caseManagementService.generateCaseId('medicine');
      expect(caseId).to.be.a('string');
      expect(caseId).to.match(/^MED_\d{6}_\d{3}$/);
    });

    it('should validate case for review', () => {
      expect(() => {
        caseManagementService.validateCaseForReview({});
      }).to.throw('Case must have a title before review');

      expect(() => {
        caseManagementService.validateCaseForReview({ 
          case_metadata: { title: 'Test' } 
        });
      }).to.throw('Case must have a description before review');

      expect(() => {
        caseManagementService.validateCaseForReview({ 
          case_metadata: { title: 'Test' },
          description: 'Test description'
        });
      }).to.not.throw();
    });
  });

  describe('Permission System', () => {
    const mockUser = {
      _id: 'user123',
      primaryRole: 'educator',
      username: 'testuser'
    };

    const mockAdmin = {
      _id: 'admin123',
      primaryRole: 'admin',
      username: 'testadmin'
    };

    const mockCase = {
      _id: 'case123',
      createdBy: 'user123',
      status: 'draft',
      collaborators: []
    };

    it('should allow case creator to access case', () => {
      const canAccess = caseManagementService.canUserAccessCase(mockCase, mockUser);
      expect(canAccess).to.be.true;
    });

    it('should allow admin to access any case', () => {
      const canAccess = caseManagementService.canUserAccessCase(mockCase, mockAdmin);
      expect(canAccess).to.be.true;
    });

    it('should allow case creator to edit case', () => {
      const canEdit = caseManagementService.canUserEditCase(mockCase, mockUser);
      expect(canEdit).to.be.true;
    });

    it('should allow admin to edit any case', () => {
      const canEdit = caseManagementService.canUserEditCase(mockCase, mockAdmin);
      expect(canEdit).to.be.true;
    });

    it('should allow educators to review cases', () => {
      const canReview = caseManagementService.canUserReviewCase(mockCase, mockUser);
      expect(canReview).to.be.true;
    });

    it('should allow admins to review cases', () => {
      const canReview = caseManagementService.canUserReviewCase(mockCase, mockAdmin);
      expect(canReview).to.be.true;
    });
  });

  describe('Helper Functions', () => {
    it('should calculate competency scores correctly', () => {
      const mockAttempts = [
        {
          detailed_metrics: {
            clinicalReasoning: 80,
            knowledgeApplication: 90
          }
        },
        {
          detailed_metrics: {
            clinicalReasoning: 90,
            knowledgeApplication: 85
          }
        }
      ];

      const scores = educatorDashboardService.calculateCompetencyScores(mockAttempts);
      expect(scores.clinicalReasoning).to.equal('85.0');
      expect(scores.knowledgeApplication).to.equal('87.5');
    });

    it('should calculate recent trends correctly', () => {
      const mockAttempts = [
        { score: { overall: 70 }, start_time: new Date('2024-01-01') },
        { score: { overall: 80 }, start_time: new Date('2024-01-02') },
        { score: { overall: 90 }, start_time: new Date('2024-01-03') }
      ];

      const trend = educatorDashboardService.calculateRecentTrend(mockAttempts);
      expect(trend).to.be.oneOf(['improving', 'declining', 'stable']);
    });

    it('should build user case query correctly', () => {
      const educator = { _id: 'user123', primaryRole: 'educator' };
      const admin = { _id: 'admin123', primaryRole: 'admin' };

      const educatorQuery = caseManagementService.buildUserCaseQuery(educator);
      expect(educatorQuery).to.have.property('$or');
      expect(educatorQuery.$or).to.be.an('array');

      const adminQuery = caseManagementService.buildUserCaseQuery(admin);
      expect(adminQuery).to.deep.equal({});
    });

    it('should generate change descriptions', () => {
      const original = { title: 'Old Title', description: 'Old Description' };
      const updated = { title: 'New Title', description: 'Old Description' };

      const changes = caseManagementService.generateChangeDescription(original, updated);
      expect(changes).to.include('Updated title');
    });
  });

  describe('Configuration and Constants', () => {
    it('should have correct pagination defaults', () => {
      expect(educatorDashboardService.defaultPageSize).to.equal(20);
      expect(educatorDashboardService.maxPageSize).to.equal(100);
      expect(caseManagementService.defaultPageSize).to.equal(20);
      expect(caseManagementService.maxPageSize).to.equal(100);
    });

    it('should have all required case statuses', () => {
      const statuses = caseManagementService.caseStatuses;
      expect(statuses).to.have.all.keys([
        'DRAFT', 'PENDING_REVIEW', 'APPROVED', 
        'PUBLISHED', 'ARCHIVED', 'REJECTED'
      ]);
    });
  });
});