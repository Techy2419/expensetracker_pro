import React from "react";
import { AuthProvider } from './contexts/AuthContext';
import Routes from './Routes';
import { inject } from "@vercel/analytics";

function App() {
  // Initialize Vercel Analytics
  inject();
  
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}

export default App;