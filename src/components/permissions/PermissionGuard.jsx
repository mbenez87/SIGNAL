import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Shield, AlertCircle } from "lucide-react";

/**
 * Permission Guard Component
 * Wraps UI elements to conditionally render based on user permissions
 * Implements least-privilege at the UI level
 */

export function PermissionGuard({ 
  children, 
  fallback = null, 
  requirePermission,
  resource,
  showMessage = false 
}) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // If permission check function provided, use it
  if (requirePermission && typeof requirePermission === 'function') {
    const hasPermission = requirePermission(resource, user);
    
    if (!hasPermission) {
      if (showMessage) {
        return (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">Insufficient Permissions</p>
              <p className="text-xs text-amber-700">You don't have permission to access this resource</p>
            </div>
          </div>
        );
      }
      return fallback;
    }
  }

  return <>{children}</>;
}

/**
 * Role-based Guard
 * Only renders children if user has the required role
 */
export function RoleGuard({ 
  children, 
  requiredRole, 
  fallback = null,
  showMessage = false 
}) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const hasRole = user?.role === requiredRole;

  if (!hasRole) {
    if (showMessage) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-900">Access Restricted</p>
            <p className="text-xs text-red-700">This feature requires {requiredRole} privileges</p>
          </div>
        </div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Admin-only Guard
 * Shortcut for admin-only features
 */
export function AdminGuard({ children, fallback = null, showMessage = false }) {
  return (
    <RoleGuard 
      requiredRole="admin" 
      fallback={fallback}
      showMessage={showMessage}
    >
      {children}
    </RoleGuard>
  );
}