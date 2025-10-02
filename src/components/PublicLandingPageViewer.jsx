import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, ExternalLink, Eye, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export function PublicLandingPageViewer() {
  const { slug } = useParams();
  const [landingPage, setLandingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchLandingPage();
    }
  }, [slug]);

  // Update page title and meta tags when landing page loads
  useEffect(() => {
    if (landingPage) {
      document.title = `${landingPage.title} | NewsLatch`;
      
      // Update meta description if available
      const firstParagraph = landingPage.sections?.[0]?.paragraphs?.[0];
      if (firstParagraph) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.name = 'description';
          document.head.appendChild(metaDescription);
        }
        metaDescription.content = firstParagraph.substring(0, 160) + '...';
      }
    }
    
    return () => {
      document.title = 'NewsLatch'; // Reset title on unmount
    };
  }, [landingPage]);

  const fetchLandingPage = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/public-landing-page/${slug}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ API Error:', result);
        throw new Error(result.error || `HTTP ${response.status}: Failed to load landing page`);
      }

      if (!result.landing_page) {
        throw new Error('No landing page data received');
      }

      setLandingPage(result.landing_page);
    } catch (err) {
      console.error('❌ Error fetching landing page:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderSection = (section, index) => {
    if (!section) return null;

    // Use section's own image_url if available, otherwise fall back to hero image occasionally
    const hasHeroImage = landingPage.ai_generated_items?.image_url;
    const hasSectionImage = section.image_url;
    
    // Show section image if it exists, or fallback to hero image in specific sections
    const shouldShowImage = hasSectionImage || (!hasSectionImage && hasHeroImage && (index === 2 || index === 4));
    const imageToShow = hasSectionImage ? section.image_url : landingPage.ai_generated_items?.image_url;

    return (
      <section key={index} className="mb-12">
        {/* Top Widget */}
        {section.widget === 'view-count' && (
          <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block mb-6">
            <span className="text-sm text-gray-700 font-medium">
              👁️ {Math.floor(Math.random() * 500) + 200} people viewed this today
            </span>
          </div>
        )}
        
        {section.widget === 'rating' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-3xl font-bold text-gray-900">{(Math.random() * 0.8 + 9.1).toFixed(1)}</div>
                  <div className="flex text-yellow-400">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <svg className="w-5 h-5 text-gray-300" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-medium">Excellent Rating</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Our assessment</div>
              </div>
            </div>
          </div>
        )}
        
        {section.widget === 'trust-badge' && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block mb-6">
            <span className="text-sm text-green-800 font-semibold">
              ✓ Verified by Industry Experts
            </span>
          </div>
        )}
        
        {section.widget === 'live-activity' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block mb-6">
            <span className="text-sm text-blue-800 font-medium">
              🔴 {Math.floor(Math.random() * 10) + 3} people are viewing this now
            </span>
          </div>
        )}
        
        {section.widget === 'recent-signups' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 inline-block mb-6">
            <span className="text-sm text-purple-800 font-medium">
              🔥 {Math.floor(Math.random() * 200) + 50} people joined in the last 24 hours
            </span>
          </div>
        )}
        
        {section.widget === 'limited-time' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-3 inline-block mb-6">
            <span className="text-sm text-red-800 font-bold">
              ⚡ LIMITED TIME OFFER - Ends Soon!
            </span>
          </div>
        )}
        
        {section.widget === 'featured-badge' && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2 inline-block mb-6">
            <span className="text-sm text-yellow-900 font-semibold">
              ⭐ Featured in 12+ Publications
            </span>
          </div>
        )}
        
        {section.widget === 'testimonial-count' && (
          <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block mb-6">
            <span className="text-sm text-gray-700 font-medium">
              💬 Based on {Math.floor(Math.random() * 2000) + 500}+ reviews
            </span>
          </div>
        )}

        {section.subtitle && (
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            {section.subtitle}
          </h2>
        )}
        
        {section.paragraphs && section.paragraphs.map((paragraph, pIndex) => (
          <p key={pIndex} className="text-lg text-gray-700 leading-relaxed mb-4">
            {paragraph}
          </p>
        ))}

        {shouldShowImage && imageToShow && (
          <div className="mb-8">
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img 
                src={imageToShow}
                alt={section.image_prompt || section.subtitle || "Article image"}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.target.style.display = 'none';
                  const placeholderDiv = e.target.nextSibling;
                  if (placeholderDiv) {
                    placeholderDiv.style.display = 'block';
                  }
                }}
              />
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hidden">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Image Placeholder</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {section.image_prompt || "Image not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {section.cta && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-10 text-center mb-10 shadow-lg">
            <div className="mb-6">
              <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-base font-bold mb-4 animate-bounce">
                EXCLUSIVE OPPORTUNITY
              </div>
            </div>
            <Button
              onClick={() => {
                if (landingPage?.ai_generated_items?.campaigns?.url) {
                  window.open(landingPage.ai_generated_items.campaigns.url, '_blank');
                }
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {section.cta}
            </Button>
            <p className="text-base text-gray-700 mt-4 font-medium">
              Click above to unlock your exclusive access now!
            </p>
            <p className="text-sm text-green-600 mt-2 font-semibold">
              Join thousands of satisfied users!
            </p>
          </div>
        )}
      </section>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading landing page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error === 'Landing page not found' 
              ? 'The landing page you are looking for does not exist or has been removed.'
              : error
            }
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Content Available</h1>
          <p className="text-gray-600">This landing page has no content to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Advertorial Notice */}
      <div className="bg-gray-50 border-b border-gray-200 py-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs text-gray-500">
              We earn commissions from brands listed on this site, which influences how listings are presented. <span className="underline cursor-pointer">Advertising Disclosure</span>.
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <header className="text-center mb-12">
          {/* Enhanced Last Updated Pill */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Last Updated: {new Date(landingPage.updated_at).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
          </div>
          
          {/* Hero Section with Title Overlay */}
          {landingPage.ai_generated_items?.image_url ? (
            <div className="relative mb-8">
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={landingPage.ai_generated_items.image_url}
                  alt={landingPage.title}
                  className="w-full h-80 md:h-96 object-cover"
                />
                {/* Title Overlay with Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
                  <div className="p-6 md:p-8 w-full">
                    <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                      {landingPage.title}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Fallback if no hero image
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-8">
              {landingPage.title}
            </h1>
          )}
          
          <div className="text-center mb-8">
            
            {/* Social Proof Counter */}
            <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block mb-4">
              <span className="text-sm text-gray-700 font-medium">
                {Math.floor(Math.random() * 500) + 200} people viewed this article today
              </span>
            </div>
            

            
            {/* Above the Fold CTA Button */}
            <div className="max-w-md mx-auto">
              <Button
                onClick={() => {
                  if (landingPage?.ai_generated_items?.campaigns?.url) {
                    window.open(landingPage.ai_generated_items.campaigns.url, '_blank');
                  }
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Visit Site →
              </Button>
            </div>
          </div>


        </header>

        {/* Article Content */}
        <article className="max-w-none">
          {landingPage.sections && landingPage.sections.map((section, index) => 
            renderSection(section, index)
          )}
        </article>




      </main>

      {/* Sticky Bottom CTA */}
      {(landingPage.sticky_cta_visible !== false) && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100" style={{ boxShadow: '0 -10px 30px -5px rgba(0, 0, 0, 0.3), 0 -4px 6px -2px rgba(0, 0, 0, 0.2)' }}>
          <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-gray-900 font-bold text-sm sm:text-base md:text-lg lg:text-xl leading-tight">
                {landingPage.sticky_cta_title || 'Ready to Take Action?'}
              </p>
              <p className="text-gray-700 text-xs sm:text-sm mt-0.5">
                {landingPage.sticky_cta_subtitle || 'Click to visit the site and learn more'}
              </p>
            </div>
            <Button
              onClick={() => {
                if (landingPage?.ai_generated_items?.campaigns?.url) {
                  window.open(landingPage.ai_generated_items.campaigns.url, '_blank');
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base md:text-lg rounded-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 whitespace-nowrap w-full sm:w-auto"
            >
              {landingPage.sticky_cta_button || 'Visit Site →'}
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Disclaimers */}
          <div className="mb-8 space-y-6 text-xs text-gray-600 leading-relaxed">
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <p className="font-bold text-gray-800 mb-2">ADVERTISEMENT NOTICE</p>
              <p>THIS IS AN ADVERTISEMENT AND NOT AN ACTUAL NEWS ARTICLE, BLOG, OR CONSUMER PROTECTION UPDATE.</p>
            </div>
            
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <p className="font-bold text-gray-800 mb-2">MARKETING DISCLOSURE</p>
              <p>This website is a market place. As such you should know that the owner has a monetary connection to the product and services advertised on the site. The owner receives payment whenever a qualified lead is referred but that is the extent of it.</p>
            </div>
            
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <p className="font-bold text-gray-800 mb-2">ADVERTISING DISCLOSURE</p>
              <p>This website and the products & services referred to on the site are advertising marketplaces. This website is an advertisement and not a news publication. Any photographs of persons used on this site are models. The owner of this site and of the products and services referred to on this site only provides a service where consumers can obtain and compare.</p>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 space-y-2 border-t border-gray-300 pt-6">
            <p>
              Powered by AI-driven content generation
            </p>
            {landingPage.ai_generated_items?.link && (
              <p className="text-xs text-gray-400">
                <span className="mr-2">Based on news from:</span>
                <a
                  href={landingPage.ai_generated_items.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-600 transition-colors underline"
                >
                  Original Source
                </a>
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}