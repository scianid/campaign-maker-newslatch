import { Megaphone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary-bg/80 backdrop-blur-sm border-t border-gray-700/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-highlight rounded-xl">
                <Megaphone className="w-5 h-5 text-primary-bg" />
              </div>
              <span className="text-lg font-bold text-white">NewsLatch Studio</span>
            </div>
            <p className="text-text-paragraph mb-4">
              AI-powered headlines that convert. Turn trending news into higher conversion rates for any offer.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-text-paragraph">
              <li>AI Headline Discovery</li>
              <li>Live News Integration</li>
              <li>Custom Widgets</li>
              <li>One-Click Embed</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-text-paragraph">
              <li>Documentation</li>
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Community</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700/50 mt-8 pt-8 text-center">
          <p className="text-sm text-text-paragraph">
            © 2025 NewsLatch Studio. Powered by AI-driven news analysis for smarter lead generation. 💡
          </p>
        </div>
      </div>
    </footer>
  );
}