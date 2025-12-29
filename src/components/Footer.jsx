import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/b4fb0c419_SignalLogocopy.png" 
              alt="SIGNAL87 AI"
              className="h-12 w-auto"
            />
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link 
              to={createPageUrl('AboutUs')}
              className="hover:text-white transition-colors text-sm"
            >
              About Us
            </Link>
            <Link 
              to={createPageUrl('AboutUs')}
              className="hover:text-white transition-colors text-sm"
            >
              Team
            </Link>
            <Link 
              to={createPageUrl('Privacy')}
              className="hover:text-white transition-colors text-sm"
            >
              Privacy
            </Link>
            <Link 
              to={createPageUrl('Terms')}
              className="hover:text-white transition-colors text-sm"
            >
              Terms
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} SIGNAL87 AI
          </div>
        </div>
      </div>
    </footer>
  );
}