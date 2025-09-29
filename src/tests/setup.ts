import '@testing-library/jest-dom';

// Mock environment variables
Object.assign(process.env, {
  NODE_ENV: 'test',
  NEXT_PUBLIC_API_URL: 'http://localhost:3001',
});

// Global test configuration
(global as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});