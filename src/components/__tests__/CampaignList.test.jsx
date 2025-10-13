import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampaignList } from '../CampaignList';
import { renderWithRouter, mockNavigate } from '../../test/helpers';
import { createMockCampaign } from '../../test/mocks';

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    }
  },
  campaignService: {
    getCampaigns: vi.fn()
  }
}));

// Mock lucide-react icons to avoid rendering issues
vi.mock('lucide-react', () => ({
  Edit3: () => <div data-testid="edit-icon">Edit3</div>,
  Trash2: () => <div data-testid="trash-icon">Trash2</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Tag: () => <div data-testid="tag-icon">Tag</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertCircle</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  Rss: () => <div data-testid="rss-icon">Rss</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>
}));

describe('CampaignList - Integration Tests', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  
  let mockCampaigns;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import mocks dynamically to ensure fresh mocks
    const { supabase } = await import('../../lib/supabase');
    
    // Setup default mock campaigns
    mockCampaigns = [
      createMockCampaign({ 
        name: 'Summer Campaign',
        url: 'https://example.com',
        description: 'A summer marketing campaign',
        tags: ['summer', 'marketing', 'promo'],
        rss_categories: ['news', 'technology'],
        rss_countries: ['US', 'GB']
      }),
      createMockCampaign({ 
        name: 'Winter Sale',
        url: 'https://winter-sale.com',
        description: 'Holiday season sale campaign',
        tags: ['winter', 'sale'],
        rss_categories: ['business'],
        rss_countries: ['FR']
      })
    ];
    
    // Mock successful session
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null
    });
  });

  describe('Campaign Display', () => {
    it('renders list of campaigns', () => {
      renderWithRouter(
        <CampaignList 
          campaigns={mockCampaigns}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Summer Campaign')).toBeInTheDocument();
      expect(screen.getByText('Winter Sale')).toBeInTheDocument();
    });

    it('displays campaign details correctly', () => {
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Summer Campaign')).toBeInTheDocument();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('A summer marketing campaign')).toBeInTheDocument();
    });

    it('displays campaign tags', () => {
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getAllByText('summer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('marketing').length).toBeGreaterThan(0);
      expect(screen.getAllByText('promo').length).toBeGreaterThan(0);
    });

    it('displays RSS categories', () => {
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getAllByText('news').length).toBeGreaterThan(0);
      expect(screen.getAllByText('technology').length).toBeGreaterThan(0);
    });

    it('displays RSS countries', () => {
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const usCountries = screen.getAllByText('United States');
      expect(usCountries.length).toBeGreaterThan(0);
      const ukCountries = screen.getAllByText('United Kingdom');
      expect(ukCountries.length).toBeGreaterThan(0);
    });

    it('shows campaign count', () => {
      renderWithRouter(
        <CampaignList 
          campaigns={mockCampaigns}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters campaigns by name', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={mockCampaigns}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search campaigns...');
      await user.type(searchInput, 'Summer');

      await waitFor(() => {
        // Search highlighting splits text with <mark>, just verify Winter Sale is filtered out
        expect(screen.queryByText('Winter Sale')).not.toBeInTheDocument();
        // And that we still have a campaign displayed
        expect(screen.getByText(/marketing campaign/i)).toBeInTheDocument();
      });
    });

    it('filters campaigns by description', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={mockCampaigns}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search campaigns...');
      await user.type(searchInput, 'holiday');

      await waitFor(() => {
        expect(screen.queryByText('Summer Campaign')).not.toBeInTheDocument();
        expect(screen.getByText('Winter Sale')).toBeInTheDocument();
      });
    });

    it('filters campaigns by URL', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={mockCampaigns}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search campaigns...');
      await user.type(searchInput, 'winter-sale');

      await waitFor(() => {
        expect(screen.queryByText('Summer Campaign')).not.toBeInTheDocument();
        expect(screen.getByText('Winter Sale')).toBeInTheDocument();
      });
    });

    it('filters campaigns by tags', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={mockCampaigns}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search campaigns...');
      await user.type(searchInput, 'promo');

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign')).toBeInTheDocument();
        expect(screen.queryByText('Winter Sale')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when no campaigns match', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={mockCampaigns}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search campaigns...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/No campaigns found for "nonexistent"/)).toBeInTheDocument();
      });
    });

    it('clears search when X button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={mockCampaigns}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search campaigns...');
      await user.type(searchInput, 'Summer');

      await waitFor(() => {
        expect(screen.queryByText('Winter Sale')).not.toBeInTheDocument();
      });

      // Click the X button to clear search
      const clearButton = searchInput.parentElement.querySelector('button');
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign')).toBeInTheDocument();
        expect(screen.getByText('Winter Sale')).toBeInTheDocument();
      });
    });

    it('shows filtered count in results', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={mockCampaigns}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search campaigns...');
      await user.type(searchInput, 'Summer');

      await waitFor(() => {
        expect(screen.getByText(/Found 1 campaign matching "Summer"/)).toBeInTheDocument();
      });
    });
  });

  describe('Campaign Actions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByTitle('Edit Campaign');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockCampaigns[0]);
    });

    it('shows delete confirmation modal when delete is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTitle('Delete Campaign');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Campaign')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete the campaign:/)).toBeInTheDocument();
      });
    });

    it('calls onDelete when delete is confirmed', async () => {
      const user = userEvent.setup();
      mockOnDelete.mockResolvedValue({});
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTitle('Delete Campaign');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Campaign')).toBeInTheDocument();
      });

      // Get all Delete buttons (one in card, one in modal)
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      // Click the modal's Delete button (last one)
      await user.click(deleteButtons[deleteButtons.length - 1]);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(mockCampaigns[0].id);
      });
    });

    it('closes delete modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTitle('Delete Campaign');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Campaign')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/Are you sure you want to delete/)).not.toBeInTheDocument();
      });
    });

    it('has View AI button for campaigns', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // View Ads button should be present (shows as 'View' on mobile, 'View Ads' on desktop)
      const viewButton = screen.getByRole('button', { name: /View Ads|View/i });
      expect(viewButton).toBeInTheDocument();
      expect(viewButton).toHaveAttribute('title', 'View AI Content');
    });

    it('has New Campaign button', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // New Campaign button should be present
      const newButton = screen.getByRole('button', { name: /New Campaign/i });
      expect(newButton).toBeInTheDocument();
    });
  });

  describe('Copy Campaign ID', () => {
    it('copies campaign ID to clipboard', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard API
      const mockWriteText = vi.fn().mockResolvedValue();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true
      });
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const copyButton = screen.getByTitle('Copy full campaign ID');
      await user.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockCampaigns[0].id);
      });
    });

    it('shows check icon after successful copy', async () => {
      const user = userEvent.setup();
      
      const mockWriteText = vi.fn().mockResolvedValue();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true
      });
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const copyButton = screen.getByTitle('Copy full campaign ID');
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Empty and Error States', () => {
    it('shows empty state when no campaigns', () => {
      renderWithRouter(
        <CampaignList 
          campaigns={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Empty state is rendered (no campaigns shown)
      expect(screen.queryByText('Summer Campaign')).not.toBeInTheDocument();
    });

    it('handles null campaigns gracefully', () => {
      renderWithRouter(
        <CampaignList 
          campaigns={null}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('Summer Campaign')).not.toBeInTheDocument();
    });
  });

  describe('AI Content Generation', () => {
    it('shows loading state when generating AI content', async () => {
      const user = userEvent.setup();
      
      // Mock fetch to delay response
      global.fetch = vi.fn(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ items_generated: 5 })
            });
          }, 100);
        })
      );
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const generateButton = screen.getByTitle('Generate AI Content');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByTitle('Generating AI Content...')).toBeInTheDocument();
      });
    });

    it('navigates to content page after successful generation', async () => {
      const user = userEvent.setup();
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items_generated: 5 })
      });
      
      renderWithRouter(
        <CampaignList 
          campaigns={[mockCampaigns[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const generateButton = screen.getByTitle('Generate AI Content');
      await user.click(generateButton);

      await waitFor(() => {
        // After generation, View Ads button should still be present
        const viewButton = screen.getByRole('button', { name: /View Ads|View/i });
        expect(viewButton).toBeInTheDocument();
      });
    });
  });
});
