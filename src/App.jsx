import React from "react";
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Routes from './Routes';
import { inject } from "@vercel/analytics";

function App() {
  // Initialize Vercel Analytics
  inject();
  
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;