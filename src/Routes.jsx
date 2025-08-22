import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./pages/NotFound";
import ExpenseEntryScreen from './pages/expense-entry-screen';
import BudgetManagementScreen from './pages/budget-management-screen';
import ProfileSelectionScreen from './pages/profile-selection-screen';
import AuthenticationScreen from './pages/authentication-screen';
import ExpenseHistoryScreen from './pages/expense-history-screen';
import DashboardScreen from './pages/dashboard-screen';
import JoinProfileScreen from './pages/join-profile-screen';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<AuthenticationScreen />} />
        <Route path="/expense-entry-screen" element={<ExpenseEntryScreen />} />
        <Route path="/budget-management-screen" element={<BudgetManagementScreen />} />
        <Route path="/profile-selection-screen" element={<ProfileSelectionScreen />} />
        <Route path="/authentication-screen" element={<AuthenticationScreen />} />
        <Route path="/expense-history-screen" element={<ExpenseHistoryScreen />} />
        <Route path="/dashboard-screen" element={<DashboardScreen />} />
        <Route path="/join-profile/:shareCode" element={<JoinProfileScreen />} />
        <Route path="/join-profile" element={<JoinProfileScreen />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
