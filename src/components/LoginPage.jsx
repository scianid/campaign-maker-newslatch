import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { authService } from '../lib/supabase';
import { LogIn, Mail, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

export function LoginPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Get redirect path from location state, or default to /campaigns
  const from = location.state?.from || '/campaigns';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      if (isSignUp) {
        await authService.signUp(formData.email, formData.password);
        setSuccessMessage('Check your email for the confirmation link!');
        setFormData({ email: '', password: '', confirmPassword: '' });
      } else {
        await authService.signInWithEmail(formData.email, formData.password);
        // Redirect will happen automatically via useEffect when user state updates
      }
    } catch (error) {
      console.error('Error with email auth:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Back Button */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </Link>
          
          <img 
            src="/toplogo.png" 
            alt="NewsLatch Studio Logo" 
            className="h-12 w-auto mx-auto mb-6"
          />
          
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-text-paragraph">
            {isSignUp ? 'Sign up to start creating campaigns' : 'Sign in to your account'}
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-card-bg rounded-2xl shadow-2xl p-8 border border-gray-700/30">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">Email address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
                className="mt-1"
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                  className="pr-10"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  required
                  className="mt-1"
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMessage('');
              }}
              className="text-highlight hover:text-highlight/80 text-sm font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            By continuing, you agree to our{' '}
            <a href="#" className="text-highlight hover:text-highlight/80">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-highlight hover:text-highlight/80">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
