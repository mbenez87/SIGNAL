
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { 
        Home, FileText, Upload, Settings, Menu, X, 
        FolderPlus, Folder, Brain, Trash2, User, LogOut, Shield, MessageSquare
      } from "lucide-react";
import { Button } from "@/components/ui/button";
import FolderList from "./components/documents/FolderList";
import CreateFolderModal from "./components/documents/CreateFolderModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logUserLogout } from "./components/audit/AuditTracker";
import Footer from "./components/Footer";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();

  // Fetch user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', user?.email],
    queryFn: () => base44.entities.Folder.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const navigation = [
    { name: 'Home', icon: Home, path: 'Home' },
    { name: 'Intelligence', icon: Brain, path: 'Intelligence' },
    { name: 'Saved Chats', icon: MessageSquare, path: 'SavedChats' },
    { name: 'Workspaces', icon: FolderPlus, path: 'Workspaces' },
    { name: 'Documents', icon: FileText, path: 'Documents' },
    { name: 'Upload', icon: Upload, path: 'Upload' },
    { name: 'Trash', icon: Trash2, path: 'Trash' },
  ];

  const adminNavigation = user?.role === 'admin' ? [
    { name: 'Audit Logs', icon: Shield, path: 'AuditLogs' },
    { name: 'Permissions', icon: Shield, path: 'Permissions' },
    { name: 'Compliance', icon: Shield, path: 'Compliance' },
  ] : [];

  const isActive = (pageName) => currentPageName === pageName;

  const handleLogout = () => {
    logUserLogout();
    base44.auth.logout();
  };

  // Pages where footer should be visible
  const footerPages = ['Home', 'AboutUs', 'Terms', 'Privacy', 'MichaelBenezra', 'MichaelChavira'];
  // Exclude footer from SubscriptionSettings
  if (currentPageName === 'SubscriptionSettings') {
    return <>{children}</>;
  }
  const showFooter = footerPages.includes(currentPageName);

  // Don't show sidebar on Home page or Dashboard
  if (currentPageName === 'Home' || currentPageName === 'Dashboard') {
    return (
      <>
        {children}
        {showFooter && <Footer />}
      </>
    );
  }

  // Don't show sidebar or footer on DocumentViewer
  if (currentPageName === 'DocumentViewer') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-30 w-full sm:w-80 md:w-80 ${!sidebarOpen && 'max-md:-translate-x-full'} transition-all duration-300 bg-neutral-950 border-r border-neutral-800 flex flex-col overflow-hidden`}>
        {/* User Profile */}
        {user && (
          <div className="p-4 border-b border-neutral-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-auto p-3 hover:bg-neutral-900">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="font-medium text-sm truncate w-full text-white">{user.full_name || 'User'}</span>
                    <span className="text-xs text-gray-400 truncate w-full">{user.email}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800">
                <DropdownMenuLabel className="text-white">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <DropdownMenuItem asChild className="text-gray-300 hover:bg-neutral-800 hover:text-white">
                  <Link to={createPageUrl('SubscriptionSettings')}>
                    <User className="w-4 h-4 mr-2" />
                    Subscription
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-gray-300 hover:bg-neutral-800 hover:text-white">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 pt-6 sm:pt-8">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex justify-center mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/b4fb0c419_SignalLogocopy.png" 
                alt="ARIA Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          
          <div className="space-y-1 mb-4 sm:mb-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} to={createPageUrl(item.path)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-10 text-sm ${
                      isActive(item.path) 
                        ? 'bg-neutral-800 text-white hover:bg-neutral-800' 
                        : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}

            {adminNavigation.length > 0 && (
              <>
                <div className="my-3 sm:my-4 border-t border-neutral-800 pt-3 sm:pt-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-3">
                    Admin
                  </p>
                </div>
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} to={createPageUrl(item.path)}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-10 text-sm ${
                          isActive(item.path) 
                            ? 'bg-neutral-800 text-white hover:bg-neutral-800' 
                            : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Folders Section */}
          <div className="mt-4 sm:mt-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3 px-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Folders
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white hover:bg-neutral-900"
                onClick={() => setShowCreateFolder(true)}
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className={`w-full justify-start h-9 text-sm ${
                  selectedFolder === null 
                    ? 'bg-neutral-800 text-white hover:bg-neutral-800' 
                    : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                }`}
                onClick={() => setSelectedFolder(null)}
              >
                <Folder className="w-4 h-4 mr-3" />
                All Documents
              </Button>
              {folders.map(folder => {
                const isSelected = selectedFolder === folder.id;
                const folderColors = {
                  blue: "text-blue-500",
                  green: "text-green-500",
                  purple: "text-purple-500",
                  orange: "text-orange-500",
                  red: "text-red-500",
                  yellow: "text-yellow-500",
                  pink: "text-pink-500",
                  gray: "text-gray-500"
                };
                const colorClass = folderColors[folder.color] || folderColors.blue;

                return (
                  <Button
                    key={folder.id}
                    variant="ghost"
                    className={`w-full justify-start h-9 text-sm ${
                      isSelected 
                        ? 'bg-neutral-800 text-white hover:bg-neutral-800' 
                        : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                    }`}
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <Folder className={`w-4 h-4 mr-3 ${colorClass}`} />
                    <span className="truncate">{folder.name}</span>
                  </Button>
                );
              })}
              {folders.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4">
                  No folders yet. Click + to create one.
                </p>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
        {/* Menu Toggle - Hidden by default, only visible on mobile */}
        <div className="md:hidden fixed top-4 left-4 z-40">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-neutral-900 text-white hover:bg-neutral-800"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {React.cloneElement(children, { 
            selectedFolder,
            setSelectedFolder 
          })}
        </main>
        {showFooter && <Footer />}
        </div>

        {/* Modals */}
        {showCreateFolder && (
        <CreateFolderModal
          onClose={() => setShowCreateFolder(false)}
          onSuccess={() => {
            setShowCreateFolder(false);
            queryClient.invalidateQueries(['folders']);
          }}
        />
        )}
        </div>
        );
        }
