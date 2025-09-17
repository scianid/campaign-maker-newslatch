import { AuthComponent } from './AuthComponent';
import { Layout } from './Layout';
import { Megaphone, Sparkles, Target, TrendingUp, Shield } from 'lucide-react';

export function HomePage({ user }) {
  return (
    <Layout user={user}>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-card-bg rounded-3xl mb-8 shadow-lg">
            <img 
              src="/icon.png" 
              alt="NewsLatch Icon" 
              className="w-12 h-12"
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            NewsLatch Studio
          </h1>         
           <h2 className="text-4xl md:text-4xl font-bold text-white mb-6">
            AI Turns Headlines Into Higher Conversions
          </h2>
          
          <p className="text-xl text-text-paragraph mb-8 max-w-3xl mx-auto leading-relaxed">
            Whether you're selling skincare or software, NewsLatch AI finds trending headlines aligned with your offer.
          </p>

          <div className="mb-12">
            <AuthComponent user={user} />
          </div>
        </div>

        {/* How It Works - 3 Steps */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card-bg rounded-2xl p-8 border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-highlight rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold text-primary-bg">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Describe Your Offer</h3>
              <p className="text-text-paragraph">
                Enter your product or service, plus any keywords or verticals you're targeting.
              </p>
            </div>

            <div className="bg-card-bg rounded-2xl p-8 border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-highlight rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold text-primary-bg">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">AI Finds Live, Relevant News</h3>
              <p className="text-text-paragraph">
                Our AI engine surface the most relevant news headlines that relate to your offer.
              </p>
            </div>

            <div className="bg-card-bg rounded-2xl p-8 border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-highlight rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold text-primary-bg">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Drop in a High-Converting Widget</h3>
              <p className="text-text-paragraph">
                Choose a layout, match your brand colors, and embed with one line of code.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card-bg border border-gray-600/50 rounded-3xl p-12 shadow-2xl hover:shadow-black/60 transition-all duration-300">
          <h2 className="text-3xl font-bold mb-4 text-white">Start Converting Headlines Today</h2>
          <p className="text-xl text-text-paragraph mb-8 max-w-2xl mx-auto">
            Join thousands of marketers using AI-powered headlines to boost their conversion rates.
          </p>
          <AuthComponent user={user} />
        </div>
      </div>
    </Layout>
  );
}