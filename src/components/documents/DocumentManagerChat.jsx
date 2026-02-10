import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Send, Loader2, FileText, Folder, Trash2, MessageSquare, X, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function DocumentManagerChat({ onClose, minimized, onToggleMinimize }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['documents', user?.email],
    queryFn: async () => {
      if (!user) return [];

      const ownedDocs = await base44.entities.Document.filter({
        is_trashed: false,
        created_by: user.email
      }, '-created_date', 500);

      const allDocs = await base44.entities.Document.filter({
        is_trashed: false,
        shared_with: { $exists: true }
      }, '-created_date', 100);

      const sharedDocs = allDocs.filter((doc) =>
        doc.shared_with?.some((share) => share.user_email === user.email) &&
        doc.created_by !== user.email
      );

      return [...ownedDocs, ...sharedDocs];
    },
    enabled: !!user,
    staleTime: 30000
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', user?.email],
    queryFn: () => base44.entities.Folder.filter({ created_by: user.email }),
    enabled: !!user,
    staleTime: 60000
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initConversation = async () => {
      if (!user) return;

      try {
        const documentContext = allDocuments.map(doc => ({
          id: doc.id,
          title: doc.title,
          file_type: doc.file_type,
          category: doc.category,
          tags: doc.tags || [],
          ai_summary: doc.ai_summary,
          folder_id: doc.folder_id,
          created_date: doc.created_date,
          file_size: doc.file_size,
          is_favorited: doc.is_favorited
        }));

        const folderContext = folders.map(folder => ({
          id: folder.id,
          name: folder.name,
          color: folder.color
        }));

        const conversation = await base44.agents.createConversation({
          agent_name: "document_manager",
          metadata: {
            name: "Document Management Session",
            description: "AI-powered document organization",
            user_email: user.email,
            document_count: allDocuments.length,
            folder_count: folders.length
          },
          initial_context: {
            documents: documentContext,
            folders: folderContext,
            user_email: user.email
          }
        });

        setConversationId(conversation.id);
      } catch (error) {
        console.error("Error creating conversation:", error);
        toast.error("Failed to initialize document manager");
      }
    };

    if (!conversationId && user && allDocuments.length >= 0) {
      initConversation();
    }
  }, [conversationId, user, allDocuments, folders]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !conversationId) {
      if (!input.trim()) toast.error("Please enter a message");
      return;
    }

    setIsLoading(true);
    const query = input;
    setInput("");

    try {
      const conversation = await base44.agents.getConversation(conversationId);

      const enhancedQuery = query + '\n\n[Current document count: ' + allDocuments.length + ']';

      await base44.agents.addMessage(conversation, {
        role: "user",
        content: enhancedQuery
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsLoading(false);
      setInput(query);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (minimized) {
    return null;
  }

  if (!user || !conversationId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 right-8 w-[600px] h-[700px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex items-center justify-center z-50"
      >
        <div className="text-center text-slate-600">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-600" />
          <p className="text-sm">Loading document workspace...</p>
        </div>
      </motion.div>
    );
  }

  const filteredMessages = messages.filter(m => m.role !== 'system');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-8 right-8 w-[600px] h-[700px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50"
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Document Manager</h3>
            <p className="text-xs text-white/80">{allDocuments.length} documents &bull; {folders.length} folders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMinimize}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 && (
          <div className="text-center text-slate-600 mt-8">
            <MessageSquare className="w-16 h-16 mx-auto mb-3 text-slate-400" />
            <p className="text-base font-medium">Ask me to organize, move, find, or manage your documents!</p>
            <div className="mt-4 space-y-2 text-sm text-left bg-slate-100 rounded-lg p-4">
              <p className="font-bold text-slate-800">Try asking:</p>
              <ul className="space-y-1 text-slate-700">
                <li>&bull; &quot;Find all documents about taxes&quot;</li>
                <li>&bull; &quot;Show me PDFs from last month&quot;</li>
                <li>&bull; &quot;Move finance documents to a new folder&quot;</li>
                <li>&bull; &quot;What documents do I have about contracts?&quot;</li>
                <li>&bull; &quot;Create a folder for 2026 reports&quot;</li>
              </ul>
            </div>
          </div>
        )}

        <AnimatePresence>
          {filteredMessages.map((message, index) => {
            const isUser = message.role === "user";
            const displayContent = isUser ? message.content.split('\n[Current document count:')[0] : message.content;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={isUser ? "flex justify-end" : "flex justify-start"}
              >
                <div className={isUser ? "max-w-[85%] rounded-xl px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "max-w-[85%] rounded-xl px-4 py-3 bg-slate-100 border border-slate-200"}>
                  {isUser ? (
                    <p className="text-sm">{displayContent}</p>
                  ) : (
                    <div className="prose prose-base max-w-none">
                      <ReactMarkdown
                        components={{
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 underline font-medium"
                            >
                              {children}
                            </a>
                          ),
                          code: ({ inline, children }) =>
                            inline ? (
                              <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm font-mono">
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-slate-200 p-2 rounded text-sm font-mono">
                                {children}
                              </code>
                            ),
                          p: ({ children }) => <p className="my-2 text-base text-slate-800 leading-relaxed font-medium">{children}</p>,
                          ul: ({ children }) => <ul className="my-2 ml-4 space-y-1 list-disc text-base">{children}</ul>,
                          li: ({ children }) => <li className="text-slate-800">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>
                        }}
                      >
                        {displayContent}
                      </ReactMarkdown>
                    </div>
                  )}

                  {message.tool_calls && message.tool_calls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-300 space-y-1">
                      {message.tool_calls.map((tool, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                          {tool.name.includes('Folder') && <Folder className="w-3 h-3" />}
                          {tool.name.includes('Document') && <FileText className="w-3 h-3" />}
                          {tool.name.includes('delete') && <Trash2 className="w-3 h-3" />}
                          <span className="font-medium">{tool.name.split('.').pop()}</span>
                          {tool.status === 'completed' && <span className="text-green-600">&#10003;</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-slate-500 text-sm"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to organize your documents..."
            className="resize-none text-sm"
            rows={2}
            disabled={isLoading || !conversationId}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !conversationId}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-auto px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
