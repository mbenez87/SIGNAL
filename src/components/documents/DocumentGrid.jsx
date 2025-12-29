import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Star, Trash2, Download, MoreVertical,
  File, FileImage, FileSpreadsheet, FileCode, Check,
  FolderInput, Edit, Send, Printer, Copy, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import ShareDocumentModal from "../permissions/ShareDocumentModal";

export default function DocumentGrid({ documents, onDelete, onToggleFavorite, selectionMode, selectedDocs, onSelectDoc, gridSize = "medium" }) {
  const [shareDoc, setShareDoc] = useState(null);

  const getFileIcon = (fileType) => {
    const type = fileType?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(type)) return FileImage;
    if (['xlsx', 'xls', 'csv'].includes(type)) return FileSpreadsheet;
    if (['html', 'json', 'xml', 'js', 'jsx'].includes(type)) return FileCode;
    if (type === 'pdf') return FileText;
    return File;
  };

  const getCategoryColor = (category) => {
    const colors = {
      business: "bg-blue-100 text-blue-800",
      legal: "bg-purple-100 text-purple-800",
      financial: "bg-green-100 text-green-800",
      research: "bg-amber-100 text-amber-800",
      personal: "bg-pink-100 text-pink-800",
      academic: "bg-indigo-100 text-indigo-800",
      medical: "bg-red-100 text-red-800",
      marketing: "bg-orange-100 text-orange-800",
      hr: "bg-cyan-100 text-cyan-800",
      technical: "bg-slate-100 text-slate-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors.other;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(2)} MB`;
  };

  const gridSizeClasses = {
    small: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7",
    medium: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  const containerHeightClasses = {
    small: "h-32 sm:h-32",
    medium: "h-40 sm:h-48",
    large: "h-56 sm:h-64"
  };

  return (
    <div className={`grid ${gridSizeClasses[gridSize]} gap-3 md:gap-4`}>
      {documents.map((doc, index) => {
        const FileIcon = getFileIcon(doc.file_type);
        
        return (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-lg border overflow-hidden group transition-all ${
              selectionMode && selectedDocs?.includes(doc.id) 
                ? 'border-indigo-500 ring-2 ring-indigo-200' 
                : 'border-slate-200 hover:shadow-lg'
            }`}
          >
            {/* Thumbnail/Preview */}
            <Link 
              to={selectionMode ? '#' : createPageUrl('DocumentViewer') + '?id=' + doc.id} 
              onClick={(e) => {
                if (selectionMode) {
                  e.preventDefault();
                  onSelectDoc(doc.id);
                }
              }}
              className={`block ${containerHeightClasses[gridSize]} bg-slate-700 flex items-center justify-center relative cursor-pointer border-b border-slate-100`}
            >
              {doc.thumbnail_url ? (
                <img 
                  src={doc.thumbnail_url} 
                  alt={doc.title}
                  className="w-full h-full object-contain p-3"
                />
              ) : (
                <FileIcon className="w-16 h-16 text-slate-400" />
              )}

              {/* Selection Checkbox */}
              {selectionMode && (
                <div className="absolute top-2 left-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                    selectedDocs?.includes(doc.id) 
                      ? 'bg-indigo-600' 
                      : 'bg-white border-2 border-slate-300'
                  }`}>
                    {selectedDocs?.includes(doc.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              )}

              {/* Favorite Badge */}
              {doc.is_favorited && !selectionMode && (
                <div className="absolute top-2 right-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
              )}
            </Link>

            {/* Content */}
            <div className="p-2 sm:p-3">
              <h3 className="font-medium text-xs sm:text-sm text-slate-900 truncate mb-1">
                {doc.title}
              </h3>

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">
                  {doc.file_type?.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400">
                  {formatFileSize(doc.file_size)}
                </span>
              </div>

              {/* Actions */}
              {!selectionMode && (
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleFavorite(doc)}
                    className="flex-1 h-8 sm:h-9 px-2"
                  >
                    <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${doc.is_favorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.file_url, '_blank')}
                    className="flex-1 h-8 sm:h-9 px-2"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex-1 h-8 sm:h-9 px-2">
                        <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(doc.file_url, '_blank')}>
                        View Document
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleFavorite(doc)}>
                        {doc.is_favorited ? 'Remove from Favorites' : 'Add to Favorites'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShareDoc(doc)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FolderInput className="w-4 h-4 mr-2" />
                        Move to Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(doc.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Move to Trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {shareDoc && (
        <ShareDocumentModal
          document={shareDoc}
          onClose={() => setShareDoc(null)}
        />
      )}
    </div>
  );
}