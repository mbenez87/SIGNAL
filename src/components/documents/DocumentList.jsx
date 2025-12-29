import React, { useState } from "react";
import { 
  FileText, Star, Trash2, Download, MoreVertical,
  File, FileImage, FileSpreadsheet, FileCode, Check, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import ShareDocumentModal from "../permissions/ShareDocumentModal";

export default function DocumentList({ documents, onDelete, onToggleFavorite, selectionMode, selectedDocs, onSelectDoc }) {
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

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {selectionMode && (
                <th className="w-12 px-4 py-3"></th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {documents.map((doc) => {
              const FileIcon = getFileIcon(doc.file_type);
              const isSelected = selectedDocs?.includes(doc.id);
              
              return (
                <tr 
                  key={doc.id} 
                  className={`transition-colors ${
                    isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  }`}
                >
                  {selectionMode && (
                    <td className="px-4 py-4">
                      <div 
                        className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600' 
                            : 'bg-white border-2 border-slate-300'
                        }`}
                        onClick={() => onSelectDoc(doc.id)}
                      >
                        {isSelected && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <Link to={createPageUrl('DocumentViewer') + '?id=' + doc.id}>
                      <div className="flex items-center gap-3 cursor-pointer">
                      <FileIcon className="w-8 h-8 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {doc.title}
                        </p>
                        {doc.ai_summary && (
                          <p className="text-sm text-slate-500 truncate">
                            {doc.ai_summary.substring(0, 60)}...
                          </p>
                        )}
                      </div>
                      {doc.is_favorited && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        </div>
                        </Link>
                        </td>
                  <td className="px-6 py-4">
                    <Badge className={getCategoryColor(doc.category)}>
                      {doc.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatFileSize(doc.file_size)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {format(new Date(doc.created_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    {!selectionMode && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleFavorite(doc)}
                        >
                          <Star className={`w-4 h-4 ${doc.is_favorited ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(doc.file_url, '_blank')}>
                              View Document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleFavorite(doc)}>
                              {doc.is_favorited ? 'Remove from Favorites' : 'Add to Favorites'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShareDoc(doc)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {shareDoc && (
        <ShareDocumentModal
          document={shareDoc}
          onClose={() => setShareDoc(null)}
        />
      )}
    </div>
  );
}