import { base44 } from "@/api/base44Client";

/**
 * Permission Helper
 * Centralized utilities for Role-Based Access Control (RBAC)
 * Implements least-privilege enforcement
 */

// Permission levels (least to most privileged)
export const PERMISSIONS = {
  NONE: 'none',
  VIEW: 'view',
  EDIT: 'edit',
  ADMIN: 'admin'
};

// System-wide roles
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

/**
 * Check if user is system admin
 */
export function isSystemAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

/**
 * Check if user owns a resource
 */
export function isOwner(resource, user) {
  if (!resource || !user) return false;
  return resource.created_by === user.email || resource.owner === user.email;
}

/**
 * Get user's permission level for a document
 * Returns: 'admin', 'edit', 'view', or 'none'
 */
export function getDocumentPermission(document, user) {
  if (!document || !user) return PERMISSIONS.NONE;
  
  // System admins have full access
  if (isSystemAdmin(user)) return PERMISSIONS.ADMIN;
  
  // Owner has admin permission
  if (isOwner(document, user)) return PERMISSIONS.ADMIN;
  
  // Check shared_with array
  if (document.shared_with && Array.isArray(document.shared_with)) {
    const userPermission = document.shared_with.find(
      share => share.user_email === user.email
    );
    
    if (userPermission) {
      return userPermission.permission || PERMISSIONS.VIEW;
    }
  }
  
  return PERMISSIONS.NONE;
}

/**
 * Check if user can view document
 */
export function canViewDocument(document, user) {
  const permission = getDocumentPermission(document, user);
  return [PERMISSIONS.VIEW, PERMISSIONS.EDIT, PERMISSIONS.ADMIN].includes(permission);
}

/**
 * Check if user can edit document
 */
export function canEditDocument(document, user) {
  const permission = getDocumentPermission(document, user);
  return [PERMISSIONS.EDIT, PERMISSIONS.ADMIN].includes(permission);
}

/**
 * Check if user can delete document
 */
export function canDeleteDocument(document, user) {
  const permission = getDocumentPermission(document, user);
  return permission === PERMISSIONS.ADMIN;
}

/**
 * Check if user can share document
 */
export function canShareDocument(document, user) {
  const permission = getDocumentPermission(document, user);
  return permission === PERMISSIONS.ADMIN;
}

/**
 * Check if user can restore from trash
 */
export function canRestoreDocument(document, user) {
  // Only owner or system admin can restore
  return isOwner(document, user) || isSystemAdmin(user);
}

/**
 * Check if user can permanently delete
 */
export function canPermanentlyDelete(document, user) {
  // Only owner or system admin can permanently delete
  return isOwner(document, user) || isSystemAdmin(user);
}

/**
 * Get user's permission level for a folder
 */
export function getFolderPermission(folder, user) {
  if (!folder || !user) return PERMISSIONS.NONE;
  
  // System admins have full access
  if (isSystemAdmin(user)) return PERMISSIONS.ADMIN;
  
  // Owner has admin permission
  if (isOwner(folder, user)) return PERMISSIONS.ADMIN;
  
  return PERMISSIONS.NONE;
}

/**
 * Check if user can modify folder
 */
export function canModifyFolder(folder, user) {
  const permission = getFolderPermission(folder, user);
  return permission === PERMISSIONS.ADMIN;
}

/**
 * Check if user can delete folder
 */
export function canDeleteFolder(folder, user) {
  const permission = getFolderPermission(folder, user);
  return permission === PERMISSIONS.ADMIN;
}

/**
 * Check if user can create workspace resources
 */
export function canCreateResource(user) {
  // All authenticated users can create resources in their workspace
  return !!user;
}

/**
 * Check if user can access audit logs
 */
export function canAccessAuditLogs(user) {
  return isSystemAdmin(user);
}

/**
 * Check if user can access compliance page
 */
export function canAccessCompliance(user) {
  return isSystemAdmin(user);
}

/**
 * Format permission for display
 */
export function formatPermission(permission) {
  const labels = {
    [PERMISSIONS.VIEW]: 'Can View',
    [PERMISSIONS.EDIT]: 'Can Edit',
    [PERMISSIONS.ADMIN]: 'Full Access',
    [PERMISSIONS.NONE]: 'No Access'
  };
  return labels[permission] || 'Unknown';
}

/**
 * Get permission badge color
 */
export function getPermissionBadgeColor(permission) {
  const colors = {
    [PERMISSIONS.VIEW]: 'bg-blue-100 text-blue-800',
    [PERMISSIONS.EDIT]: 'bg-green-100 text-green-800',
    [PERMISSIONS.ADMIN]: 'bg-purple-100 text-purple-800',
    [PERMISSIONS.NONE]: 'bg-gray-100 text-gray-800'
  };
  return colors[permission] || colors[PERMISSIONS.NONE];
}