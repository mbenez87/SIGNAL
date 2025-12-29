import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Shield, FileText, AlertTriangle, CheckCircle, Clock, Search
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Compliance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch documents needing compliance review
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['complianceDocs', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const docs = await base44.entities.Document.filter({ 
        created_by: user.email,
        is_trashed: false 
      });
      
      // Filter docs needing attention
      return docs.filter(doc => {
        const needsClassification = !doc.data_classification;
        const needsRetention = !doc.retention_policy;
        const needsAudit = !doc.last_audit_date;
        return needsClassification || needsRetention || needsAudit;
      });
    },
    enabled: !!user,
  });

  // Update document compliance
  const updateComplianceMutation = useMutation({
    mutationFn: ({ docId, updates }) => 
      base44.entities.Document.update(docId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['complianceDocs']);
      toast.success('Compliance settings updated');
      setShowUpdateModal(false);
      setSelectedDoc(null);
    },
  });

  const handleQuickClassify = (doc, classification) => {
    updateComplianceMutation.mutate({
      docId: doc.id,
      updates: {
        data_classification: classification,
        last_audit_date: new Date().toISOString()
      }
    });
  };

  const getClassificationColor = (level) => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'internal': return 'bg-blue-100 text-blue-800';
      case 'confidential': return 'bg-orange-100 text-orange-800';
      case 'restricted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return doc.title?.toLowerCase().includes(lowerQuery);
  });

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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">Compliance Dashboard</h1>
          </div>
          <p className="text-slate-600">
            Manage data classification, retention policies, and compliance reviews
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Total Documents</h3>
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{documents.length}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Needs Classification</h3>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {documents.filter(d => !d.data_classification).length}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Needs Retention Policy</h3>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {documents.filter(d => !d.retention_policy).length}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Compliant</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {documents.filter(d => d.data_classification && d.retention_policy && d.last_audit_date).length}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Documents Requiring Review</h2>
          </div>
          
          <div className="divide-y divide-slate-200">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading documents...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-slate-600">All documents are compliant!</p>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <h3 className="font-medium text-slate-900">{doc.title}</h3>
                        {doc.data_classification && (
                          <Badge className={getClassificationColor(doc.data_classification)}>
                            {doc.data_classification}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="ml-8 space-y-1">
                        {!doc.data_classification && (
                          <div className="flex items-center gap-2 text-sm text-orange-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Missing data classification</span>
                          </div>
                        )}
                        {!doc.retention_policy && (
                          <div className="flex items-center gap-2 text-sm text-orange-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span>No retention policy set</span>
                          </div>
                        )}
                        {!doc.last_audit_date && (
                          <div className="flex items-center gap-2 text-sm text-orange-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Never audited</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Select onValueChange={(value) => handleQuickClassify(doc, value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Quick Classify" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="internal">Internal</SelectItem>
                          <SelectItem value="confidential">Confidential</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}