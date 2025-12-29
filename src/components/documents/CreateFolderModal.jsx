import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Folder } from "lucide-react";

export default function CreateFolderModal({ onClose, onSuccess }) {
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");

  const colors = [
    { name: "blue", class: "bg-blue-500" },
    { name: "green", class: "bg-green-500" },
    { name: "purple", class: "bg-purple-500" },
    { name: "orange", class: "bg-orange-500" },
    { name: "red", class: "bg-red-500" },
    { name: "yellow", class: "bg-yellow-500" },
    { name: "pink", class: "bg-pink-500" },
    { name: "gray", class: "bg-gray-500" },
  ];

  const createFolderMutation = useMutation({
    mutationFn: (folderData) => base44.entities.Folder.create(folderData),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    createFolderMutation.mutate({
      name: folderName,
      color: selectedColor,
      document_ids: [],
      is_pinned: false,
      view_type: "grid"
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Create New Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="folderName" className="text-sm">Folder Name</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              autoFocus
              className="h-10"
            />
          </div>

          <div>
            <Label className="text-sm">Folder Color</Label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-2">
              {colors.map(color => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.name)}
                  className={`
                    w-10 h-10 rounded-lg ${color.class}
                    ${selectedColor === color.name ? 'ring-2 ring-offset-2 ring-slate-900' : ''}
                    hover:scale-110 transition-transform touch-manipulation
                  `}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto h-10">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!folderName.trim() || createFolderMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto h-10"
            >
              {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}