import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Target, User, Menu, X, Settings } from 'lucide-react';
import { AuthComponent } from './AuthComponent';
import { Button } from '../ui/Button';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function Header({ user, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
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
        setIsAdmin(result?.data?.is_admin || false);
      } else {
        setIsAdmin(user.id === '81facc72-4b4d-4dfc-86ca-23572e7c0e4c');
      }
    } catch (error) {
      setIsAdmin(user.id === '81facc72-4b4d-4dfc-86ca-23572e7c0e4c');
    }
  };

  const navigationItems = [
    {
      path: '/campaigns',
      label: 'Campaigns',
      icon: Target
    },
    {
      path: '/pages',
      label: 'Landing Pages',
      icon: FileText
    }
  ];

  // Add admin link if user is admin
  if (isAdmin) {
    navigationItems.push({
      path: '/admin',
      label: 'Admin',
      icon: Settings
    });
  }

  const isActivePath = (path) => {
    return location.pathname === path || 
           (path === '/campaigns' && location.pathname.startsWith('/content/'));
  };

  return (
    <header className="bg-primary-bg/95 backdrop-blur-sm border-b border-gray-700/30 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              <img 
                src="/toplogo.png" 
                alt="NewsLatch Studio Logo" 
                className="h-10 w-auto"
              />
            </div>
            
            {user && (
              <nav className="hidden md:flex items-center gap-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  
                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-highlight bg-highlight/10 border border-highlight/20'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white p-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
            {children}
            <AuthComponent user={user} />
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700/30 py-2">
            <nav className="flex flex-col gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors justify-start ${
                      isActive
                        ? 'text-highlight bg-highlight/10 border border-highlight/20'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}