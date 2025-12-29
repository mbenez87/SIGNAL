import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trash2, Search, RotateCcw, X, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { logDocumentRestore, logDocumentDelete, logBulkAction } from "../components/audit/AuditTracker";

export default function Trash() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch trashed documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['trashed-documents', searchQuery, user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      const docs = await base44.entities.Document.filter({ 
        is_trashed: true,
        created_by: user.email // Only show user's own documents
      }, '-trashed_date');

      // Client-side search filter
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return docs.filter(doc => 
          doc.title?.toLowerCase().includes(lowerQuery)
        );
      }

      return docs;
    },
  });

  // Restore document mutation
  const restoreDocMutation = useMutation({
    mutationFn: (docId) => 
      base44.entities.Document.update(docId, { 
        is_trashed: false, 
        trashed_date: null 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['trashed-documents']);
      queryClient.invalidateQueries(['documents']);
    },
  });

  // Permanently delete document mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries(['trashed-documents']);
    },
  });

  // Empty trash mutation
  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(documents.map(doc => base44.entities.Document.delete(doc.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trashed-documents']);
    },
  });

  const handleRestore = (docId) => {
    const doc = documents.find(d => d.id === docId);
    restoreDocMutation.mutate(docId);
    // Audit log restore
    if (doc) {
      logDocumentRestore(docId, doc.title);
    }
  };

  const handlePermanentDelete = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (confirm('Permanently delete this document? This action cannot be undone.')) {
      deleteDocMutation.mutate(docId);
      // Audit log permanent deletion
      if (doc) {
        logDocumentDelete(docId, doc.title, true);
      }
    }
  };

  const handleEmptyTrash = () => {
    if (confirm(`Permanently delete all ${documents.length} document(s) from trash? This action cannot be undone.`)) {
      // Audit log bulk permanent deletion
      const docIds = documents.map(d => d.id);
      logBulkAction('permanent_delete', 'document', docIds);
      
      emptyTrashMutation.mutate();
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      business: "bg-blue-100 text-blue-800",
      legal: "bg-purple-100 text-purple-800",
      financial: "bg-green-100 text-green-800",
      research: "bg-amber-100 text-amber-800",
      personal: "bg-pink-100 text-pink-800",
      academic: "bg-indigo-100 text-indigo-800",
      medical: "bg-red-100 text-red-800",
      marketing: "bg-orange-100 text-orange-800",
      hr: "bg-cyan-100 text-cyan-800",
      technical: "bg-slate-100 text-slate-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-7 h-7 text-slate-500" />
                Trash
              </h1>
              <p className="text-slate-600 mt-1">
                {documents.length} document{documents.length !== 1 ? 's' : ''} in trash
              </p>
            </div>
            
            {documents.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleEmptyTrash}
              >
                <Trash2 className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Empty Trash</span>
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search trashed documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Loading...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Trash is empty</h3>
            <p className="text-slate-500">
              Deleted documents will appear here
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
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Deleted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {doc.title}
                            </p>
                            <p className="text-sm text-slate-500">
                              {doc.file_type?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getCategoryColor(doc.category)}>
                          {doc.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {doc.trashed_date ? format(new Date(doc.trashed_date), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(doc.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePermanentDelete(doc.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {documents.length > 0 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Note:</strong> Documents in trash will be automatically deleted after 30 days. 
              Use "Empty Trash" to permanently delete all documents immediately.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}