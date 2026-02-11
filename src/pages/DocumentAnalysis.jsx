import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Brain, Loader2, Play, CheckCircle, AlertTriangle,
  FileText, ShieldCheck, FlaskConical, Crosshair, User, Building2, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { batchAnalyzeDocuments, buildChronologicalThreads } from "@/services/documentAnalysis";
import ConfidenceScore from "../components/documents/ConfidenceScore";
import EntityChips from "../components/documents/EntityChips";
import ChronologicalThreads from "../components/documents/ChronologicalThreads";
import SemanticSearch from "../components/documents/SemanticSearch";

const ENTITY_ICONS = {
  chemicals: FlaskConical,
  weapons: Crosshair,
  people: User,
  organizations: Building2,
  locations: MapPin,
};

export default function DocumentAnalysis() {
  const [batchProgress, setBatchProgress] = useState(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Fetch all documents
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["allDocumentsAnalysis", user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Document.filter(
        { is_trashed: false },
        "-created_date"
      );
    },
    enabled: !!user,
  });

  // Compute analysis stats
  const stats = useMemo(() => {
    const analyzed = documents.filter((d) => d.metadata?.analysis?.embedding);
    const unanalyzed = documents.filter(
      (d) => !d.metadata?.analysis?.embedding && d.extracted_content
    );

    // Aggregate entity counts
    const entityCounts = { chemicals: 0, weapons: 0, people: 0, organizations: 0, locations: 0 };
    const allEntities = { chemicals: new Set(), weapons: new Set(), people: new Set(), organizations: new Set(), locations: new Set() };

    for (const doc of analyzed) {
      const entities = doc.metadata?.analysis?.entities;
      if (!entities) continue;
      for (const [cat, list] of Object.entries(entities)) {
        if (allEntities[cat] && Array.isArray(list)) {
          entityCounts[cat] += list.length;
          list.forEach((e) => allEntities[cat].add(e.text?.toLowerCase()));
        }
      }
    }

    // Average confidence
    const scores = analyzed
      .map((d) => d.metadata?.analysis?.confidence_score?.composite)
      .filter(Boolean);
    const avgConfidence =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Duplicates count
    const totalDuplicates = analyzed.reduce(
      (sum, d) => sum + (d.metadata?.analysis?.relationships?.duplicates?.length || 0),
      0
    );

    return {
      total: documents.length,
      analyzed: analyzed.length,
      unanalyzed: unanalyzed.length,
      entityCounts,
      uniqueEntities: Object.fromEntries(
        Object.entries(allEntities).map(([k, v]) => [k, v.size])
      ),
      avgConfidence,
      totalDuplicates,
    };
  }, [documents]);

  // Build chronological threads
  const threads = useMemo(() => {
    return buildChronologicalThreads(documents);
  }, [documents]);

  // Handle batch analysis
  const handleBatchAnalyze = async () => {
    const unanalyzed = documents.filter(
      (d) => !d.metadata?.analysis?.embedding && d.extracted_content
    );

    if (unanalyzed.length === 0) {
      toast.info("All documents have already been analyzed");
      return;
    }

    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: unanalyzed.length });

    try {
      await batchAnalyzeDocuments(unanalyzed, (current, total) => {
        setBatchProgress({ current, total });
      });

      toast.success(`Analysis complete: ${unanalyzed.length} documents processed`);
      refetch();
    } catch (error) {
      toast.error("Batch analysis encountered errors");
      console.error(error);
    } finally {
      setIsBatchRunning(false);
      setBatchProgress(null);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "threads", label: "Entity Threads" },
    { id: "search", label: "Semantic Search" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">SIGNAL87</p>
              <h1 className="text-xl md:text-2xl font-semibold text-white">
                Document Analysis
              </h1>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-1 ml-[52px]">
            Intelligence analysis, entity extraction, and document relationships
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Documents</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.analyzed} analyzed, {stats.unanalyzed} pending
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Avg Confidence</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.avgConfidence > 0 ? `${Math.round(stats.avgConfidence * 100)}%` : "--"}
            </p>
            <p className="text-xs text-slate-500 mt-1">composite score</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Entities</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {Object.values(stats.entityCounts).reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {Object.values(stats.uniqueEntities).reduce((a, b) => a + b, 0)} unique
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">Duplicates</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalDuplicates}</p>
            <p className="text-xs text-slate-500 mt-1">detected pairs</p>
          </motion.div>
        </div>

        {/* Batch Analysis Action */}
        {stats.unanalyzed > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isBatchRunning ? (
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
              <div>
                <p className="text-sm text-white font-medium">
                  {isBatchRunning
                    ? `Analyzing... ${batchProgress?.current || 0}/${batchProgress?.total || 0}`
                    : `${stats.unanalyzed} documents need analysis`}
                </p>
                <p className="text-xs text-slate-400">
                  {isBatchRunning
                    ? "Entity extraction and embedding generation in progress"
                    : "Run batch analysis to generate embeddings and extract entities"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleBatchAnalyze}
              disabled={isBatchRunning}
              className="bg-cyan-500 hover:bg-cyan-600 text-black"
              size="sm"
            >
              {isBatchRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Analyze All
                </>
              )}
            </Button>
          </div>
        )}

        {/* Batch complete message */}
        {stats.unanalyzed === 0 && stats.analyzed > 0 && (
          <div className="bg-neutral-900 border border-green-800/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-sm text-green-300">
              All {stats.analyzed} documents have been analyzed
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-neutral-900 rounded-lg p-1 border border-neutral-800 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-neutral-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Entity Distribution */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
              <h3 className="text-sm font-medium text-white mb-4">Entity Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(ENTITY_ICONS).map(([category, Icon]) => (
                  <div
                    key={category}
                    className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg"
                  >
                    <Icon className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-lg font-bold text-white">
                        {stats.uniqueEntities[category] || 0}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Analyzed Documents */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
              <h3 className="text-sm font-medium text-white mb-4">Recently Analyzed</h3>
              <div className="space-y-3">
                {documents
                  .filter((d) => d.metadata?.analysis)
                  .slice(0, 5)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-neutral-800/30 rounded-lg"
                    >
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{doc.title}</p>
                        {doc.metadata.analysis.entities && (
                          <div className="mt-1">
                            <EntityChips
                              entities={doc.metadata.analysis.entities}
                              variant="summary"
                            />
                          </div>
                        )}
                      </div>
                      {doc.metadata.analysis.confidence_score && (
                        <ConfidenceScore
                          confidenceScore={doc.metadata.analysis.confidence_score}
                          variant="badge"
                        />
                      )}
                    </div>
                  ))}
                {documents.filter((d) => d.metadata?.analysis).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No documents analyzed yet. Run batch analysis to get started.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "threads" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <ChronologicalThreads threads={threads} />
          </div>
        )}

        {activeTab === "search" && <SemanticSearch />}
      </div>
    </div>
  );
}
