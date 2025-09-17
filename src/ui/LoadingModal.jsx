import { Loader2, Rss } from 'lucide-react';

export function LoadingModal({ isOpen, campaignName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card-bg rounded-2xl shadow-2xl p-8 max-w-md mx-4">
        <div className="text-center">
          {/* Loading Icon */}
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-highlight/20 rounded-full flex items-center justify-center mx-auto">
              <Rss className="w-8 h-8 text-highlight" />
            </div>
            <Loader2 className="w-6 h-6 text-highlight animate-spin absolute -top-1 -right-1" />
          </div>
          
          {/* Loading Text */}
          <h3 className="text-lg font-semibold text-white mb-2">
            Fetching RSS Content
          </h3>
          <p className="text-sm text-text-paragraph mb-4">
            Loading the latest articles from <span className="font-medium text-white">{campaignName}</span>...
          </p>
          
          {/* Progress Steps */}
          <div className="space-y-2 text-xs text-text-paragraph">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-highlight rounded-full animate-pulse"></div>
              <span>Connecting to RSS feeds</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-highlight/80 rounded-full animate-pulse delay-300"></div>
              <span>Parsing content</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-highlight/60 rounded-full animate-pulse delay-700"></div>
              <span>Organizing articles</span>
            </div>
          </div>
          
          {/* Note */}
          <p className="text-xs text-text-paragraph/70 mt-6">
            This may take a few moments...
          </p>
        </div>
      </div>
    </div>
  );
}