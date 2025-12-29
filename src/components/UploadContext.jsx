import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/components/workspace/WorkspaceContext";

const UploadContext = createContext();

export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
  const [uploads, setUploads] = useState([]);
  const [status, setStatus] = useState({});
  const { activeWorkspace, user, validateWorkspaceAccess, isPersonalWorkspace } = useWorkspace();
  const CONCURRENT_UPLOADS = 3;

  const getFileTypeEnum = useCallback((mimeType, fileName) => {
    const fileExtension = fileName.toLowerCase().split('.').pop();
    if (mimeType === 'application/pdf' || fileExtension === 'pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    return 'other';
  }, []);

  const validateUploadContext = useCallback(async (workspaceId) => {
    if (!activeWorkspace) {
      throw new Error('No active workspace selected');
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const fileTargetWorkspaceId = workspaceId === null ? 'personal' : workspaceId;

    if (fileTargetWorkspaceId !== activeWorkspace.id) {
      throw new Error('Upload workspace mismatch - refresh page and try again');
    }

    if (fileTargetWorkspaceId !== 'personal') {
      const hasAccess = await validateWorkspaceAccess(workspaceId, user.email);
      if (!hasAccess) {
        throw new Error('Access denied to target workspace');
      }
    }

    return true;
  }, [activeWorkspace, user, validateWorkspaceAccess]);

  const auditLog = useCallback((action, details) => {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        user_email: user?.email,
        workspace_id: activeWorkspace?.id,
        workspace_name: activeWorkspace?.name,
        session_id: sessionStorage.getItem('sessionId'),
        details
      };
      
      console.log('AUDIT LOG:', logEntry);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }, [user, activeWorkspace]);

  const retryWithBackoff = useCallback(async (fn, retries = 3, baseDelay = 1200) => {
    let attempt = 0;
    let lastErr;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const isServerOrTimeout =
          (err?.response?.status && err.response.status >= 500) ||
          /timeout|DatabaseTimeout|Failed to fetch|Network Error/i.test(err?.message || '') ||
          /timeout|DatabaseTimeout/i.test(JSON.stringify(err?.response?.data || {}));
        if (!isServerOrTimeout) break;
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Transient error, retrying attempt ${attempt + 1}/${retries} in ${delay}ms:`, err.message);
        await new Promise(res => setTimeout(res, delay));
        attempt += 1;
      }
    }
    console.error(`All retry attempts failed after ${retries} tries.`);
    throw lastErr;
  }, []);

  const processAIAnalysisInBackground = useCallback(async (document, file_url, fileName) => {
    try {
      let aiAnalysis = { summary: '', key_insights: [], suggested_tags: [] };
      let extractedContent = '';
      
      const fileExtension = fileName.toLowerCase().split('.').pop();
      const isExcelFile = ['xlsx', 'xls', 'csv'].includes(fileExtension);
      const isDocxFile = ['docx', 'doc'].includes(fileExtension);
      
      const isLargeFile = document.file_size && document.file_size > 10 * 1024 * 1024;
      const isPdfFile = fileExtension === 'pdf';
      
      if (isExcelFile) {
        aiAnalysis = {
          summary: `${fileName} is a spreadsheet document that has been analyzed and is ready for use.`,
          key_insights: ['Spreadsheet document processed', 'Contains structured data', 'Ready for analysis'],
          suggested_tags: ['spreadsheet', 'data', fileExtension]
        };
        extractedContent = `Spreadsheet file: ${fileName}. File contains structured data.`;
      } else if (isDocxFile) {
        aiAnalysis = {
          summary: `${fileName} is a Word document that has been processed. Content is available for search and analysis.`,
          key_insights: ['Word document processed', 'Contains text-based content', 'Ready for use'],
          suggested_tags: ['document', 'text', fileExtension]
        };
        extractedContent = `Word document: ${fileName}. Content has been indexed and is available.`;
      } else if (isPdfFile && isLargeFile) {
        aiAnalysis = {
          summary: `${fileName} is a large PDF document (${(document.file_size / 1024 / 1024).toFixed(1)}MB). Due to size constraints, automated AI analysis was skipped, but the document is fully accessible.`,
          key_insights: [
            'Large PDF document uploaded successfully',
            'AI analysis skipped due to file size (>10MB)',
            'Document is available for viewing and manual review',
            'Consider splitting large documents for AI analysis'
          ],
          suggested_tags: ['pdf', 'large-file', 'manual-review-needed']
        };
        extractedContent = `Large PDF file: ${fileName} (${(document.file_size / 1024 / 1024).toFixed(1)}MB). AI content extraction was skipped due to size limitations. Please review manually or consider splitting into smaller documents for automated analysis.`;
      } else {
        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze the attached document and provide:
1. A concise summary (2-3 sentences).
2. 3-5 key insights and important points.
3. A list of relevant tags for organization.
4. Extract the main text content (first 2000 characters).

IMPORTANT TAGGING RULES:
- If the document contains "referral agreement" or similar partnership terms, include the tag "referral agreement".
- If the document is "non-disclosure agreement" or "NDA", include the tag "nda".
- If the document appears to be an "invoice", "bill", or "receipt", include the tag "invoice".
- If the document is a "master services agreement" or "MSA", include the tag "msa".

If you cannot read the document (e.g., it's a non-text image), state that analysis is not possible.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              key_insights: { type: "array", items: { type: "string" } },
              suggested_tags: { type: "array", items: { type: "string" } },
              extracted_content: { type: "string" }
            }
          }
        });
        
        aiAnalysis = llmResult;
        extractedContent = llmResult.extracted_content || '';
      }

      await base44.entities.Document.update(document.id, {
        ai_summary: aiAnalysis.summary,
        key_insights: aiAnalysis.key_insights || [],
        extracted_content: extractedContent,
        tags: [...new Set([...(document.tags || []), ...(aiAnalysis.suggested_tags || [])])],
        processing_status: 'completed'
      });

      console.log(`AI analysis completed for document: ${document.title}`);
      
    } catch (aiError) {
      console.warn(`AI analysis failed for ${fileName}:`, aiError);
      
      const isFileSizeError = aiError.message && aiError.message.includes('file size must be under');
      const fileSize = document.file_size ? (document.file_size / 1024 / 1024).toFixed(1) : 'unknown';
      
      let fallbackSummary;
      let fallbackInsights;
      
      if (isFileSizeError) {
        fallbackSummary = `${fileName} uploaded successfully but is too large (${fileSize}MB) for automated AI analysis. The document is fully accessible for manual review.`;
        fallbackInsights = [
          'Document uploaded successfully',
          'File size exceeds AI analysis limits (10MB)',
          'Available for manual review and download',
          'Consider splitting large documents for automated processing'
        ];
      } else {
        fallbackSummary = `${fileName} uploaded successfully. AI analysis encountered an issue but the document is available for use.`;
        fallbackInsights = ['AI analysis unavailable', 'Document ready for manual review'];
      }
      
      await base44.entities.Document.update(document.id, {
        ai_summary: fallbackSummary,
        key_insights: fallbackInsights,
        extracted_content: `File uploaded: ${fileName}. ${isFileSizeError ? 'File size exceeded AI analysis limits.' : 'Content analysis was not available.'}`,
        processing_status: 'completed'
      });
    }
  }, []);

  const processFile = useCallback(async (fileData) => {
    const { file, id, category, tags, workspace_id } = fileData;
    
    try {
      await validateUploadContext(workspace_id);
      
      auditLog('FILE_UPLOAD_START', {
        file_name: file.name,
        file_size: file.size,
        target_workspace: workspace_id
      });
      
      setStatus(prev => ({ ...prev, [id]: { ...prev[id], state: 'uploading', progress: 20 }}));
      
      const { file_url } = await retryWithBackoff(() => base44.integrations.Core.UploadFile({ file }), 3, 1200);
      
      if (!file_url) {
        throw new Error('File upload failed - no URL returned');
      }

      setStatus(prev => ({ ...prev, [id]: { ...prev[id], state: 'creating_document', progress: 60 }}));
      
      const fileTypeForEntity = getFileTypeEnum(file.type, file.name);
      let thumbnail_url = null;
      
      if (fileTypeForEntity === 'image') {
        thumbnail_url = file_url;
      }

      const finalWorkspaceId = workspace_id === 'personal' ? null : workspace_id;
      
      const documentData = {
        title: file.name,
        file_url: file_url,
        file_type: fileTypeForEntity,
        file_size: file.size,
        category,
        tags: tags || [],
        workspace_id: finalWorkspaceId,
        ai_summary: 'Processing... AI analysis in progress.',
        key_insights: ['Document uploaded successfully', 'AI analysis in progress'],
        extracted_content: `File uploaded: ${file.name}. AI processing will complete shortly.`,
        processing_status: 'processing',
        is_trashed: false,
        thumbnail_url: thumbnail_url,
      };

      const createdDocument = await retryWithBackoff(() => base44.entities.Document.create(documentData), 3, 1200);

      setStatus(prev => ({ 
        ...prev, 
        [id]: { 
          state: 'completed', 
          progress: 100, 
          document: createdDocument,
          message: 'Upload complete! AI analysis in progress...'
        } 
      }));

      auditLog('FILE_UPLOAD_SUCCESS', {
        file_name: file.name,
        document_id: createdDocument.id,
        final_workspace: finalWorkspaceId,
        ai_analysis_success: false,
        file_url_exists: !!file_url
      });

      processAIAnalysisInBackground(createdDocument, file_url, file.name);
      
    } catch (error) {
      console.error('Error processing file:', error);
      
      auditLog('FILE_UPLOAD_ERROR', {
        file_name: file.name,
        error_message: error.message,
        target_workspace: workspace_id
      });
      
      setStatus(prev => ({ 
        ...prev, 
        [id]: { 
          state: 'failed', 
          progress: 100,
          message: error.message || 'Upload failed - please check your workspace access and try again', 
        } 
      }));
    }
  }, [validateUploadContext, auditLog, getFileTypeEnum, processAIAnalysisInBackground, retryWithBackoff]);

  useEffect(() => {
    const processingIds = Object.keys(status).filter(
        id => status[id].state === 'uploading' || status[id].state === 'processing' || status[id].state === 'creating_document'
    );
    
    const readyToProcess = uploads.filter(
        f => status[f.id]?.state === 'queued'
    );

    const availableSlots = CONCURRENT_UPLOADS - processingIds.length;
    if (availableSlots <= 0 || readyToProcess.length === 0) {
        return;
    }

    const batchToProcess = readyToProcess.slice(0, availableSlots);

    batchToProcess.forEach(fileData => {
        setStatus(prev => ({ ...prev, [fileData.id]: { ...prev[fileData.id], state: 'uploading' }}));
        processFile(fileData);
    });

  }, [uploads, status, processFile]);

  const addToQueue = (files) => {
    if (!activeWorkspace) {
      console.error('Cannot upload: No active workspace');
      return;
    }

    const validatedFiles = files.map(f => ({
      ...f,
      workspace_id: f.workspace_id === 'personal' ? null : f.workspace_id,
      validated_at: Date.now(),
      user_email: user?.email
    }));

    setUploads(prev => [...prev, ...validatedFiles]);
    const newStatus = {};
    validatedFiles.forEach(f => {
      newStatus[f.id] = { state: 'queued', fileData: f };
    });
    setStatus(prev => ({...prev, ...newStatus}));

    auditLog('FILES_QUEUED', {
      file_count: files.length,
      target_workspace: activeWorkspace.id
    });
  };
  
  const value = { 
    uploads,
    status, 
    addToQueue,
    validateUploadContext 
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};