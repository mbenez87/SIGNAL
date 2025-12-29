import React from "react";

export function Progress({ value = 0, className = "" }) {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-200 ${className}`}>
      <div
        className="h-full bg-indigo-600 transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}