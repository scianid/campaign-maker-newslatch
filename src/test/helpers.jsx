import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Render component with router
export const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

// Mock navigate function from react-router-dom
export const mockNavigate = vi.fn();

// Mock useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wait for async updates
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Create mock file for file input testing
export const createMockFile = (name = 'test.jpg', size = 1024, type = 'image/jpeg') => {
  const blob = new Blob(['test'], { type });
  blob.lastModifiedDate = new Date();
  blob.name = name;
  return blob;
};

// Mock fetch for API testing
export const mockFetch = (data, options = {}) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: options.ok !== false,
    status: options.status || 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    ...options,
  });
};

// Reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
};
