/**
 * Analytics tracking utilities for Google Tag Manager and Google Analytics
 */

/**
 * Track CTA button clicks
 * @param {string} ctaType - Type of CTA (e.g., 'hero_cta', 'sticky_cta', 'section_cta')
 * @param {string} pageSlug - The landing page slug
 * @param {string} pageName - The landing page title/name
 * @param {string} buttonText - The text on the CTA button
 * @param {string} destinationUrl - Where the CTA leads
 */
export function trackCtaClick(ctaType, pageSlug, pageName, buttonText, destinationUrl) {
  try {
    // Google Analytics 4 event
    if (window.gtag) {
      window.gtag('event', 'cta_click', {
        event_category: 'engagement',
        event_label: ctaType,
        page_slug: pageSlug,
        page_name: pageName,
        button_text: buttonText,
        destination_url: destinationUrl,
        timestamp: new Date().toISOString()
      });
    }

    // Google Tag Manager event
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'cta_click',
        cta_type: ctaType,
        page_slug: pageSlug,
        page_name: pageName,
        button_text: buttonText,
        destination_url: destinationUrl,
        timestamp: new Date().toISOString()
      });
    }

    console.log('CTA Click Tracked:', {
      ctaType,
      pageSlug,
      pageName,
      buttonText,
      destinationUrl
    });
  } catch (error) {
    console.error('Error tracking CTA click:', error);
  }
}

/**
 * Track page views
 * @param {string} pageSlug - The landing page slug
 * @param {string} pageName - The landing page title/name
 */
export function trackPageView(pageSlug, pageName) {
  try {
    // Google Analytics 4 event
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_slug: pageSlug,
        page_name: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }

    // Google Tag Manager event
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'landing_page_view',
        page_slug: pageSlug,
        page_name: pageName,
        page_url: window.location.href
      });
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

/**
 * Track user engagement (scroll depth, time on page, etc.)
 * @param {string} engagementType - Type of engagement
 * @param {object} data - Additional data to track
 */
export function trackEngagement(engagementType, data = {}) {
  try {
    // Google Analytics 4 event
    if (window.gtag) {
      window.gtag('event', engagementType, {
        event_category: 'engagement',
        ...data
      });
    }

    // Google Tag Manager event
    if (window.dataLayer) {
      window.dataLayer.push({
        event: engagementType,
        ...data
      });
    }
  } catch (error) {
    console.error('Error tracking engagement:', error);
  }
}

// Default export for convenience
export default {
  trackCtaClick,
  trackPageView,
  trackEngagement
};
