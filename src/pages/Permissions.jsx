import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Search, Users, FileText, Folder, 
  Eye, Edit, Lock, AlertCircle, TrendingUp
} from "lucide-react";
import { AdminGuard } from "../components/permissions/PermissionGuard";
import { 
  formatPermission, 
  getPermissionBadgeColor,
  PERMISSIONS 
} from "../components/permissions/PermissionHelper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Permissions() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch all documents with sharing info (admin only)
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['all-documents-permissions'],
    queryFn: async () => {
      if (user?.role !== 'admin') return [];
      const docs = await base44.asServiceRole.entities.Document.filter({}, '-updated_date', 100);
      return docs.filter(doc => doc.shared_with && doc.shared_with.length > 0);
    },
    enabled: user?.role === 'admin',
  });

  // Calculate statistics
  const stats = {
    totalSharedDocs: documents.length,
    totalShares: documents.reduce((sum, doc) => sum + (doc.shared_with?.length || 0), 0),
    viewOnlyShares: documents.reduce((sum, doc) => 
      sum + (doc.shared_with?.filter(s => s.permission === PERMISSIONS.VIEW).length || 0), 0
    ),
    editShares: documents.reduce((sum, doc) => 
      sum + (doc.shared_with?.filter(s => s.permission === PERMISSIONS.EDIT).length || 0), 0
    ),
    adminShares: documents.reduce((sum, doc) => 
      sum + (doc.shared_with?.filter(s => s.permission === PERMISSIONS.ADMIN).length || 0), 0
    ),
  };

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.shared_with?.some(s => s.user_email.toLowerCase().includes(query))
    );
  });

  return (
    <AdminGuard showMessage>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-indigo-600" />
                  Access Control & Permissions
                </h1>
                <p className="text-slate-600 mt-1">
                  Role-Based Access Control (RBAC) with Least-Privilege Enforcement
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search documents or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Statistics */}
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Shared Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="text-2xl font-bold">{stats.totalSharedDocs}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Shares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">{stats.totalShares}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  View Only
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">{stats.viewOnlyShares}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Can Edit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold">{stats.editShares}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Full Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold">{stats.adminShares}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Principles */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Least-Privilege Security Model
                </h3>
                <p className="text-sm text-slate-700 mb-3">
                  Signal87 AI implements enterprise-grade Role-Based Access Control (RBAC) to ensure users only have access to what they need.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">View Permission</p>
                      <p className="text-xs text-slate-600">Read and download only</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Edit className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Edit Permission</p>
                      <p className="text-xs text-slate-600">View, download, and modify</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Admin Permission</p>
                      <p className="text-xs text-slate-600">Full control and sharing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-500">Loading permissions...</div>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No shared documents</h3>
              <p className="text-slate-500">
                {searchQuery ? 'No results found for your search' : 'No documents have been shared yet'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Shared With
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Permissions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {doc.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                {doc.file_type?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-900">{doc.created_by}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-900">
                            {doc.shared_with?.length || 0} user{doc.shared_with?.length !== 1 ? 's' : ''}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {doc.shared_with?.map((share, idx) => (
                              <Badge 
                                key={idx} 
                                className={`${getPermissionBadgeColor(share.permission)} text-xs`}
                              >
                                {share.user_email}: {formatPermission(share.permission)}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}