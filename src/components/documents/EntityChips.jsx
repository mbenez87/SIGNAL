import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Crosshair, User, Building2, MapPin, Calendar,
  ChevronDown, ChevronUp
} from "lucide-react";

const CATEGORY_CONFIG = {
  chemicals: {
    label: "Chemicals",
    icon: FlaskConical,
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    chipColor: "bg-red-500/10 text-red-300 border-red-500/20",
  },
  weapons: {
    label: "Weapons",
    icon: Crosshair,
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    chipColor: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  },
  people: {
    label: "People",
    icon: User,
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    chipColor: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  },
  organizations: {
    label: "Organizations",
    icon: Building2,
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    chipColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  },
  locations: {
    label: "Locations",
    icon: MapPin,
    color: "bg-green-500/15 text-green-400 border-green-500/30",
    chipColor: "bg-green-500/10 text-green-300 border-green-500/20",
  },
  dates: {
    label: "Dates",
    icon: Calendar,
    color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    chipColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  },
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
      {entity.confidence >= 0.9 && (
        <span className="text-[10px] opacity-60">{confidencePercent}%</span>
      )}
    </motion.div>
  );
}

function EntityCategory({ category, entities, config, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = config.icon;

  if (!entities || entities.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full group"
      >
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${config.color}`}>
          <Icon className="w-3 h-3" />
          <span className="text-xs font-medium">{config.label}</span>
          <span className="text-[10px] opacity-70">({entities.length})</span>
        </div>
        <div className="flex-1 border-t border-slate-700/50" />
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 pl-1">
              {entities.map((entity, idx) => (
                <EntityChip key={`${category}-${idx}`} entity={entity} config={config} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EntityChips({ entities, variant = "full" }) {
  if (!entities) return null;

  const totalCount = Object.values(entities).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  if (totalCount === 0) return null;

  // Compact variant: inline chips for all entities
  if (variant === "compact") {
    const allEntities = [];
    for (const [category, list] of Object.entries(entities)) {
      const config = CATEGORY_CONFIG[category];
      if (!config || !list) continue;
      for (const entity of list.slice(0, 3)) {
        allEntities.push({ ...entity, category, config });
      }
    }

    return (
      <div className="flex flex-wrap gap-1">
        {allEntities.slice(0, 8).map((entity, idx) => (
          <EntityChip key={idx} entity={entity} config={entity.config} />
        ))}
        {totalCount > 8 && (
          <span className="text-xs text-slate-500 self-center px-1">
            +{totalCount - 8} more
          </span>
        )}
      </div>
    );
  }

  // Summary variant: category counts only
  if (variant === "summary") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
          const count = entities[category]?.length || 0;
          if (count === 0) return null;
          const Icon = config.icon;
          return (
            <div
              key={category}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${config.color}`}
            >
              <Icon className="w-3 h-3" />
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full variant: categorized expandable sections
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">
          Extracted Entities
        </h4>
        <span className="text-xs text-slate-400">{totalCount} total</span>
      </div>
      {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
        <EntityCategory
          key={category}
          category={category}
          entities={entities[category]}
          config={config}
          defaultExpanded={true}
        />
      ))}
    </div>
  );
}
