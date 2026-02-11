import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ShieldCheck, Search, Brain, Database, Quote } from "lucide-react";

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

export default function ConfidenceScore({ confidenceScore, variant = "full" }) {
  const [expanded, setExpanded] = useState(false);

  if (!confidenceScore) return null;

  const compositeColors = getScoreColor(confidenceScore.composite);
  const compositePercent = Math.round(confidenceScore.composite * 100);

  // Compact variant: just the badge
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

  // Inline variant: single-line score
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 text-xs ${compositeColors.text}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-medium">{compositePercent}%</span>
          <span className="text-slate-500">confidence</span>
        </div>
        {confidenceScore.entity_count > 0 && (
          <span className="text-xs text-slate-500">
            ({confidenceScore.entity_count} entities)
          </span>
        )}
      </div>
    );
  }

  // Full variant: expandable card
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${compositeColors.bg}/20 flex items-center justify-center ring-1 ${compositeColors.ring}`}>
            <ShieldCheck className={`w-5 h-5 ${compositeColors.text}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">
              {compositePercent}% Confidence
            </p>
            <p className="text-xs text-slate-400">
              {getScoreLabel(confidenceScore.composite)} reliability
              {confidenceScore.entity_count > 0 && ` - ${confidenceScore.entity_count} entities detected`}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expanded breakdown */}
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
                return (
                  <ScoreBar key={key} label={label} score={score} icon={icon} />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
