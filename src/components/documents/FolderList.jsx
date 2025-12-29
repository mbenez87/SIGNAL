import React from "react";
import { Folder, FolderOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FolderList({ folders, selectedFolder, onSelectFolder }) {
  const folderColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    pink: "text-pink-600",
    gray: "text-gray-600"
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-4">Folders</h3>
      
      <div className="space-y-1">
        {/* All Documents */}
        <Button
          variant={selectedFolder === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onSelectFolder(null)}
        >
          <Home className="w-4 h-4 mr-2" />
          All Documents
        </Button>

        {/* Folders */}
        {folders.map(folder => {
          const isSelected = selectedFolder === folder.id;
          const FolderIcon = isSelected ? FolderOpen : Folder;
          const colorClass = folderColors[folder.color] || folderColors.blue;
          
          return (
            <Button
              key={folder.id}
              variant={isSelected ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onSelectFolder(folder.id)}
            >
              <FolderIcon className={`w-4 h-4 mr-2 ${colorClass}`} />
              <span className="truncate">{folder.name}</span>
            </Button>
          );
        })}

        {folders.length === 0 && selectedFolder === null && (
          <p className="text-sm text-slate-500 text-center py-4">
            No folders yet
          </p>
        )}
      </div>
    </div>
  );
}