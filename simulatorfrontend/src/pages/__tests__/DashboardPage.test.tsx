import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../../services/api';
import DashboardPage from '../DashboardPage';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockDashboardData = {
  stats: {
    completedCases: 5,
    overallScore: 88,
    currentLevel: 'Proficient',
    achievements: 12,
  },
  recommendedCases: [
    {
      _id: '1',
      case_metadata: { title: 'Test Case 1', specialty: 'Cardiology', difficulty: 'Intermediate' },
      description: 'A test case.',
    },
  ],
  progressData: [{ date: '2023-01-01', score: 85 }],
  recentActivity: [
    { _id: '1', type: 'case_completed', description: 'Completed a case', timestamp: new Date().toISOString() },
  ],
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DashboardPage', () => {
  it('renders loading state initially', () => {
    mockedApi.getStudentDashboard.mockResolvedValue(new Promise(() => {}));
    renderWithRouter(<DashboardPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders dashboard data after successful fetch', async () => {
    mockedApi.getStudentDashboard.mockResolvedValue(mockDashboardData);
    renderWithRouter(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Cases Completed')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Test Case 1')).toBeInTheDocument();
    });
  });

  it('renders error message on fetch failure', async () => {
    mockedApi.getStudentDashboard.mockRejectedValue(new Error('Failed to fetch'));
    renderWithRouter(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });
});