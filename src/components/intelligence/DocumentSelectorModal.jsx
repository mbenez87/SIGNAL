import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  X, Search, FileText, Check, Folder
} from "lucide-react";
import { format } from "date-fns";

export default function DocumentSelectorModal({ 
  selectedWorkspace, 
  selectedDocs, 
  onSelectDocs, 
  onClose 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelected, setLocalSelected] = useState(selectedDocs || []);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents-selector', searchQuery, user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      const query = {
        is_trashed: false,
        created_by: user.email, // Only show user's own documents
      };

      const docs = await base44.entities.Document.filter(query, '-created_date');

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return docs.filter(doc => 
          doc.title?.toLowerCase().includes(lowerQuery) ||
          doc.category?.toLowerCase().includes(lowerQuery)
        );
      }

      return docs;
    },
  });

  const handleToggleDoc = (doc) => {
    setLocalSelected(prev => {
      const exists = prev.find(d => d.id === doc.id);
      if (exists) {
        return prev.filter(d => d.id !== doc.id);
      } else {
        return [...prev, doc];
      }
    });
  };

  const handleConfirm = () => {
    onSelectDocs(localSelected);
    onClose();
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Select Documents</h2>
            <p className="text-sm text-slate-600 mt-1">
              {localSelected.length} document{localSelected.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-slate-200">
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

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-slate-500">Loading documents...</div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No documents found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const isSelected = localSelected.find(d => d.id === doc.id);
                
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleToggleDoc(doc)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-indigo-600' : 'bg-white border-2 border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      
                      <FileText className="w-8 h-8 text-slate-400 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(doc.category)}>
                            {doc.category}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {doc.file_type?.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">
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
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Confirm Selection ({localSelected.length})
          </Button>
        </div>
      </div>
    </div>
  );
}