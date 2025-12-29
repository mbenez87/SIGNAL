import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, DollarSign, Briefcase, Heart, Folder, FolderPlus,
  Search, Grid3x3, List, X, Plus, MoreVertical, Upload,
  FileText, Download, Share2, Star, Edit2, Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import AddDocumentsModal from "../components/workspaces/AddDocumentsModal";
import RenameWorkspaceModal from "../components/workspaces/RenameWorkspaceModal";
import ShareWorkspaceModal from "../components/workspaces/ShareWorkspaceModal";

export default function Workspaces() {
  const [viewType, setViewType] = useState("grid");
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddDocsModal, setShowAddDocsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [workspaceToRename, setWorkspaceToRename] = useState(null);
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    description: "",
    type: "personal",
    icon: "folder",
    color: "blue"
  });

  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch workspaces
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Workspace.filter({ created_by: user.email }, '-updated_date');
    },
    enabled: !!user,
  });

  // Fetch documents for selected workspace
  const { data: workspaceDocuments = [] } = useQuery({
    queryKey: ['workspace-documents', selectedWorkspace?.id, searchQuery],
    queryFn: async () => {
      if (!selectedWorkspace) return [];
      
      const allDocs = await base44.entities.Document.filter({
        is_trashed: false,
        created_by: user.email
      }, '-created_date');

      // Filter by workspace folder or metadata
      let filtered = allDocs.filter(doc => 
        doc.metadata?.workspace_id === selectedWorkspace.id ||
        doc.folder_id === selectedWorkspace.id
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
    enabled: !!selectedWorkspace && !!user,
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: (data) => base44.entities.Workspace.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      setShowCreateModal(false);
      setNewWorkspace({
        name: "",
        description: "",
        type: "personal",
        icon: "folder",
        color: "blue"
      });
      toast.success("Workspace created successfully");
    },
  });

  // Rename workspace mutation
  const renameWorkspaceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Workspace.update(id, {
      ...data,
      last_updated: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      setShowRenameModal(false);
      setWorkspaceToRename(null);
      toast.success("Workspace renamed successfully");
    },
  });

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id) => base44.entities.Workspace.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      toast.success("Workspace deleted successfully");
    },
  });

  const iconMap = {
    shield: Shield,
    dollar: DollarSign,
    briefcase: Briefcase,
    heart: Heart,
    folder: Folder,
  };

  const getIconComponent = (iconName) => {
    return iconMap[iconName] || Folder;
  };

  const getStatusDots = (docCount) => {
    const total = 5;
    const filled = Math.min(Math.ceil((docCount / 50) * total), total);
    return Array.from({ length: total }, (_, i) => i < filled);
  };

  const handleCreateWorkspace = () => {
    if (!newWorkspace.name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }
    createWorkspaceMutation.mutate({
      ...newWorkspace,
      last_updated: new Date().toISOString(),
      document_count: 0
    });
  };

  const handleRenameWorkspace = (workspace) => {
    setWorkspaceToRename(workspace);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = (data) => {
    renameWorkspaceMutation.mutate({
      id: workspaceToRename.id,
      data
    });
  };

  const handleDeleteWorkspace = (workspace) => {
    if (confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) {
      deleteWorkspaceMutation.mutate(workspace.id);
    }
  };

  const openWorkspace = (workspace) => {
    setSelectedWorkspace(workspace);
    setShowModal(true);
    setSearchQuery("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedWorkspace(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Grid Background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-16 pb-8 border-b border-neutral-800">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center text-black font-bold text-sm">
                87
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="bg-transparent border-neutral-700 text-white hover:bg-neutral-900"
              >
                <Search className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-black hover:bg-gray-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Workspace
              </Button>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Workspaces</h1>
            <p className="text-gray-400">Intelligent document organization and analysis</p>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Personal Workspaces
          </div>
          <div className="flex gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
            <button
              className={`px-3 py-1.5 text-xs rounded ${
                viewType === 'grid' ? 'bg-neutral-900 text-white' : 'text-gray-400'
              }`}
              onClick={() => setViewType('grid')}
            >
              Grid
            </button>
            <button
              className={`px-3 py-1.5 text-xs rounded ${
                viewType === 'list' ? 'bg-neutral-900 text-white' : 'text-gray-400'
              }`}
              onClick={() => setViewType('list')}
            >
              List
            </button>
          </div>
        </div>

        {/* Workspaces Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
          layout
        >
          <AnimatePresence>
            {workspaces.map((workspace) => {
              const Icon = getIconComponent(workspace.icon);
              const statusDots = getStatusDots(workspace.document_count || 0);

              return (
                <motion.div
                  key={workspace.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden cursor-pointer hover:bg-neutral-800 hover:border-neutral-700 transition-all group relative"
                  onClick={() => openWorkspace(workspace)}
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
                  
                  {/* Preview Area */}
                  <div className="h-44 bg-neutral-950 border-b border-neutral-800 flex items-center justify-center">
                    <Icon className="w-20 h-20 text-gray-600 opacity-70" strokeWidth={1.5} />
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold tracking-tight mb-1">{workspace.name}</h3>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">
                          {workspace.type}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="w-6 h-6 border border-neutral-800 rounded flex items-center justify-center text-gray-600 hover:text-gray-400 hover:bg-neutral-950 transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end"
                          className="bg-neutral-900 border-neutral-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameWorkspace(workspace);
                            }}
                            className="text-gray-300 hover:bg-neutral-800 hover:text-white cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(workspace);
                            }}
                            className="text-red-400 hover:bg-neutral-800 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                      {workspace.description}
                    </p>

                    <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                      <div className="flex gap-4 text-xs text-gray-600 font-mono">
                        <span>{workspace.document_count || 0} docs</span>
                        <span>
                          {workspace.last_updated 
                            ? formatDistanceToNow(new Date(workspace.last_updated), { addSuffix: true })
                            : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {statusDots.map((filled, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              filled ? 'bg-white' : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Create Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-dashed border-neutral-700 rounded-lg min-h-[320px] flex flex-col items-center justify-center cursor-pointer hover:border-white hover:bg-neutral-950 transition-all group"
              onClick={() => setShowCreateModal(true)}
            >
              <div className="w-16 h-16 border-2 border-neutral-700 rounded-full flex items-center justify-center text-gray-400 mb-4 group-hover:border-white group-hover:text-white group-hover:rotate-90 transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-sm text-gray-400 font-medium">Create Workspace</div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-10"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Create Workspace</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    placeholder="Workspace name"
                    className="bg-neutral-950 border-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    value={newWorkspace.description}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                    placeholder="Brief description"
                    className="bg-neutral-950 border-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={newWorkspace.type}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, type: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-md text-white"
                  >
                    <option value="personal">Personal</option>
                    <option value="finance">Finance</option>
                    <option value="professional">Professional</option>
                    <option value="legal">Legal</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent border-neutral-700"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-white text-black hover:bg-gray-200"
                    onClick={handleCreateWorkspace}
                    disabled={createWorkspaceMutation.isLoading}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Detail Modal */}
      <AnimatePresence>
        {showModal && selectedWorkspace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-10"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-neutral-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center">
                    {React.createElement(getIconComponent(selectedWorkspace.icon), {
                      className: "w-6 h-6 text-gray-400"
                    })}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedWorkspace.name}</h2>
                    <div className="text-sm text-gray-500 font-mono">
                      {selectedWorkspace.type} • {workspaceDocuments.length} documents
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-transparent border-neutral-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowShareModal(true);
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" className="bg-transparent border-neutral-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 border border-neutral-800 rounded flex items-center justify-center hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="text-base font-semibold">All Documents</div>
                    <div className="text-sm text-gray-500">{workspaceDocuments.length} documents</div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search documents..."
                        className="pl-10 w-52 bg-neutral-950 border-neutral-800"
                      />
                    </div>
                    <Button 
                      onClick={() => setShowAddDocsModal(true)}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Workspace
                    </Button>
                  </div>
                </div>

                {/* Documents Grid */}
                {workspaceDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-7 h-7 text-gray-600" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">No documents found</h3>
                    <p className="text-sm text-gray-500 mb-6">Add documents from your library to get started</p>
                    <Button 
                      onClick={() => setShowAddDocsModal(true)}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Workspace
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {workspaceDocuments.map((doc) => (
                      <Link
                        key={doc.id}
                        to={createPageUrl('DocumentViewer') + `?id=${doc.id}`}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden hover:bg-neutral-900 hover:border-neutral-700 transition-all"
                      >
                        <div className="h-44 bg-neutral-800 flex items-center justify-center relative">
                          {doc.thumbnail_url ? (
                            <img src={doc.thumbnail_url} alt={doc.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-3/4 h-5/6 bg-white rounded flex flex-col items-center justify-center gap-2">
                              <FileText className="w-12 h-12 text-neutral-900 opacity-80" />
                              <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wide">
                                {doc.file_type?.toUpperCase() || 'FILE'}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-semibold truncate mb-1.5">{doc.title}</h4>
                          <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                            <span>{doc.file_type?.toUpperCase()}</span>
                            <span>{doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ''}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Documents Modal */}
      <AnimatePresence>
        {showAddDocsModal && selectedWorkspace && (
          <AddDocumentsModal
            workspace={selectedWorkspace}
            onClose={() => setShowAddDocsModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Rename Workspace Modal */}
      <AnimatePresence>
        {showRenameModal && workspaceToRename && (
          <RenameWorkspaceModal
            workspace={workspaceToRename}
            onRename={handleRenameSubmit}
            onClose={() => {
              setShowRenameModal(false);
              setWorkspaceToRename(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Share Workspace Modal */}
      <AnimatePresence>
        {showShareModal && selectedWorkspace && (
          <ShareWorkspaceModal
            workspace={selectedWorkspace}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}