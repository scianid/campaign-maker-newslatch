# AI Paragraph Generation Feature

## Overview
Added the ability to generate paragraphs with AI assistance in the Landing Page Editor (`/pages/edit/PAGE_UUID`).

## How It Works

### User Flow
1. **Navigate to Edit Page**: Go to `/pages/edit/PAGE_UUID`
2. **Click "Add Paragraph"**: A dropdown menu appears with two options:
   - ✏️ **Manual**: Adds a textbox for manual text entry
   - ✨ **AI Generate**: Opens AI generation wizard

### AI Generation Process

#### Step 1: Choose Content Type
Select from 10 specialized content types optimized for sales/advertising landing pages:

1. **Product Description** - Highlight features and benefits persuasively
2. **Problem & Solution** - Define a problem and how you solve it
3. **Social Proof** - Build credibility with testimonials and stats
4. **Urgency & Scarcity** - Create sense of limited time or availability
5. **Benefits & Transformation** - Focus on outcomes and transformations
6. **Story Telling** - Connect emotionally through relatable stories
7. **Comparison** - Compare with alternatives or current situation
8. **How It Works** - Explain the process or mechanism
9. **Objection Handling** - Address common concerns or doubts
10. **Value Proposition** - Emphasize ROI and value proposition

#### Step 2: Enter Your Prompt
- Describe specifically what you want the AI to write
- The AI receives full context:
  - Landing page title
  - Campaign name and description
  - Product/service URL
  - All existing content on the page
- Example prompt: *"Write about how our product helps busy professionals save time and increase productivity..."*

#### Step 3: Generation
- AI generates a compelling 3-5 sentence paragraph
- Uses GPT-4o-mini for fast, quality results
- Automatically adds the paragraph to the section
- Can be edited like any other paragraph after generation

## Technical Implementation

### New Files Created
- **`supabase/functions/generate-paragraph/index.ts`** - Edge function for AI paragraph generation

### Modified Files
- **`src/components/EditLandingPage.jsx`**
  - Added dropdown menu for "Add Paragraph" button
  - Added two-step modal for AI generation
  - Added `generateParagraphWithAI()` function
  - Added 10 content type definitions with descriptions
  - Added click-outside handler for dropdown

### API Endpoint
- **POST** `/functions/v1/generate-paragraph`
- **Body**: 
  ```json
  {
    "landingPageId": "uuid",
    "prompt": "user's specific request",
    "contentType": "product-description",
    "context": "full page context"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "paragraph": "Generated paragraph text...",
    "contentType": "product-description"
  }
  ```

### AI System Prompts
The edge function uses specialized prompts to ensure high-quality, conversion-focused content:

**System Prompt Guidelines:**
- Expert copywriter specializing in high-converting sales content
- Clear, persuasive, and engaging style
- Focus on benefits, not just features
- Use emotional triggers and power words
- Keep paragraphs concise (3-5 sentences)
- Professional yet conversational tone
- Avoid generic or clichéd phrases

**User Prompt Structure:**
- Content type instruction (e.g., "Write a compelling product description...")
- User's specific request
- Full landing page context
- Instruction to return only the paragraph text

## Content Type Use Cases

### Product Description
**Best for**: Main sections introducing your product/service
**Example**: "Introducing TimeTracker Pro, the revolutionary time management tool that helps busy professionals reclaim up to 10 hours per week. With intelligent automation and intuitive design, you'll effortlessly track projects, optimize your schedule, and finally achieve that work-life balance you've been dreaming of."

### Problem & Solution
**Best for**: Opening sections or sections before CTAs
**Example**: "Tired of juggling multiple apps just to manage your day? Most professionals waste 2-3 hours weekly switching between calendars, task managers, and time trackers. TimeTracker Pro eliminates this chaos by combining everything into one seamless platform."

### Social Proof
**Best for**: Mid-page credibility builders
**Example**: "Join over 50,000 professionals who have already transformed their productivity with TimeTracker Pro. Our platform maintains a 4.9/5 star rating across all review platforms, and 94% of users report saving at least 5 hours per week within their first month."

### Urgency & Scarcity
**Best for**: Near CTA sections
**Example**: "Our exclusive launch pricing ends in 72 hours, and we're limiting new signups to just 500 spots to ensure quality onboarding for each user. Don't miss your chance to lock in 40% off our annual plan before prices return to normal."

### Benefits & Transformation
**Best for**: Feature sections or transformation stories
**Example**: "Imagine starting your day with crystal-clear priorities, automatically organized by AI. Picture yourself leaving work on time, every time, with all your tasks completed. That's the transformation TimeTracker Pro delivers – not just better time management, but a better life."

### Story Telling
**Best for**: Building emotional connection
**Example**: "Sarah, a marketing director and mother of two, used to work until 9 PM most nights. After adopting TimeTracker Pro, she discovered she was spending 30% of her time on low-priority tasks. Within three weeks, she restructured her workflow and now leaves the office by 5:30 PM daily – without sacrificing results."

### Comparison
**Best for**: Addressing "why not competitors" objections
**Example**: "Unlike basic time tracking apps that just log hours, TimeTracker Pro uses AI to analyze your patterns and suggest optimizations. While competitors charge per user, our flat-rate pricing means your entire team can collaborate without breaking the budget. It's not just different – it's designed for modern teams."

### How It Works
**Best for**: Explaining process or methodology
**Example**: "Getting started takes just 60 seconds. Connect your calendar, select your work categories, and our AI immediately begins learning your patterns. As you work, TimeTracker Pro quietly observes, then presents personalized insights every Friday showing exactly where your time went and how to optimize next week."

### Objection Handling
**Best for**: FAQ-style sections or pre-CTA
**Example**: "Worried about the learning curve? TimeTracker Pro requires zero training – it's designed to feel intuitive from day one. Concerned about data privacy? All your information is encrypted and we never share it with third parties. Have a unique workflow? Our platform adapts to any industry or work style."

### Value Proposition
**Best for**: Summary sections or final push before CTA
**Example**: "For just $12 per month – less than two coffees – you're investing in a tool that saves you 10+ hours weekly. That's over 500 hours per year, or more than 12 full work weeks. What would you do with an extra 3 months of productive time? The ROI speaks for itself."

## Tips for Best Results

1. **Be Specific**: The more detailed your prompt, the better the output
2. **Provide Context**: Mention specific benefits, features, or angles you want emphasized
3. **Iterate**: Generate multiple versions by trying different content types with similar prompts
4. **Edit After**: AI provides a strong foundation – polish it to match your exact voice
5. **Mix Types**: Use different content types throughout the page for variety and comprehensive coverage

## Future Enhancements

Potential improvements:
- [ ] Save favorite prompts for reuse
- [ ] "Regenerate" button to try again without re-entering prompt
- [ ] Tone adjustment (professional, casual, urgent, friendly)
- [ ] Length control (short, medium, long)
- [ ] Multiple paragraph generation at once
- [ ] A/B test different versions
- [ ] Integration with page analytics to suggest content types that convert best
