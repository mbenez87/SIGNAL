import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  Copy, GitBranch, Link2, FileText, Calendar, ArrowRight
} from "lucide-react";
import { format } from "date-fns";

const RELATIONSHIP_CONFIG = {
  duplicate: {
    label: "Duplicates",
    description: "Documents with identical or near-identical content",
    icon: Copy,
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    badgeColor: "bg-red-500/20 text-red-300",
    threshold: "95%+",
  },
  version: {
    label: "Versions",
    description: "Documents that appear to be different versions",
    icon: GitBranch,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10 border-yellow-500/20",
    badgeColor: "bg-yellow-500/20 text-yellow-300",
    threshold: "85-95%",
  },
  related: {
    label: "Related",
    description: "Documents covering similar topics",
    icon: Link2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    badgeColor: "bg-blue-500/20 text-blue-300",
    threshold: "70-85%",
  },
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
          <p className="text-sm text-white truncate group-hover:text-slate-200">
            {doc.title}
          </p>
          {doc.created_date && (
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500">
                {format(new Date(doc.created_date), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.badgeColor}`}>
            {similarityPercent}%
          </span>
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
        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded">
          {config.threshold} similarity
        </span>
        <span className="text-xs text-slate-400">({documents.length})</span>
      </div>
      <div className="space-y-1.5 pl-1">
        {documents.map((doc) => (
          <RelationshipCard key={doc.doc_id} doc={doc} config={config} />
        ))}
      </div>
    </div>
  );
}

export default function DocumentRelationships({ relationships }) {
  if (!relationships) return null;

  const { duplicates = [], versions = [], related = [] } = relationships;
  const totalRelated = duplicates.length + versions.length + related.length;

  if (totalRelated === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-500">
        No related documents found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Document Relationships</h3>
        <span className="text-xs text-slate-400">
          {totalRelated} connection{totalRelated !== 1 ? "s" : ""}
        </span>
      </div>

      <RelationshipSection
        type="duplicate"
        documents={duplicates}
        config={RELATIONSHIP_CONFIG.duplicate}
      />
      <RelationshipSection
        type="version"
        documents={versions}
        config={RELATIONSHIP_CONFIG.version}
      />
      <RelationshipSection
        type="related"
        documents={related}
        config={RELATIONSHIP_CONFIG.related}
      />
    </div>
  );
}
