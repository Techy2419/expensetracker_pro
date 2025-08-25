import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AuthenticationCard from './components/AuthenticationCard';
import AuthenticationBackground from './components/AuthenticationBackground';
import LoadingOverlay from './components/LoadingOverlay';

const AuthenticationScreen = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Helmet>
        <title>Sign In - FinTrackr</title>
        <meta name="description" content="Sign in to FinTrackr to manage your expenses, track budgets, and achieve your financial goals." />
        <meta name="keywords" content="expense tracker, budget management, financial planning, sign in, authentication" />
      </Helmet>

      <AuthenticationBackground>
        <div className="flex flex-col items-center justify-center min-h-screen">
          {/* Main Authentication Card */}
          <AuthenticationCard />

          {/* Additional Information */}
          <div className="mt-8 text-center max-w-md">
            <div className="flex items-center justify-center space-x-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">10K+</div>
                <div className="text-xs text-muted-foreground">Active Users</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">$2M+</div>
                <div className="text-xs text-muted-foreground">Tracked Expenses</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">99.9%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Join thousands of users who have taken control of their finances
            </p>
          </div>
        </div>
      </AuthenticationBackground>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isInitialLoading} 
        message="Loading FinTrackr..." 
      />
    </>
  );
};

export default AuthenticationScreen;