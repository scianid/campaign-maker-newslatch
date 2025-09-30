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

      console.log('🔍 Fetching landing page for slug:', slug);

      const response = await fetch(
        `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/public-landing-page/${slug}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📡 Response status:', response.status);

      const result = await response.json();
      console.log('📄 Response data:', result);

      if (!response.ok) {
        console.error('❌ API Error:', result);
        throw new Error(result.error || `HTTP ${response.status}: Failed to load landing page`);
      }

      if (!result.landing_page) {
        throw new Error('No landing page data received');
      }

      console.log('✅ Landing page loaded successfully');
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

    return (
      <section key={index} className="mb-12">
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

        {(section.image_prompt || landingPage.ai_generated_items?.image_url) && (
          <div className="mb-8">
            {landingPage.ai_generated_items?.image_url ? (
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={landingPage.ai_generated_items.image_url}
                  alt={section.image_prompt || "Article image"}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
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
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Image Placeholder</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {section.image_prompt}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {section.cta && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-10 text-center mb-10 shadow-lg">
            <div className="mb-6">
              <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-base font-bold mb-4 animate-bounce">
                ✨ EXCLUSIVE OPPORTUNITY ✨
              </div>
            </div>
            <Button
              onClick={() => {
                if (landingPage?.ai_generated_items?.campaigns?.url) {
                  window.open(landingPage.ai_generated_items.campaigns.url, '_blank');
                }
              }}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-6 px-12 text-xl rounded-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 animate-pulse border-2 border-green-500"
            >
              {section.cta} →
            </Button>
            <p className="text-base text-gray-700 mt-4 font-medium">
              🌟 Click above to unlock your exclusive access now!
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
    <div className="min-h-screen bg-white">
      {/* Advertorial Notice */}
      <div className="bg-gray-50 border-b border-gray-200 py-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Advertorial
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/toplogo.png" 
                alt="Logo" 
                className="h-8 w-auto opacity-50"
              />
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(landingPage.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {landingPage.view_count} views
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            {landingPage.title}
          </h1>
          
          <div className="flex items-center justify-center text-sm text-gray-500 mb-8">
            <span>Powered by NewsLatch</span>
          </div>


        </header>

        {/* Article Content */}
        <article className="max-w-none">
          {landingPage.sections && landingPage.sections.map((section, index) => 
            renderSection(section, index)
          )}
        </article>

        {/* Footer CTA */}
        {landingPage.ai_generated_items?.campaigns?.url && (
          <div className="bg-gradient-to-br from-blue-50 to-green-100 border-2 border-blue-200 rounded-2xl p-12 text-center mt-20 shadow-xl">
            <div className="mb-6">
              <div className="inline-block bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-bold mb-4 animate-bounce">
                🎉 YOUR SUCCESS AWAITS 🎉
              </div>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready to Achieve Your Goals?
            </h3>
            <p className="text-xl text-gray-700 mb-8 font-medium">
              🌟 Join thousands who have already transformed their lives!
            </p>
            <Button
              onClick={() => window.open(landingPage.ai_generated_items.campaigns.url, '_blank')}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-8 px-16 text-2xl rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-110 transition-all duration-300 border-4 border-blue-500 animate-pulse"
            >
              🚀 START YOUR JOURNEY NOW! →
            </Button>
            <p className="text-lg text-blue-600 mt-6 font-bold">
              💫 Your future success starts with one click!
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500 space-y-2">
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