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
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t-2 border-gray-200 shadow-2xl sm:bottom-3 sm:left-3 sm:right-auto sm:max-w-xs sm:rounded-lg sm:border-2 animate-slide-up">
        <div className="relative p-3 sm:p-4">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-1.5 right-1.5 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Content */}
          <div className="mb-3">
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">
              🍪 Cookie Notice
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              We use cookies to enhance your experience and analyze site traffic. 
              By clicking "Accept", you consent to our use of cookies.
            </p>
            <a
              href="/privacy-policy"
              className="text-xs text-blue-600 hover:text-blue-800 underline mt-1.5 inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy policy
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
            <Button
              onClick={handleAccept}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 text-xs rounded-md transition-colors shadow-md hover:shadow-lg"
            >
              Accept All
            </Button>
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-1.5 px-3 text-xs rounded-md border-2 border-gray-400 transition-colors"
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
