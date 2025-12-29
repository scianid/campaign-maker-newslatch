# Landing Page Redesign Styleguide (Based on Reference Screenshot)

This document translates the provided reference landing page into an implementable styleguide: typography, layout, components, imagery needs, and AI prompts.

---

## 1) Visual Summary

**Overall vibe**: clean fintech/SaaS marketing site, lots of whitespace, rounded cards, soft shadows, and a mint/teal accent.

**Key motifs**
- Rounded rectangles (12–24px radius)
- Light surfaces with subtle shadow
- Single accent color used consistently for CTAs, checkmarks, and brand highlights
- “Explainer” sections built as stacked cards on a centered column

---

## 2) Typography (Font Inspection + Recommendations)

### What the screenshot suggests
The reference uses a modern geometric sans with slightly rounded shapes, strong x-height, and clean numerals. It resembles families like **Poppins / Sora / Manrope / Inter**.

### Recommended mapping for this repo
Your Tailwind config already sets `font-sans: Sora`. Sora is a very close match to the reference look.

**Option A (minimal change):**
- Headings: `Sora` 600–700
- Body/UI: `Sora` 400–500

**Option B (closest “marketing SaaS” feel):**
- Headings: `Sora` 600–700
- Body/UI: `Inter` 400–500

If you want Option B, add Inter via Google Fonts and extend Tailwind with `fontFamily.body`.

### Type scale (desktop)
- H1: 48–56px, 700, tracking -0.02em, line-height 1.05–1.1
- H2: 32–36px, 700, tracking -0.01em, line-height 1.15
- H3: 20–24px, 600–700, line-height 1.2–1.3
- Body: 16–18px, 400–500, line-height 1.6
- Small: 14px, 400–500, line-height 1.4–1.5

### Type scale (mobile)
- H1: 36–40px
- H2: 26–30px
- Body: 16px

---

## 3) Color System

### Core palette (matches the new dark theme screenshot)
Use a **deep navy base** with a **teal/cyan accent**.

**Base / Surfaces**
- `bg`: #070B1D (primary page background)
- `surface`: #0B1225 (section background / overlays)
- `card`: #0E1633 (cards, panels)
- `border`: rgba(255, 255, 255, 0.08)

**Text**
- `text`: #FFFFFF
- `muted`: #B8C1D9 (body copy)
- `subtle`: rgba(255, 255, 255, 0.70)

**Brand / Accent**
- `accent`: #00E6D0
- `accent-hover`: #00D2BF
- `accent-ink`: #04161A (text on accent buttons)

**Shadows (dark UI friendly)**
- `shadow-sm`: 0 1px 2px rgba(0,0,0,0.25)
- `shadow-md`: 0 8px 24px rgba(0,0,0,0.35)
- `shadow-lg`: 0 24px 60px rgba(0,0,0,0.45)

### CTA button styling
- Background: `accent`
- Text: `accent-ink`
- Radius: 9999px or 14–16px (reference looks “pill-ish”)
- Padding: 12px 18px (mobile), 14px 22px (desktop)

---

## 4) Layout & Spacing

### Grid + max widths
- Page max width: 1120–1200px
- Standard section padding: 
  - Desktop: 80–96px vertical, 24px horizontal
  - Mobile: 48–64px vertical, 16px horizontal

### Common section patterns
- Hero: 2-column split (text left, product visual right)
- Feature steps: centered headline, then stacked/stepped cards
- Logo bar: full-width dark strip with muted logos
- Video: edge-to-edge hero media block with rounded container
- Footer: dark background with multi-column links

### Radii
- Cards: 16px
- Big containers: 24px
- Buttons: 9999px (pill) or 16px

---

## 5) Components (Structure & Specs)

### A) Top navigation
**Structure**
- Left: wordmark logo
- Center: nav links (Home, Partners, Get in Touch, FAQs, Legal)
- Right: primary button “Sign in”

**Behavior**
- Desktop: inline nav
- Mobile: hamburger + slide-down panel

**Specs**
- Height: 64–72px
- Link style: 14–15px, medium
- Button: mint pill

---

### B) Hero (above the fold)
**Left column**
- H1 (bold)
- Short subheadline (muted)
- One sentence supporting copy
- Primary CTA: “Get Started”

**Right column**
- Product “dashboard card” mock image
- Slight tilt/stack effect (background card behind main card)

**Specs**
- 2-col at ≥1024px; stacked at mobile
- Space between columns: 48–64px

---

### C) “3-step” connection section
Headline centered: “Connect your sales platform to quickly access revenue”

Then 3 stacked cards:
1. Connect
2. Access
3. Grow

Each card:
- Left: numbered circle (1/2/3)
- Right: title + short description

---

### D) Partner logo bar
Full width dark strip with monochrome platform logos.

**Notes on assets**
- Use official SVG wordmarks if licensed/allowed.
- Otherwise, use generic “platform” icons or replace with your own partner set.

---

### E) Video feature section
Large media block (16:9) with rounded corners.
- Poster image with subtle overlay
- Centered brand mark over the video

---

### F) “Why [Brand]?” section
Centered title and a short blurb.
Under it, 4 benefit columns:
- Check icon in mint
- Short title
- 1–2 lines description

CTA button below: “Get Started”

---

### G) Testimonial section
Title: “How are we received?”
- Quote in italics
- Name + company
- Dots indicator (carousel)

---

### H) 3 feature cards + CTA
Three cards in a row (apply/manage/no fees style):
- Icon above
- Title
- Body

CTA: “Apply now”

---

### I) Footer
Two-part footer:
1) Dark band with small links row and copyright
2) Deep footer with 3 columns:
   - Company
   - Resources
   - Support

Optional badges/logos at bottom.

---

## 6) Imagery Needed (What to Generate / Source)

### 1) Logo / Wordmark (SVG)
- Needed in navbar and footer.
- Prefer vector SVG.

### 2) Hero product mock (image)
- A **NewsLatch Studio** UI mock: trending headlines + campaign widget preview + conversion lift.
- Should feel like a **news intelligence + marketing conversion** product (not finance).

**Recommended specs**
- 1600×1200 (or 1400×1000) PNG
- Transparent background optional

### 3) “Stacked card” background element
- A faint secondary card behind the hero mock to create depth.
- Can be done in CSS (no asset required) OR a subtle blurred shape.

### 4) Partner logos
- Use official assets if permitted.
- Otherwise generate generic icons (not brand lookalikes).

### 5) Video poster image
- 1920×1080 JPG/PNG
- Marketer/content creator/news analyst context (no brand marks, no recognizable faces required)

### 6) Icons
- Use a consistent icon set (you already use `lucide-react`).
- Checkmarks, document, shield, sparkles, etc.

---

## 7) AI Image Prompts (Copy/Paste)

These prompts are written to produce **brand-safe** visuals (no trademark logos, no copying real UI). Adjust brand color to your `accent`.

### A) Hero “NewsLatch Studio dashboard” mock (recommended)
Goal: a product shot that communicates “AI + headlines + conversion widget” at a glance.

**Prompt (dark theme, on-brand)**
> A modern SaaS product UI mockup for "NewsLatch Studio" on a rounded floating card, dark navy background with teal/cyan accent, panels showing: trending headlines feed (generic non-branded headlines), topic tags, relevance score chips, a campaign widget preview, and conversion metrics (CTR, leads, uplift), minimal clean layout, soft shadows, subtle glass effect, crisp typography, no real news site logos, no recognizable brand names, no watermark, no copyrighted UI, professional, high resolution

**Negative prompt**
> fintech, banking, credit card, payments, stock charts, crypto, cluttered UI, neon glow, heavy gradients, low-res, blurry, real logos, readable real brand names, watermark

**Variants (pick one)**
- “headline intelligence dashboard + widget builder”
- “news-to-campaign generator dashboard”
- “trend detector + landing widget preview”

---

### B) Hero background shapes (optional)
**Option 1 (abstract, on dark)**
> Abstract soft gradient shapes on dark navy background, teal/cyan accents, subtle noise, minimal, modern SaaS, smooth, no text, no watermark

**Option 2 (news motif)**
> Abstract layered cards resembling headline tiles floating in depth, dark navy base, teal accent outlines, subtle blur and shadow, minimal, no text, no watermark

---

### C) Video poster image (NewsLatch context)
**Option 1 (marketing + news research)**
> Lifestyle photo, marketer researching trending news on a laptop with sticky notes and a notebook, modern desk setup, soft natural light, clean composition with whitespace, no visible brands, no readable site names, cinematic but subtle, 16:9

**Option 2 (no faces, safest)**
> Close-up hands using a laptop showing a generic "trending headlines" interface (no real logos, no readable brand names), phone nearby, dark desk with teal accent lighting, clean modern workspace, no text, 16:9

---

### D) Testimonial avatar (optional)
If you want avatars, prefer illustrated to avoid “real person” issues.

> Minimal flat illustration avatar, friendly, gender-neutral, simple shapes, mint accent, circle crop, vector style, no text

---

### E) Partner logo replacements (generic)
Avoid generating Amazon/Stripe/etc. lookalikes.

> Set of 6 generic e-commerce platform icons, monochrome, simple geometric, consistent stroke width, vector SVG style, no text, no brand resemblance

---

## 7.1) Extra NewsLatch-Specific Assets (Optional but High Impact)

### A) "Headline widget" preview card (for the hero or how-it-works)
> A compact embeddable website widget UI showing 3 generic headline tiles with small thumbnails, a "Why this matters" line, and a call-to-action button, dark navy background with teal accent, rounded corners, modern minimal typography, no real logos, no real publication names, no watermark

### B) "AI spark" illustration (icon/spot graphic)
> Minimal vector illustration of an AI spark transforming a headline card into a conversion card, teal/cyan accent on dark navy, flat shapes, clean, no text, no watermark

### C) Generic headline thumbnails (set)
> Set of 6 abstract editorial thumbnail images (technology, health, business, lifestyle, environment, culture) in a consistent illustration style, subtle teal highlight, no text, no logos, no watermark

---

## 8) Content Notes (Copy Blocks)

You can keep the same structure but swap copy to match NewsLatch:

**Hero headline examples**
- “Turn News Into Conversions”
- “Real-time headlines. Ready-to-embed landing widgets.”

**3-step section**
1) Connect: Add your offer + target audience
2) Access: AI finds aligned trending stories
3) Grow: Embed a widget and track conversions

---

## 9) Implementation Notes (Tailwind)

This design is mostly achievable with your existing Tailwind setup.

Suggested tokens to add (if you want a dedicated marketing palette):
- `marketing-bg`, `marketing-surface`, `marketing-text`, `marketing-muted`, `marketing-accent`

And a few reusable classes:
- `card`: `bg-white rounded-2xl shadow-md border border-slate-900/10`
- `section`: `py-16 md:py-24`
- `container`: `max-w-6xl mx-auto px-4 md:px-6`

---

## 10) Deliverables Checklist

- [ ] Navbar (logo + links + sign-in)
- [ ] Hero with 2-col layout + dashboard mock
- [ ] 3-step stacked cards
- [ ] Dark partner logo bar
- [ ] Video block (poster + play)
- [ ] “Why” benefits (4 columns)
- [ ] Testimonial block
- [ ] 3 feature cards + CTA
- [ ] Footer (multi-column)
