import { ArrowLeft, ExternalLink, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';

export default function EditorHeader({ landingPage, showSaved }) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <Link to="/landing-pages">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Pages
            </Button>
          </Link>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">
            {landingPage?.title || 'Landing Page'}
          </h1>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Saved Indicator */}
            {showSaved && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Check className="w-4 h-4" />
                Saved
              </div>
            )}

            {/* Preview Button */}
            {landingPage && (
              <Link
                to={`/landing-page/${landingPage.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Campaign Info */}
        {landingPage?.ai_generated_items && (
          <div className="mt-2 text-sm text-gray-500">
            Campaign: <span className="font-medium">{landingPage.ai_generated_items.campaigns?.name}</span>
            {' • '}
            <span className="italic">{landingPage.ai_generated_items.headline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
