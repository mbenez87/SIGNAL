import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Copy, Mail, Check, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function ShareWorkspaceModal({ workspace, onClose }) {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/workspaces/${workspace.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteByEmail = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    // TODO: Implement email invitation logic
    toast.success(`Invitation sent to ${email}`);
    setEmail("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Share Workspace</h2>
            <p className="text-sm text-gray-500 mt-1">{workspace.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Copy Link */}
          <div>
            <label className="block text-sm font-medium mb-2">Share Link</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-neutral-950 border-neutral-800 text-gray-400 font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="bg-transparent border-neutral-700 hover:bg-neutral-800"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Anyone with this link can view this workspace
            </p>
          </div>

          {/* Invite by Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Invite by Email</label>
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 bg-neutral-950 border-neutral-800"
                onKeyPress={(e) => e.key === 'Enter' && handleInviteByEmail()}
              />
              <Button
                onClick={handleInviteByEmail}
                className="bg-white text-black hover:bg-gray-200"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div>
            <label className="block text-sm font-medium mb-3">Quick Share</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="bg-transparent border-neutral-700 hover:bg-neutral-800"
                onClick={handleCopyLink}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                className="bg-transparent border-neutral-700 hover:bg-neutral-800"
                onClick={() => {
                  window.open(`mailto:?subject=Check out ${workspace.name}&body=View this workspace: ${shareUrl}`);
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                className="bg-transparent border-neutral-700 hover:bg-neutral-800"
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=Check out this workspace&url=${encodeURIComponent(shareUrl)}`);
                }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800">
          <Button
            variant="outline"
            className="w-full bg-transparent border-neutral-700"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}