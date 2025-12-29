import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function RenameWorkspaceModal({ workspace, onRename, onClose }) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onRename({ name: name.trim(), description: description.trim() });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Rename Workspace</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workspace name"
              className="bg-neutral-950 border-neutral-800 text-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="bg-neutral-950 border-neutral-800 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent border-neutral-700 text-white"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-white text-black hover:bg-gray-200"
              disabled={!name.trim()}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}