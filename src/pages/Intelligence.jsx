import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Sparkles, TrendingUp, Folder, Brain,
  Send, Loader2, Paperclip, X, Download, Save } from
"lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { sendChatMessage, isChatConfigured, getChatProviderLabel } from "@/api/openaiClient";
import { toast } from "sonner";
import DocumentSelectorModal from "../components/intelligence/DocumentSelectorModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Intelligence() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [workflowMode, setWorkflowMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [loadedChatId, setLoadedChatId] = useState(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      base44.auth.redirectToLogin();
    }
  }, [user, isUserLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Assign a local session ID on mount (replaces Base44 agent conversation).
  // Also restores a saved chat when a ?chatId= param is present.
  useEffect(() => {
    if (!conversationId) {
      setConversationId(crypto.randomUUID());
    }

    const loadSavedChat = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const chatId = urlParams.get('chatId');

      if (chatId && chatId !== loadedChatId) {
        try {
          const savedChat = await base44.entities.SavedChat.filter({ id: chatId });
          if (savedChat.length > 0) {
            const chat = savedChat[0];
            setMessages(chat.messages || []);
            setConversationId(chat.conversation_id || crypto.randomUUID());
            setWorkflowMode(chat.mode || null);

            // Hydrate plain IDs → full document objects so title/summary/content are available
            if (chat.document_ids && chat.document_ids.length > 0) {
              try {
                const hydrated = await Promise.all(
                  chat.document_ids.map(id =>
                    base44.entities.Document.filter({ id }).then(r => r[0] ?? null)
                  )
                );
                setSelectedDocs(hydrated.filter(Boolean));
              } catch {
                setSelectedDocs([]);
              }
            } else {
              setSelectedDocs([]);
            }

            setLoadedChatId(chatId);
            toast.success(`Loaded: ${chat.title}`);
          }
        } catch (error) {
          console.error('Failed to load saved chat:', error);
          toast.error('Failed to load saved chat');
        }
      }
    };

    loadSavedChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedChatId]);

  const workflowButtons = [
  {
    id: "report",
    label: "Generate Report",
    icon: FileText,
    description: "Structured multi-section reports"
  },
  {
    id: "insights",
    label: "AI Insights",
    icon: Sparkles,
    description: "Extract patterns and opportunities"
  },
  {
    id: "trends",
    label: "Trends",
    icon: TrendingUp,
    description: "Identify patterns over time"
  },
  {
    id: "documents",
    label: "Documents",
    icon: Folder,
    description: "Select specific documents"
  },
  {
    id: "research",
    label: "Deep Research",
    icon: Brain,
    description: "Multi-step synthesis & analysis"
  }];


  const buildSystemPrompt = (docs, mode) => {
    const modeInstructions = {
      report:    "Generate a comprehensive structured report with clearly labelled sections, an executive summary, and conclusions.",
      insights:  "Extract and highlight key patterns, opportunities, risks, and anomalies from the provided content.",
      trends:    "Identify temporal patterns, directional changes, and emerging themes across the documents.",
      research:  "Perform deep multi-step research synthesis. Cross-reference sources, surface contradictions, and produce a well-cited analysis.",
    };

    let prompt = `You are Aria V2, the advanced document intelligence AI for Signal87 AI.
You specialise in document analysis, report generation, research synthesis, and business intelligence.
Use Markdown formatting with clear headers, bullet lists, and emphasis where it aids readability.
Powered by: ${getChatProviderLabel()}.`;

    if (mode && modeInstructions[mode]) {
      prompt += `\n\nActive Mode — ${mode.charAt(0).toUpperCase() + mode.slice(1)}: ${modeInstructions[mode]}`;
    }

    if (docs.length > 0) {
      prompt += `\n\nDocument Context (${docs.length} document${docs.length !== 1 ? 's' : ''} selected for this query):`;
      docs.forEach(doc => {
        prompt += `\n\n**${doc.title}**`;
        if (doc.ai_summary)            prompt += `\nSummary: ${doc.ai_summary}`;
        if (doc.key_insights?.length)  prompt += `\nKey Insights: ${doc.key_insights.join('; ')}`;
        if (doc.extracted_content)     prompt += `\nContent Preview: ${doc.extracted_content.slice(0, 800)}`;
      });
    }

    return prompt;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      if (!input.trim()) toast.error("Please enter a message");
      return;
    }

    setIsLoading(true);
    const query = input;
    setInput("");

    let messageContent = query;
    if (workflowMode) {
      messageContent = `[Mode: ${workflowMode}] ${query}`;
    }
    if (selectedDocs.length > 0) {
      messageContent += `\n\nFocus on these documents: ${selectedDocs.map(d => d.title).join(", ")}`;
    }

    const userMessage = { role: "user", content: messageContent };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const response = await sendChatMessage({
        messages: updatedMessages,
        systemPrompt: buildSystemPrompt(selectedDocs, workflowMode),
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.content,
        model_used: response.model_used,
      }]);

      setWorkflowMode(null);
      setSelectedDocs([]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message: " + (error.message || "Unknown error"));
      setMessages(prev => prev.slice(0, -1)); // remove the optimistic user message
      setInput(query);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleWorkflowClick = async (mode) => {
    if (mode === "documents") {
      setShowDocSelector(true);
      return;
    }

    // If documents are selected, auto-submit with the workflow
    if (selectedDocs.length > 0) {
      setIsLoading(true);
      const modeLabels = {
        report:   "Generate a comprehensive report",
        insights: "Extract key insights and patterns",
        trends:   "Analyze trends and patterns over time",
        research: "Perform deep research and analysis",
      };

      const prompt = modeLabels[mode] || "Analyze these documents";
      const messageContent = `[Mode: ${mode}] ${prompt}\n\nFocus on these documents: ${selectedDocs.map(d => d.title).join(", ")}`;
      const userMessage = { role: "user", content: messageContent };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      try {
        const response = await sendChatMessage({
          messages: updatedMessages,
          systemPrompt: buildSystemPrompt(selectedDocs, mode),
        });

        setMessages(prev => [...prev, {
          role: "assistant",
          content: response.content,
          model_used: response.model_used,
        }]);

        setSelectedDocs([]);
        setWorkflowMode(null);
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message: " + (error.message || "Unknown error"));
        setMessages(prev => prev.slice(0, -1));
      }

      setIsLoading(false);
    } else {
      // No documents selected, just set the mode
      setWorkflowMode(mode);
    }
  };

  const handleSelectDocs = (docs) => {
    setSelectedDocs(docs);
  };

  const handleRemoveDoc = (docId) => {
    setSelectedDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const exportToCSV = () => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }

    const csvRows = [];
    csvRows.push(['Timestamp', 'Role', 'Content', 'Mode'].join(','));

    messages.forEach((msg) => {
      const timestamp = msg.created_date || new Date().toISOString();
      const role = msg.role === 'user' ? 'User' : 'ARIA';
      const content = (msg.content || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const mode = msg.mode || '';
      csvRows.push(`"${timestamp}","${role}","${content}","${mode}"`);
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aria-conversation-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported to CSV");
  };

  const exportToDOCX = async () => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }

    try {
      const response = await base44.functions.invoke('generateDocx', {
        title: `ARIA Conversation - ${new Date().toISOString().split('T')[0]}`,
        content: messages.map((msg) => {
          const role = msg.role === 'user' ? 'User' : 'ARIA';
          const timestamp = msg.created_date ? new Date(msg.created_date).toLocaleString() : '';
          return `**${role}** ${timestamp ? `(${timestamp})` : ''}\n\n${msg.content || ''}\n\n---\n\n`;
        }).join('')
      });

      if (response.data && response.data.file_url) {
        const link = document.createElement('a');
        link.href = response.data.file_url;
        link.download = `aria-conversation-${new Date().toISOString().split('T')[0]}.docx`;
        link.click();
        toast.success("Conversation exported to DOCX");
      }
    } catch (error) {
      console.error("Error exporting to DOCX:", error);
      toast.error("Failed to export to DOCX");
    }
  };

  const handleSaveChat = async () => {
    if (!saveTitle.trim()) {
      toast.error("Please enter a title for the chat");
      return;
    }

    if (messages.length === 0) {
      toast.error("No messages to save");
      return;
    }

    try {
      const preview = messages.find(m => m.role === 'user')?.content?.slice(0, 200) || "Chat session";
      
      await base44.entities.SavedChat.create({
        title: saveTitle,
        conversation_id: conversationId,
        messages: messages,
        mode: workflowMode || 'chat',
        document_ids: selectedDocs.map(d => d.id),
        preview: preview
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
    <div className="bg-neutral-950 text-white min-h-screen from-[#0a0e27] via-[#0d1230] to-[#0a0e27]">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pt-20 sm:pt-28 md:pt-40 lg:pt-48 pb-4 sm:pb-6 md:pb-8">
        {/* Central Chat Input */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8">

          <div className="text-center mb-4 sm:mb-6 px-2">
            <h1 className="text-white mb-2 text-lg font-semibold sm:text-5xl md:text-6xl">Aria V2

            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400">
              Your Document Intelligence Hub
            </p>
          </div>
          <div className="bg-transparent p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-slate-700/80 hover:border-slate-600/80 transition-colors shadow-lg">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything. Type @ for documents and / for workflows."
              className="w-full bg-transparent border-0 text-white placeholder:text-gray-600 resize-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base md:text-lg min-h-[60px] sm:min-h-[70px] md:min-h-[90px] max-h-[150px] sm:max-h-[200px] md:max-h-[300px] px-0 leading-relaxed"
              disabled={isLoading} />

            
            {/* Selected Documents */}
            {selectedDocs.length > 0 &&
            <div className="flex flex-wrap gap-1.5 sm:gap-2 px-1 sm:px-2 pb-2">
                {selectedDocs.map((doc) =>
              <div
                key={doc.id}
                className="flex items-center gap-1.5 sm:gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-2 sm:px-3 py-1 sm:py-1.5">

                    <FileText className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span className="text-xs text-indigo-300 truncate max-w-[120px] sm:max-w-none">{doc.title}</span>
                    <button
                  onClick={() => handleRemoveDoc(doc.id)}
                  className="text-indigo-400 hover:text-indigo-300">

                      <X className="w-3 h-3" />
                    </button>
                  </div>
              )}
              </div>
            }

            <div className="flex items-center justify-between gap-2 px-0 pt-3 border-t border-slate-800/50">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDocSelector(true)}
                  className="text-gray-500 hover:text-white hover:bg-slate-800/50 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm rounded-lg">

                  <Paperclip className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">{selectedDocs.length > 0 ? `${selectedDocs.length} docs` : 'Attach'}</span>
                </Button>
                {messages.length > 0 &&
                <>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={exportToCSV}
                    className="text-gray-500 hover:text-white hover:bg-slate-800/50 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm rounded-lg">
                      <Download className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">CSV</span>
                    </Button>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={exportToDOCX}
                    className="text-gray-500 hover:text-white hover:bg-slate-800/50 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm rounded-lg">
                      <Download className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">DOCX</span>
                    </Button>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveModal(true)}
                    className="text-gray-500 hover:text-white hover:bg-slate-800/50 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm rounded-lg">
                      <Save className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Save</span>
                    </Button>
                  </>
                }
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-cyan-500 hover:bg-cyan-600 text-black rounded-xl px-5 sm:px-7 h-9 sm:h-10 disabled:opacity-50 disabled:cursor-not-allowed font-medium">

                {isLoading ?
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> :

                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                }
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Workflow Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 md:mb-12 px-2">

          {workflowButtons.map((button, index) => {
            const Icon = button.icon;
            const isActive = workflowMode === button.id;

            return (
              <motion.button
                key={button.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleWorkflowClick(button.id)}
                className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-3 rounded-full border transition-all text-xs sm:text-sm md:text-base ${
                isActive ?
                "bg-blue-600/20 border-blue-500 text-blue-300" :
                "bg-slate-800/30 border-slate-700/50 text-gray-300 hover:bg-slate-700/50 hover:border-slate-600"}`
                }>

                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{button.label}</span>
              </motion.button>);

          })}
        </motion.div>

        {/* Conversation Feed */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <AnimatePresence>
            {messages.map((message, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>

                <div
                className={`max-w-[95%] sm:max-w-[85%] md:max-w-[80%] rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 ${
                message.role === "user" ?
                "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30" :
                "bg-slate-800/50 border border-slate-700/50"}`
                }>

                  {message.role === "user" ?
                <p className="text-white text-sm sm:text-base break-words">{message.content}</p> :

                <>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                      components={{
                        a: ({ children, href }) =>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline break-words">

                                {children}
                              </a>,

                        code: ({ inline, children }) =>
                        inline ?
                        <code className="bg-slate-900 px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm">
                                  {children}
                                </code> :

                        <code className="block bg-slate-900 p-2 sm:p-3 md:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto">
                                  {children}
                                </code>,

                        p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
                        h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2">{children}</h3>,
                        ul: ({ children }) => <ul className="my-4 ml-6 space-y-2 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="my-4 ml-6 space-y-2 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-slate-600 pl-4 my-4 italic text-gray-300">{children}</blockquote>

                      }}>

                          {message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {/* Sources & Confidence */}
                      {message.sources && message.sources.length > 0 &&
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700">
                          <p className="text-xs text-gray-400 mb-2">Sources:</p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {message.sources.map((source, idx) =>
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-slate-700/50 px-2 py-1 rounded hover:bg-slate-700 break-words">

                                {source.title}
                              </a>
                      )}
                          </div>
                        </div>
                  }
                      
                      {message.confidence &&
                  <div className="mt-2 text-xs text-gray-500">
                          Confidence: {(message.confidence * 100).toFixed(0)}%
                        </div>
                  }
                    </>
                }
                  {message.mode &&
                <div className="mt-2 text-xs text-gray-500">
                      Mode: {workflowButtons.find((b) => b.id === message.mode)?.label}
                    </div>
                }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>


      </div>

      {/* Document Selector Modal */}
      {showDocSelector &&
      <DocumentSelectorModal
        selectedDocs={selectedDocs}
        onSelectDocs={handleSelectDocs}
        onClose={() => setShowDocSelector(false)} />

      }

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveChat();
                  }
                }}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSaveModal(false)}
                className="bg-transparent border-neutral-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChat}
                className="bg-white text-black hover:bg-gray-200"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}