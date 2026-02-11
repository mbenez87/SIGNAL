import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  FlaskConical, Crosshair, User, Building2, MapPin,
  FileText, ChevronDown, ChevronUp, Calendar, ArrowRight
} from "lucide-react";
import { format } from "date-fns";

const CATEGORY_ICONS = {
  chemicals: FlaskConical,
  weapons: Crosshair,
  people: User,
  organizations: Building2,
  locations: MapPin,
};

const CATEGORY_COLORS = {
  chemicals: "text-red-400 bg-red-500/10 border-red-500/20",
  weapons: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  people: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  organizations: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  locations: "text-green-400 bg-green-500/10 border-green-500/20",
};

function ThreadTimeline({ thread }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[thread.category] || FileText;
  const colorClass = CATEGORY_COLORS[thread.category] || "text-slate-400 bg-slate-500/10 border-slate-500/20";
  const previewDocs = expanded ? thread.documents : thread.documents.slice(0, 3);

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      {/* Thread Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-neutral-800/50 transition-colors"
      >
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colorClass}`}>
          <Icon className="w-3.5 h-3.5" />
          <span className="capitalize">{thread.entity}</span>
        </div>

        <div className="flex-1 text-left">
          <span className="text-xs text-slate-400">
            {thread.documents.length} document{thread.documents.length !== 1 ? "s" : ""} in thread
          </span>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {/* Timeline */}
      <AnimatePresence>
        <motion.div
          initial={false}
          animate={{ height: "auto" }}
          className="overflow-hidden"
        >
          <div className="px-3 pb-3">
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-2 top-0 bottom-0 w-px bg-neutral-700" />

              {previewDocs.map((doc, idx) => (
                <Link
                  key={doc.doc_id}
                  to={createPageUrl("DocumentViewer") + "?id=" + doc.doc_id}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative py-2 group cursor-pointer"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[18px] top-3 w-2.5 h-2.5 rounded-full bg-neutral-700 border-2 border-neutral-900 group-hover:bg-cyan-500 transition-colors" />

                    <div className="flex items-center gap-2 pl-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500">
                            {doc.created_date
                              ? format(new Date(doc.created_date), "MMM d, yyyy HH:mm")
                              : "Unknown date"}
                          </span>
                          {doc.confidence && (
                            <span className="text-[10px] text-slate-600">
                              ({Math.round(doc.confidence * 100)}% conf)
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  </motion.div>
                </Link>
              ))}

              {!expanded && thread.documents.length > 3 && (
                <div className="py-1 pl-2">
                  <span className="text-xs text-slate-500">
                    +{thread.documents.length - 3} more documents
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function ChronologicalThreads({ threads }) {
  const [showAll, setShowAll] = useState(false);

  if (!threads || threads.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-500">
        No entity threads found across documents
      </div>
    );
  }

  const visibleThreads = showAll ? threads : threads.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Entity Threads</h3>
        <span className="text-xs text-slate-400">
          {threads.length} thread{threads.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {visibleThreads.map((thread, idx) => (
          <ThreadTimeline key={`${thread.category}-${thread.entity}-${idx}`} thread={thread} />
        ))}
      </div>

      {threads.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center py-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {showAll ? "Show less" : `Show all ${threads.length} threads`}
        </button>
      )}
    </div>
  );
}
