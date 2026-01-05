import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthComponent } from './components/AuthComponent';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { MultiStepCampaignForm } from './components/MultiStepCampaignForm';
import { EditCampaignForm } from './components/EditCampaignForm';
import { CampaignDashboard } from './components/CampaignDashboard';
import { AiContentPage } from './components/AiContentPage';
import { LandingPagesPage } from './components/LandingPagesPage';
import { EditLandingPage } from './components/EditLandingPage';
import { PublicLandingPageViewer } from './components/PublicLandingPageViewer';
import { AdminPage } from './components/AdminPage';
import { CookieConsent } from './components/CookieConsent';
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
              Powered by AI-driven news analysis for smarter lead generation 💡
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
    }).catch(err => {
      console.error('Error getting user:', err);
      setUser(null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      // Handle sign out or invalid sessions
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
      }
      
      // Handle token refresh errors - sign out if refresh fails
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      }
      
      // Default handling
      if (!session?.user && event !== 'SIGNED_OUT' && event !== 'USER_DELETED') {
        setUser(null);
      } else if (session?.user) {
        setUser(session.user);
      }
      
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
        {/* Public routes */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/campaigns" replace /> : <HomePage user={user} />} 
        />
        
        <Route 
          path="/login" 
          element={<LoginPage user={user} />} 
        />
        
        <Route 
          path="/page/:slug" 
          element={<PublicLandingPageViewer />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/campaigns" 
          element={
            <ProtectedRoute user={user}>
              <CampaignDashboard user={user} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/new" 
          element={
            <ProtectedRoute user={user}>
              <MultiStepCampaignForm user={user} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/edit/:id" 
          element={
            <ProtectedRoute user={user}>
              <EditCampaignForm user={user} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/content/:campaignId" 
          element={
            <ProtectedRoute user={user}>
              <AiContentPage user={user} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/pages" 
          element={
            <ProtectedRoute user={user}>
              <LandingPagesPage user={user} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/pages/edit/:pageId" 
          element={
            <ProtectedRoute user={user}>
              <EditLandingPage user={user} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute user={user}>
              <AdminPage user={user} />
            </ProtectedRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Cookie Consent Banner */}
      <CookieConsent />
    </Router>
  );

}

export default App