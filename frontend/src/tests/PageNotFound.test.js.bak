import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PageNotFound from '../Pages/PageNotFound';

describe('PageNotFound Component - Unit Tests', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <PageNotFound />
      </MemoryRouter>
    );
  };

  test('4. should render the 404 error heading correctly', () => {
    renderComponent();
    const headingElement = screen.getByRole('heading', { name: /404 Page Not Found/i });
    expect(headingElement).toBeInTheDocument();
  });

  test('5. should render the descriptive error paragraph text', () => {
    renderComponent();
    const textElement = screen.getByText(/Oops! The page you're looking for doesn't exist/i);
    expect(textElement).toBeInTheDocument();
  });

  test('6. should render the "Go back to homepage" button', () => {
    renderComponent();
    const buttonElement = screen.getByRole('button', { name: /Go back to homepage/i });
    expect(buttonElement).toBeInTheDocument();
  });

  test('7. should contain a link leading to the homepage path "/"', () => {
    renderComponent();
    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', '/');
  });
});
