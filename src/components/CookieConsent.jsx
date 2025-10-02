import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
    
    // Enable Google Tag Manager if it exists
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'cookie_consent_granted',
        consent_marketing: true,
        consent_analytics: true
      });
    }
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowBanner(false);
    
    // Disable tracking in Google Tag Manager if it exists
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'cookie_consent_denied',
        consent_marketing: false,
        consent_analytics: false
      });
    }
  };

  const handleClose = () => {
    // Close without setting preference (will show again on next visit)
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay for mobile */}
      <div className="fixed inset-0 bg-black/20 z-[60] sm:hidden" onClick={handleClose} />
      
      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t-2 border-gray-200 shadow-2xl sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md sm:rounded-lg sm:border-2 animate-slide-up">
        <div className="relative p-4 sm:p-6">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              🍪 Cookie Notice
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze site traffic, and personalize content. 
              By clicking "Accept", you consent to our use of cookies.
            </p>
            <a
              href="/privacy-policy"
              className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Learn more about our privacy policy
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={handleAccept}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Accept All
            </Button>
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-lg border-2 border-gray-300 transition-colors"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
