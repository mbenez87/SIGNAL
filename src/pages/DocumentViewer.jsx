import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { safeApiCall, safeEntityOperation, safeFunctionCall } from "../components/utils/apiHelpers";
import {
  ArrowLeft, Download, Star, Trash2, ZoomIn, ZoomOut,
  Maximize2, Minimize2, FileText, Loader2, Sparkles, Share2, AlertCircle,
  History, MessageSquare, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ShareDocumentModal from "../components/permissions/ShareDocumentModal";
import VersionHistoryPanel from "../components/collaboration/VersionHistoryPanel";
import CommentThread from "../components/collaboration/CommentThread";
import ConfidenceScore from "../components/documents/ConfidenceScore";
import EntityChips from "../components/documents/EntityChips";
import DocumentRelationships from "../components/documents/DocumentRelationships";

export default function DocumentViewer() {
  const [zoom, setZoom] = useState(100);
  const [showSummary, setShowSummary] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get document ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const documentId = urlParams.get('id');

  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  // Fetch document (with access check)
  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', documentId, user?.email],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({
        id: documentId
      });

      if (!docs || docs.length === 0) {
        return null;
      }

      return docs[0];
    },
    enabled: !!documentId,
    retry: false,
  });

  // Redirect to login only if document requires authentication
  React.useEffect(() => {
    if (!isLoadingUser && !isLoading && !user && document && !document.public_access_enabled) {
      const returnUrl = `${window.location.pathname}?page=DocumentViewer&id=${documentId}`;
      base44.auth.redirectToLogin(returnUrl);
    }
  }, [user, isLoadingUser, document, isLoading, documentId]);

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: () =>
      safeEntityOperation('update', 'Document', documentId, { is_favorited: !document.is_favorited }),
    onSuccess: () => {
      queryClient.invalidateQueries(['document', documentId]);
      queryClient.invalidateQueries(['documents']);
    },
  });

  // Delete document mutation
  const deleteDocMutation = useMutation({
    mutationFn: () =>
      safeEntityOperation('update', 'Document', documentId, {
        is_trashed: true,
        trashed_date: new Date().toISOString()
      }),
    onSuccess: () => {
      navigate(createPageUrl('Documents'));
    },
  });



  const handleDelete = () => {
    if (confirm('Move this document to trash?')) {
      deleteDocMutation.mutate();
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      business: "bg-blue-100 text-blue-800",
      legal: "bg-purple-100 text-purple-800",
      financial: "bg-green-100 text-green-800",
      research: "bg-amber-100 text-amber-800",
      personal: "bg-pink-100 text-pink-800",
      academic: "bg-indigo-100 text-indigo-800",
      medical: "bg-red-100 text-red-800",
      marketing: "bg-orange-100 text-orange-800",
      hr: "bg-cyan-100 text-cyan-800",
      technical: "bg-slate-100 text-slate-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors.other;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!document && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Document not found</h2>
          <p className="text-sm text-slate-600 mb-4">
            This document doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate(createPageUrl('Documents'))}>
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : 'min-h-screen bg-slate-50'}`}>
      {/* Header */}
      <div className={`${isFullscreen ? 'bg-slate-800' : 'bg-white'} border-b ${isFullscreen ? 'border-slate-700' : 'border-slate-200'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12"
                onClick={() => navigate(createPageUrl('Documents'))}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </Button>

              <div className="flex-1 min-w-0">
                <h1 className={`text-xs sm:text-sm md:text-xl font-semibold ${isFullscreen ? 'text-white' : 'text-slate-900'} truncate`}>
                  {document.title}
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                  <Badge className={`${getCategoryColor(document.category)} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5`}>
                    {document.category}
                  </Badge>
                  <span className={`text-[10px] sm:text-xs md:text-sm ${isFullscreen ? 'text-slate-300' : 'text-slate-500'}`}>
                    {document.file_type?.toUpperCase()}
                  </span>
                </div>
              </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
              {/* Zoom Controls - Hidden on mobile and tablet */}
              {document.file_type === 'pdf' && (
                <div className="hidden lg:flex items-center gap-2 mr-2 lg:mr-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 lg:h-12 lg:w-12"
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                  >
                    <ZoomOut className="w-5 h-5 lg:w-6 lg:h-6" />
                  </Button>
                  <span className="text-xs lg:text-sm text-slate-600 w-10 lg:w-12 text-center font-semibold">
                    {zoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 lg:h-12 lg:w-12"
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                  >
                    <ZoomIn className="w-5 h-5 lg:w-6 lg:h-6" />
                  </Button>
                </div>
              )}

              {/* Fullscreen Toggle */}
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 ${isFullscreen ? 'bg-slate-700 text-white hover:bg-slate-600' : ''}`}
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                ) : (
                  <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                )}
              </Button>

              {/* AI Summary Toggle - Always visible */}
              {!isFullscreen && (
                <Button
                  variant={showSummary ? "default" : "outline"}
                  className={`h-8 sm:h-9 md:h-10 lg:h-12 px-3 sm:px-4 ${showSummary ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                  onClick={() => {
                    setShowSummary(!showSummary);
                    if (!showSummary) { setShowAnalysis(false); }
                    // If stuck in processing for >60s, show retry option
                    if ((document.processing_status === 'processing' || document.processing_status === 'pending') && document.updated_date) {
                      const timeSinceUpdate = Date.now() - new Date(document.updated_date).getTime();
                      if (timeSinceUpdate > 60000) {
                        console.warn('Document stuck in processing state for >60s');
                      }
                    }
                  }}
                >
                  {document.processing_status === 'processing' || document.processing_status === 'pending' ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-1.5" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold">
                    {document.processing_status === 'processing' ? 'Processing' :
                     document.processing_status === 'pending' ? 'Pending' :
                     document.processing_status === 'failed' ? 'Failed' : 'AI'}
                  </span>
                </Button>
              )}

              {/* Intelligence Analysis Toggle */}
              {!isFullscreen && document.metadata?.analysis && (
                <Button
                  variant={showAnalysis ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 ${showAnalysis ? "bg-cyan-600 hover:bg-cyan-700" : ""}`}
                  onClick={() => { setShowAnalysis(!showAnalysis); if (!showAnalysis) { setShowSummary(false); setShowVersionHistory(false); setShowComments(false); } }}
                  title="Intelligence Analysis"
                >
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 ${isFullscreen ? 'bg-slate-700 text-white hover:bg-slate-600' : ''}`}
                onClick={() => toggleFavoriteMutation.mutate()}
              >
                <Star className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${document.is_favorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 ${isFullscreen ? 'bg-slate-700 text-white hover:bg-slate-600' : ''}`}
                onClick={() => window.open(document.file_url, '_blank')}
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </Button>

              {!isFullscreen && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 hidden sm:flex ${showVersionHistory ? 'bg-cyan-600 text-white hover:bg-cyan-700' : ''}`}
                    onClick={() => {
                      setShowVersionHistory(!showVersionHistory);
                      setShowComments(false);
                      setShowAnalysis(false);
                    }}
                  >
                    <History className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 hidden sm:flex ${showComments ? 'bg-cyan-600 text-white hover:bg-cyan-700' : ''}`}
                    onClick={() => {
                      setShowComments(!showComments);
                      setShowVersionHistory(false);
                      setShowAnalysis(false);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 hidden sm:flex"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 hidden md:flex"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-50px)] sm:h-[calc(100vh-55px)] md:h-[calc(100vh-65px)]' : 'h-[calc(100vh-100px)] w-full px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4'}`}>
        <div className={`flex ${isFullscreen ? 'h-full' : 'flex-col lg:flex-row gap-2 sm:gap-3 md:gap-6 h-full'}`}>
          {/* Main Document Viewer */}
          <div className={`${isFullscreen ? 'flex-1 bg-slate-900' : 'flex-1 bg-white rounded-lg shadow-lg'} overflow-hidden h-full`}>
            {document.file_type === 'pdf' ? (
              <iframe
                src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(document.file_url)}`}
                className="w-full h-full"
                title={document.title}
              />
            ) : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(document.file_type?.toLowerCase()) ? (
              <div className={`flex items-center justify-center ${isFullscreen ? 'h-full' : 'p-8'}`}>
                <img
                  src={document.file_url}
                  alt={document.title}
                  className={`${isFullscreen ? 'max-h-full max-w-full object-contain' : 'max-w-full h-auto'}`}
                />
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className={`w-16 h-16 ${isFullscreen ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-4`} />
                <h3 className={`text-lg font-semibold ${isFullscreen ? 'text-white' : 'text-slate-700'} mb-2`}>
                  Preview not available
                </h3>
                <p className={`${isFullscreen ? 'text-slate-400' : 'text-slate-500'} mb-4`}>
                  This file type cannot be previewed in the browser
                </p>
                <Button onClick={() => window.open(document.file_url, '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar - AI Summary & Insights */}
          {!isFullscreen && showSummary && (
            <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 lg:sticky lg:top-24 mb-32">
                {document.processing_status === 'processing' || document.processing_status === 'pending' ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-900 mb-2">Processing Document</h3>
                    <p className="text-slate-600 text-sm mb-4">AI is analyzing this document. This usually takes 10-30 seconds.</p>
                    {document.updated_date && Date.now() - new Date(document.updated_date).getTime() > 60000 && (
                      <div className="mt-4">
                        <p className="text-amber-600 text-sm mb-2">Taking longer than expected?</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            safeFunctionCall('claudeDocumentProcessor', {
                              document_id: document.id,
                              file_url: document.file_url,
                              file_type: document.file_type
                            }).then(() => {
                              queryClient.invalidateQueries(['document', documentId]);
                            });
                          }}
                        >
                          Retry Processing
                        </Button>
                      </div>
                    )}
                  </div>
                ) : document.processing_status === 'failed' ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-900 mb-2">Processing Failed</h3>
                    <p className="text-slate-600 text-sm mb-4">{document.processing_error || 'An error occurred during processing.'}</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        safeFunctionCall('claudeDocumentProcessor', {
                          document_id: document.id,
                          file_url: document.file_url,
                          file_type: document.file_type
                        });
                        queryClient.invalidateQueries(['document', documentId]);
                      }}
                    >
                      Retry Processing
                    </Button>
                  </div>
                ) : document.ai_summary || (document.key_insights && document.key_insights.length > 0) ? (
                  <>
                    {document.ai_summary && (
                      <>
                        <h3 className="font-semibold text-slate-900 mb-3 text-sm md:text-base">AI Summary</h3>
                        <p className="text-slate-600 leading-relaxed text-xs md:text-sm">{document.ai_summary}</p>
                      </>
                    )}

                    {document.key_insights && document.key_insights.length > 0 && (
                      <>
                        <h3 className="font-semibold text-slate-900 mb-3 mt-4 md:mt-6 text-sm md:text-base">Key Insights</h3>
                        <ul className="space-y-2 pb-20">
                          {document.key_insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-indigo-600 mt-1 text-xs md:text-sm">•</span>
                              <span className="text-slate-600 text-xs md:text-sm">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-900 mb-2">No AI Analysis Yet</h3>
                    <p className="text-slate-600 text-sm">This document hasn't been processed yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Sidebar - Intelligence Analysis */}
          {!isFullscreen && showAnalysis && document.metadata?.analysis && (
            <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0">
              <div className="bg-neutral-900 rounded-lg shadow-sm p-4 md:p-6 lg:sticky lg:top-24 space-y-5 border border-neutral-800">
                <h3 className="font-semibold text-white text-sm md:text-base">Intelligence Analysis</h3>

                {/* Confidence Score */}
                {document.metadata.analysis.confidence_score && (
                  <ConfidenceScore
                    confidenceScore={document.metadata.analysis.confidence_score}
                    variant="full"
                  />
                )}

                {/* Extracted Entities */}
                {document.metadata.analysis.entities && (
                  <EntityChips
                    entities={document.metadata.analysis.entities}
                    variant="full"
                  />
                )}

                {/* Document Relationships */}
                {document.metadata.analysis.relationships && (
                  <DocumentRelationships
                    relationships={document.metadata.analysis.relationships}
                  />
                )}

                {/* Analysis Metadata */}
                {document.metadata.analysis.analyzed_at && (
                  <div className="pt-3 border-t border-neutral-800">
                    <p className="text-[10px] text-slate-500">
                      Analyzed: {new Date(document.metadata.analysis.analyzed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <ShareDocumentModal
          document={document}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Version History Drawer */}
      {showVersionHistory && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[500px] bg-neutral-900 shadow-2xl z-50 border-l border-neutral-800">
          <VersionHistoryPanel
            documentId={documentId}
            onClose={() => setShowVersionHistory(false)}
          />
        </div>
      )}

      {/* Comments Drawer */}
      {showComments && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[500px] bg-neutral-900 shadow-2xl z-50 border-l border-neutral-800">
          <CommentThread
            documentId={documentId}
            onClose={() => setShowComments(false)}
          />
        </div>
      )}
    </div>
  );
}
