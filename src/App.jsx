import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthComponent } from './components/AuthComponent';
import { HomePage } from './components/HomePage';
import { CampaignDashboard } from './components/CampaignDashboard';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
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
                <p className="text-sm text-gray-600">Welcome back, {user.user_metadata?.full_name || user.email}!</p>
              </div>
            </div>
            
            <AuthComponent user={user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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