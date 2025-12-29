import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FilterPanel({ filters, onFilterChange, className = "" }) {
  return (
    <div className={`flex gap-3 ${className}`}>
      <Select
        value={filters.category}
        onValueChange={(value) => onFilterChange({ ...filters, category: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="business">Business</SelectItem>
          <SelectItem value="legal">Legal</SelectItem>
          <SelectItem value="financial">Financial</SelectItem>
          <SelectItem value="research">Research</SelectItem>
          <SelectItem value="personal">Personal</SelectItem>
          <SelectItem value="academic">Academic</SelectItem>
          <SelectItem value="medical">Medical</SelectItem>
          <SelectItem value="marketing">Marketing</SelectItem>
          <SelectItem value="hr">HR</SelectItem>
          <SelectItem value="technical">Technical</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.fileType}
        onValueChange={(value) => onFilterChange({ ...filters, fileType: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="File Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="docx">Word</SelectItem>
          <SelectItem value="xlsx">Excel</SelectItem>
          <SelectItem value="txt">Text</SelectItem>
          <SelectItem value="jpg">Image</SelectItem>
          <SelectItem value="png">PNG</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.dateRange}
        onValueChange={(value) => onFilterChange({ ...filters, dateRange: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}