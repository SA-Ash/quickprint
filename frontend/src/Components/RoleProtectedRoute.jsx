import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/auth.service';

/**
 * Role-based route protection component
 * Redirects users to their appropriate dashboard if they don't have the required role
 * 
 * @param {React.ReactNode} children - The protected component to render
 * @param {string[]} allowedRoles - Array of roles allowed to access this route
 */
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    // Not logged in, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Get current user
  const user = authService.getCurrentUser();
  const userRole = user?.role?.toUpperCase();
  
  // Check if user has an allowed role
  const hasAccess = allowedRoles.some(role => {
    const normalizedRole = role.toUpperCase();
    // Handle role aliases
    if (normalizedRole === 'PARTNER' || normalizedRole === 'SHOP') {
      return userRole === 'SHOP' || userRole === 'PARTNER';
    }
    return userRole === normalizedRole;
  });
  
  if (!hasAccess) {
    // User doesn't have the required role, redirect to their correct dashboard
    const correctRoute = authService.getDashboardRoute();
    console.log(`[RoleProtectedRoute] Access denied for role ${userRole}. Redirecting to ${correctRoute}`);
    return <Navigate to={correctRoute} replace />;
  }
  
  // User has access
  return children;
};

export default RoleProtectedRoute;
