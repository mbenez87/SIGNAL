import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateFolderModal from "../components/documents/CreateFolderModal";
import { 
  Upload, Search, Grid3x3, List, 
  Filter, SortAsc, Star, Trash2, LayoutGrid, CheckSquare, X, FolderPlus
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import DocumentGrid from "../components/documents/DocumentGrid";
import DocumentList from "../components/documents/DocumentList";
import FilterPanel from "../components/documents/FilterPanel";
import ThumbnailGenerator from "../components/documents/ThumbnailGenerator";
import { logDocumentDelete, logDocumentEdit, logBulkAction } from "../components/audit/AuditTracker";

export default function Documents({ selectedFolder, setSelectedFolder }) {
  const [viewType, setViewType] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [gridSize, setGridSize] = useState("medium");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [showThumbnailGen, setShowThumbnailGen] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    fileType: "all",
    dateRange: "all"
  });

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', selectedFolder, searchQuery, filters, user?.email],
    queryFn: async () => {
      if (!user) return [];

      // Get owned documents
      const ownedQuery = {
        is_trashed: false,
        created_by: user.email,
      };

      if (selectedFolder) {
        ownedQuery.folder_id = selectedFolder;
      }

      if (filters.category !== "all") {
        ownedQuery.category = filters.category;
      }

      if (filters.fileType !== "all") {
        ownedQuery.file_type = filters.fileType;
      }

      const ownedDocs = await base44.entities.Document.filter(ownedQuery, '-created_date');

      // Get all documents to find shared ones
      const allDocs = await base44.entities.Document.filter({ is_trashed: false }, '-created_date');

      // Filter for documents shared with current user
      const sharedDocs = allDocs.filter(doc => 
        doc.shared_with?.some(share => share.user_email === user.email) &&
        doc.created_by !== user.email // Exclude owned docs
      );

      // Apply filters to shared docs
      let filteredSharedDocs = sharedDocs;
      if (selectedFolder) {
        filteredSharedDocs = filteredSharedDocs.filter(doc => doc.folder_id === selectedFolder);
      }
      if (filters.category !== "all") {
        filteredSharedDocs = filteredSharedDocs.filter(doc => doc.category === filters.category);
      }
      if (filters.fileType !== "all") {
        filteredSharedDocs = filteredSharedDocs.filter(doc => doc.file_type === filters.fileType);
      }

      // Combine and deduplicate
      const allUserDocs = [...ownedDocs, ...filteredSharedDocs];

      // Client-side search filter
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return allUserDocs.filter(doc => 
          doc.title?.toLowerCase().includes(lowerQuery) ||
          doc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
          doc.ai_summary?.toLowerCase().includes(lowerQuery)
        );
      }

      return allUserDocs;
    },
  });

  // Delete document mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.update(docId, { is_trashed: true, trashed_date: new Date().toISOString() }),
    onMutate: async (docId) => {
      await queryClient.cancelQueries(['documents']);
      const previousDocs = queryClient.getQueryData(['documents', selectedFolder, searchQuery, filters, user?.email]);
      queryClient.setQueryData(['documents', selectedFolder, searchQuery, filters, user?.email], (old) => 
        old?.filter(doc => doc.id !== docId) || []
      );
      return { previousDocs };
    },
    onError: (err, docId, context) => {
      queryClient.setQueryData(['documents', selectedFolder, searchQuery, filters, user?.email], context.previousDocs);
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ docId, isFavorited }) => 
      base44.entities.Document.update(docId, { is_favorited: !isFavorited }),
    onMutate: async ({ docId, isFavorited }) => {
      await queryClient.cancelQueries(['documents']);
      const previousDocs = queryClient.getQueryData(['documents', selectedFolder, searchQuery, filters, user?.email]);
      queryClient.setQueryData(['documents', selectedFolder, searchQuery, filters, user?.email], (old) => 
        old?.map(doc => doc.id === docId ? { ...doc, is_favorited: !isFavorited } : doc) || []
      );
      return { previousDocs };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['documents', selectedFolder, searchQuery, filters, user?.email], context.previousDocs);
    },
  });

  const handleDeleteDocument = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (confirm('Move this document to trash?')) {
      deleteDocMutation.mutate(docId);
      // Audit log
      if (doc) {
        logDocumentDelete(docId, doc.title, false);
      }
    }
  };

  const handleToggleFavorite = (doc) => {
    toggleFavoriteMutation.mutate({ docId: doc.id, isFavorited: doc.is_favorited });
    // Audit log
    logDocumentEdit(doc.id, doc.title, { 
      is_favorited: !doc.is_favorited 
    });
  };

  const handleSelectDoc = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(doc => doc.id));
    }
  };

  const handleBulkTrash = () => {
    if (confirm(`Move ${selectedDocs.length} document(s) to trash?`)) {
      // Audit log bulk action
      logBulkAction('trash', 'document', selectedDocs);
      
      selectedDocs.forEach(docId => {
        deleteDocMutation.mutate(docId);
      });
      setSelectedDocs([]);
      setSelectionMode(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedDocs([]);
  };

  return (
    <div className="h-full bg-neutral-950 overflow-auto">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">SIGNAL87</p>
              <h1 className="text-xl md:text-2xl font-semibold text-white">Documents</h1>
              <p className="text-gray-400 text-sm mt-1">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex gap-2 md:gap-3">
              {!selectionMode && (
                  <>


                    <Link to={createPageUrl('Upload')}>
                      <Button 
                        className="bg-white text-black hover:bg-gray-200"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </Link>
                  </>
                )}
              {selectionMode && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelSelection}
                    className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                  >
                    <X className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Cancel</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAll}
                    className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                  >
                    {selectedDocs.length === documents.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedDocs.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleBulkTrash}
                    >
                      <Trash2 className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Trash ({selectedDocs.length})</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="flex gap-2 bg-neutral-800 border border-neutral-700 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${viewType === 'grid' && gridSize === 'large' ? 'bg-neutral-700' : ''} hover:bg-neutral-700 text-white`}
                onClick={() => { setViewType("grid"); setGridSize("large"); }}
              >
                <Grid3x3 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${viewType === 'grid' && gridSize === 'medium' ? 'bg-neutral-700' : ''} hover:bg-neutral-700 text-white`}
                onClick={() => { setViewType("grid"); setGridSize("medium"); }}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${viewType === 'grid' && gridSize === 'small' ? 'bg-neutral-700' : ''} hover:bg-neutral-700 text-white`}
                onClick={() => { setViewType("grid"); setGridSize("small"); }}
              >
                <Grid3x3 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${viewType === 'list' ? 'bg-neutral-700' : ''} hover:bg-neutral-700 text-white`}
                onClick={() => setViewType("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
              </div>


              </div>

          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel 
              filters={filters}
              onFilterChange={setFilters}
              className="mt-4"
            />
          )}

          {/* Thumbnail Generator */}
          {showThumbnailGen && (
            <div className="mt-4">
              <ThumbnailGenerator 
                onComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['documents'], refetchType: 'none' });
                  setTimeout(() => queryClient.refetchQueries(['documents']), 100);
                  setShowThumbnailGen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-4 md:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading documents...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <LayoutGrid className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">
              Upload your first document to get started
            </p>
            <Link to={createPageUrl('Upload')}>
              <Button className="bg-white text-black hover:bg-gray-200">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </Link>
          </div>
        ) : viewType === "grid" ? (
          <DocumentGrid
            documents={documents}
            onDelete={handleDeleteDocument}
            onToggleFavorite={handleToggleFavorite}
            selectionMode={selectionMode}
            selectedDocs={selectedDocs}
            onSelectDoc={handleSelectDoc}
            gridSize={gridSize}
          />
        ) : (
          <DocumentList
            documents={documents}
            onDelete={handleDeleteDocument}
            onToggleFavorite={handleToggleFavorite}
            selectionMode={selectionMode}
            selectedDocs={selectedDocs}
            onSelectDoc={handleSelectDoc}
          />
        )}
      </div>
    </div>
  );
}