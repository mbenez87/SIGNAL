import { base44 } from "@/api/base44Client";

/**
 * Client-side Audit Tracker
 * Simplified wrapper for logging user actions to immutable audit trail
 * Captures: User, Action, Time (automatic), IP Address (automatic)
 */

// Core audit logging function - creates IMMUTABLE records
async function logAuditAction(action_type, resource_type, resource_id, resource_title, details = {}, status = 'success', error_message = null) {
  try {
    await base44.functions.invoke('auditLogger', {
      action_type,
      resource_type,
      resource_id,
      resource_title,
      details,
      status,
      error_message
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw - audit failures shouldn't block user actions
  }
}

// Document-specific audit functions
export async function logDocumentView(documentId, documentTitle) {
  await logAuditAction('document_view', 'document', documentId, documentTitle);
}

export async function logDocumentDownload(documentId, documentTitle) {
  await logAuditAction('document_download', 'document', documentId, documentTitle);
}

export async function logDocumentDelete(documentId, documentTitle, permanent = false) {
  await logAuditAction(
    permanent ? 'document_permanent_delete' : 'document_delete', 
    'document', 
    documentId, 
    documentTitle,
    { permanent }
  );
}

export async function logDocumentRestore(documentId, documentTitle) {
  await logAuditAction('document_restore', 'document', documentId, documentTitle);
}

export async function logDocumentUpload(documentId, documentTitle, fileType, fileSize) {
  await logAuditAction('document_upload', 'document', documentId, documentTitle, {
    file_type: fileType,
    file_size: fileSize
  });
}

export async function logDocumentEdit(documentId, documentTitle, changes = {}) {
  await logAuditAction('document_edit', 'document', documentId, documentTitle, {
    changes
  });
}

export async function logDocumentShare(documentId, documentTitle, sharedWith) {
  await logAuditAction('share_document', 'document', documentId, documentTitle, {
    shared_with: sharedWith
  });
}

// Folder audit functions
export async function logFolderCreate(folderId, folderName) {
  await logAuditAction('folder_create', 'folder', folderId, folderName);
}

export async function logFolderDelete(folderId, folderName) {
  await logAuditAction('folder_delete', 'folder', folderId, folderName);
}

export async function logFolderUpdate(folderId, folderName, changes = {}) {
  await logAuditAction('folder_update', 'folder', folderId, folderName, {
    changes
  });
}

// AI and system audit functions
export async function logAIQuery(query, mode, documentCount) {
  await logAuditAction('ai_query', 'system', null, null, {
    query: query.substring(0, 500), // Limit query length
    mode,
    document_count: documentCount
  });
}

export async function logAIReportGeneration(reportType, documentIds) {
  await logAuditAction('ai_report_generation', 'system', null, null, {
    report_type: reportType,
    document_ids: documentIds,
    document_count: documentIds.length
  });
}

// Bulk operations
export async function logBulkAction(actionType, resourceType, resourceIds, details = {}) {
  await logAuditAction('bulk_action', resourceType, null, null, {
    action_type: actionType,
    resource_ids: resourceIds,
    count: resourceIds.length,
    ...details
  });
}

// User authentication audit
export async function logUserLogin() {
  await logAuditAction('user_login', 'user', null, null);
}

export async function logUserLogout() {
  await logAuditAction('user_logout', 'user', null, null);
}

// Settings and permissions
export async function logPermissionChange(resourceType, resourceId, resourceTitle, changes) {
  await logAuditAction('permission_change', resourceType, resourceId, resourceTitle, {
    changes
  });
}

export async function logSettingsChange(settingName, oldValue, newValue) {
  await logAuditAction('settings_change', 'system', null, null, {
    setting_name: settingName,
    old_value: oldValue,
    new_value: newValue
  });
}

// Data export audit
export async function logDataExport(exportType, recordCount) {
  await logAuditAction('export_data', 'system', null, null, {
    export_type: exportType,
    record_count: recordCount
  });
}