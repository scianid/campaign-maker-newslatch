import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { authService, supabase } from '../lib/supabase';
import { LogIn, LogOut, User, Mail, Eye, EyeOff, Loader2, Settings, Home, ChevronDown, Coins } from 'lucide-react';

export function AuthComponent({ user, onAuthChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [userCredits, setUserCredits] = useState(null);

  // Check if user is admin when user changes
  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchUserCredits();
    } else {
      setIsAdmin(false);
      setUserCredits(null);
    }
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      setCheckingAdmin(true);
      
      // First, try to get or create the profile using the service key (bypassing RLS)
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/admin-users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setIsAdmin(result?.data?.is_admin || false);
      } else {
        // RLS is causing issues, use hardcoded admin check for now
        setIsAdmin(user.id === '81facc72-4b4d-4dfc-86ca-23572e7c0e4c');
      }
    } catch (error) {
      // Fallback: check if user ID matches known admin
      setIsAdmin(user.id === '81facc72-4b4d-4dfc-86ca-23572e7c0e4c');
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchUserCredits = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/admin-users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUserCredits(result?.data?.credits ?? null);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  // Expose fetchUserCredits globally for refreshing after AI operations
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      window.refreshUserCredits = fetchUserCredits;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.refreshUserCredits;
      }
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  // If user is authenticated
  if (user) {
    return (
      <div className="flex items-center gap-3">
        {/* User Menu */}
        <div className="relative user-menu-container">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700/30 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-highlight rounded-full flex items-center justify-center">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white">
                {user.user_metadata?.full_name || user.email}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-text-paragraph">{user.email}</p>
                {userCredits !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-highlight/20 text-highlight text-xs rounded-full font-semibold">
                    <Coins className="w-3 h-3" />
                    {userCredits} credits
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-card-bg rounded-lg shadow-lg border border-gray-700 z-50">
              <div className="py-2">
                {userCredits !== null && (
                  <div className="px-4 py-3 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm">AI Credits</span>
                      </div>
                      <span className="text-lg font-bold text-highlight">{userCredits}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Used for AI operations</p>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUserMenu(false);
                    handleSignOut();
                  }}
                  disabled={loading}
                  className="w-full justify-start rounded-none px-4 py-2 text-gray-300 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sign in button - navigates to /login page
  return (
    <Button
      onClick={() => navigate('/login', { state: { from: location.pathname } })}
      variant="default"
    >
      <LogIn className="w-4 h-4" />
      Sign In
    </Button>
  );
}