import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Sparkles, TrendingUp, Folder, Brain,
  Send, Loader2, Paperclip, X, Download, Save,
  Shield, ShieldCheck, ShieldAlert, AlertTriangle,
  CheckCircle, Info, Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { safeApiCall, safeEntityOperation, safeFunctionCall } from "../components/utils/apiHelpers";
import DocumentSelectorModal from "../components/intelligence/DocumentSelectorModal";
import PageHeader from "../components/layout/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getOptimalModel, getCostTier } from "../components/intelligence/ariaModelRouter";
import DocumentChunksViewer from "../components/intelligence/DocumentChunksViewer";
import ResponseVerification from "../components/intelligence/ResponseVerification";
import ConfidenceIndicator from "../components/intelligence/ConfidenceIndicator";
import LowConfidenceWarning from "../components/intelligence/LowConfidenceWarning";

// ============================================
// MARKDOWN RENDERER
// ============================================
const markdownComponents = {
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-neutral-700 rounded-lg">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-neutral-800">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-neutral-700">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="hover:bg-neutral-800/50 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-400 border border-neutral-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-sm text-white border border-neutral-700">{children}</td>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline break-words">
      {children}
    </a>
  ),
  code: ({ inline, children }) =>
    inline
      ? <code className="bg-neutral-950 px-1.5 py-0.5 rounded text-sm text-blue-300">{children}</code>
      : <code className="block bg-neutral-950 p-4 rounded-lg text-sm overflow-x-auto text-white">{children}</code>,
  p: ({ children }) => <p className="my-3 leading-relaxed text-white">{children}</p>,
  h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3 text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-3 text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2 text-white">{children}</h3>,
  ul: ({ children }) => <ul className="my-4 ml-6 space-y-2 list-disc text-white">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 ml-6 space-y-2 list-decimal text-white">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-1 text-white">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-600 pl-4 my-4 italic text-gray-300">
      {children}
    </blockquote>
  ),
};

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="text-white"
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

// ============================================
// GROUNDED MODE COMPONENTS
// ============================================
function GroundedModeToggle({ enabled, onToggle, selectedDocuments = [], disabled = false }) {
  const canEnable = selectedDocuments.length > 0;
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => canEnable && onToggle(!enabled)}
        disabled={disabled || !canEnable}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
          ${enabled ? "bg-cyan-600" : "bg-slate-600"}
          ${disabled || !canEnable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
            ${enabled ? "translate-x-5" : "translate-x-1"}
          `}
        />
      </button>
      <div className="flex items-center gap-1.5">
        {enabled
          ? <ShieldCheck className="w-4 h-4 text-cyan-400" />
          : <Shield className="w-4 h-4 text-gray-500" />
        }
        <span className={`text-xs font-medium ${enabled ? "text-cyan-400" : "text-gray-500"}`}>
          Strict Mode
        </span>
      </div>
      {!canEnable && (
        <span className="text-xs text-amber-500/70">(select docs)</span>
      )}
    </div>
  );
}

function DocumentScopeIndicator({ enabled, documents = [] }) {
  if (!enabled || documents.length === 0) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-cyan-600/10 border border-cyan-500/30 rounded-lg mb-3">
      <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-cyan-300">🔒 Strict Document Mode Active</p>
        <p className="text-xs text-cyan-400/70 truncate">
          Answering only from: {documents.map(d => d.title).join(", ")}
        </p>
      </div>
    </div>
  );
}

function GroundingWarningBanner({ verification }) {
  if (!verification || verification.isGrounded) return null;
  return (
    <div className="flex items-start gap-2 p-2 bg-amber-600/10 border border-amber-500/30 rounded-lg mb-2">
      <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-medium text-amber-300">Grounding Issues Detected</p>
        {verification.issues?.length > 0 && (
          <ul className="mt-1 text-xs text-amber-400/80 list-disc list-inside">
            {verification.issues.slice(0, 2).map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
            {verification.issues.length > 2 && (
              <li>...and {verification.issues.length - 2} more</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

// Parses [DOC:id, PARA:n] citation markers from content.
// Returns { cleanContent, citations } if any citations found, otherwise null.
function parseCitations(content, documents) {
  if (!content) return null;
  const citationPattern = /\[DOC:([a-zA-Z0-9_-]+),?\s*PARA:(\d+)\]/g;
  const cleanContent = String(content).replace(citationPattern, "");
  // citationPattern.lastIndex is reset to 0 by replace(), so exec starts fresh
  const citations = [];
  const seen = new Set();
  let match;
  while ((match = citationPattern.exec(String(content))) !== null) {
    const key = `${match[1]}-${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      const doc = documents.find(d => d.id === match[1]);
      citations.push({
        docId: match[1],
        paraId: parseInt(match[2], 10),
        docTitle: doc?.title || "Document",
        valid: !!doc,
      });
    }
  }
  return citations.length > 0 ? { cleanContent, citations } : null;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function Intelligence() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [workflowMode, setWorkflowMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [loadedChatId, setLoadedChatId] = useState(null);
  const [searchScope, setSearchScope] = useState("documents");
  const [groundedMode, setGroundedMode] = useState(false);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedDocs.length === 0 && groundedMode) {
      setGroundedMode(false);
    }
  }, [selectedDocs, groundedMode]);

  // Load a saved chat from URL param
  useEffect(() => {
    let isMounted = true;
    const loadSavedChat = async () => {
      const chatId = new URLSearchParams(window.location.search).get("chatId");
      if (!chatId || chatId === loadedChatId) return;
      try {
        const savedChat = await safeEntityOperation("filter", "SavedChat", { id: chatId });
        if (!isMounted || !savedChat?.length) return;
        const chat = savedChat[0];
        setMessages(chat.messages || []);
        setConversationId(chat.conversation_id);
        setWorkflowMode(chat.mode || "chat");
        if (chat.document_ids?.length > 0) {
          const fullDocs = await Promise.all(
            chat.document_ids.map(id =>
              base44.entities.Document.filter({ id }).then(docs => docs[0]).catch(() => null)
            )
          );
          if (isMounted) setSelectedDocs(fullDocs.filter(Boolean));
        } else {
          setSelectedDocs([]);
        }
        if (isMounted) {
          setLoadedChatId(chatId);
          toast.success(`Loaded: ${chat.title}`);
        }
      } catch (error) {
        console.error("Failed to load saved chat:", error);
        if (isMounted) toast.error("Failed to load saved chat");
      }
    };
    loadSavedChat();
    return () => { isMounted = false; };
  }, [loadedChatId]);

  // Initialize agent conversation
  useEffect(() => {
    const initConversation = async () => {
      if (!conversationId) {
        try {
          const isAuth = await base44.auth.isAuthenticated();
          if (!isAuth) {
            base44.auth.redirectToLogin(window.location.pathname);
            return;
          }
          const conversation = await safeApiCall(
            () => base44.agents.createConversation({
              agent_name: "aria",
              metadata: {
                name: "ARIA Intelligence Session",
                description: "Document intelligence conversation",
              },
            }),
            { fallback: null }
          );
          if (conversation) setConversationId(conversation.id);
        } catch (error) {
          console.error("Error creating conversation:", error);
          toast.error("Failed to initialize conversation. Please refresh the page.");
        }
      }
    };
    initConversation();
  }, [conversationId]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!conversationId) return;
    let isSubscribed = true;
    let unsubscribe;
    try {
      unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        if (isSubscribed) {
          setMessages(data.messages || []);
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error("Subscription error:", err);
    }
    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        try { unsubscribe(); } catch { /* ignore cleanup errors */ }
      }
    };
  }, [conversationId]);

  const workflowButtons = [
    // Core Intelligence Analysis
    { id: "quick_summary",     label: "Quick Summary",    icon: Sparkles,      description: "3-5 key bullet points",          category: "intel" },
    { id: "executive_summary", label: "Executive Summary",icon: FileText,      description: "Comprehensive overview",          category: "intel" },
    { id: "extract_intel",     label: "Extract Intel",    icon: Brain,         description: "Entities, facts, relationships",  category: "intel" },
    { id: "threat_analysis",   label: "Threats & Risks",  icon: ShieldAlert,   description: "Security analysis",               category: "intel" },
    { id: "timeline",          label: "Timeline",         icon: TrendingUp,    description: "Chronological events",            category: "intel" },
    { id: "entity_network",    label: "Entity Network",   icon: Sparkles,      description: "Relationship mapping",            category: "intel" },
    { id: "compare",           label: "Compare Docs",     icon: FileText,      description: "Find contradictions",             category: "intel" },
    { id: "pattern_detection", label: "Patterns",         icon: Zap,           description: "Trends & anomalies",              category: "intel" },
    { id: "gap_analysis",      label: "Gap Analysis",     icon: AlertTriangle, description: "Missing information",             category: "intel" },
    { id: "financial_intel",   label: "Financial Intel",  icon: TrendingUp,    description: "Money flows & transactions",      category: "intel" },
    { id: "geospatial",        label: "Geospatial",       icon: Info,          description: "Location analysis",              category: "intel" },
    { id: "duplicate_check",   label: "Find Duplicates",  icon: CheckCircle,   description: "Detect redundant content",        category: "intel" },
    // Utility Actions
    { id: "documents", label: "Documents",     icon: Folder, description: "Select specific documents", category: "utility" },
    { id: "research",  label: "Deep Research", icon: Brain,  description: "Multi-step synthesis",      category: "utility" },
  ];

  const handleCitationClick = (docId, paraId) => {
    console.log(`Citation clicked: Document ${docId}, Paragraph ${paraId}`);
    toast.info(`Viewing: Document ${docId}, ¶${paraId}`, { duration: 2000 });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      if (!input.trim()) toast.error("Please enter a message");
      return;
    }
    if (!conversationId) {
      toast.error("Conversation not ready. Please wait...");
      return;
    }
    setIsLoading(true);
    const query = input;
    setInput("");
    try {
      if (groundedMode && selectedDocs.length > 0) {
        toast.info("🔒 Strict Document Mode active", { duration: 2000 });
      }
      setMessages(prev => [...prev, {
        role: "user",
        content: query,
        created_date: new Date().toISOString(),
        grounded_mode: groundedMode,
      }]);

      let messageContent = query;
      if (searchScope === "web") {
        messageContent += `\n\n[Model: sonar-pro][Mode: web_search]`;
      } else if (searchScope === "documents") {
        messageContent += `\n\n[Mode: document_search_only]`;
      } else if (searchScope === "hybrid") {
        messageContent += `\n\n[Mode: hybrid_search]`;
      }
      if (selectedDocs.length > 0) {
        messageContent += `\n\nFocus on these documents: ${selectedDocs.map(d => `doc://${d.id} (${d.title})`).join(", ")}`;
      }

      const response = await safeFunctionCall("aria", {
        message: messageContent,
        documentIds: selectedDocs.map(d => d.id),
        grounded_mode: groundedMode,
        mode: searchScope === "web" ? "research" : "chat",
        selectedModel: searchScope === "web" ? "sonar-pro" : "claude-sonnet-4",
      });

      if (response?.success) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: response.content,
          sources: response.sources || [],
          confidence: response.confidence,
          confidence_reason: response.confidence_reason,
          citations: response.citations || [],
          valid_citations: response.valid_citations,
          invalid_citations: response.invalid_citations,
          grounded_mode: response.grounded_mode,
          verification: response.verification,
          created_date: new Date().toISOString(),
        }]);
        if (groundedMode) {
          const confPercent = Math.round((response.confidence || 0) * 100);
          if (response.verification && !response.verification.isGrounded) {
            toast.warning(`⚠️ Grounding issues detected (${confPercent}% confidence)`, { duration: 4000 });
          } else if (confPercent >= 90) {
            toast.success(`✅ Verified response (${confPercent}% confidence)`, { duration: 3000 });
          }
        }
      } else {
        toast.error(response?.error || "Failed to get response from ARIA");
        setMessages(prev => prev.slice(0, -1));
        setInput(query);
      }
      setWorkflowMode(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message: " + (error.message || "Unknown error"));
      setInput(query);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cleanMessageContent = (content) =>
    content.replace(/\[Model:.*?\]/g, "").replace(/\[Mode:.*?\]/g, "").trim();

  const handleWorkflowClick = async (mode) => {
    if (mode === "documents") {
      setShowDocSelector(true);
      return;
    }
    if (selectedDocs.length > 0) {
      if (!conversationId) {
        toast.error("Conversation not ready. Please wait...");
        return;
      }
      setIsLoading(true);
      const modeLabels = {
        quick_summary:     "Generate a quick summary with 3-5 key bullet points",
        executive_summary: "Generate a comprehensive executive summary",
        extract_intel:     "Extract key intelligence from documents",
        threat_analysis:   "Analyze threats and risks",
        timeline:          "Create chronological timeline",
        entity_network:    "Map entity relationships",
        compare:           "Compare documents",
        pattern_detection: "Detect patterns and anomalies",
        gap_analysis:      "Identify intelligence gaps",
        financial_intel:   "Extract financial intelligence",
        geospatial:        "Analyze geospatial information",
        duplicate_check:   "Check for duplicate content",
        research:          "Perform deep research and analysis",
      };
      const prompt = modeLabels[mode] || "Analyze these documents";
      try {
        const routing = getOptimalModel({
          action: mode,
          message: prompt,
          documents: selectedDocs,
          preferredModel: "auto",
        });
        console.log(`🤖 Smart routing: ${routing.model} (${routing.reason})`);
        toast.info(`Using ${routing.model} (${getCostTier(routing.model)} tier)`, { duration: 2000 });

        setMessages(prev => [...prev, {
          role: "user",
          content: `[Mode: ${mode}] ${prompt}`,
          created_date: new Date().toISOString(),
        }]);

        const response = await safeFunctionCall("aria", {
          message: `${prompt}\n\nAnalyze these documents: ${selectedDocs.map(d => `doc://${d.id} (${d.title})`).join(", ")}`,
          documentIds: selectedDocs.map(d => d.id),
          grounded_mode: groundedMode,
          mode: mode === "research" ? "research" : "chat",
          action: mode,
        });

        if (response?.success) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: response.content,
            sources: response.sources || [],
            confidence: response.confidence,
            confidence_level: response.confidence_level,
            confidence_reason: response.confidence_reason,
            confidence_metrics: response.confidence_metrics,
            citations: response.citations || [],
            grounded_mode: response.grounded_mode,
            verification: response.verification,
            document_context: response.document_context,
            mode,
            created_date: new Date().toISOString(),
          }]);
          toast.success(`${workflowButtons.find(b => b.id === mode)?.label} complete`);
        } else {
          toast.error("Failed to process analysis");
        }
        setWorkflowMode(null);
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message: " + (error.message || "Unknown error"));
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.info("Please select documents first");
      setWorkflowMode(mode);
      setShowDocSelector(true);
    }
  };

  const handleSelectDocs = (docs) => setSelectedDocs(docs);
  const handleRemoveDoc  = (docId) => setSelectedDocs(prev => prev.filter(d => d.id !== docId));

  const exportToCSV = () => {
    if (messages.length === 0) { toast.error("No messages to export"); return; }
    const rows = [
      ["Timestamp", "Role", "Content", "Mode", "Confidence", "Grounded"].join(","),
      ...messages.map(msg => {
        const content = (msg.content || "").replace(/"/g, '""').replace(/\n/g, " ");
        const confidence = msg.confidence ? Math.round(msg.confidence * 100) + "%" : "";
        return `"${msg.created_date || new Date().toISOString()}","${msg.role === "user" ? "User" : "ARIA"}","${content}","${msg.mode || ""}","${confidence}","${msg.grounded_mode ? "Yes" : "No"}"`;
      }),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aria-conversation-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Conversation exported to CSV");
  };

  const exportToDOCX = async () => {
    if (messages.length === 0) { toast.error("No messages to export"); return; }
    try {
      toast.loading("Generating DOCX...");
      const response = await safeFunctionCall("generateDocx", {
        title: `ARIA Conversation - ${new Date().toISOString().split("T")[0]}`,
        sections: messages.map(msg => {
          const role = msg.role === "user" ? "User" : "ARIA";
          const timestamp = msg.created_date ? new Date(msg.created_date).toLocaleString() : "";
          const confidence = msg.confidence ? ` [${Math.round(msg.confidence * 100)}% confidence]` : "";
          return {
            heading: `${role}${timestamp ? ` (${timestamp})` : ""}${confidence}`,
            body: msg.content || "",
          };
        }),
        footerNote: `Generated by Signal87 AI - ${new Date().toLocaleString()}`,
      });
      if (response?.file_url) {
        window.open(response.file_url, "_blank");
        toast.success("Conversation exported to DOCX");
      } else {
        toast.error("Failed to generate DOCX file");
      }
    } catch (error) {
      console.error("Error exporting to DOCX:", error);
      toast.error("Failed to export to DOCX: " + (error.message || "Unknown error"));
    }
  };

  const handleSaveChat = async () => {
    if (!saveTitle.trim()) { toast.error("Please enter a title for the chat"); return; }
    if (messages.length === 0) { toast.error("No messages to save"); return; }
    try {
      const preview = messages.find(m => m.role === "user")?.content?.slice(0, 200) || "Chat session";
      await safeEntityOperation("create", "SavedChat", {
        title: saveTitle,
        conversation_id: conversationId,
        messages,
        mode: workflowMode || "chat",
        document_ids: selectedDocs.map(d => d.id),
        preview,
      });
      toast.success("Chat saved successfully");
      setShowSaveModal(false);
      setSaveTitle("");
    } catch (error) {
      toast.error("Failed to save chat");
      console.error(error);
    }
  };

  return (
    <div className="relative min-h-screen overscroll-none">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-neutral-950 via-cyan-950/20 to-neutral-950 -z-10" />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-8 pb-4 sm:pb-20 md:pb-8 relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-16"
        >
          <PageHeader
            title="Document Intelligence"
            subtitle="Transform your documents into a connected knowledge system — one that learns, optimizes, and improves intelligently with ARIA."
          />
        </motion.div>

        {/* Central Chat Input */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-12 max-w-4xl mx-auto"
        >
          <DocumentScopeIndicator enabled={groundedMode} documents={selectedDocs} />

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-4 sm:p-8">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={groundedMode ? "Ask about your selected documents..." : "Ask anything about your documents..."}
              className="w-full bg-neutral-800/50 border-0 text-white placeholder:text-gray-500 resize-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base min-h-[60px] sm:min-h-[100px] max-h-[150px] sm:max-h-[200px] px-3 sm:px-4 py-3 rounded-lg leading-relaxed"
              disabled={isLoading}
            />

            {selectedDocs.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-3">
                {selectedDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 bg-cyan-600/20 border border-cyan-500/30 rounded-full px-3 py-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs text-cyan-300 truncate max-w-[120px] sm:max-w-none">{doc.title}</span>
                    <button onClick={() => handleRemoveDoc(doc.id)} className="text-cyan-400 hover:text-cyan-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-3 border-t border-neutral-800/50">
              {/* Search scope + strict mode row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 mr-1">Search:</span>
                  {[
                    { id: "documents", label: "📁 Docs" },
                    { id: "hybrid",    label: "🔗 Hybrid" },
                    { id: "web",       label: "🌐 Web" },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSearchScope(s.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                        searchScope === s.id
                          ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50"
                          : "text-gray-500 hover:text-gray-300 hover:bg-neutral-800/50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <GroundedModeToggle
                  enabled={groundedMode}
                  onToggle={setGroundedMode}
                  selectedDocuments={selectedDocs}
                  disabled={isLoading || searchScope === "web"}
                />
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDocSelector(true)}
                    className="text-gray-400 hover:text-white hover:bg-neutral-800/50 h-9 px-3 rounded-lg"
                  >
                    <Paperclip className="w-4 h-4 mr-1.5" />
                    <span className="text-xs">{selectedDocs.length > 0 ? `${selectedDocs.length} Docs` : "Select Docs"}</span>
                  </Button>
                  {messages.length > 0 && (
                    <div className="hidden sm:flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={exportToCSV}
                        className="text-gray-400 hover:text-white hover:bg-neutral-800/50 h-9 px-3 rounded-lg">
                        <Download className="w-4 h-4 mr-1.5" />
                        <span className="text-xs">CSV</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={exportToDOCX}
                        className="text-gray-400 hover:text-white hover:bg-neutral-800/50 h-9 px-3 rounded-lg">
                        <Download className="w-4 h-4 mr-1.5" />
                        <span className="text-xs">DOCX</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowSaveModal(true)}
                        className="text-gray-400 hover:text-white hover:bg-neutral-800/50 h-9 px-3 rounded-lg">
                        <Save className="w-4 h-4 mr-1.5" />
                        <span className="text-xs">Save</span>
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`${groundedMode ? "bg-cyan-600 hover:bg-cyan-700" : "bg-cyan-500 hover:bg-cyan-600"} text-white rounded-xl px-4 sm:px-6 h-10 sm:h-11 disabled:opacity-50 font-medium min-w-[44px] sm:min-w-[100px] shadow-lg shadow-cyan-600/20 active:scale-95 transition-transform`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
                      <span className="text-sm hidden sm:inline">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:mr-2" />
                      <span className="text-sm hidden sm:inline">Send</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Workflow Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-6 sm:mb-16"
        >
          {/* Primary Actions */}
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto mb-6">
              {["quick_summary", "executive_summary"].map(id => {
                const btn = workflowButtons.find(b => b.id === id);
                const Icon = btn.icon;
                const isActive = workflowMode === id;
                const subtitles = {
                  quick_summary:     "Get 3-5 key bullet points instantly",
                  executive_summary: "Comprehensive structured overview",
                };
                return (
                  <motion.button
                    key={id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleWorkflowClick(id)}
                    className={`group relative overflow-hidden rounded-xl border p-4 sm:p-6 transition-all active:scale-[0.97] ${
                      isActive
                        ? "bg-gradient-to-br from-cyan-600/20 to-cyan-700/10 border-cyan-500 shadow-lg shadow-cyan-600/20"
                        : "bg-neutral-900/80 border-neutral-700/50 hover:border-cyan-500/50 hover:bg-neutral-800/80"
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-lg bg-cyan-600/20 border border-cyan-500/30">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-sm sm:text-base font-semibold text-white mb-0.5 sm:mb-1">{btn.label}</h4>
                        <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">{subtitles[id]}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Intelligence Analysis Grid */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/70 mb-4 text-center">
              Intelligence Analysis
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 max-w-6xl mx-auto">
              {workflowButtons
                .filter(b => b.category === "intel" && b.id !== "quick_summary" && b.id !== "executive_summary")
                .map((button, index) => {
                  const Icon = button.icon;
                  const isActive = workflowMode === button.id;
                  return (
                    <motion.button
                      key={button.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleWorkflowClick(button.id)}
                      title={button.description}
                      className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl border transition-all active:scale-95 ${
                        isActive
                          ? "bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-600/20"
                          : "bg-neutral-900/60 border-neutral-700/40 text-gray-300 hover:bg-neutral-800/60 hover:border-cyan-500/40"
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{button.label}</span>
                    </motion.button>
                  );
                })}
            </div>
          </div>

          {/* Utilities */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500/70 mb-4 text-center">
              Utilities
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-md mx-auto">
              {workflowButtons
                .filter(b => b.category === "utility")
                .map((button, index) => {
                  const Icon = button.icon;
                  const isActive = workflowMode === button.id;
                  return (
                    <motion.button
                      key={button.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleWorkflowClick(button.id)}
                      title={button.description}
                      className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl border transition-all active:scale-95 ${
                        isActive
                          ? "bg-orange-600/15 border-orange-500/50 text-orange-300 shadow-lg shadow-orange-600/20"
                          : "bg-neutral-900/60 border-neutral-700/40 text-gray-400 hover:bg-neutral-800/60 hover:border-orange-500/40"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">{button.label}</span>
                    </motion.button>
                  );
                })}
            </div>
          </div>
        </motion.div>

        {/* Conversation Feed */}
        <div className="space-y-5 sm:space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-5 sm:px-6 py-4 sm:py-5 ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-orange-600/20 to-orange-700/20 border border-orange-500/30 shadow-lg shadow-orange-900/10"
                    : "bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/50"
                }`}>
                  {message.role === "user" ? (
                    <div>
                      <p className="text-white text-sm sm:text-base break-words leading-relaxed">
                        {cleanMessageContent(message.content)}
                      </p>
                      {message.grounded_mode && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-cyan-400">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Strict Mode</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Confidence Indicator */}
                      {message.confidence !== undefined && (
                        <div className="mb-3">
                          <ConfidenceIndicator
                            score={message.confidence}
                            level={message.confidence_level}
                            reason={message.confidence_reason}
                            metrics={message.confidence_metrics}
                            citations={message.citations}
                            groundedMode={message.grounded_mode}
                            showDetails={message.grounded_mode}
                          />
                        </div>
                      )}

                      {/* Low Confidence Warning */}
                      {(message.confidence_level === "low" || message.confidence_level === "insufficient_data") && (
                        <LowConfidenceWarning
                          confidenceLevel={message.confidence_level}
                          confidenceScore={message.confidence}
                        />
                      )}

                      {message.grounded_mode && message.verification && (
                        <GroundingWarningBanner verification={message.verification} />
                      )}

                      <div className="prose prose-sm prose-invert max-w-none">
                        {message.grounded_mode && message.citations?.length > 0 ? (
                          (() => {
                            const parsed = parseCitations(message.content, selectedDocs);
                            if (!parsed) return <MarkdownRenderer content={message.content} />;
                            return (
                              <>
                                <MarkdownRenderer content={parsed.cleanContent} />
                                <div className="mt-4 pt-3 border-t border-neutral-700/50">
                                  <p className="text-xs text-gray-500 mb-2">Referenced Sources:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {parsed.citations.map((citation, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => handleCitationClick(citation.docId, citation.paraId)}
                                        title={`${citation.docTitle} - Paragraph ${citation.paraId}`}
                                        className={`text-xs px-2 py-1 rounded transition-colors ${
                                          citation.valid
                                            ? "bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30"
                                            : "bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30"
                                        }`}
                                      >
                                        {citation.docTitle}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            );
                          })()
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )}
                      </div>

                      {/* Sources */}
                      {message.sources?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-700">
                          <p className="text-xs text-gray-400 mb-2">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs px-2.5 py-1.5 rounded-lg hover:opacity-80 break-words transition-all ${
                                  source.type === "internal" ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/50" :
                                  source.type === "external" ? "bg-green-600/30 text-green-300 border border-green-500/50" :
                                  "bg-neutral-800/50"
                                }`}
                              >
                                {source.type === "internal" && "📁 "}
                                {source.type === "external" && "🌐 "}
                                {source.title}
                              </a>
                            ))}
                          </div>
                          {message.metadata?.execution_time && (
                            <div className="mt-2 text-xs text-gray-500">
                              ⚡ Internal: {message.metadata.execution_time.internal}ms |
                              Web: {message.metadata.execution_time.web}ms |
                              Synthesis: {message.metadata.execution_time.synthesis}ms
                            </div>
                          )}
                        </div>
                      )}

                      {/* Grounded mode footer */}
                      {message.grounded_mode && (
                        <>
                          <div className="mt-3 flex items-center gap-1 text-xs text-cyan-400">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Grounded</span>
                          </div>
                          {message.document_context && (
                            <DocumentChunksViewer
                              documents={message.document_context.documents}
                              verification={message.verification}
                            />
                          )}
                          <ResponseVerification message={message} documents={selectedDocs} />
                        </>
                      )}

                      {message.mode && (
                        <div className="mt-2 text-xs text-gray-500">
                          Mode: {workflowButtons.find(b => b.id === message.mode)?.label}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-start"
            >
              <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                  <p className="text-gray-300 text-sm sm:text-base">
                    {groundedMode ? "ARIA is analyzing documents..." : "ARIA is thinking..."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Document Selector Modal */}
      {showDocSelector && (
        <DocumentSelectorModal
          selectedDocs={selectedDocs}
          onSelectDocs={handleSelectDocs}
          onClose={() => setShowDocSelector(false)}
        />
      )}

      {/* Save Chat Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Save Chat Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chat Title</label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Enter a title for this chat"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-md text-white placeholder:text-gray-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveChat(); }}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowSaveModal(false)}
                className="bg-transparent border-neutral-700">
                Cancel
              </Button>
              <Button onClick={handleSaveChat} className="bg-cyan-600 text-white hover:bg-cyan-700">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
