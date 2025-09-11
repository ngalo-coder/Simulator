import React from 'react';
import { render, screen } from '@testing-library/react';
import CaseCard from './CaseCard';

// Mock the necessary props
const mockCase = {
  id: '1',
  title: 'Cardiology Case',
  description: 'A case about heart conditions',
  specialty: 'Cardiology',
  patient_age: 45,
  patient_gender: 'Male',
  chief_complaint: 'Chest pain',
  isCompleted: true,
  bestScore: 85,
  lastCompletedAt: '2023-01-15T10:30:00Z'
};

const mockProps = {
  case_: mockCase,
  onStartSimulation: jest.fn(),
  onRetake: jest.fn(),
  startingSimulation: false
};

describe('CaseCard', () => {
  test('renders case title correctly', () => {
    render(<CaseCard {...mockProps} />);
    expect(screen.getByText('Cardiology Case')).toBeInTheDocument();
  });

  test('renders patient information', () => {
    render(<CaseCard {...mockProps} />);
    expect(screen.getByText('👤 45y Male')).toBeInTheDocument();
  });

  test('renders specialty tag with correct styling', () => {
    render(<CaseCard {...mockProps} />);
    const specialtyTag = screen.getByText('Cardiology');
    expect(specialtyTag).toBeInTheDocument();
    expect(specialtyTag).toHaveClass('bg-red-100', 'text-red-800');
  });

  test('renders chief complaint when present', () => {
    render(<CaseCard {...mockProps} />);
    expect(screen.getByText('Chief Complaint:')).toBeInTheDocument();
    expect(screen.getByText('Chest pain')).toBeInTheDocument();
  });

  test('renders completion status when case is completed', () => {
    render(<CaseCard {...mockProps} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  test('renders stats section when case is completed', () => {
    render(<CaseCard {...mockProps} />);
    expect(screen.getByText('Best Score')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('applies dark mode classes correctly', () => {
    render(<CaseCard {...mockProps} />);
    const card = screen.getByTestId('case-card');
    expect(card).toHaveClass('dark:border-blue-500/30');
  });
});