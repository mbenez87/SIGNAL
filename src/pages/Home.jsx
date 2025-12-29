import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Grid3x3,
  BarChart3,
  Heart,
  Shield,
  DollarSign,
  Briefcase,
  FileText,
  User,
  LogOut } from
"lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/AuthContext";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");

  const handleLogout = () => {
    base44.auth.logout();
  };



  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <nav className="max-w-[1400px] mx-auto px-6 sm:px-10 py-5 flex justify-between items-center">
          <Link to={createPageUrl('Home')} className="flex items-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/d7d85d5a1_SignalLogo.png"
              alt="Signal87 AI Logo"
              className="h-[90px] w-auto" />

          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-lg text-slate-900 hover:text-blue-600 transition-colors">Features</a>
            <a href="#workspaces" className="text-lg text-slate-900 hover:text-blue-600 transition-colors">Workspaces</a>
            <Link to={createPageUrl("Pricing")} className="text-lg text-slate-900 hover:text-blue-600 transition-colors">Pricing</Link>

            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
              <a href="https://www.linkedin.com/company/signal87-ai/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/10079ee55_linkedin-icon-1-logo-png-transparent.png" alt="LinkedIn" className="h-6 w-6" />
              </a>
              <a href="https://www.crunchbase.com/organization/signal87-ai" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/b8b3e85a3_crunchbase-svgrepo-com.png" alt="Crunchbase" className="h-6 w-6" />
              </a>
            </div>

            {isAuthenticated && user && (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-slate-900 text-white text-sm">
                        {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{user.full_name || 'User'}</span>
                      <span className="text-xs text-slate-500 font-normal">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Documents')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('SubscriptionSettings')}>
                      <User className="w-4 h-4 mr-2" />
                      Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 py-20 sm:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          <div className="inline-block px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs sm:text-sm font-medium text-slate-600 mb-6">
            Signal87 AI
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight mb-6">AI-powered document intelligence

          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">Signal87 turns unstructured files into insights with AI—organize, search, and act across your entire document ecosystem.

          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              variant="outline"
              onClick={() => base44.auth.redirectToLogin(createPageUrl('Documents'))}
              className="h-16 px-12 text-lg border-slate-300 text-slate-900 hover:bg-slate-50 w-full sm:w-auto min-w-[180px]">
              Log In
            </Button>
            <Button 
              onClick={() => base44.auth.redirectToLogin(createPageUrl('Documents'))}
              className="bg-slate-900 text-white hover:bg-slate-800 h-16 px-12 text-lg w-full sm:w-auto min-w-[180px]">
              Sign Up
            </Button>
          </div>
              </motion.div>
              </section>

      {/* Document Intelligence Section */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Document Preview Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl p-8 sm:p-12 relative overflow-hidden min-h-[600px] flex items-center justify-center">
            
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 1, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-br from-purple-200/50 to-blue-200/50 blur-3xl" />

            <div className="relative z-10 w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
                
                {/* Document Header */}
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">Q4_Financial_Report.pdf</div>
                    <div className="text-sm text-slate-500">124 pages • Analyzing...</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <motion.div
                  className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                    initial={{ width: "0%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 2, delay: 0.5, ease: "easeOut" }} />
                </motion.div>

                {/* Key Financial Data */}
                <div className="mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                    Key Financial Data
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      className="bg-slate-50 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Revenue</div>
                      <div className="text-2xl font-bold text-slate-900">$2.4M</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                      className="bg-slate-50 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Expenses</div>
                      <div className="text-2xl font-bold text-slate-900">$1.8M</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 }}
                      className="bg-slate-50 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Net Profit</div>
                      <div className="text-2xl font-bold text-slate-900">$600K</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.0 }}
                      className="bg-slate-50 rounded-lg p-4">
                      <div className="text-xs text-slate-500 mb-1">Growth</div>
                      <div className="text-2xl font-bold text-green-600">+24%</div>
                    </motion.div>
                  </div>
                </div>

                {/* AI Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ delay: 1.2 }}
                  whileHover={{ scale: 1.02, borderLeftWidth: "6px" }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-l-4 border-purple-600 cursor-pointer">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    AI Summary
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Q4 showed strong performance with 24% YoY growth. Revenue increased primarily from new 
                    enterprise contracts. Operating expenses remain controlled at 75% of revenue.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <FileText className="w-5 h-5" />
              Document Intelligence
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Read and summarize <span className="text-slate-500">faster than anything else.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg text-slate-600 leading-relaxed">
              ARIA processes documents in seconds, extracting key insights, financial data, and generating 
              comprehensive reports automatically. Never manually read through lengthy documents again.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-4">
              {[
                "Instant document summaries and key insights",
                "Automatic financial data extraction and analysis",
                "Generate reports across multiple documents",
                "Extract tables, figures, and data points"
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                  className="flex items-start gap-3 text-slate-600">
                  <span className="font-semibold text-slate-900">✓</span>
                  {item}
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 1.1 }}>
              <Link to={createPageUrl("Intelligence")}>
                <Button className="bg-slate-900 text-white hover:bg-slate-800 mt-4">
                  Learn about Document Intelligence
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature 1: AI Chat */}
      <section id="features" className="max-w-[1400px] mx-auto px-6 sm:px-10 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">

              <MessageSquare className="w-5 h-5" />
              ARIA
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">

              Chat with ARIA <span className="text-slate-500">anywhere.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg text-slate-600 leading-relaxed">

              Ask questions, get insights, and interact with your documents naturally using ARIA, your intelligent document assistant built specifically for understanding and analyzing your files.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="space-y-4">

              {[
              "Natural language queries across all documents",
              "Instant analysis and summaries powered by ARIA",
              "Context-aware responses with source citations"].
              map((item, i) =>
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="flex items-start gap-3 text-slate-600">

                  <span className="font-semibold text-slate-900">✓</span>
                  {item}
                </motion.li>
              )}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.9 }}>

              <Link to={createPageUrl("Intelligence")}>
                <Button className="bg-slate-900 text-white hover:bg-slate-800 mt-4">Learn about ARIA</Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 sm:p-12 min-h-[500px] flex items-center justify-center relative overflow-hidden">

            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 2, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50 blur-3xl" />

            <div className="relative z-10">
              <ChatDemo />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 2: Organization with Document Scroll */}
      <section id="workspaces" className="max-w-[1400px] mx-auto px-6 sm:px-10 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 sm:p-12 min-h-[600px] flex items-center justify-center order-2 lg:order-1 relative overflow-hidden">

            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [-2, 2, -2]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-br from-cyan-100/50 to-blue-100/50 blur-3xl" />

            <div className="relative z-10 w-full">
              <ScrollingDocumentDemo />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 order-1 lg:order-2">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">

              <Grid3x3 className="w-5 h-5" />
              Organization
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">

              Work faster with ARIA <span className="text-slate-500">built for teams.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg text-slate-600 leading-relaxed">

              ARIA-powered categorization keeps your documents perfectly organized without any manual work. Automatic tagging, duplicate detection, and smart suggestions.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-4">

              {[
              "Automatic document categorization with ARIA",
              "Duplicate detection and merging",
              "Smart folder suggestions powered by ARIA"].
              map((item, i) =>
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                className="flex items-start gap-3 text-slate-600">

                  <span className="font-semibold text-slate-900">✓</span>
                  {item}
                </motion.li>
              )}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 1 }}>

              <Link to={createPageUrl("Workspaces")}>
                <Button className="bg-slate-900 text-white hover:bg-slate-800 mt-4">Learn about Organization</Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature 3: Intelligence */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">

              <BarChart3 className="w-5 h-5" />
              Account Intelligence
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">

              Surface the right context <span className="text-slate-500">for each workspace.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-slate-600 leading-relaxed">

              Manage workspaces proactively with shared context from AI analysis, document insights, and automated organization in one unified view.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="space-y-4">

              {[
              "Track key document signals automatically",
              "See full workspace context in seconds",
              "Turn insights into actionable tasks"].
              map((item, i) =>
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="flex items-start gap-3 text-slate-600">

                  <span className="font-semibold text-slate-900">✓</span>
                  {item}
                </motion.li>
              )}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.9 }}>

              <Link to={createPageUrl("Intelligence")}>
                <Button className="bg-slate-900 text-white hover:bg-slate-800 mt-4">Learn about Intelligence</Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 sm:p-12 min-h-[500px] flex items-center justify-center relative overflow-hidden">

            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                rotate: [2, -2, 2]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 blur-3xl" />

            <div className="relative z-10">
              <DashboardDemo />
            </div>
          </motion.div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-slate-200 py-16">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/9452aa1b2_SignalLogo.png"
                alt="Signal87 AI"
                className="h-[72px] w-auto mb-4"
              />
              <p className="text-slate-600 leading-relaxed">
                Intelligent document organization powered by AI.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Product</h4>
              <div className="space-y-3">
                <a href="#features" className="block text-slate-600 hover:text-slate-900 transition-colors">Features</a>
                <Link to={createPageUrl("Workspaces")} className="block text-slate-600 hover:text-slate-900 transition-colors">Workspaces</Link>
                <Link to={createPageUrl("Pricing")} className="block text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Company</h4>
              <div className="space-y-3">
                <Link to={createPageUrl("AboutUs")} className="block text-slate-600 hover:text-slate-900 transition-colors">About</Link>
                <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">Blog</a>
                <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">Careers</a>
                <a href="#" className="block text-slate-600 hover:text-slate-900 transition-colors">Contact</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Legal</h4>
              <div className="space-y-3">
                <Link to={createPageUrl("Privacy")} className="block text-slate-600 hover:text-slate-900 transition-colors">Privacy</Link>
                <Link to={createPageUrl("Terms")} className="block text-slate-600 hover:text-slate-900 transition-colors">Terms</Link>
                <Link to={createPageUrl("Compliance")} className="block text-slate-600 hover:text-slate-900 transition-colors">Compliance</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500">
            <div>© 2025 Signal87 AI. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>);

}

// Chat Demo Component
function ChatDemo() {
  const [showTyping, setShowTyping] = React.useState(false);

  React.useEffect(() => {
    const animationCycle = () => {
      setTimeout(() => setShowTyping(true), 800);
      setTimeout(() => setShowTyping(false), 3000);
    };
    
    animationCycle();
    const interval = setInterval(animationCycle, 8000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-xl flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="self-end bg-slate-900 text-white px-6 py-5 rounded-xl max-w-[85%] shadow-sm">

        <div className="text-base">What's my total insurance coverage?</div>
      </motion.div>
      
      <AnimatePresence>
        {showTyping &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 px-4">

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-2 h-2 bg-white rounded-full" />

            </div>
            <div className="flex gap-1">
              <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
              className="w-2 h-2 bg-slate-400 rounded-full" />

              <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
              className="w-2 h-2 bg-slate-400 rounded-full" />

              <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
              className="w-2 h-2 bg-slate-400 rounded-full" />

            </div>
          </motion.div>
        }
      </AnimatePresence>
      
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
        className="bg-white px-6 py-5 rounded-xl max-w-[85%] shadow-sm border border-slate-100">

        <motion.div
          className="flex items-center gap-3 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}>

          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold"
            animate={{ rotate: [0, 360] }}
            transition={{ delay: 1.3, duration: 0.6 }}>

            A
          </motion.div>
          <div className="text-sm font-semibold text-slate-600">ARIA</div>
        </motion.div>
        <motion.div
          className="text-base text-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}>

          Based on your uploaded policies, your total coverage is $2.5M across health, life, and property insurance.
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 2.8, type: "spring", stiffness: 200 }}
        className="self-end bg-slate-900 text-white px-6 py-5 rounded-xl max-w-[85%] shadow-sm">

        <div className="text-base">Show me my health policy details</div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 3.8, type: "spring", stiffness: 200 }}
        className="bg-white px-6 py-5 rounded-xl max-w-[85%] shadow-sm border border-slate-100">

        <motion.div
          className="flex items-center gap-3 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.0 }}>

          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold"
            animate={{ rotate: [0, 360] }}
            transition={{ delay: 3.9, duration: 0.6 }}>

            A
          </motion.div>
          <div className="text-sm font-semibold text-slate-600">ARIA</div>
        </motion.div>
        <motion.div
          className="text-base text-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.2 }}>

          I found your Health Insurance Policy 2024. It provides $500K coverage with a $2,500 deductible. Would you like me to show specific sections?
        </motion.div>
      </motion.div>
    </div>);

}

// Scrolling Document Demo Component
function ScrollingDocumentDemo() {
  const documents = [
  { title: "Health Insurance Policy", type: "PDF", pages: "24 pages", icon: Shield },
  { title: "Tax Return 2024", type: "PDF", pages: "18 pages", icon: DollarSign },
  { title: "Marriage Certificate", type: "PDF", pages: "2 pages", icon: Heart },
  { title: "SF-330 Form", type: "PDF", pages: "12 pages", icon: Briefcase },
  { title: "Property Deed", type: "PDF", pages: "8 pages", icon: FileText }];


  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {/* Main scrolling document stack */}
      <div className="relative w-full max-w-md">
        {documents.map((doc, index) =>
        <motion.div
          key={index}
          initial={{
            opacity: 0,
            y: 100 + index * 20,
            scale: 0.9 - index * 0.05,
            rotateX: 10
          }}
          whileInView={{
            opacity: 1 - index * 0.15,
            y: index * 60,
            scale: 1 - index * 0.08,
            rotateX: 0
          }}
          animate={{
            y: [index * 60, index * 60 - 5, index * 60],
          }}
          transition={{
            duration: 1.2,
            delay: index * 0.15,
            ease: [0.16, 1, 0.3, 1],
            y: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          viewport={{ once: false }}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            translateX: '-50%',
            zIndex: documents.length - index
          }}
          className="w-full">

            <motion.div
            whileHover={{
              scale: 1.05,
              y: -10,
              transition: { type: "spring", stiffness: 400 }
            }}
            className="bg-white rounded-xl p-6 shadow-2xl border border-slate-200 cursor-pointer">

              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
              index === 0 ? 'bg-blue-100' :
              index === 1 ? 'bg-green-100' :
              index === 2 ? 'bg-pink-100' :
              index === 3 ? 'bg-purple-100' :
              'bg-amber-100'}`
              }>
                  <doc.icon className="w-7 h-7 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-slate-900 mb-1">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="font-medium">{doc.type}</span>
                    <span>•</span>
                    <span>{doc.pages}</span>
                  </div>
                </div>
              </div>
              
              {/* Document preview lines */}
              <div className="mt-4 space-y-2">
                {[...Array(3)].map((_, i) =>
              <motion.div
                key={i}
                initial={{ width: 0 }}
                animate={{ width: `${100 - i * 15}%` }}
                transition={{ duration: 0.8, delay: 0.5 + index * 0.15 + i * 0.1 }}
                className="h-2 bg-slate-100 rounded-full" />

              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Floating AI badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0, y: 50 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: false }}
        animate={{ 
          y: [0, -10, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          opacity: { duration: 0.8, delay: 1.5 },
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute bottom-8 right-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />

        <span className="text-sm font-semibold">ARIA Analyzing</span>
      </motion.div>
    </div>);

}

// Doc Grid Demo Component
function DocGridDemo() {
  const docs = [
  { icon: Shield, title: "Health Policy", category: "Insurance", color: "bg-blue-100" },
  { icon: DollarSign, title: "Tax Return", category: "Financial", color: "bg-green-100" },
  { icon: Heart, title: "Marriage Cert", category: "Personal", color: "bg-pink-100" },
  { icon: Briefcase, title: "SF-330 Form", category: "Government", color: "bg-purple-100" }];


  return (
    <div className="grid grid-cols-2 gap-5 w-full max-w-xl">
      {docs.map((doc, index) =>
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: 0.3 + index * 0.15,
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
        whileHover={{
          y: -12,
          scale: 1.05,
          rotate: index % 2 === 0 ? 2 : -2,
          transition: { type: "spring", stiffness: 400, damping: 15 }
        }}
        className="bg-white rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-xl transition-all border border-slate-100">

          <motion.div
          className={`w-12 h-12 ${doc.color} rounded-lg flex items-center justify-center mb-4`}
          whileHover={{
            scale: 1.1,
            rotate: 360,
            transition: { duration: 0.4 }
          }}>

            <doc.icon className="w-6 h-6 text-slate-700" />
          </motion.div>
          <motion.div
          className="text-base font-semibold mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.15 }}>

            {doc.title}
          </motion.div>
          <motion.div
          className="text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 + index * 0.15 }}>

            {doc.category}
          </motion.div>
        </motion.div>
      )}
    </div>);

}

// Dashboard Demo Component
function DashboardDemo() {
  const [counts, setCounts] = React.useState({ docs: 0, complete: 0 });

  React.useEffect(() => {
    const docsTimer = setInterval(() => {
      setCounts((prev) => ({
        ...prev,
        docs: prev.docs < 87 ? prev.docs + 3 : 87
      }));
    }, 30);

    const completeTimer = setInterval(() => {
      setCounts((prev) => ({
        ...prev,
        complete: prev.complete < 94 ? prev.complete + 2 : 94
      }));
    }, 30);

    return () => {
      clearInterval(docsTimer);
      clearInterval(completeTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      className="bg-white rounded-xl p-10 shadow-sm w-full max-w-2xl border border-slate-100">

      <div className="flex gap-6 border-b border-slate-200 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="pb-3 text-sm font-medium border-b-2 border-slate-900 cursor-pointer">

          Overview
        </motion.div>
        <motion.div
          className="pb-3 text-sm text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
          whileHover={{ scale: 1.05 }}>

          Documents
        </motion.div>
        <motion.div
          className="pb-3 text-sm text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
          whileHover={{ scale: 1.05 }}>

          Activity
        </motion.div>
      </div>
      
      <motion.h3
        className="text-xl font-semibold mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}>

        Current status
      </motion.h3>
      
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
        { label: "Health", value: "Good", isNumber: false },
        { label: "Documents", value: counts.docs, isNumber: true },
        { label: "Complete", value: `${counts.complete}%`, isNumber: true }].
        map((stat, index) =>
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false }}
          transition={{
            delay: 0.7 + index * 0.15,
            type: "spring",
            stiffness: 200
          }}
          whileHover={{
            scale: 1.08,
            y: -8,
            transition: { type: "spring", stiffness: 400 }
          }}
          className="bg-slate-50 p-5 rounded-lg cursor-pointer">

            <motion.div
            className="text-sm text-slate-500 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 + index * 0.15 }}>

              {stat.label}
            </motion.div>
            <motion.div
            className="text-3xl font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + index * 0.15, type: "spring", stiffness: 300 }}>

              {stat.value}
            </motion.div>
          </motion.div>
        )}
      </div>
      
      <div>
        <motion.div
          className="text-base font-semibold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}>

          Recent insights
        </motion.div>
        {[
        "• 3 documents need renewal",
        "• Tax filing deadline in 30 days"].
        map((insight, index) =>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -30, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            delay: 1.6 + index * 0.2,
            type: "spring",
            stiffness: 200
          }}
          whileHover={{
            scale: 1.02,
            x: 5,
            backgroundColor: "#EFF6FF",
            transition: { type: "spring", stiffness: 400 }
          }}
          className="bg-slate-50 px-4 py-3 rounded-lg text-base text-slate-600 mb-3 hover:bg-blue-50 transition-colors cursor-pointer">

            {insight}
          </motion.div>
        )}
      </div>
    </motion.div>);

}