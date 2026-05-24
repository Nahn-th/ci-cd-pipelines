import '@testing-library/jest-dom';

// Polyfill window.matchMedia for media queries (Chakra UI, react-slick)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock axios globally to avoid "Cannot use import statement outside a module"
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn().mockReturnThis(),
}));

// Mock ESM packages that Jest fails to parse
jest.mock('react-markdown', () => {
  return function DummyMarkdown({ children }) {
    return <>{children}</>;
  };
});
jest.mock('remark-gfm', () => () => {});



