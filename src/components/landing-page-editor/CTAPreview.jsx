import { Button } from '../../ui/Button';

export function CTAPreview({ config, isEditor = false, landingPage = null, slug = null, index = null, trackCtaClick = null }) {
  if (!config) return null;

  const handleClick = () => {
    if (!isEditor && landingPage?.ai_generated_items?.campaigns?.url) {
      if (trackCtaClick) {
        trackCtaClick(
          `section_${index + 1}_cta_${config.type}`,
          slug,
          landingPage?.ai_generated_items?.headline || 'Landing Page',
          config.buttonText,
          landingPage.ai_generated_items.campaigns.url
        );
      }
      window.open(landingPage.ai_generated_items.campaigns.url, '_blank');
    }
  };

  const pointerClass = isEditor ? 'pointer-events-none' : '';

  // Simple CTA
  if (config.type === 'simple') {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-xl p-8 text-center shadow-lg">
        <Button 
          className={`w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg ${pointerClass}`}
          onClick={handleClick}
        >
          {config.buttonText || 'Get Started'}
        </Button>
        {config.subtitleText && (
          <p className="text-sm text-gray-600 mt-4">
            {config.subtitleText}
          </p>
        )}
      </div>
    );
  }

  // Exclusive CTA
  if (config.type === 'exclusive') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
        <div className="mb-6">
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4">
            {config.badgeText || 'EXCLUSIVE OPPORTUNITY'}
          </div>
        </div>
        <Button 
          className={`w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg ${pointerClass}`}
          onClick={handleClick}
        >
          {config.buttonText || 'Get Started'}
        </Button>
        <p className="text-base text-gray-700 mt-4 font-medium">
          {config.subtitleText || 'Click above to unlock your exclusive access now!'}
        </p>
      </div>
    );
  }

  // Urgency CTA
  if (config.type === 'urgency') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
        <div className="mb-6">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4 animate-pulse">
            ⚡ {config.badgeText || 'LIMITED TIME OFFER'}
          </span>
        </div>
        <Button 
          className={`w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg shadow-xl ${pointerClass}`}
          onClick={handleClick}
        >
          {config.buttonText || 'Claim Your Spot Now'}
        </Button>
        <p className="text-base text-gray-700 mt-4 font-medium">
          {config.subtitleText || "Don't miss out - offer ends soon!"}
        </p>
      </div>
    );
  }

  // Testimonial CTA
  if (config.type === 'testimonial') {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-gray-300 rounded-xl p-10 text-center shadow-lg">
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="text-yellow-400 mb-2">
            {'⭐'.repeat(5)}
          </div>
          <p className="text-gray-700 italic mb-2">
            "{config.testimonialQuote || 'This product changed my life!'}"
          </p>
          <p className="text-sm text-gray-600 font-medium">
            — {config.testimonialAuthor || 'Verified Customer'}
          </p>
        </div>
        <Button 
          className={`w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg ${pointerClass}`}
          onClick={handleClick}
        >
          {config.buttonText || 'Get Started Today'}
        </Button>
        {config.subtitleText && (
          <p className="text-sm text-gray-600 mt-4">
            {config.subtitleText}
          </p>
        )}
      </div>
    );
  }

  // Discount CTA
  if (config.type === 'discount') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
        <div className="mb-6">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4">
            {config.badgeText || 'SPECIAL DISCOUNT'}
          </span>
        </div>
        <div className="bg-white border-2 border-blue-300 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2 font-medium">Use this code:</p>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg py-3 px-6">
              <code className="text-2xl font-bold text-gray-900 tracking-wider">
                {config.discountCode || 'SAVE20'}
              </code>
            </div>
            <button
              onClick={(e) => {
                if (!isEditor) {
                  e.stopPropagation();
                  navigator.clipboard.writeText(config.discountCode || 'SAVE20');
                  e.target.textContent = 'Copied!';
                  setTimeout(() => {
                    e.target.textContent = 'Copy';
                  }, 2000);
                }
              }}
              className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pointerClass}`}
              title="Copy code"
            >
              Copy
            </button>
          </div>
        </div>
        <Button 
          className={`w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg shadow-xl ${pointerClass}`}
          onClick={handleClick}
        >
          {config.buttonText || 'Apply Discount'}
        </Button>
        <p className="text-base text-gray-700 mt-4 font-medium">
          {config.subtitleText || 'Use code at checkout for instant savings'}
        </p>
      </div>
    );
  }

  // Guarantee CTA
  if (config.type === 'guarantee') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-10 text-center shadow-lg">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-base font-bold mb-4">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {config.guaranteeText || '30-Day Money-Back Guarantee'}
          </div>
        </div>
        <Button 
          className={`w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg ${pointerClass}`}
          onClick={handleClick}
        >
          {config.buttonText || 'Try Risk-Free'}
        </Button>
        <p className="text-base text-gray-700 mt-4 font-medium">
          {config.subtitleText || 'No questions asked - 100% satisfaction guaranteed'}
        </p>
      </div>
    );
  }

  return null;
}
