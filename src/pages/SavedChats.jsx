import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Search,
  Trash2,
  Clock,
  FileText,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function SavedChats() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch saved chats
  const { data: savedChats = [], isLoading } = useQuery({
    queryKey: ['savedChats', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.SavedChat.filter(
        { created_by: user.email },
        '-created_date'
      );
    },
    enabled: !!user,
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: (chatId) => base44.entities.SavedChat.delete(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedChats']);
      toast.success("Chat deleted successfully");
    },
  });

  const handleDeleteChat = (chatId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this saved chat?")) {
      deleteChatMutation.mutate(chatId);
    }
  };

  // Filter chats based on search
  const filteredChats = savedChats.filter(chat =>
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.preview?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'insights': return '💡';
      case 'research': return '🔍';
      case 'report': return '📊';
      default: return '💬';
    }
  };

  return (
    <div className="h-full bg-neutral-950 overflow-auto">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">SIGNAL87</p>
              <h1 className="text-2xl font-semibold text-white">Saved Chats</h1>
              <p className="text-gray-400 text-sm mt-1">
                {filteredChats.length} saved conversation{filteredChats.length !== 1 ? 's' : ''}
              </p>
            </div>

            <Link to={createPageUrl('Intelligence')}>
              <Button className="bg-white text-black hover:bg-gray-200">
                <MessageSquare className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search saved chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading saved chats...</div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No saved chats yet</h3>
            <p className="text-gray-500 mb-4">
              Start a conversation and save it to access it later
            </p>
            <Link to={createPageUrl('Intelligence')}>
              <Button className="bg-white text-black hover:bg-gray-200">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat) => (
              <Link
                key={chat.id}
                to={createPageUrl('Intelligence') + `?chatId=${chat.id}`}
                className="block bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:bg-neutral-800 hover:border-neutral-700 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{getModeIcon(chat.mode)}</span>
                      <h3 className="text-base font-semibold text-white truncate">
                        {chat.title}
                      </h3>
                      <span className="text-xs text-gray-500 uppercase tracking-wider px-2 py-1 bg-neutral-800 rounded">
                        {chat.mode}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                      {chat.preview}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(chat.created_date), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {chat.messages?.length || 0} messages
                      </div>
                      {chat.document_ids?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {chat.document_ids.length} docs
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="text-gray-500 hover:text-red-400 hover:bg-neutral-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}