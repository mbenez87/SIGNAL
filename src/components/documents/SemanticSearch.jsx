import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { semanticSearch } from "@/services/documentAnalysis";
import ConfidenceScore from "./ConfidenceScore";
import EntityChips from "./EntityChips";
import {
  Search, Loader2, FileText, Brain, SlidersHorizontal,
  ArrowRight, X, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function SemanticSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [threshold, setThreshold] = useState(0.3);
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef(null);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Fetch all documents for search
  const { data: allDocuments = [] } = useQuery({
    queryKey: ["allDocuments", user?.email],
    queryFn: async () => {
      if (!user) return [];
      const docs = await base44.entities.Document.filter(
        { is_trashed: false },
        "-created_date"
      );
      return docs;
    },
    enabled: !!user,
  });

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const searchResults = await semanticSearch(query, allDocuments, {
        threshold,
        maxResults: 20,
      });
      setResults(searchResults);
    } catch (error) {
      console.error("Semantic search failed:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, allDocuments, threshold, isSearching]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.8) return "text-green-400";
    if (similarity >= 0.6) return "text-yellow-400";
    if (similarity >= 0.4) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white">Semantic Search</h3>
            <p className="text-xs text-slate-400">Search by meaning, not just keywords</p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you're looking for..."
              className="pl-10 h-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500 focus:border-cyan-500/50"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="bg-cyan-500 hover:bg-cyan-600 text-black h-10 px-4"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className={`h-10 w-10 border-neutral-700 ${
              showSettings ? "bg-neutral-700 text-white" : "text-slate-400"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400">
                    Similarity Threshold
                  </label>
                  <span className="text-xs text-cyan-400 font-medium">
                    {Math.round(threshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={threshold * 100}
                  onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                  className="w-full mt-2 accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Broad</span>
                  <span>Strict</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      {results !== null && (
        <div className="max-h-[500px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No matching documents found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try broadening your search or lowering the threshold
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              <div className="px-4 py-2 bg-neutral-800/50">
                <span className="text-xs text-slate-400">
                  {results.length} result{results.length !== 1 ? "s" : ""} found
                </span>
              </div>
              {results.map((result, index) => (
                <Link
                  key={result.doc_id}
                  to={createPageUrl("DocumentViewer") + "?id=" + result.doc_id}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-cyan-300">
                            {result.title}
                          </h4>
                          <span
                            className={`text-xs font-medium ${getSimilarityColor(result.similarity)}`}
                          >
                            {Math.round(result.similarity * 100)}% match
                          </span>
                        </div>

                        {result.ai_summary && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                            {result.ai_summary}
                          </p>
                        )}

                        <div className="flex items-center gap-3 flex-wrap">
                          {result.category && (
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                              {result.category}
                            </span>
                          )}
                          {result.file_type && (
                            <span className="text-[10px] text-slate-500">
                              {result.file_type.toUpperCase()}
                            </span>
                          )}
                          {result.created_date && (
                            <span className="text-[10px] text-slate-500">
                              {format(new Date(result.created_date), "MMM d, yyyy")}
                            </span>
                          )}
                          {result.confidence && (
                            <ConfidenceScore
                              confidenceScore={result.confidence}
                              variant="badge"
                            />
                          )}
                        </div>

                        {result.entities && (
                          <div className="mt-2">
                            <EntityChips entities={result.entities} variant="compact" />
                          </div>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
