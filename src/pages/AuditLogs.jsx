import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Search, Download, Filter, ChevronLeft, ChevronRight,
  FileText, Folder, User, Settings, AlertCircle, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7days");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch audit logs
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['auditLogs', page, actionFilter, statusFilter, dateRange, user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      // Admin users see all logs, regular users see only their own
      const query = user.role === 'admin' ? {} : { user_email: user.email };
      
      // Apply filters
      if (actionFilter !== "all") {
        query.action_type = actionFilter;
      }
      if (statusFilter !== "all") {
        query.status = statusFilter;
      }

      // Date range filtering (client-side for now)
      const logs = await base44.entities.AuditLog.list('-created_date', pageSize * 2);
      
      // Filter by date range
      const now = new Date();
      const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.created_date);
        const daysDiff = (now - logDate) / (1000 * 60 * 60 * 24);
        
        if (dateRange === "24hours") return daysDiff <= 1;
        if (dateRange === "7days") return daysDiff <= 7;
        if (dateRange === "30days") return daysDiff <= 30;
        if (dateRange === "90days") return daysDiff <= 90;
        return true;
      });

      return filteredLogs;
    },
    enabled: !!user,
  });

  // Filter by search query
  const filteredLogs = auditLogs.filter(log => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(lowerQuery) ||
      log.action_type?.toLowerCase().includes(lowerQuery) ||
      log.resource_title?.toLowerCase().includes(lowerQuery) ||
      log.resource_id?.toLowerCase().includes(lowerQuery)
    );
  });

  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
      case 'document': return FileText;
      case 'folder': return Folder;
      case 'user': return User;
      case 'system': return Settings;
      default: return Shield;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Success</Badge>;
      case 'failure':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Partial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource', 'Status', 'IP Address'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_date), 'yyyy-MM-dd HH:mm:ss'),
      log.user_email,
      log.action_type,
      log.resource_type,
      log.resource_title || log.resource_id || 'N/A',
      log.status,
      log.ip_address || 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Loading...</h2>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Restricted</h2>
          <p className="text-slate-500">Admin access required to view audit logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
          </div>
          <p className="text-slate-600">
            Complete audit trail of all user actions and system events
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="document_upload">Document Upload</SelectItem>
                <SelectItem value="document_view">Document View</SelectItem>
                <SelectItem value="document_download">Document Download</SelectItem>
                <SelectItem value="document_delete">Document Delete</SelectItem>
                <SelectItem value="ai_query">AI Query</SelectItem>
                <SelectItem value="user_login">User Login</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const ResourceIcon = getResourceIcon(log.resource_type);
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-slate-600">
                          {format(new Date(log.created_date), 'MMM d, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            {log.user_email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.action_type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <ResourceIcon className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="font-medium">{log.resource_title || 'N/A'}</div>
                              <div className="text-xs text-slate-500">{log.resource_type}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {log.ip_address || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details).substring(0, 50) + '...' : 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}