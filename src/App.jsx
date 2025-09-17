import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthComponent } from './components/AuthComponent';
import { HomePage } from './components/HomePage';
import { CampaignForm } from './components/CampaignForm';
import { CampaignList } from './components/CampaignList';
import { authService } from './lib/supabase';
import { Megaphone } from 'lucide-react';

// Protected Route component
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Layout component for authenticated pages
function Layout({ user, children }) {
  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Header */}
      <header className="bg-primary-bg/95 backdrop-blur-sm border-b border-gray-700/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img 
              src="/toplogo.png" 
              alt="NewsLatch Studio Logo" 
              className="h-10 w-auto"
            />
            
            <AuthComponent user={user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary-bg/80 backdrop-blur-sm border-t border-gray-700/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-300">
              Built with ❤️ using React, Tailwind CSS, and Supabase
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    authService.getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-600 border-t-highlight rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/campaigns" replace /> : <HomePage user={user} />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/campaigns" 
          element={
            <ProtectedRoute user={user}>
              <Layout user={user}>
                <CampaignList user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/new" 
          element={
            <ProtectedRoute user={user}>
              <Layout user={user}>
                <CampaignForm user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/edit/:id" 
          element={
            <ProtectedRoute user={user}>
              <Layout user={user}>
                <CampaignForm user={user} />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );

}

export default App