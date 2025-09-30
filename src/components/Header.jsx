import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Target, User } from 'lucide-react';
import { AuthComponent } from './AuthComponent';
import { Button } from '../ui/Button';

export function Header({ user, children }) {
  const navigate = useNavigate();
  const location = useLocation();

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

  const isActivePath = (path) => {
    return location.pathname === path || 
           (path === '/campaigns' && location.pathname.startsWith('/content/'));
  };

  return (
    <header className="bg-primary-bg/95 backdrop-blur-sm border-b border-gray-700/30 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate('/campaigns')}
              className="flex-shrink-0"
            >
              <img 
                src="/toplogo.png" 
                alt="NewsLatch Studio Logo" 
                className="h-10 w-auto hover:opacity-80 transition-opacity"
              />
            </button>
            
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
            {children}
            <AuthComponent user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}