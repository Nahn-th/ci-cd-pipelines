import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { useSelector } from 'react-redux';

// Mock react-redux useSelector hook
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

// Mock routing and navbar components to isolate App.js logic
jest.mock('../routes/AllRoute', () => () => <div data-testid="all-routes">All Routes Content</div>);
jest.mock('../components/UserComponents/UserNavbar', () => () => <div data-testid="user-navbar">User Navbar</div>);

describe('App Component - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. should render Navbar if user role is admin', () => {
    useSelector.mockReturnValue({ role: 'admin' });

    render(<App />);

    expect(screen.getByTestId('all-routes')).toBeInTheDocument();
    expect(screen.getByTestId('user-navbar')).toBeInTheDocument();
  });

  test('2. should render Navbar if user role is teacher', () => {
    useSelector.mockReturnValue({ role: 'teacher' });

    render(<App />);

    expect(screen.getByTestId('all-routes')).toBeInTheDocument();
    expect(screen.getByTestId('user-navbar')).toBeInTheDocument();
  });

  test('3. should NOT render Navbar if user role is student or other', () => {
    useSelector.mockReturnValue({ role: 'student' });

    render(<App />);

    expect(screen.getByTestId('all-routes')).toBeInTheDocument();
    expect(screen.queryByTestId('user-navbar')).not.toBeInTheDocument();
  });
});
