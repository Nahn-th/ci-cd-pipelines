import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminNavTop from '../src/components/AdminNavTop';

// Mock useSelector
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('AdminNavTop Component - Unit Tests', () => {
  const mockHandleSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useSelector.mockReturnValue({ name: 'Alexander' });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminNavTop handleSearch={mockHandleSearch} />
      </MemoryRouter>
    );
  };

  test('12. should render search input with correct placeholder', () => {
    renderComponent();
    const inputElement = screen.getByPlaceholderText(/Search Anything/i);
    expect(inputElement).toBeInTheDocument();
  });

  test('13. should trigger handleSearch callback when input value changes', () => {
    renderComponent();
    const inputElement = screen.getByPlaceholderText(/Search Anything/i);
    
    fireEvent.change(inputElement, { target: { value: 'Docker' } });
    
    expect(mockHandleSearch).toHaveBeenCalled();
  });

  test('14. should display the first letter of the logged in user name', () => {
    renderComponent();
    const firstLetterElement = screen.getByText('A');
    expect(firstLetterElement).toBeInTheDocument();
  });
});
