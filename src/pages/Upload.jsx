import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Upload as UploadIcon, FileText, X, CheckCircle, 
  AlertCircle, Loader2, ArrowLeft 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { logDocumentUpload } from "../components/audit/AuditTracker";

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const fileObjects = newFiles.map(file => ({
      file,
      id: Math.random().toString(36),
      status: 'pending',
      progress: 0,
      error: null
    }));
    setFiles(prev => [...prev, ...fileObjects]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const fileObj = files[i];
      if (fileObj.status === 'completed') continue;

      // Add delay between documents (except for first one) to prevent rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'uploading', progress: 10 } : f
        ));

        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: fileObj.file
        });

        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, progress: 50 } : f
        ));

        // Create document record
        const fileExtension = fileObj.file.name.split('.').pop().toLowerCase();
        
        // For image files, use the file_url as thumbnail. For PDFs, generate thumbnail from first page
        let thumbnail_url = null;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        
        if (imageExtensions.includes(fileExtension)) {
          thumbnail_url = file_url;
        } else if (fileExtension === 'pdf') {
          try {
            // Generate thumbnail from PDF first page
            const result = await base44.functions.invoke('generatePdfThumbnail', { pdf_url: file_url });
            thumbnail_url = result.data.thumbnail_url;
          } catch (e) {
            console.error('Thumbnail generation failed:', e);
            // Continue without thumbnail if generation fails
          }
        }
        
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, progress: 80 } : f
        ));
        
        const newDocument = await base44.entities.Document.create({
          title: fileObj.file.name,
          file_url: file_url,
          thumbnail_url: thumbnail_url,
          file_type: fileExtension,
          file_size: fileObj.file.size,
          mime_type: fileObj.file.type,
          owner: user.email,
          processing_status: 'pending',
          category: 'other',
          tags: [],
          is_trashed: false,
          is_favorited: false,
          access_count: 0,
          version: 1
        });

        // Trigger AI processing in the background
        try {
          base44.functions.invoke('grokProcessing', {
            document_id: newDocument.id,
            file_url: file_url,
            file_type: fileExtension
          }).catch(err => console.error('Background processing error:', err));
        } catch (bgError) {
          console.error('Failed to trigger processing:', bgError);
        }

        // Audit log the upload
        logDocumentUpload(newDocument.id, newDocument.title, fileExtension, fileObj.file.size);

        // Mark as completed
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'completed', progress: 100 } : f
        ));

      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { 
            ...f, 
            status: 'error', 
            error: error.message || 'Upload failed' 
          } : f
        ));
      }
    }

    setUploading(false);
    
    // Redirect to Documents after upload completes
    setTimeout(() => {
      navigate(createPageUrl('Documents'));
    }, 500);
  };

  const allCompleted = files.length > 0 && files.every(f => f.status === 'completed');
  const hasErrors = files.some(f => f.status === 'error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Documents'))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Upload Documents</h1>
          <p className="text-slate-600 mt-2">
            Drag and drop files or click to browse
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 md:p-12 text-center bg-white hover:border-indigo-400 transition-colors cursor-pointer"
          onClick={() => document.getElementById('fileInput').click()}
        >
          <UploadIcon className="w-12 h-12 md:w-16 md:h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-slate-700 mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-slate-500 text-sm">
            Supports PDF, DOCX, TXT, images, and more (max 500MB per file)
          </p>
          <input
            id="fileInput"
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Files to Upload ({files.length})
            </h3>
            
            <div className="space-y-3">
              {files.map(fileObj => (
                <div
                  key={fileObj.id}
                  className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg"
                >
                  <FileText className="w-8 h-8 text-slate-400 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {fileObj.file.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {fileObj.status === 'uploading' && (
                      <Progress value={fileObj.progress} className="mt-2" />
                    )}
                    
                    {fileObj.error && (
                      <p className="text-sm text-red-600 mt-1">{fileObj.error}</p>
                    )}
                  </div>

                  {fileObj.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileObj.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}

                  {fileObj.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  )}

                  {fileObj.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}

                  {fileObj.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
              <Button
                onClick={uploadFiles}
                disabled={uploading || files.length === 0 || allCompleted}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : allCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    All Uploaded
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload {files.length} File{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}