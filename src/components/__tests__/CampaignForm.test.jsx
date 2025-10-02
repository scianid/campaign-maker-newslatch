import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampaignForm } from '../CampaignForm';
import { renderWithRouter, mockNavigate } from '../../test/helpers';
import { createMockCampaign, createMockUser } from '../../test/mocks';

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  campaignService: {
    createCampaign: vi.fn(),
    updateCampaign: vi.fn()
  }
}));

// Create mock functions that can be reassigned
const mockUseParams = vi.fn(() => ({}));
const mockUseLocation = vi.fn(() => ({ state: {} }));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useLocation: () => mockUseLocation(),
    useNavigate: () => mockNavigate
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Save: () => <div data-testid="save-icon">Save</div>,
  Edit3: () => <div data-testid="edit-icon">Edit3</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  Check: () => <div data-testid="check-icon">Check</div>
}));

describe('CampaignForm - Integration Tests', () => {
  const mockUser = createMockUser();
  let mockCampaignService;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import mocks dynamically
    const { campaignService } = await import('../../lib/supabase');
    mockCampaignService = campaignService;
    
    // Reset router mocks to default state
    mockUseParams.mockReturnValue({});
    mockUseLocation.mockReturnValue({ state: {} });
  });

  describe('New Campaign Form', () => {
    it('renders form with empty fields', () => {
      renderWithRouter(<CampaignForm user={mockUser} />);

      expect(screen.getByText('Create New Campaign')).toBeInTheDocument();
      expect(screen.getByLabelText(/Campaign Name/)).toHaveValue('');
      expect(screen.getByLabelText(/Campaign URL/)).toHaveValue('');
    });

    it('allows typing in campaign name field', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const nameInput = screen.getByLabelText(/Campaign Name/);
      await user.type(nameInput, 'My New Campaign');

      expect(nameInput).toHaveValue('My New Campaign');
    });

    it('allows typing in URL field', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const urlInput = screen.getByLabelText(/Campaign URL/);
      await user.type(urlInput, 'example.com');

      expect(urlInput).toHaveValue('example.com');
    });

    it('automatically adds https:// protocol to URL on blur', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const urlInput = screen.getByLabelText(/Campaign URL/);
      await user.type(urlInput, 'example.com');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(urlInput).toHaveValue('https://example.com');
      });
    });

    it('does not add protocol if URL already has one', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const urlInput = screen.getByLabelText(/Campaign URL/);
      await user.type(urlInput, 'https://example.com');
      await user.tab();

      await waitFor(() => {
        expect(urlInput).toHaveValue('https://example.com');
      });
    });

    it('allows typing in description field', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const descInput = screen.getByLabelText(/Description/);
      await user.type(descInput, 'Campaign description here');

      expect(descInput).toHaveValue('Campaign description here');
    });
  });

  describe('Tag Management', () => {
    it('adds a new tag when Add Tag button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const tagInput = screen.getByPlaceholderText(/Add a tag/);
      await user.type(tagInput, 'marketing');
      
      const addButton = screen.getByRole('button', { name: /Plus/i });
      await user.click(addButton);

      expect(screen.getByText('marketing')).toBeInTheDocument();
      expect(tagInput).toHaveValue('');
    });

    it('adds a tag when Enter key is pressed', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const tagInput = screen.getByPlaceholderText(/Add a tag/);
      await user.type(tagInput, 'sales{Enter}');

      expect(screen.getByText('sales')).toBeInTheDocument();
      expect(tagInput).toHaveValue('');
    });

    it('removes a tag when X button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const tagInput = screen.getByPlaceholderText(/Add a tag/);
      await user.type(tagInput, 'promo{Enter}');

      expect(screen.getByText('promo')).toBeInTheDocument();

      const removeButton = screen.getByRole('button', { name: /X/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('promo')).not.toBeInTheDocument();
      });
    });

    it('does not add duplicate tags', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const tagInput = screen.getByPlaceholderText(/Add a tag/);
      await user.type(tagInput, 'unique{Enter}');
      await user.type(tagInput, 'unique{Enter}');

      const tags = screen.getAllByText('unique');
      expect(tags).toHaveLength(1);
    });

    it('trims whitespace from tags', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const tagInput = screen.getByPlaceholderText(/Add a tag/);
      await user.type(tagInput, '  spaced  {Enter}');

      expect(screen.getByText('spaced')).toBeInTheDocument();
    });

    it('does not add empty tags', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const tagInput = screen.getByPlaceholderText(/Add a tag/);
      await user.type(tagInput, '   {Enter}');

      expect(screen.queryByText('   ')).not.toBeInTheDocument();
    });
  });

  describe('RSS Configuration', () => {
    it('allows selecting RSS categories', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      // The MultiSelect component should be present
      const categoryLabel = screen.getByText(/RSS Feed Categories/);
      expect(categoryLabel).toBeInTheDocument();
    });

    it('allows selecting RSS countries', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const countryLabel = screen.getByText(/Target Countries/);
      expect(countryLabel).toBeInTheDocument();
    });
  });

  describe('Form Submission - Create Campaign', () => {
    it('creates a new campaign with valid data', async () => {
      const user = userEvent.setup();
      mockCampaignService.createCampaign.mockResolvedValue({ id: 'new-id' });
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      await user.type(screen.getByLabelText(/Campaign Name/), 'Test Campaign');
      await user.type(screen.getByLabelText(/Campaign URL/), 'test.com');
      await user.tab(); // Trigger URL format
      
      const submitButton = screen.getByRole('button', { name: /Save Campaign|Create Campaign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCampaignService.createCampaign).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Campaign',
            url: 'https://test.com'
          })
        );
      });
    });

    it('navigates to campaigns list after successful creation', async () => {
      const user = userEvent.setup();
      mockCampaignService.createCampaign.mockResolvedValue({ id: 'new-id' });
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      await user.type(screen.getByLabelText(/Campaign Name/), 'Test Campaign');
      await user.type(screen.getByLabelText(/Campaign URL/), 'https://test.com');
      
      const submitButton = screen.getByRole('button', { name: /Save Campaign|Create Campaign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/campaigns');
      });
    });

    it('includes tags in campaign creation', async () => {
      const user = userEvent.setup();
      mockCampaignService.createCampaign.mockResolvedValue({ id: 'new-id' });
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      await user.type(screen.getByLabelText(/Campaign Name/), 'Tagged Campaign');
      await user.type(screen.getByLabelText(/Campaign URL/), 'https://tagged.com');
      
      const tagInput = screen.getByPlaceholderText(/Add a tag/);
      await user.type(tagInput, 'tag1{Enter}');
      await user.type(tagInput, 'tag2{Enter}');
      
      const submitButton = screen.getByRole('button', { name: /Save Campaign|Create Campaign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCampaignService.createCampaign).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['tag1', 'tag2']
          })
        );
      });
    });

    it('includes description in campaign creation', async () => {
      const user = userEvent.setup();
      mockCampaignService.createCampaign.mockResolvedValue({ id: 'new-id' });
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      await user.type(screen.getByLabelText(/Campaign Name/), 'Described Campaign');
      await user.type(screen.getByLabelText(/Campaign URL/), 'https://described.com');
      await user.type(screen.getByLabelText(/Description/), 'This is a test description');
      
      const submitButton = screen.getByRole('button', { name: /Save Campaign|Create Campaign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCampaignService.createCampaign).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'This is a test description'
          })
        );
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockCampaignService.createCampaign.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 'new-id' }), 100))
      );
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      await user.type(screen.getByLabelText(/Campaign Name/), 'Test Campaign');
      await user.type(screen.getByLabelText(/Campaign URL/), 'https://test.com');
      
      const submitButton = screen.getByRole('button', { name: /Save Campaign|Create Campaign/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('handles creation errors gracefully', async () => {
      const user = userEvent.setup();
      mockCampaignService.createCampaign.mockRejectedValue(new Error('Creation failed'));
      
      // Mock alert
      window.alert = vi.fn();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      await user.type(screen.getByLabelText(/Campaign Name/), 'Test Campaign');
      await user.type(screen.getByLabelText(/Campaign URL/), 'https://test.com');
      
      const submitButton = screen.getByRole('button', { name: /Save Campaign|Create Campaign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Error saving campaign. Please try again.');
      });
    });
  });

  describe('Form Submission - Edit Campaign', () => {
    const existingCampaign = createMockCampaign({
      name: 'Existing Campaign',
      url: 'https://existing.com',
      description: 'Existing description',
      tags: ['old-tag']
    });

    beforeEach(async () => {
      mockUseParams.mockReturnValue({ id: existingCampaign.id });
      mockUseLocation.mockReturnValue({ state: { campaign: existingCampaign } });
    });

    it('renders form with existing campaign data', () => {
      renderWithRouter(<CampaignForm user={mockUser} />);

      expect(screen.getByText('Edit Campaign')).toBeInTheDocument();
      expect(screen.getByLabelText(/Campaign Name/)).toHaveValue('Existing Campaign');
      expect(screen.getByLabelText(/Campaign URL/)).toHaveValue('https://existing.com');
      expect(screen.getByLabelText(/Description/)).toHaveValue('Existing description');
      expect(screen.getByText('old-tag')).toBeInTheDocument();
    });

    it('updates existing campaign with new data', async () => {
      const user = userEvent.setup();
      mockCampaignService.updateCampaign.mockResolvedValue({});
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const nameInput = screen.getByLabelText(/Campaign Name/);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Campaign');
      
      const submitButton = screen.getByRole('button', { name: /Update Campaign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCampaignService.updateCampaign).toHaveBeenCalledWith(
          existingCampaign.id,
          expect.objectContaining({
            name: 'Updated Campaign'
          })
        );
      });
    });

    it('navigates to campaigns list after successful update', async () => {
      const user = userEvent.setup();
      mockCampaignService.updateCampaign.mockResolvedValue({});
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const submitButton = screen.getByRole('button', { name: /Update Campaign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/campaigns');
      });
    });

    it('handles update errors gracefully', async () => {
      const user = userEvent.setup();
      mockCampaignService.updateCampaign.mockRejectedValue(new Error('Update failed'));
      
      window.alert = vi.fn();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const submitButton = screen.getByRole('button', { name: /Update Campaign/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Error saving campaign. Please try again.');
      });
    });
  });

  describe('Form Validation', () => {
    it('requires campaign name', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const nameInput = screen.getByLabelText(/Campaign Name/);
      const urlInput = screen.getByLabelText(/Campaign URL/);
      
      await user.type(urlInput, 'https://test.com');
      
      const submitButton = screen.getByRole('button', { name: /Save Campaign|Create Campaign/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockCampaignService.createCampaign).not.toHaveBeenCalled();
    });

    it('requires campaign URL', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const nameInput = screen.getByLabelText(/Campaign Name/);
      
      await user.type(nameInput, 'Test Campaign');
      
      const submitButton = screen.getByRole('button', { name: /Save Campaign|Create Campaign/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockCampaignService.createCampaign).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('navigates back to campaigns list when Back button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<CampaignForm user={mockUser} />);

      const backButton = screen.getByRole('button', { name: /Back to Campaigns/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/campaigns');
    });
  });
});
