import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Share2, X, Mail, Shield, Eye, Edit, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PERMISSIONS, formatPermission, getPermissionBadgeColor } from "./PermissionHelper";
import { logDocumentShare, logPermissionChange } from "../audit/AuditTracker";

export default function ShareDocumentModal({ document, onClose }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState(PERMISSIONS.VIEW);
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Share document mutation
  const shareMutation = useMutation({
    mutationFn: async ({ email, permission }) => {
      // Get existing shares
      const currentShares = document.shared_with || [];
      
      // Check if already shared
      const existingShare = currentShares.find(s => s.user_email === email);
      
      let updatedShares;
      if (existingShare) {
        // Update existing permission
        updatedShares = currentShares.map(s => 
          s.user_email === email ? { ...s, permission } : s
        );
        toast.success(`Updated ${email}'s permission to ${formatPermission(permission)}`);
      } else {
        // Add new share
        updatedShares = [...currentShares, { user_email: email, permission }];
        toast.success(`Shared with ${email} (${formatPermission(permission)})`);
      }
      
      const result = await base44.entities.Document.update(document.id, {
        shared_with: updatedShares
      });

      // Audit log
      logDocumentShare(document.id, document.title, email);
      logPermissionChange('document', document.id, document.title, {
        user_email: email,
        permission,
        action: existingShare ? 'updated' : 'added'
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setEmail("");
      setPermission(PERMISSIONS.VIEW);
    },
  });

  // Remove share mutation
  const removeMutation = useMutation({
    mutationFn: async (emailToRemove) => {
      const currentShares = document.shared_with || [];
      const updatedShares = currentShares.filter(s => s.user_email !== emailToRemove);
      
      const result = await base44.entities.Document.update(document.id, {
        shared_with: updatedShares
      });

      // Audit log
      logPermissionChange('document', document.id, document.title, {
        user_email: emailToRemove,
        action: 'removed'
      });

      toast.success(`Removed access for ${emailToRemove}`);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
    },
  });

  const handleShare = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Prevent sharing with self
    if (email === user?.email) {
      toast.error("You cannot share with yourself");
      return;
    }

    shareMutation.mutate({ email, permission });
  };

  const getPermissionIcon = (perm) => {
    switch (perm) {
      case PERMISSIONS.VIEW:
        return <Eye className="w-4 h-4" />;
      case PERMISSIONS.EDIT:
        return <Edit className="w-4 h-4" />;
      case PERMISSIONS.ADMIN:
        return <Shield className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const sharedWith = document.shared_with || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            Share Document
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Share "{document.title}" with others and manage access permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-10"
            />
          </div>

          <div>
            <Label htmlFor="permission" className="text-sm">Permission Level</Label>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger className="mt-1 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PERMISSIONS.VIEW}>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Can View</div>
                      <div className="text-xs text-slate-500">View and download only</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={PERMISSIONS.EDIT}>
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Can Edit</div>
                      <div className="text-xs text-slate-500">View, download, and edit</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={PERMISSIONS.ADMIN}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Full Access</div>
                      <div className="text-xs text-slate-500">View, edit, delete, and share</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-10"
            disabled={shareMutation.isPending || !email.trim()}
          >
            {shareMutation.isPending ? "Sharing..." : "Share Document"}
          </Button>
        </form>

        {/* Current Shares */}
        {sharedWith.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <Label className="text-sm font-semibold mb-3 block">
              Shared with ({sharedWith.length})
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sharedWith.map((share, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {share.user_email}
                      </p>
                      <Badge className={`${getPermissionBadgeColor(share.permission)} text-xs mt-1`}>
                        {getPermissionIcon(share.permission)}
                        <span className="ml-1">{formatPermission(share.permission)}</span>
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMutation.mutate(share.user_email)}
                    disabled={removeMutation.isPending}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <strong>Security:</strong> Users will only be able to access this document if they have an account on the platform. 
            Permissions follow least-privilege principles.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}