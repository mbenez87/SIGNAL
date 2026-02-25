import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, DollarSign, Briefcase, Heart, Folder,
  Search, X, Plus, MoreVertical,
  FileText, Download, Share2, Edit2, Trash2,
  Brain, MessageSquare, Settings, Send, Loader2,
  ShieldCheck, Sparkles, BookOpen,
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
import { safeFunctionCall } from "../components/utils/apiHelpers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Markdown renderer (same style as Intelligence page) ──────────────────────
const mdComponents = {
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="min-w-full border-collapse border border-neutral-700 rounded-lg text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-neutral-800">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-neutral-700">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-neutral-800/50">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-1.5 text-left text-xs font-semibold text-cyan-400 border border-neutral-700">{children}</th>,
  td: ({ children }) => <td className="px-3 py-1.5 text-sm text-white border border-neutral-700">{children}</td>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline break-words">{children}</a>,
  code: ({ inline, children }) => inline
    ? <code className="bg-neutral-950 px-1.5 py-0.5 rounded text-xs text-blue-300">{children}</code>
    : <code className="block bg-neutral-950 p-3 rounded-lg text-xs overflow-x-auto text-white">{children}</code>,
  p: ({ children }) => <p className="my-2 leading-relaxed text-white text-sm">{children}</p>,
  h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2 text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold mt-3 mb-1 text-white">{children}</h3>,
  ul: ({ children }) => <ul className="my-2 ml-5 space-y-1 list-disc text-white text-sm">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 ml-5 space-y-1 list-decimal text-white text-sm">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-1 text-white text-sm">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-cyan-600 pl-3 my-2 italic text-gray-300 text-sm">{children}</blockquote>,
};

function MdRenderer({ content }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents} className="text-white">
      {content}
    </ReactMarkdown>
  );
}

// ─── Quick-action chips shown in the Chat tab ─────────────────────────────────
const QUICK_ACTIONS = [
  { id: "summary",   label: "Summarize all docs",    prompt: "Give me a concise summary of all documents in this workspace."                },
  { id: "insights",  label: "Key insights",           prompt: "What are the most important insights and takeaways from these documents?"     },
  { id: "risks",     label: "Risks & gaps",           prompt: "Identify any risks, red flags, or information gaps in these documents."      },
  { id: "timeline",  label: "Timeline",               prompt: "Extract and organize any dates, deadlines, or chronological events."         },
  { id: "compare",   label: "Compare documents",      prompt: "Compare and contrast the key themes across all documents in this workspace." },
];

export default function Workspaces() {
  const [viewType, setViewType]               = useState("grid");
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showModal, setShowModal]             = useState(false);
  const [docSearch, setDocSearch]             = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddDocsModal, setShowAddDocsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showShareModal, setShowShareModal]   = useState(false);
  const [workspaceToRename, setWorkspaceToRename] = useState(null);
  const [activeTab, setActiveTab]             = useState("documents");

  // Chat state — keyed by workspace id so history persists while modal is open
  const [chatHistories, setChatHistories]     = useState({});
  const [chatInput, setChatInput]             = useState("");
  const [isChatLoading, setIsChatLoading]     = useState(false);

  // Instructions state
  const [instructions, setInstructions]       = useState("");
  const [isSavingInstructions, setIsSavingInstructions] = useState(false);

  const [newWorkspace, setNewWorkspace]       = useState({
    name: "", description: "", type: "personal", icon: "folder", color: "blue",
  });

  const chatEndRef  = useRef(null);
  const queryClient = useQueryClient();

  // ── auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistories, isChatLoading]);

  // ── sync instructions when workspace changes ──────────────────────────────
  useEffect(() => {
    if (selectedWorkspace) {
      setInstructions(selectedWorkspace.instructions || "");
    }
  }, [selectedWorkspace?.id]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn:  () => base44.auth.me(),
  });

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces", user?.email],
    queryFn:  async () => {
      if (!user) return [];
      return base44.entities.Workspace.filter({ created_by: user.email }, "-updated_date");
    },
    enabled: !!user,
  });

  const { data: workspaceDocuments = [] } = useQuery({
    queryKey: ["workspace-documents", selectedWorkspace?.id, docSearch],
    queryFn:  async () => {
      if (!selectedWorkspace) return [];
      const allDocs = await base44.entities.Document.filter(
        { is_trashed: false, created_by: user.email },
        "-created_date"
      );
      let filtered = allDocs.filter(
        (doc) =>
          doc.metadata?.workspace_id === selectedWorkspace.id ||
          doc.folder_id === selectedWorkspace.id
      );
      if (docSearch) {
        const q = docSearch.toLowerCase();
        filtered = filtered.filter(
          (d) => d.title?.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q)
        );
      }
      return filtered;
    },
    enabled: !!selectedWorkspace && !!user,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createWorkspaceMutation = useMutation({
    mutationFn: (data) => base44.entities.Workspace.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["workspaces"]);
      setShowCreateModal(false);
      setNewWorkspace({ name: "", description: "", type: "personal", icon: "folder", color: "blue" });
      toast.success("Workspace created");
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ id, data }) =>
      base44.entities.Workspace.update(id, { ...data, last_updated: new Date().toISOString() }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["workspaces"]);
      // also update selectedWorkspace in place so instructions reflect
      setSelectedWorkspace((prev) => prev ? { ...prev, ...variables.data } : prev);
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id) => base44.entities.Workspace.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["workspaces"]);
      toast.success("Workspace deleted");
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const iconMap = { shield: Shield, dollar: DollarSign, briefcase: Briefcase, heart: Heart, folder: Folder };
  const getIcon = (name) => iconMap[name] || Folder;

  const getStatusDots = (count) => {
    const total  = 5;
    const filled = Math.min(Math.ceil((count / 50) * total), total);
    return Array.from({ length: total }, (_, i) => i < filled);
  };

  const currentMessages = chatHistories[selectedWorkspace?.id] || [];

  const addMessage = (workspaceId, msg) => {
    setChatHistories((prev) => ({
      ...prev,
      [workspaceId]: [...(prev[workspaceId] || []), msg],
    }));
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateWorkspace = () => {
    if (!newWorkspace.name.trim()) { toast.error("Please enter a workspace name"); return; }
    createWorkspaceMutation.mutate({ ...newWorkspace, last_updated: new Date().toISOString(), document_count: 0 });
  };

  const handleDeleteWorkspace = (workspace) => {
    if (window.confirm(`Delete "${workspace.name}"? This cannot be undone.`)) {
      deleteWorkspaceMutation.mutate(workspace.id);
    }
  };

  const openWorkspace = (workspace) => {
    setSelectedWorkspace(workspace);
    setShowModal(true);
    setDocSearch("");
    setActiveTab("documents");
    setChatInput("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedWorkspace(null);
    setDocSearch("");
    setChatInput("");
  };

  const handleSaveInstructions = async () => {
    if (!selectedWorkspace) return;
    setIsSavingInstructions(true);
    try {
      await updateWorkspaceMutation.mutateAsync({
        id:   selectedWorkspace.id,
        data: { instructions },
      });
      toast.success("Instructions saved");
    } catch {
      toast.error("Failed to save instructions");
    } finally {
      setIsSavingInstructions(false);
    }
  };

  const handleSendChat = async (overrideInput) => {
    const query = (overrideInput ?? chatInput).trim();
    if (!query || isChatLoading) return;
    if (!selectedWorkspace) return;
    if (workspaceDocuments.length === 0) {
      toast.error("Add documents to this workspace first");
      return;
    }

    setChatInput("");
    setIsChatLoading(true);

    addMessage(selectedWorkspace.id, {
      role:    "user",
      content: query,
      ts:      new Date().toISOString(),
    });

    try {
      // Build the final message — include workspace instructions as context
      let fullMessage = query;
      if (instructions.trim()) {
        fullMessage = `[Workspace context / instructions]\n${instructions}\n\n[User question]\n${query}`;
      }

      const response = await safeFunctionCall("aria", {
        message:     fullMessage,
        documentIds: workspaceDocuments.map((d) => d.id),
        grounded_mode: true,
        mode:        "chat",
      });

      if (response?.success) {
        addMessage(selectedWorkspace.id, {
          role:       "assistant",
          content:    response.content,
          sources:    response.sources || [],
          confidence: response.confidence,
          ts:         new Date().toISOString(),
        });
      } else {
        toast.error(response?.error || "ARIA could not respond");
        // put the user message back
        setChatInput(query);
        setChatHistories((prev) => ({
          ...prev,
          [selectedWorkspace.id]: (prev[selectedWorkspace.id] || []).slice(0, -1),
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reach ARIA");
      setChatInput(query);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-8 py-10">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="mb-16 pb-8 border-b border-neutral-800">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center text-black font-bold text-sm">
                87
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Workspace
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Workspaces</h1>
            <p className="text-gray-400">Intelligent document organisation and analysis</p>
          </div>
        </div>

        {/* ── Section header ───────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            Personal Workspaces
          </div>
          <div className="flex gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
            {["grid", "list"].map((v) => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={`px-3 py-1.5 text-xs rounded capitalize ${
                  viewType === v ? "bg-neutral-900 text-white" : "text-gray-400"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── Workspaces grid ──────────────────────────────────────────────── */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12" layout>
          <AnimatePresence>
            {workspaces.map((workspace) => {
              const Icon       = getIcon(workspace.icon);
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

                  {/* Preview */}
                  <div className="h-44 bg-neutral-950 border-b border-neutral-800 flex items-center justify-center">
                    <Icon className="w-20 h-20 text-gray-600 opacity-70" strokeWidth={1.5} />
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold tracking-tight mb-1">{workspace.name}</h3>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">{workspace.type}</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => { e.stopPropagation(); setWorkspaceToRename(workspace); setShowRenameModal(true); }}
                            className="text-gray-300 hover:bg-neutral-800 hover:text-white cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(workspace); }}
                            className="text-red-400 hover:bg-neutral-800 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{workspace.description}</p>

                    <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                      <div className="flex gap-4 text-xs text-gray-600 font-mono">
                        <span>{workspace.document_count || 0} docs</span>
                        <span>
                          {workspace.last_updated
                            ? formatDistanceToNow(new Date(workspace.last_updated), { addSuffix: true })
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {statusDots.map((filled, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${filled ? "bg-white" : "bg-gray-600"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Create card */}
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

      {/* ════════════════════════════════════════════════════════════════════
          CREATE WORKSPACE MODAL
      ════════════════════════════════════════════════════════════════════ */}
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
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                    placeholder="e.g. Acme Corp Q1 2026"
                    className="bg-neutral-950 border-neutral-800"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
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
                    <option value="client">Client</option>
                    <option value="finance">Finance</option>
                    <option value="professional">Professional</option>
                    <option value="legal">Legal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 bg-transparent border-neutral-700" onClick={() => setShowCreateModal(false)}>
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

      {/* ════════════════════════════════════════════════════════════════════
          WORKSPACE DETAIL MODAL  (tabbed: Documents | Chat | Instructions)
      ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && selectedWorkspace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-10"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Modal header ─────────────────────────────────────────── */}
              <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center">
                    {React.createElement(getIcon(selectedWorkspace.icon), {
                      className: "w-5 h-5 text-gray-400",
                    })}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">{selectedWorkspace.name}</h2>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      {selectedWorkspace.type} · {workspaceDocuments.length} documents
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-neutral-700 text-sm"
                    onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}
                  >
                    <Share2 className="w-4 h-4 mr-1.5" /> Share
                  </Button>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 border border-neutral-800 rounded flex items-center justify-center hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Tabs ─────────────────────────────────────────────────── */}
              <div className="flex border-b border-neutral-800 shrink-0 px-6">
                {[
                  { id: "documents",    label: "Documents",     icon: FileText       },
                  { id: "chat",         label: "Chat with ARIA", icon: Brain          },
                  { id: "instructions", label: "Instructions",  icon: BookOpen       },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-white text-white"
                          : "border-transparent text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {tab.id === "chat" && currentMessages.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-cyan-600/30 text-cyan-300 rounded-full">
                          {currentMessages.filter((m) => m.role === "user").length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Tab content ──────────────────────────────────────────── */}
              <div className="flex-1 overflow-hidden flex flex-col">

                {/* ─ DOCUMENTS TAB ──────────────────────────────────────── */}
                {activeTab === "documents" && (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <div className="text-sm font-semibold">All Documents</div>
                        <div className="text-xs text-gray-500">{workspaceDocuments.length} documents</div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input
                            value={docSearch}
                            onChange={(e) => setDocSearch(e.target.value)}
                            placeholder="Filter documents..."
                            className="pl-9 w-48 bg-neutral-950 border-neutral-800 text-sm"
                          />
                        </div>
                        <Button
                          onClick={() => setShowAddDocsModal(true)}
                          className="bg-white text-black hover:bg-gray-200 text-sm"
                        >
                          <Plus className="w-4 h-4 mr-1.5" /> Add to Workspace
                        </Button>
                      </div>
                    </div>

                    {workspaceDocuments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-7 h-7 text-gray-600" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">No documents yet</h3>
                        <p className="text-sm text-gray-500 mb-6">Add documents from your library to get started</p>
                        <Button onClick={() => setShowAddDocsModal(true)} className="bg-white text-black hover:bg-gray-200">
                          <Plus className="w-4 h-4 mr-2" /> Add to Workspace
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {workspaceDocuments.map((doc) => (
                          <Link
                            key={doc.id}
                            to={createPageUrl("DocumentViewer") + `?id=${doc.id}`}
                            className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden hover:bg-neutral-900 hover:border-neutral-700 transition-all"
                          >
                            <div className="h-36 bg-neutral-800 flex items-center justify-center relative">
                              {doc.thumbnail_url ? (
                                <img src={doc.thumbnail_url} alt={doc.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-3/4 h-5/6 bg-white rounded flex flex-col items-center justify-center gap-1">
                                  <FileText className="w-10 h-10 text-neutral-900 opacity-80" />
                                  <div className="text-[10px] font-semibold text-neutral-900 uppercase tracking-wide">
                                    {doc.file_type?.toUpperCase() || "FILE"}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-2.5">
                              <h4 className="text-xs font-semibold truncate mb-1">{doc.title}</h4>
                              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                <span>{doc.file_type?.toUpperCase()}</span>
                                <span>{doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ""}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─ CHAT TAB ───────────────────────────────────────────── */}
                {activeTab === "chat" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Scope banner */}
                    <div className="px-6 pt-4 shrink-0">
                      {workspaceDocuments.length > 0 ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600/10 border border-cyan-500/30 rounded-lg mb-4">
                          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                          <p className="text-xs text-cyan-300">
                            <span className="font-semibold">Strict Document Mode</span> — ARIA will only answer from the {workspaceDocuments.length} document{workspaceDocuments.length !== 1 ? "s" : ""} in this workspace.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-600/10 border border-amber-500/30 rounded-lg mb-4">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                          <p className="text-xs text-amber-300">
                            Add documents to this workspace to enable scoped AI chat.
                          </p>
                          <button
                            onClick={() => { setActiveTab("documents"); setShowAddDocsModal(true); }}
                            className="ml-auto text-xs text-amber-400 underline hover:text-amber-300"
                          >
                            Add docs
                          </button>
                        </div>
                      )}

                      {/* Quick-action chips */}
                      {currentMessages.length === 0 && workspaceDocuments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {QUICK_ACTIONS.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => handleSendChat(a.prompt)}
                              disabled={isChatLoading}
                              className="px-3 py-1.5 text-xs rounded-full border border-neutral-700 text-gray-300 hover:border-cyan-500/60 hover:text-cyan-300 hover:bg-cyan-600/10 transition-all disabled:opacity-50"
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
                      {currentMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                              msg.role === "user"
                                ? "bg-gradient-to-br from-orange-600/20 to-orange-700/20 border border-orange-500/30"
                                : "bg-neutral-800/80 border border-neutral-700/50"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <p className="text-white text-sm leading-relaxed">{msg.content}</p>
                            ) : (
                              <>
                                <MdRenderer content={msg.content} />
                                {/* Sources */}
                                {msg.sources?.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-neutral-700">
                                    <p className="text-[10px] text-gray-500 mb-1.5">Sources</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {msg.sources.map((s, si) => (
                                        <a
                                          key={si}
                                          href={s.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[10px] px-2 py-1 rounded bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:opacity-80"
                                        >
                                          📁 {s.title}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Confidence badge */}
                                {msg.confidence !== undefined && (
                                  <div className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400/70">
                                    <ShieldCheck className="w-3 h-3" />
                                    {Math.round(msg.confidence * 100)}% confidence
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-neutral-800/80 border border-neutral-700/50 rounded-2xl px-5 py-4 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            <p className="text-sm text-gray-300">ARIA is reading your documents…</p>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input bar */}
                    <div className="px-6 py-4 border-t border-neutral-800 shrink-0">
                      <div className="flex gap-3 items-end">
                        <Textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={handleChatKey}
                          placeholder={
                            workspaceDocuments.length === 0
                              ? "Add documents to start chatting…"
                              : `Ask ARIA about "${selectedWorkspace.name}"…`
                          }
                          disabled={isChatLoading || workspaceDocuments.length === 0}
                          className="flex-1 bg-neutral-950 border-neutral-800 text-white placeholder:text-gray-600 resize-none text-sm min-h-[44px] max-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0"
                          rows={1}
                        />
                        <Button
                          onClick={() => handleSendChat()}
                          disabled={!chatInput.trim() || isChatLoading || workspaceDocuments.length === 0}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white h-11 px-4 shrink-0 disabled:opacity-40"
                        >
                          {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                      {currentMessages.length > 0 && (
                        <button
                          onClick={() => setChatHistories((p) => ({ ...p, [selectedWorkspace.id]: [] }))}
                          className="mt-2 text-[10px] text-gray-600 hover:text-gray-400"
                        >
                          Clear conversation
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ─ INSTRUCTIONS TAB ───────────────────────────────────── */}
                {activeTab === "instructions" && (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-2xl">
                      <div className="mb-5">
                        <h3 className="text-sm font-semibold mb-1">Workspace Instructions</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Write instructions for ARIA to follow when chatting in this workspace. These are automatically
                          included with every question — use them to set the tone, specify the company, define terminology,
                          or restrict what ARIA should focus on.
                        </p>
                      </div>

                      {/* Example placeholder */}
                      <Textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder={`Examples:\n• You are analysing documents for Acme Corp, a B2B SaaS company.\n• Focus only on financial data. Ignore marketing content.\n• Always respond in bullet points.\n• Treat all dollar figures as USD unless stated otherwise.`}
                        className="w-full bg-neutral-950 border-neutral-800 text-white placeholder:text-gray-600 text-sm resize-none min-h-[220px] focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                        rows={10}
                      />

                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[11px] text-gray-600">
                          {instructions.length > 0
                            ? `${instructions.length} characters · saved to this workspace`
                            : "Instructions are optional"}
                        </p>
                        <Button
                          onClick={handleSaveInstructions}
                          disabled={isSavingInstructions}
                          className="bg-white text-black hover:bg-gray-200 text-sm"
                        >
                          {isSavingInstructions ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                          ) : (
                            "Save Instructions"
                          )}
                        </Button>
                      </div>

                      {/* Tip */}
                      <div className="mt-6 p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
                        <p className="text-xs font-medium text-gray-400 mb-2">💡 Tips for good instructions</p>
                        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                          <li>Describe the company or client these documents belong to</li>
                          <li>Specify the role ARIA should play (analyst, advisor, auditor…)</li>
                          <li>Set the preferred output format (bullets, tables, prose)</li>
                          <li>Name any key people, products, or terms ARIA should know</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sub-modals ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddDocsModal && selectedWorkspace && (
          <AddDocumentsModal
            workspace={selectedWorkspace}
            onClose={() => setShowAddDocsModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRenameModal && workspaceToRename && (
          <RenameWorkspaceModal
            workspace={workspaceToRename}
            onRename={({ name, description }) =>
              updateWorkspaceMutation.mutate({ id: workspaceToRename.id, data: { name, description } })
            }
            onClose={() => { setShowRenameModal(false); setWorkspaceToRename(null); }}
          />
        )}
      </AnimatePresence>

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
