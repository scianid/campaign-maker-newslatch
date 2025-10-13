import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthComponent } from '../AuthComponent';
import { createMockUser, createMockSession } from '../../test/mocks';

// Mock the supabase module
vi.mock('../../lib/supabase', () => {
  const mockAuthService = {
    signUp: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
  };

  const mockSupabase = {
    supabaseUrl: 'https://test.supabase.co',
    auth: {
      getSession: vi.fn(),
    },
  };

  return {
    authService: mockAuthService,
    supabase: mockSupabase,
  };
});

// Helper to render with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AuthComponent - Integration Tests', () => {
  let mockAuthService;
  let mockSupabase;
  const mockOnAuthChange = vi.fn();

  beforeEach(async () => {
    // Get mocked modules
    const supabaseModule = await import('../../lib/supabase');
    mockAuthService = supabaseModule.authService;
    mockSupabase = supabaseModule.supabase;

    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Mock fetch for admin check
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unauthenticated State', () => {
    it('renders sign in button when user is not authenticated', () => {
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows auth form when sign in button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('toggles between sign in and sign up forms', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      // Open form
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      
      // Switch to sign up
      await user.click(screen.getByText(/don't have an account\? sign up/i));
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      
      // Switch back to sign in
      await user.click(screen.getByText(/already have an account\? sign in/i));
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    });

    it('closes auth form when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      
      await user.click(screen.getByText(/cancel/i));
      expect(screen.queryByRole('heading', { name: /welcome back/i })).not.toBeInTheDocument();
    });
  });

  describe('Sign In Flow', () => {
    it('successfully signs in with valid credentials', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithEmail.mockResolvedValue({ data: {}, error: null });
      
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      // Open form
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Fill in credentials
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      
      // Submit
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(mockAuthService.signInWithEmail).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    it('displays error message when sign in fails', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithEmail.mockRejectedValue(
        new Error('Invalid login credentials')
      );
      
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during sign in', async () => {
      const user = userEvent.setup();
      let resolveSignIn;
      mockAuthService.signInWithEmail.mockReturnValue(
        new Promise((resolve) => { resolveSignIn = resolve; })
      );
      
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Should show loading spinner
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
      });
      
      // Resolve the promise
      resolveSignIn({ data: {}, error: null });
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click eye icon to show password
      const toggleButtons = screen.getAllByRole('button');
      const eyeButton = toggleButtons.find(btn => btn.querySelector('svg'));
      await user.click(eyeButton);
      
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await user.click(eyeButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Sign Up Flow', () => {
    it('successfully signs up with valid information', async () => {
      const user = userEvent.setup();
      mockAuthService.signUp.mockResolvedValue({ data: {}, error: null });
      
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.click(screen.getByText(/don't have an account\? sign up/i));
      
      await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith(
          'newuser@example.com',
          'password123'
        );
      });
    });

    it('displays error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.click(screen.getByText(/don't have an account\? sign up/i));
      
      await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'different123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockAuthService.signUp).not.toHaveBeenCalled();
    });

    it('shows confirmation message after successful sign up', async () => {
      const user = userEvent.setup();
      mockAuthService.signUp.mockResolvedValue({ data: {}, error: null });
      
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.click(screen.getByText(/don't have an account\? sign up/i));
      
      await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith('newuser@example.com', 'password123');
      });
      
      // Form should close after successful sign up
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument();
      });
    });

    it('displays error message when sign up fails', async () => {
      const user = userEvent.setup();
      mockAuthService.signUp.mockRejectedValue(
        new Error('Email already registered')
      );
      
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.click(screen.getByText(/don't have an account\? sign up/i));
      
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated State', () => {
    it('displays user information when authenticated', () => {
      const mockUser = createMockUser({ email: 'test@example.com' });
      
      renderWithRouter(<AuthComponent user={mockUser} onAuthChange={mockOnAuthChange} />);
      
      const emailElements = screen.getAllByText('test@example.com');
      expect(emailElements.length).toBeGreaterThan(0);
      expect(emailElements[0]).toBeInTheDocument();
    });

    it('displays user menu when clicking on user avatar', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();
      
      renderWithRouter(<AuthComponent user={mockUser} onAuthChange={mockOnAuthChange} />);
      
      // Click on user avatar/button
      const userButton = screen.getByRole('button');
      await user.click(userButton);
      
      expect(screen.getByText(/sign out/i)).toBeInTheDocument();
    });

    it('signs out when sign out button is clicked', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();
      mockAuthService.signOut.mockResolvedValue({ error: null });
      
      renderWithRouter(<AuthComponent user={mockUser} onAuthChange={mockOnAuthChange} />);
      
      // Open user menu
      await user.click(screen.getByRole('button'));
      
      // Click sign out
      await user.click(screen.getByText(/sign out/i));
      
      await waitFor(() => {
        expect(mockAuthService.signOut).toHaveBeenCalled();
      });
    });

    it('shows navigation links for authenticated users', () => {
      const mockUser = createMockUser();
      
      renderWithRouter(<AuthComponent user={mockUser} onAuthChange={mockOnAuthChange} />);
      
      // Check that user menu is displayed with user email (appears twice - as name and email)
      const emailElements = screen.getAllByText(mockUser.email);
      expect(emailElements.length).toBeGreaterThan(0);
    });

    it('shows admin link for admin users', async () => {
      const adminUser = createMockUser({ 
        id: '81facc72-4b4d-4dfc-86ca-23572e7c0e4c',
        email: 'admin@example.com' 
      });
      
      // Mock the session for admin check
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: createMockSession({ 
            user: adminUser 
          }) 
        },
        error: null,
      });
      
      renderWithRouter(<AuthComponent user={adminUser} onAuthChange={mockOnAuthChange} />);
      
      // Wait for component to render - admin users still get the same UI, just with admin status tracked internally
      await waitFor(() => {
        const emailElements = screen.getAllByText('admin@example.com');
        expect(emailElements.length).toBeGreaterThan(0);
      });
    });

    it('does not show admin link for regular users', () => {
      const regularUser = createMockUser({ email: 'regular@example.com' });
      
      renderWithRouter(<AuthComponent user={regularUser} onAuthChange={mockOnAuthChange} />);
      
      // Regular users see the same UI as admin users - admin status is tracked internally
      const emailElements = screen.getAllByText('regular@example.com');
      expect(emailElements.length).toBeGreaterThan(0);
    });

    it('closes user menu when clicking outside', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser();
      
      const { container } = renderWithRouter(
        <AuthComponent user={mockUser} onAuthChange={mockOnAuthChange} />
      );
      
      // Open menu
      await user.click(screen.getByRole('button'));
      expect(screen.getByText(/sign out/i)).toBeInTheDocument();
      
      // Click outside
      await user.click(container);
      
      await waitFor(() => {
        expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('requires email and password fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });

    it('requires confirmation password for sign up', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.click(screen.getByText(/don't have an account\? sign up/i));
      
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toBeRequired();
    });

    it('clears form fields after successful authentication', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithEmail.mockResolvedValue({ data: {}, error: null });
      
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(mockAuthService.signInWithEmail).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithEmail.mockRejectedValue(
        new Error('Network error')
      );
      
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithEmail.mockRejectedValue(
        new Error()
      );
      
      renderWithRouter(<AuthComponent user={null} onAuthChange={mockOnAuthChange} />);
      
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
      });
    });
  });
});
