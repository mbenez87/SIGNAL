import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import {
  Bot, FileText, FolderOpen, Search, Upload, Settings, LogOut, Home,
  Shield, BarChart3, X, Send, Sparkles, Paperclip, Wand2, Loader2,
  Globe, Database
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [ariaOpen, setAriaOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Aria, your AI assistant. I can help you upload documents, organize files, search for information, apply signatures, and much more. What would you like to do?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAriaThinking, setIsAriaThinking] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [includeWebSearch, setIncludeWebSearch] = useState(true);
  
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalDocs: 0, totalSize: 0, aiInsights: 0 });

  const sidebarItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'generate', icon: Wand2, label: 'Generate', highlight: true },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'folders', icon: FolderOpen, label: 'Folders' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'compliance', icon: Shield, label: 'Compliance' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl('Home')));
  }, [navigate]);

  const loadDocuments = useCallback(async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      const docs = await base44.entities.Document.filter(
        { created_by: user.email, is_trashed: { '$ne': true } },
        "-created_date", 50
      );
      setDocuments(docs);
      
      const totalSize = docs.reduce((acc, d) => acc + (d.file_size || 0), 0);
      const withInsights = docs.filter(d => d.ai_summary || d.key_insights?.length > 0).length;
      setStats({
        totalDocs: docs.length,
        totalSize: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
        aiInsights: withInsights
      });

      const userFolders = await base44.entities.Folder.filter({ created_by: user.email });
      setFolders(userFolders);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAriaThinking) return;
    
    const userMsg = inputMessage;
    setInputMessage('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAriaThinking(true);

    try {
      const response = await base44.functions.invoke('aria', {
        query: userMsg,
        mode: 'chat'
      });

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data?.content || "I'm sorry, I couldn't process that request.",
        model_used: response.data?.model_used
      }]);
    } catch (error) {
      console.error('Aria chat error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "I encountered an error. Please try again."
      }]);
    }
    setIsAriaThinking(false);
  };

  const handleGenerate = async () => {
    if (!generationPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const relevantDocs = documents.slice(0, 15).map(doc => ({
        title: doc.title,
        summary: doc.ai_summary,
        key_insights: doc.key_insights?.slice(0, 3),
        category: doc.category,
        content_preview: doc.extracted_content?.substring(0, 800)
      }));

      const prompt = `You are an expert document analyst. Generate a comprehensive response based on the user's request.

USER REQUEST: "${generationPrompt}"

AVAILABLE DOCUMENTS (${documents.length} total):
${JSON.stringify(relevantDocs, null, 2)}

INSTRUCTIONS:
1. Analyze the relevant documents thoroughly
2. Generate a well-structured, professional response
3. Use Markdown formatting with headers, lists, and emphasis
4. Include specific data and insights from the documents
5. If documents don't contain relevant info, ${includeWebSearch ? 'supplement with your knowledge' : 'clearly state what information is missing'}

Generate a detailed, actionable response:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: includeWebSearch,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string", description: "The full generated content in Markdown" },
            sources_used: { type: "array", items: { type: "string" } },
            confidence: { type: "number" }
          }
        }
      });

      setGeneratedContent(response);
    } catch (error) {
      console.error('Generation error:', error);
      setGeneratedContent({ content: "Error generating content. Please try again.", error: true });
    }
    setIsGenerating(false);
  };

  const handleSignOut = async () => {
    await base44.auth.logout();
    navigate(createPageUrl('Home'));
  };

  const navigateToPage = (tabId) => {
    const pageMap = {
      'documents': 'Documents',
      'folders': 'Documents',
      'search': 'Intelligence',
      'compliance': 'Documents',
      'analytics': 'Dashboard',
      'settings': 'Dashboard'
    };
    if (pageMap[tabId]) {
      navigate(createPageUrl(pageMap[tabId]));
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S87</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Signal87
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigateToPage(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                activeTab === item.id
                  ? item.highlight
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-zinc-800 text-white'
                  : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="bg-zinc-900 border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Personal Workspace • {documents.length} documents
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents..."
                className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg w-80 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={() => navigate(createPageUrl('Upload'))}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          {activeTab === 'home' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Total Documents</h3>
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalDocs}</p>
                <p className="text-sm text-gray-400 mt-2">in workspace</p>
              </div>
              <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Storage Used</h3>
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalSize} GB</p>
                <p className="text-sm text-gray-400 mt-2">total file size</p>
              </div>
              <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">AI Insights</h3>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.aiInsights}</p>
                <p className="text-sm text-gray-400 mt-2">documents with AI analysis</p>
              </div>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Generate Reports & Insights</h2>
                <p className="text-gray-400">Search your documents and generate comprehensive reports powered by AI</p>
              </div>

              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <textarea
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="What would you like to generate? e.g., 'Create a summary of all Q4 financial reports' or 'Generate a compliance report from vendor contracts'"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
                />
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
                      <Database className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Docs</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeWebSearch}
                          onChange={(e) => setIncludeWebSearch(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-600 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">+ Web</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Powered by Aria AI</span>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !generationPrompt.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {generatedContent && (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Generated Content
                  </h3>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{generatedContent.content}</ReactMarkdown>
                  </div>
                  {generatedContent.sources_used?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-700">
                      <p className="text-sm text-gray-400">Sources: {generatedContent.sources_used.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Suggested Prompts</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    'Summarize all financial documents from Q4',
                    'Generate compliance report for vendor contracts',
                    'Create executive summary from board meeting notes',
                    'Analyze budget trends across all departments',
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGenerationPrompt(prompt)}
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-left hover:border-blue-600 transition-colors group"
                    >
                      <p className="text-sm text-white group-hover:text-blue-400">{prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Recent Documents</h2>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="group cursor-pointer">
                      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden hover:border-blue-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20">
                        <div className="aspect-[3/4] bg-zinc-800 relative overflow-hidden flex items-center justify-center">
                          {doc.thumbnail_url ? (
                            <img src={doc.thumbnail_url} alt={doc.title} className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-12 h-12 text-zinc-600" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                            {doc.title}
                          </h3>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>{doc.category || 'Document'}</span>
                            <span>{new Date(doc.created_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {!ariaOpen && (
        <button
          onClick={() => setAriaOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 flex items-center justify-center group hover:scale-110 z-50"
        >
          <Bot className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></span>
        </button>
      )}

      {ariaOpen && (
        <div className="fixed bottom-8 right-8 w-[480px] h-[600px] bg-zinc-900 rounded-2xl shadow-2xl flex flex-col z-50 border border-zinc-800">
          <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Aria</h3>
                <p className="text-xs text-white/80">Your AI Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setAriaOpen(false)}
              className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-zinc-800 text-white'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.model_used && (
                    <p className="text-xs text-gray-400 mt-2 border-t border-zinc-700 pt-2">
                      via {msg.model_used}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isAriaThinking && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-2xl">
            <div className="flex items-center space-x-2">
              <button className="w-10 h-10 hover:bg-zinc-800 rounded-full flex items-center justify-center transition-colors">
                <Paperclip className="w-5 h-5 text-gray-400" />
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Aria anything..."
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={isAriaThinking}
                className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Aria uses intelligent routing across multiple AI models
            </p>
          </div>
        </div>
      )}
    </div>
  );
}