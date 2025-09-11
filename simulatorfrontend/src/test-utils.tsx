import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const renderWithRouter = (ui: React.ReactElement, { initialEntries = ['/'] }: { initialEntries?: any[] } = {}) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    );
    return render(ui, { wrapper: Wrapper });
};

export default renderWithRouter;
