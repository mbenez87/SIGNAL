import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search, FileText, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AddDocumentsModal({ workspace, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocs, setSelectedDocs] = useState([]);
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch all documents not in this workspace
  const { data: availableDocuments = [], isLoading } = useQuery({
    queryKey: ['available-documents', workspace?.id, searchQuery, user?.email],
    queryFn: async () => {
      if (!user || !workspace) return [];
      
      const allDocs = await base44.entities.Document.filter({
        is_trashed: false,
        created_by: user.email
      }, '-created_date');

      // Filter out documents already in this workspace
      let filtered = allDocs.filter(doc => 
        doc.metadata?.workspace_id !== workspace.id &&
        doc.folder_id !== workspace.id
      );

      // Apply search
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(doc =>
          doc.title?.toLowerCase().includes(lowerQuery) ||
          doc.category?.toLowerCase().includes(lowerQuery)
        );
      }

      return filtered;
    },
    enabled: !!user && !!workspace,
  });

  // Add documents to workspace mutation
  const addDocsMutation = useMutation({
    mutationFn: async (docIds) => {
      const promises = docIds.map(docId => 
        base44.entities.Document.update(docId, {
          metadata: { workspace_id: workspace.id }
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace-documents']);
      queryClient.invalidateQueries(['workspaces']);
      toast.success(`${selectedDocs.length} document(s) added to workspace`);
      onClose();
    },
  });

  const handleToggleDoc = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleAddDocuments = () => {
    if (selectedDocs.length === 0) {
      toast.error("Please select at least one document");
      return;
    }
    addDocsMutation.mutate(selectedDocs);
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Add Documents to Workspace</h2>
            <p className="text-sm text-gray-400 mt-1">
              {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-800 transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-950 border-neutral-800 text-white"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading documents...</div>
            </div>
          ) : availableDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No documents found' : 'All documents are already in this workspace'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableDocuments.map((doc) => {
                const isSelected = selectedDocs.includes(doc.id);
                
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleToggleDoc(doc.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-white bg-neutral-800' 
                        : 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-white' : 'bg-neutral-950 border-2 border-neutral-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-black" />}
                      </div>
                      
                      <FileText className="w-8 h-8 text-gray-500 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(doc.category)}>
                            {doc.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {doc.file_type?.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(doc.created_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-transparent border-neutral-700 text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddDocuments}
            disabled={selectedDocs.length === 0 || addDocsMutation.isLoading}
            className="bg-white text-black hover:bg-gray-200"
          >
            {addDocsMutation.isLoading ? 'Adding...' : `Add ${selectedDocs.length} Document${selectedDocs.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}