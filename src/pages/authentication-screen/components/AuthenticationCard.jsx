import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const AuthenticationCard = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setAuthError('');
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setAuthError(error);
        return;
      }
      
      // OAuth redirects automatically, no need to navigate manually
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard.');
        return;
      }
      setAuthError('Failed to authenticate with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e?.preventDefault();
    setIsEmailLoading(true);
    setAuthError('');

    try {
      const { email, password, fullName } = formData;
      
      if (!email || !password || (isSignUp && !fullName)) {
        setAuthError('Please fill in all required fields.');
        return;
      }

      let result;
      if (isSignUp) {
        result = await signUp(email, password, fullName);
      } else {
        result = await signIn(email, password);
      }

      if (result?.error) {
        setAuthError(result?.error);
        return;
      }

      // Navigate to profile selection on success
      navigate('/profile-selection-screen');
      
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive.');
        return;
      }
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setAuthError('');
    setFormData({
      email: '',
      password: '',
      fullName: ''
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card rounded-2xl shadow-modal p-8 border border-border">
      {/* App Logo */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
          <Icon name="DollarSign" size={32} color="white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">FinTrackr</h1>
      </div>
      {/* Welcome Message */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          {isSignUp ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {isSignUp ? 
            'Join thousands of users managing their finances with our platform.' :
            'Sign in to continue tracking your expenses and managing budgets.'
          }
        </p>
      </div>
      {/* Email/Password Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
        {isSignUp && (
          <Input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData?.fullName}
            onChange={handleInputChange}
            required
          />
        )}
        
        <Input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData?.email}
          onChange={handleInputChange}
          required
        />
        
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={formData?.password}
          onChange={handleInputChange}
          required
          minLength={6}
        />
        
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isEmailLoading}
          disabled={isGoogleLoading}
        >
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
      </form>
      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-card text-muted-foreground">or</span>
        </div>
      </div>
      {/* Google Authentication */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          loading={isGoogleLoading}
          disabled={isEmailLoading}
          onClick={handleGoogleAuth}
          iconName="Chrome"
          iconPosition="left"
          iconSize={20}
          className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
        >
          Continue with Google
        </Button>
      </div>
      {/* Error Message */}
      {authError && (
        <div className="mb-6 p-3 bg-error/10 border border-error/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-error">{authError}</p>
              {authError?.includes('Supabase') && (
                <button
                  onClick={() => navigator.clipboard?.writeText?.(authError)}
                  className="text-xs text-error/70 hover:text-error mt-1 underline"
                >
                  Copy error message
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Toggle Auth Mode */}
      <div className="text-center mb-6">
        <button
          onClick={toggleAuthMode}
          className="text-sm text-accent hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
      {/* Trust Signals */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-4 mb-3">
          <div className="flex items-center space-x-1">
            <Icon name="Shield" size={16} className="text-accent" />
            <span className="text-xs text-muted-foreground">Supabase Security</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="Lock" size={16} className="text-accent" />
            <span className="text-xs text-muted-foreground">Data Protection</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your financial data is encrypted and securely stored
        </p>
      </div>
      {/* Legal Links */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <button className="text-accent hover:underline">Terms of Service</button>
          {' '}and{' '}
          <button className="text-accent hover:underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
};

export default AuthenticationCard;