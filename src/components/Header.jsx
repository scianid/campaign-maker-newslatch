import { AuthComponent } from './AuthComponent';

export function Header({ user, children }) {
  return (
    <header className="bg-primary-bg/95 backdrop-blur-sm border-b border-gray-700/30 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <img 
            src="/toplogo.png" 
            alt="NewsLatch Studio Logo" 
            className="h-10 w-auto"
          />
          
          <div className="flex items-center gap-4">
            {children}
            <AuthComponent user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}