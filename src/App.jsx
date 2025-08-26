import React from "react";
import { AuthProvider } from './contexts/AuthContext';
import Routes from './Routes';
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <AuthProvider>
      <Routes />
      <Analytics />
    </AuthProvider>
  );
}

export default App;