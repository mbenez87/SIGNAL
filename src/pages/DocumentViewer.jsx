import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { safeApiCall, safeEntityOperation, safeFunctionCall } from "../components/utils/apiHelpers";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, Star, Trash2, ZoomIn, ZoomOut,
  Maximize2, Minimize2, FileText, Loader2, Sparkles, Share2, AlertCircle,
  History, MessageSquare, ShieldCheck, ChevronDown, ChevronUp, Search,
  Brain, Database, Quote, FlaskConical, Crosshair, User, Building2, MapPin,
  Calendar, Copy, GitBranch, Link2, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import ShareDocumentModal from "../components/permissions/ShareDocumentModal";
import VersionHistoryPanel from "../components/collaboration/VersionHistoryPanel";
import CommentThread from "../components/collaboration/CommentThread";

// ============================================================================
// INLINE: ConfidenceScore
// ============================================================================
const SCORE_LABELS = {
  composite: { label: "Overall Confidence", icon: ShieldCheck },
  retrieval: { label: "Retrieval Score", icon: Search },
  extraction: { label: "Extraction Accuracy", icon: Brain },
  source_reliability: { label: "Source Reliability", icon: Database },
  grounding: { label: "Grounding Score", icon: Quote },
};

function getScoreColor(score) {
  if (score >= 0.8) return { bg: "bg-green-500", text: "text-green-400", ring: "ring-green-500/30" };
  if (score >= 0.6) return { bg: "bg-yellow-500", text: "text-yellow-400", ring: "ring-yellow-500/30" };
  if (score >= 0.4) return { bg: "bg-orange-500", text: "text-orange-400", ring: "ring-orange-500/30" };
  return { bg: "bg-red-500", text: "text-red-400", ring: "ring-red-500/30" };
}

function getScoreLabel(score) {
  if (score >= 0.8) return "High";
  if (score >= 0.6) return "Medium";
  if (score >= 0.4) return "Low";
  return "Very Low";
}

function ScoreBar({ label, score, icon: Icon }) {
  const colors = getScoreColor(score);
  const percentage = Math.round(score * 100);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Icon className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400 truncate">{label}</span>
          <span className={`text-xs font-medium ${colors.text}`}>{percentage}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full ${colors.bg} rounded-full`}
          />
        </div>
      </div>
    </div>
  );
}

function ConfidenceScore({ confidenceScore, variant = "full" }) {
  const [expanded, setExpanded] = useState(false);
  if (!confidenceScore) return null;

  const compositeColors = getScoreColor(confidenceScore.composite);
  const compositePercent = Math.round(confidenceScore.composite * 100);

  if (variant === "badge") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${compositeColors.bg}/20 ${compositeColors.text} ring-1 ${compositeColors.ring}`}
        title={`Confidence: ${compositePercent}%`}
      >
        <ShieldCheck className="w-3 h-3" />
        <span>{compositePercent}%</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 text-xs ${compositeColors.text}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-medium">{compositePercent}%</span>
          <span className="text-slate-500">confidence</span>
        </div>
        {confidenceScore.entity_count > 0 && (
          <span className="text-xs text-slate-500">({confidenceScore.entity_count} entities)</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${compositeColors.bg}/20 flex items-center justify-center ring-1 ${compositeColors.ring}`}>
            <ShieldCheck className={`w-5 h-5 ${compositeColors.text}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">{compositePercent}% Confidence</p>
            <p className="text-xs text-slate-400">
              {getScoreLabel(confidenceScore.composite)} reliability
              {confidenceScore.entity_count > 0 && ` - ${confidenceScore.entity_count} entities detected`}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-slate-700/50">
              {Object.entries(SCORE_LABELS).map(([key, { label, icon }]) => {
                if (key === "composite") return null;
                const score = confidenceScore[key];
                if (score === undefined || score === null) return null;
                return <ScoreBar key={key} label={label} score={score} icon={icon} />;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// INLINE: EntityChips
// ============================================================================
const ENTITY_CATEGORY_CONFIG = {
  chemicals: { label: "Chemicals", icon: FlaskConical, color: "bg-red-500/15 text-red-400 border-red-500/30", chipColor: "bg-red-500/10 text-red-300 border-red-500/20" },
  weapons: { label: "Weapons", icon: Crosshair, color: "bg-orange-500/15 text-orange-400 border-orange-500/30", chipColor: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  people: { label: "People", icon: User, color: "bg-blue-500/15 text-blue-400 border-blue-500/30", chipColor: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  organizations: { label: "Organizations", icon: Building2, color: "bg-purple-500/15 text-purple-400 border-purple-500/30", chipColor: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
  locations: { label: "Locations", icon: MapPin, color: "bg-green-500/15 text-green-400 border-green-500/30", chipColor: "bg-green-500/10 text-green-300 border-green-500/20" },
  dates: { label: "Dates", icon: Calendar, color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30", chipColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
};

function EntityChip({ entity, config }) {
  const Icon = config.icon;
  const confidencePercent = Math.round((entity.confidence || 0) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${config.chipColor} cursor-default`}
      title={`${entity.text} (${confidencePercent}% confidence, source: ${entity.source || "unknown"})`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate max-w-[150px]">{entity.text}</span>
      {entity.confidence >= 0.9 && <span className="text-[10px] opacity-60">{confidencePercent}%</span>}
    </motion.div>
  );
}

function EntityCategory({ category, entities, config, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = config.icon;
  if (!entities || entities.length === 0) return null;
  return (
    <div className="space-y-2">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 w-full group">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${config.color}`}>
          <Icon className="w-3 h-3" />
          <span className="text-xs font-medium">{config.label}</span>
          <span className="text-[10px] opacity-70">({entities.length})</span>
        </div>
        <div className="flex-1 border-t border-slate-700/50" />
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="flex flex-wrap gap-1.5 pl-1">
              {entities.map((entity, idx) => <EntityChip key={`${category}-${idx}`} entity={entity} config={config} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EntityChips({ entities, variant = "full" }) {
  if (!entities) return null;
  const totalCount = Object.values(entities).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  if (totalCount === 0) return null;

  if (variant === "compact") {
    const allEntities = [];
    for (const [category, list] of Object.entries(entities)) {
      const config = ENTITY_CATEGORY_CONFIG[category];
      if (!config || !list) continue;
      for (const entity of list.slice(0, 3)) allEntities.push({ ...entity, category, config });
    }
    return (
      <div className="flex flex-wrap gap-1">
        {allEntities.slice(0, 8).map((entity, idx) => <EntityChip key={idx} entity={entity} config={entity.config} />)}
        {totalCount > 8 && <span className="text-xs text-slate-500 self-center px-1">+{totalCount - 8} more</span>}
      </div>
    );
  }

  if (variant === "summary") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(ENTITY_CATEGORY_CONFIG).map(([category, config]) => {
          const count = entities[category]?.length || 0;
          if (count === 0) return null;
          const Icon = config.icon;
          return (
            <div key={category} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${config.color}`}>
              <Icon className="w-3 h-3" /><span>{count}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Extracted Entities</h4>
        <span className="text-xs text-slate-400">{totalCount} total</span>
      </div>
      {Object.entries(ENTITY_CATEGORY_CONFIG).map(([category, config]) => (
        <EntityCategory key={category} category={category} entities={entities[category]} config={config} defaultExpanded={true} />
      ))}
    </div>
  );
}

// ============================================================================
// INLINE: DocumentRelationships
// ============================================================================
const RELATIONSHIP_CONFIG = {
  duplicate: { label: "Duplicates", icon: Copy, color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20", badgeColor: "bg-red-500/20 text-red-300", threshold: "95%+" },
  version: { label: "Versions", icon: GitBranch, color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20", badgeColor: "bg-yellow-500/20 text-yellow-300", threshold: "85-95%" },
  related: { label: "Related", icon: Link2, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20", badgeColor: "bg-blue-500/20 text-blue-300", threshold: "70-85%" },
};

function RelationshipCard({ doc, config }) {
  const similarityPercent = Math.round(doc.similarity * 100);
  return (
    <Link to={createPageUrl("DocumentViewer") + "?id=" + doc.doc_id}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-3 p-3 rounded-lg border ${config.bgColor} hover:bg-slate-700/30 transition-colors group cursor-pointer`}
      >
        <FileText className={`w-4 h-4 ${config.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate group-hover:text-slate-200">{doc.title}</p>
          {doc.created_date && (
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500">{format(new Date(doc.created_date), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.badgeColor}`}>{similarityPercent}%</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </motion.div>
    </Link>
  );
}

function RelationshipSection({ type, documents, config }) {
  if (!documents || documents.length === 0) return null;
  const Icon = config.icon;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <h4 className="text-sm font-medium text-white">{config.label}</h4>
        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded">{config.threshold} similarity</span>
        <span className="text-xs text-slate-400">({documents.length})</span>
      </div>
      <div className="space-y-1.5 pl-1">
        {documents.map((doc) => <RelationshipCard key={doc.doc_id} doc={doc} config={config} />)}
      </div>
    </div>
  );
}

function DocumentRelationships({ relationships }) {
  if (!relationships) return null;
  const { duplicates = [], versions = [], related = [] } = relationships;
  const totalRelated = duplicates.length + versions.length + related.length;
  if (totalRelated === 0) {
    return <div className="text-center py-4 text-xs text-slate-500">No related documents found</div>;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Document Relationships</h3>
        <span className="text-xs text-slate-400">{totalRelated} connection{totalRelated !== 1 ? "s" : ""}</span>
      </div>
      <RelationshipSection type="duplicate" documents={duplicates} config={RELATIONSHIP_CONFIG.duplicate} />
      <RelationshipSection type="version" documents={versions} config={RELATIONSHIP_CONFIG.version} />
      <RelationshipSection type="related" documents={related} config={RELATIONSHIP_CONFIG.related} />
    </div>
  );
}

// ============================================================================
// MAIN: DocumentViewer
// ============================================================================
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
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-neutral-950' : 'min-h-screen bg-neutral-950'}`}>
      {/* Header */}
      <div className={`${isFullscreen ? 'bg-neutral-950' : 'bg-neutral-950'} border-b ${isFullscreen ? 'border-neutral-800' : 'border-neutral-800'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white hover:bg-neutral-800"
                onClick={() => navigate(createPageUrl('Documents'))}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xs sm:text-sm md:text-xl font-semibold text-white truncate">
                  {document.title}
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                  <Badge className={`${getCategoryColor(document.category)} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5`}>
                    {document.category}
                  </Badge>
                  <span className="text-[10px] sm:text-xs md:text-sm text-neutral-400">
                    {document.file_type?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
              {/* Zoom Controls */}
              {(document.file_type === 'pdf' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(document.file_type?.toLowerCase())) && (
                <div className="hidden lg:flex items-center gap-2 mr-2 lg:mr-4">
                  <Button variant="outline" size="icon" className="h-10 w-10 lg:h-12 lg:w-12 border-neutral-700 text-white bg-transparent hover:bg-neutral-800" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                    <ZoomOut className="w-5 h-5 lg:w-6 lg:h-6" />
                  </Button>
                  <span className="text-xs lg:text-sm text-white w-10 lg:w-12 text-center font-semibold">{zoom}%</span>
                  <Button variant="outline" size="icon" className="h-10 w-10 lg:h-12 lg:w-12 border-neutral-700 text-white bg-transparent hover:bg-neutral-800" onClick={() => setZoom(Math.min(400, zoom + 25))}>
                    <ZoomIn className="w-5 h-5 lg:w-6 lg:h-6" />
                  </Button>
                </div>
              )}

              {/* Fullscreen Toggle */}
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 border-neutral-700 text-white hover:bg-neutral-800 bg-transparent ${isFullscreen ? 'bg-neutral-800' : ''}`}
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              </Button>

              {/* Intelligence Analysis Toggle */}
              {!isFullscreen && document.metadata?.analysis && (
                <Button
                  variant={showAnalysis ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 border-neutral-700 text-white hover:bg-neutral-800 bg-transparent ${showAnalysis ? "bg-cyan-600 hover:bg-cyan-700 border-cyan-600" : ""}`}
                  onClick={() => { setShowAnalysis(!showAnalysis); if (!showAnalysis) { setShowSummary(false); setShowVersionHistory(false); setShowComments(false); } }}
                  title="Intelligence Analysis"
                >
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </Button>
              )}

              <Button
                variant="outline" size="icon"
                className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 border-neutral-700 text-white hover:bg-neutral-800 bg-transparent ${isFullscreen ? 'bg-neutral-800' : ''}`}
                onClick={() => toggleFavoriteMutation.mutate()}
              >
                <Star className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${document.is_favorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>

              <Button
                variant="outline" size="icon"
                className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 border-neutral-700 text-white hover:bg-neutral-800 bg-transparent ${isFullscreen ? 'bg-neutral-800' : ''}`}
                onClick={() => window.open(document.file_url, '_blank')}
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </Button>

              {!isFullscreen && (
                <>
                  <Button
                    variant="outline" size="icon"
                    className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 hidden sm:flex border-neutral-700 text-white hover:bg-neutral-800 bg-transparent ${showVersionHistory ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-600' : ''}`}
                    onClick={() => { setShowVersionHistory(!showVersionHistory); setShowComments(false); setShowAnalysis(false); }}
                  >
                    <History className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </Button>
                  <Button
                    variant="outline" size="icon"
                    className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 hidden sm:flex border-neutral-700 text-white hover:bg-neutral-800 bg-transparent ${showComments ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-600' : ''}`}
                    onClick={() => { setShowComments(!showComments); setShowVersionHistory(false); setShowAnalysis(false); }}
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 hidden sm:flex border-neutral-700 text-white hover:bg-neutral-800 bg-transparent" onClick={() => setShowShareModal(true)}>
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 hidden md:flex border-neutral-700 text-white hover:bg-neutral-800 bg-transparent" onClick={handleDelete}>
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
          <div className={`${isFullscreen ? 'flex-1 bg-slate-900' : 'flex-1 bg-white rounded-lg shadow-lg'} h-full relative`}>
            {document.file_type === 'pdf' ? (
              <iframe
                src={document.file_url}
                className="w-full h-full"
                title={document.title}
              />
            ) : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(document.file_type?.toLowerCase()) ? (
              <div className={`flex items-center justify-center overflow-auto ${isFullscreen ? 'h-full' : 'h-full p-8'}`}>
                <img
                  src={document.file_url}
                  alt={document.title}
                  style={{ width: `${zoom}%`, maxWidth: 'none', transition: 'width 0.2s ease-in-out' }}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className={`w-16 h-16 ${isFullscreen ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-4`} />
                <h3 className={`text-lg font-semibold ${isFullscreen ? 'text-white' : 'text-slate-700'} mb-2`}>Preview not available</h3>
                <p className={`${isFullscreen ? 'text-slate-400' : 'text-slate-500'} mb-4`}>This file type cannot be previewed in the browser</p>
                <Button onClick={() => window.open(document.file_url, '_blank')}>
                  <Download className="w-4 h-4 mr-2" />Download File
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar - AI Summary & Insights */}
          {!isFullscreen && showSummary && (
            <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0">
              <div className="bg-neutral-900 rounded-lg shadow-sm p-4 md:p-6 lg:sticky lg:top-24 mb-32 border border-neutral-800">
                {document.processing_status === 'processing' || document.processing_status === 'pending' ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-white mb-2">Processing Document</h3>
                    <p className="text-slate-400 text-sm mb-4">AI is analyzing this document. This usually takes 10-30 seconds.</p>
                    {document.updated_date && Date.now() - new Date(document.updated_date).getTime() > 60000 && (
                      <div className="mt-4">
                        <p className="text-amber-600 text-sm mb-2">Taking longer than expected?</p>
                        <Button size="sm" onClick={() => { safeFunctionCall('claudeDocumentProcessor', { document_id: document.id, file_url: document.file_url, file_type: document.file_type }).then(() => { queryClient.invalidateQueries(['document', documentId]); }); }}>
                          Retry Processing
                        </Button>
                      </div>
                    )}
                  </div>
                ) : document.processing_status === 'failed' ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-white mb-2">Processing Failed</h3>
                    <p className="text-slate-400 text-sm mb-4">{document.processing_error || 'An error occurred during processing.'}</p>
                    <Button size="sm" onClick={() => { safeFunctionCall('claudeDocumentProcessor', { document_id: document.id, file_url: document.file_url, file_type: document.file_type }); queryClient.invalidateQueries(['document', documentId]); }}>
                      Retry Processing
                    </Button>
                  </div>
                ) : document.ai_summary || (document.key_insights && document.key_insights.length > 0) ? (
                  <>
                    {document.ai_summary && (
                      <>
                        <h3 className="font-semibold text-white mb-3 text-sm md:text-base">AI Summary</h3>
                        <p className="text-slate-300 leading-relaxed text-xs md:text-sm">{document.ai_summary}</p>
                      </>
                    )}
                    {document.key_insights && document.key_insights.length > 0 && (
                      <>
                        <h3 className="font-semibold text-white mb-3 mt-4 md:mt-6 text-sm md:text-base">Key Insights</h3>
                        <ul className="space-y-2 pb-20">
                          {document.key_insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-indigo-600 mt-1 text-xs md:text-sm">•</span>
                              <span className="text-slate-300 text-xs md:text-sm">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-white mb-2">No AI Analysis Yet</h3>
                    <p className="text-slate-400 text-sm">This document hasn't been processed yet.</p>
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
                {document.metadata.analysis.confidence_score && (
                  <ConfidenceScore confidenceScore={document.metadata.analysis.confidence_score} variant="full" />
                )}
                {document.metadata.analysis.entities && (
                  <EntityChips entities={document.metadata.analysis.entities} variant="full" />
                )}
                {document.metadata.analysis.relationships && (
                  <DocumentRelationships relationships={document.metadata.analysis.relationships} />
                )}
                {document.metadata.analysis.analyzed_at && (
                  <div className="pt-3 border-t border-neutral-800">
                    <p className="text-[10px] text-slate-500">Analyzed: {new Date(document.metadata.analysis.analyzed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <ShareDocumentModal document={document} onClose={() => setShowShareModal(false)} />
      )}

      {showVersionHistory && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[500px] bg-neutral-900 shadow-2xl z-50 border-l border-neutral-800">
          <VersionHistoryPanel documentId={documentId} onClose={() => setShowVersionHistory(false)} />
        </div>
      )}

      {showComments && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[500px] bg-neutral-900 shadow-2xl z-50 border-l border-neutral-800">
          <CommentThread documentId={documentId} onClose={() => setShowComments(false)} />
        </div>
      )}
    </div>
  );
}
