# Testing Strategy for Campaign Maker NewLatch

## Overview
This document outlines the comprehensive testing strategy for the Campaign Maker NewLatch application, covering all main user flows, components, and integrations.

## Testing Goals
1. Ensure all critical user flows work end-to-end
2. Verify component rendering and interactions
3. Validate data persistence and API integrations
4. Confirm authentication and authorization work correctly
5. Test edge cases and error handling

---

## Testing Stages

### Stage 1: Unit Testing - Core Components
**Objective**: Test individual components in isolation

#### Components to Test:
1. **UI Components** (`src/ui/`)
   - Button
   - Input
   - Textarea
   - Select
   - Toggle
   - Badge
   - MultiSelect
   - LoadingModal

2. **Utility Functions** (`src/utils/`)
   - `cn()` - className utility

#### Test Coverage:
- Component rendering
- Props handling
- Event handlers
- Edge cases (empty states, long text, etc.)

---

### Stage 2: Integration Testing - Feature Components
**Objective**: Test feature components with their dependencies

#### Components to Test:
1. **Authentication Flow** (`AuthComponent.jsx`)
   - Sign up functionality
   - Sign in functionality
   - Sign out functionality
   - Error handling
   - Session persistence

2. **Campaign Management** (`CampaignList.jsx`, `CampaignForm.jsx`, `EditCampaignForm.jsx`)
   - Create new campaign
   - List campaigns
   - Edit campaign
   - Delete campaign
   - Form validation
   - Data persistence

3. **AI Content Generation** (`AiContentPage.jsx`, `AiContentViewer.jsx`)
   - Generate AI content for campaigns
   - View AI content list
   - Publish/unpublish content
   - Filter and search functionality
   - Tag management

4. **Landing Page Editor** (`EditLandingPage.jsx`)
   - Load landing page data
   - Edit title inline
   - Edit sections (subtitle, paragraphs, CTA)
   - Add/delete sections
   - Add/delete paragraphs
   - Widget management (8 widget types)
   - Image generation/regeneration
   - Sticky CTA customization (title, subtitle, button, visibility)
   - Auto-save functionality
   - Delete confirmation modals

5. **Landing Pages List** (`LandingPagesPage.jsx`)
   - List all landing pages
   - View public landing page
   - Navigate to editor
   - Delete landing page
   - Pagination
   - Search/filter

6. **Public Landing Page Viewer** (`PublicLandingPageViewer.jsx`)
   - Load page by slug
   - Render sections with widgets
   - Display images
   - CTA button functionality
   - Sticky CTA bar (show/hide based on settings)
   - Widget rendering (8 types)
   - Disclaimers footer
   - Meta tags and SEO

7. **Admin Pages** (`AdminPage.jsx`)
   - User management
   - RSS feed management
   - System monitoring

---

### Stage 3: End-to-End Testing - Critical User Flows
**Objective**: Test complete user journeys from start to finish

#### Critical User Flows:

**Flow 1: New User Onboarding → Campaign Creation**
1. User signs up
2. User creates first campaign
3. User configures RSS categories
4. Campaign is saved to database

**Flow 2: AI Content Generation → Publishing**
1. User selects campaign
2. User generates AI content
3. AI content appears in list
4. User reviews and publishes content
5. Content marked as published

**Flow 3: Landing Page Creation → Customization → Publishing**
1. User navigates to AI content
2. User generates landing page
3. Landing page editor opens
4. User edits title, sections, and content
5. User adds/removes widgets
6. User generates/regenerates images
7. User customizes sticky CTA
8. Changes auto-save
9. User previews public page
10. Public page renders correctly with all customizations

**Flow 4: Landing Page Widget Management**
1. User opens landing page editor
2. User selects widget from dropdown
3. Widget preview appears in Section Widget frame
4. Widget displays on public page
5. User changes widget type
6. Widget updates on public page
7. User deletes widget
8. Widget removed from public page

**Flow 5: Sticky CTA Customization**
1. User opens landing page editor
2. User edits sticky CTA title
3. User edits sticky CTA subtitle
4. User edits sticky CTA button text
5. Changes auto-save
6. User hides sticky CTA
7. "Show Sticky CTA" button appears
8. User shows sticky CTA again
9. Public page reflects all changes

**Flow 6: Landing Page Deletion**
1. User views landing pages list
2. User clicks delete on a page
3. Confirmation modal appears
4. User confirms deletion
5. Page removed from database
6. Associated images cleaned up

**Flow 7: Public Landing Page Viewing**
1. Visitor accesses landing page by slug
2. Page loads with correct content
3. Widgets render at top of sections
4. Images display correctly
5. CTA buttons are clickable
6. Sticky CTA bar visible (if enabled)
7. Disclaimers display in footer
8. Click CTA → Opens campaign URL in new tab

---

### Stage 4: API and Database Testing
**Objective**: Test backend integrations and data persistence

#### APIs to Test:

**Supabase Edge Functions:**
1. `generate-landing-page` - Landing page generation from AI content
2. `generate-landing-page-image` - Image generation with DALL-E
3. `ai-content` - AI content generation from RSS feeds
4. `ai-generate` - General AI generation
5. `rss-feeds` - RSS feed management
6. `admin-users` - User management
7. `delete-landing-page-images` - Image cleanup
8. `public-landing-page` - Public page serving

#### Database Operations:
1. **Campaigns Table**
   - CRUD operations
   - User ownership validation
   - RLS policies

2. **AI Generated Items Table**
   - Content creation
   - Publishing status
   - Tags and metadata

3. **Landing Pages Table**
   - Page creation with sections
   - Widget data persistence
   - Sticky CTA fields (title, subtitle, button, visibility)
   - Image URLs storage
   - Slug generation and uniqueness

4. **User Profiles**
   - Admin flag management
   - Profile updates

---

### Stage 5: Performance and Load Testing
**Objective**: Ensure application performs well under load

#### Tests:
1. Landing page load time (target: <2s)
2. Image generation time (target: <30s)
3. AI content generation time (target: <15s)
4. Database query performance
5. Concurrent user handling
6. Large dataset rendering (100+ landing pages)

---

### Stage 6: Security Testing
**Objective**: Verify security measures are in place

#### Tests:
1. **Authentication**
   - Unauthenticated access blocked
   - Session management
   - Token expiration

2. **Authorization**
   - Row-level security (RLS) policies
   - User can only access own data
   - Admin-only routes protected

3. **Input Validation**
   - SQL injection prevention
   - XSS prevention
   - CSRF protection

4. **API Security**
   - API key protection
   - Rate limiting
   - CORS configuration

---

### Stage 7: Cross-Browser and Responsive Testing
**Objective**: Ensure compatibility across devices and browsers

#### Browsers to Test:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

#### Devices to Test:
- Desktop (1920x1080, 1366x768)
- Tablet (iPad, Android tablet)
- Mobile (iPhone, Android phone)

#### Features to Test:
1. Landing page editor responsiveness
2. Sticky CTA on mobile
3. Widget display on small screens
4. Touch interactions
5. Modal dialogs on mobile

---

## Testing Tools and Framework

### Recommended Stack:
1. **Unit/Integration Testing**: Vitest + React Testing Library
2. **E2E Testing**: Playwright or Cypress
3. **API Testing**: Supertest or built-in fetch
4. **Mocking**: MSW (Mock Service Worker)
5. **Coverage**: Vitest coverage reports

### Test File Structure:
```
src/
  components/
    __tests__/
      AuthComponent.test.jsx
      CampaignForm.test.jsx
      EditLandingPage.test.jsx
      PublicLandingPageViewer.test.jsx
      ...
  ui/
    __tests__/
      Button.test.jsx
      Input.test.jsx
      ...
  utils/
    __tests__/
      cn.test.js
e2e/
  auth.spec.js
  campaign-flow.spec.js
  landing-page-flow.spec.js
  public-viewer.spec.js
  ...
```

---

## Test Data Strategy

### Test Data Requirements:
1. **Test Users**
   - Regular user account
   - Admin user account
   - User with existing campaigns

2. **Test Campaigns**
   - Campaign with AI content
   - Campaign without AI content
   - Campaign with multiple landing pages

3. **Test Landing Pages**
   - Page with all widget types
   - Page with images
   - Page without sticky CTA
   - Page with custom CTA text

4. **Mock Data**
   - RSS feed responses
   - OpenAI API responses
   - DALL-E image generation responses

---

## Success Criteria

### Stage Completion:
Each stage is complete when:
- ✅ All tests pass
- ✅ Code coverage >80% for that stage
- ✅ No critical bugs found
- ✅ Performance targets met

### Overall Success:
- ✅ All critical user flows tested
- ✅ Overall code coverage >75%
- ✅ Zero high-severity bugs
- ✅ All security tests pass
- ✅ Cross-browser compatibility verified

---

## Implementation Phases

### Phase 1 (Week 1): Setup & Unit Tests
- Set up testing framework (Vitest + RTL)
- Write unit tests for UI components
- Write unit tests for utilities
- Achieve >90% coverage for UI layer

### Phase 2 (Week 2): Integration Tests
- Test authentication flow
- Test campaign management
- Test AI content generation
- Achieve >80% coverage for feature components

### Phase 3 (Week 3): E2E Tests - Core Flows
- Test user onboarding flow
- Test campaign creation flow
- Test landing page creation flow
- Test widget management flow

### Phase 4 (Week 4): E2E Tests - Advanced Flows
- Test sticky CTA customization
- Test public landing page viewing
- Test deletion flows
- Test admin features

### Phase 5 (Week 5): API & Database Tests
- Test all Edge Functions
- Test database operations
- Test RLS policies
- Test data persistence

### Phase 6 (Week 6): Performance & Security
- Run performance tests
- Run security audit
- Fix any critical issues
- Document findings

### Phase 7 (Week 7): Cross-Browser & Polish
- Test all browsers
- Test all devices
- Fix compatibility issues
- Final QA pass

---

## Maintenance and Regression Testing

### Ongoing Testing:
- Run unit/integration tests on every commit
- Run E2E tests before each deployment
- Monthly security audits
- Quarterly performance reviews

### Regression Testing:
- Maintain test suite for all features
- Add tests for every bug fix
- Update tests when features change
- Track test coverage over time

---

## Notes and Considerations

### Known Challenges:
1. **Image Generation Testing**: DALL-E API calls are expensive and slow
   - Solution: Mock image generation in tests, use placeholder images

2. **AI Content Testing**: OpenAI API calls have rate limits
   - Solution: Mock AI responses with realistic data

3. **Database State**: Tests need isolated database state
   - Solution: Use test database with cleanup after each test

4. **Async Operations**: Many operations are asynchronous
   - Solution: Use proper async/await patterns in tests

### Future Enhancements:
- Add visual regression testing (Percy, Chromatic)
- Implement accessibility testing (axe-core)
- Add performance monitoring (Lighthouse CI)
- Set up continuous testing pipeline (GitHub Actions)
