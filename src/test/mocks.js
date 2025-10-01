import { vi } from 'vitest';

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockClient = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return mockClient;
};

// Mock session for authenticated user
export const createMockSession = (overrides = {}) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: {
    id: 'mock-user-id',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides.user,
  },
  ...overrides,
});

// Mock user
export const createMockUser = (overrides = {}) => ({
  id: 'mock-user-id',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  ...overrides,
});

// Mock campaign data
export const createMockCampaign = (overrides = {}) => ({
  id: 'mock-campaign-id',
  user_id: 'mock-user-id',
  name: 'Test Campaign',
  url: 'https://example.com',
  tags: ['test', 'campaign'],
  description: 'Test campaign description',
  rss_categories: ['news', 'technology'],
  rss_countries: ['US'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Mock AI generated item
export const createMockAiItem = (overrides = {}) => ({
  id: 'mock-ai-item-id',
  campaign_id: 'mock-campaign-id',
  headline: 'Test Headline',
  clickbait: 'You Won\'t Believe This!',
  link: 'https://example.com/article',
  relevance_score: 85,
  trend: 'Breaking news in technology',
  description: 'Test article description',
  tooltip: 'Additional context',
  ad_placement: null,
  is_published: false,
  ttl: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  image_url: 'https://example.com/image.jpg',
  tags: ['test', 'ai'],
  ...overrides,
});

// Mock landing page
export const createMockLandingPage = (overrides = {}) => ({
  id: 'mock-landing-page-id',
  ai_generated_item_id: 'mock-ai-item-id',
  title: 'Test Landing Page',
  sections: [
    {
      subtitle: 'Section 1',
      paragraphs: ['Paragraph 1', 'Paragraph 2'],
      cta: 'Learn More',
      image_url: 'https://example.com/section1.jpg',
      widget_type: null,
    },
  ],
  slug: 'test-landing-page',
  is_active: true,
  view_count: 0,
  sticky_cta_title: 'Ready to Take Action?',
  sticky_cta_subtitle: 'Click to visit the site and learn more',
  sticky_cta_button: 'Visit Site →',
  sticky_cta_visible: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Mock RSS feed
export const createMockRssFeed = (overrides = {}) => ({
  id: 'mock-feed-id',
  name: 'Test Feed',
  url: 'https://example.com/rss',
  categories: ['news'],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});
