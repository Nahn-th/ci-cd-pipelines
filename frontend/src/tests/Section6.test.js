import { render, screen, fireEvent } from '@testing-library/react';
import Section6 from '../Pages/LandingPageComponents/Section6';

const mockNavigate = jest.fn();

// Mock useNavigate from react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Section6 Component - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('8. should render the section header highlighting SRM outcomes', () => {
    render(<Section6 />);
    const headingElement = screen.getByText(/Learner outcomes on/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('9. should render the statistical outcome description text', () => {
    render(<Section6 />);
    const textElement = screen.getByText(/an impressive 87% of learners have reported tangible career benefits/i);
    expect(textElement).toBeInTheDocument();
  });

  test('10. should render the outcome illustration image', () => {
    render(<Section6 />);
    const imageElement = screen.getByRole('img');
    expect(imageElement).toBeInTheDocument();
  });

  test('11. should render the "Join for Free" button and navigate to "/signup" when clicked', () => {
    render(<Section6 />);
    const buttonElement = screen.getByRole('button', { name: /Join for Free/i });
    expect(buttonElement).toBeInTheDocument();

    fireEvent.click(buttonElement);
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });
});
