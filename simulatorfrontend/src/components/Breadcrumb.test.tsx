import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Breadcrumb, { BreadcrumbItem } from './Breadcrumb';

// Wrapper component for React Router
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Breadcrumb Component', () => {
  const mockItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/dashboard' },
    { label: 'Browse Cases', href: '/browse-cases' },
    { label: 'Internal Medicine', isActive: true }
  ];

  it('renders breadcrumb items correctly', () => {
    render(
      <RouterWrapper>
        <Breadcrumb items={mockItems} />
      </RouterWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Browse Cases')).toBeInTheDocument();
    expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
  });

  it('renders navigation arrows between items', () => {
    render(
      <RouterWrapper>
        <Breadcrumb items={mockItems} />
      </RouterWrapper>
    );

    const arrows = screen.getAllByText('→');
    expect(arrows).toHaveLength(2); // Two arrows for three items
  });

  it('renders links for non-active items with href', () => {
    render(
      <RouterWrapper>
        <Breadcrumb items={mockItems} />
      </RouterWrapper>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const browseCasesLink = screen.getByRole('link', { name: 'Browse Cases' });
    
    expect(homeLink).toHaveAttribute('href', '/dashboard');
    expect(browseCasesLink).toHaveAttribute('href', '/browse-cases');
  });

  it('renders active item as span without link', () => {
    render(
      <RouterWrapper>
        <Breadcrumb items={mockItems} />
      </RouterWrapper>
    );

    const activeItem = screen.getByText('Internal Medicine');
    expect(activeItem).not.toHaveAttribute('href');
    expect(activeItem.tagName).toBe('SPAN');
  });

  it('applies active styling to active items', () => {
    render(
      <RouterWrapper>
        <Breadcrumb items={mockItems} />
      </RouterWrapper>
    );

    const activeItem = screen.getByText('Internal Medicine');
    expect(activeItem).toHaveClass('font-semibold', 'text-blue-600');
  });

  it('returns null when no items provided', () => {
    const { container } = render(
      <RouterWrapper>
        <Breadcrumb items={[]} />
      </RouterWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('handles items without href as non-clickable spans', () => {
    const itemsWithoutHref: BreadcrumbItem[] = [
      { label: 'Home', href: '/dashboard' },
      { label: 'Loading...' }, // No href
      { label: 'Current Page', isActive: true }
    ];

    render(
      <RouterWrapper>
        <Breadcrumb items={itemsWithoutHref} />
      </RouterWrapper>
    );

    const loadingItem = screen.getByText('Loading...');
    expect(loadingItem).not.toHaveAttribute('href');
    expect(loadingItem.tagName).toBe('SPAN');
  });

  it('applies custom className', () => {
    const { container } = render(
      <RouterWrapper>
        <Breadcrumb items={mockItems} className="custom-class" />
      </RouterWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('sets proper aria attributes', () => {
    render(
      <RouterWrapper>
        <Breadcrumb items={mockItems} />
      </RouterWrapper>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');

    const activeItem = screen.getByText('Internal Medicine');
    expect(activeItem).toHaveAttribute('aria-current', 'page');
  });
});