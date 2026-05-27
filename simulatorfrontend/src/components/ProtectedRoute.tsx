/**
 * ProtectedRoute – route-level guard.
 * Supports `minRole` (hierarchical) or backwards-compatible `requireAdmin`.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermission, Role } from '../hooks/usePermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Minimum role required to access this route */
  minRole?: Role;
  /** @deprecated Use minRole="admin" instead */
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  minRole,
  requireAdmin,
}) => {
  const { user, loading } = useAuth();
  const { hasMinRole } = usePermission();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Support both new minRole and legacy requireAdmin
  const effectiveMinRole: Role | undefined = requireAdmin ? 'admin' : minRole;

  if (effectiveMinRole && !hasMinRole(effectiveMinRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;