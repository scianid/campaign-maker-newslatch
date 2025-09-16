import { AuthComponent } from './AuthComponent';
import { Megaphone, Sparkles, Target, TrendingUp, Shield } from 'lucide-react';

export function HomePage({ user }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Campaign Maker
                </h1>
                <p className="text-sm text-gray-600">Professional Campaign Management</p>
              </div>
            </div>
            
            <AuthComponent user={user} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mb-8 shadow-lg">
            <Sparkles className="w-12 h-12 text-blue-600" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6">
            Campaign Maker
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The ultimate platform for creating, managing, and tracking your marketing campaigns. 
            Organize URLs, manage tags, configure RSS feeds, and take your campaigns to the next level.
          </p>

          <div className="mb-12">
            <AuthComponent user={user} />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Campaign Management</h3>
            <p className="text-gray-600">
              Organize your campaigns with intelligent tagging, URL management, and RSS feed integration for maximum efficiency.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Analytics</h3>
            <p className="text-gray-600">
              Track campaign performance, monitor RSS feeds, and get insights that help you make data-driven decisions.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Reliable</h3>
            <p className="text-gray-600">
              Your campaigns are protected with enterprise-grade security and backed up in the cloud for peace of mind.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to supercharge your campaigns?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Create your account and start organizing your marketing campaigns today.
          </p>
          <AuthComponent user={user} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">Campaign Maker</span>
              </div>
              <p className="text-gray-600 mb-4">
                Professional campaign management made simple. Create, organize, and track your marketing campaigns with ease.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Campaign Management</li>
                <li>RSS Feed Integration</li>
                <li>Smart Tagging</li>
                <li>Real-time Analytics</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Community</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-600">
              © 2025 Campaign Maker. Built with ❤️ using React, Tailwind CSS, and Supabase.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}