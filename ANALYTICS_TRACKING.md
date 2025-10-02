# Analytics Tracking Guide

## Overview
The application now tracks all CTA (Call-to-Action) clicks on landing pages using both **Google Tag Manager** and **Google Analytics 4**.

## Tracked Events

### 1. Page Views
Automatically tracked when a landing page loads.

**Event Name:** `landing_page_view` (GTM) / `page_view` (GA4)

**Data Captured:**
- `page_slug`: The URL slug of the landing page
- `page_name`: The headline/title of the page
- `page_url`: Full URL of the page

### 2. CTA Clicks
Tracked whenever a user clicks any CTA button on a landing page.

**Event Name:** `cta_click`

**CTA Types:**
- `hero_cta` - Main CTA button at the top of the page
- `sticky_cta` - Sticky bottom CTA bar
- `section_1_cta`, `section_2_cta`, etc. - CTA buttons in each content section

**Data Captured:**
- `cta_type`: Type of CTA clicked (hero, sticky, section_1, etc.)
- `page_slug`: Which landing page the click occurred on
- `page_name`: Page headline/title
- `button_text`: Text displayed on the button
- `destination_url`: Where the CTA leads
- `timestamp`: ISO timestamp of the click

## Google Analytics 4 Setup

### View CTA Clicks in GA4

1. **Real-Time Report:**
   - Go to Reports → Realtime
   - Click on "Event count by Event name"
   - Look for `cta_click` events

2. **Create Custom Report:**
   - Go to Explore → Create new exploration
   - Add dimensions: `event_name`, `cta_type`, `page_slug`, `button_text`
   - Add metrics: `Event count`
   - Filter by: `event_name` = `cta_click`

3. **Conversion Tracking:**
   - Go to Admin → Events
   - Find `cta_click` and mark as conversion
   - This allows you to track CTA clicks as goals

### Custom Dimensions (Optional)
To see all tracking parameters in GA4 reports, create custom dimensions:

1. Go to Admin → Custom Definitions → Custom Dimensions
2. Create these dimensions:
   - `cta_type` → Event parameter: `cta_type`
   - `page_slug` → Event parameter: `page_slug`
   - `button_text` → Event parameter: `button_text`
   - `destination_url` → Event parameter: `destination_url`

## Google Tag Manager Setup

### View Events in GTM Debug Mode

1. Enable Preview mode in GTM
2. Visit a landing page
3. Click any CTA button
4. In GTM Preview, you'll see the `cta_click` event with all parameters

### Create Tags Based on CTA Clicks

**Example: Track High-Performing CTAs**

1. Create a Trigger:
   - Type: Custom Event
   - Event name: `cta_click`
   - Condition: `cta_type` equals `hero_cta`

2. Create a Tag:
   - Type: Google Analytics: GA4 Event
   - Event Name: `hero_cta_click`
   - Trigger: Your custom trigger above

### Create Variables

To use CTA data in other tags:

1. Variables → New → Data Layer Variable
2. Create these variables:
   - `DLV - CTA Type` → Data Layer Variable Name: `cta_type`
   - `DLV - Page Slug` → Data Layer Variable Name: `page_slug`
   - `DLV - Button Text` → Data Layer Variable Name: `button_text`
   - `DLV - Destination URL` → Data Layer Variable Name: `destination_url`

## Example Queries

### BigQuery (GA4 Export)

```sql
-- Top performing CTAs by page
SELECT
  page_slug,
  cta_type,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT user_pseudo_id) as unique_users
FROM
  `your-project.analytics_XXXXX.events_*`
WHERE
  event_name = 'cta_click'
  AND _TABLE_SUFFIX BETWEEN '20250101' AND '20250131'
GROUP BY
  page_slug, cta_type
ORDER BY
  total_clicks DESC
```

### GA4 Explorations

**CTA Performance by Page:**
- Dimensions: `page_slug`, `cta_type`
- Metrics: `Event count`, `Total users`
- Breakdown: By `button_text`

**CTA Click Funnel:**
1. Page view
2. Hero CTA click
3. Section CTA click
4. Sticky CTA click

## Testing

### Verify Tracking is Working

1. **Console Logs:**
   - Open browser DevTools
   - Visit a landing page
   - Click any CTA
   - Check console for: "CTA Click Tracked: {details}"

2. **GA4 Real-Time:**
   - Go to GA4 Real-Time report
   - Click a CTA on your site
   - Should see `cta_click` event appear within seconds

3. **GTM Preview:**
   - Enable GTM Preview mode
   - Click CTAs and verify events fire with correct parameters

## Cookie Consent Integration

The tracking respects user cookie preferences:
- **Accepted:** Full tracking enabled
- **Declined:** Tracking disabled
- **No choice yet:** Tracking disabled until user accepts

## Best Practices

1. **Monitor Top CTAs:**
   - Track which CTA positions get the most clicks
   - Optimize button text and placement based on data

2. **A/B Testing:**
   - Test different button text
   - Track performance by `button_text` parameter

3. **Page Performance:**
   - Compare CTA click rates across different `page_slug` values
   - Identify high and low performing landing pages

4. **Conversion Funnel:**
   - Track from page view → CTA click → final conversion
   - Identify drop-off points

## Data Privacy

- All tracking respects GDPR/CCPA requirements
- Users can opt-out via cookie consent banner
- No personally identifiable information (PII) is tracked
- Data is anonymized in Google Analytics

## Support

If tracking is not working:
1. Check browser console for errors
2. Verify GTM container ID: `GTM-WXZFXVTV`
3. Verify GA4 ID: `G-HGN1G9V7NG`
4. Ensure cookie consent is granted
5. Check that `trackCtaClick` function is imported correctly
