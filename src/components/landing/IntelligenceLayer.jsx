import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, Globe, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TERMINAL_LINES = [
  { text: '$ aria.analyze("legal_bills/*.pdf")', delay: 0 },
  { text: '> Scanning documents...', delay: 600 },
  { text: '> Extracting invoice data...', delay: 1200 },
  { text: '', delay: 1400 },
  { text: '✓ Analysis complete: $47,250 total', delay: 2000, success: true },
  { text: '✓ Report saved to workspace', delay: 2400, success: true },
  { text: '█', delay: 2800, cursor: true }
];

export default function IntelligenceLayer() {
  const [visibleLines, setVisibleLines] = useState([]);
  const [typingLine, setTypingLine] = useState({ index: -1, text: '' });

  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;
    let currentDelay = 0;
    const timeouts = [];

    const typeLine = () => {
      if (lineIndex >= TERMINAL_LINES.length) {
        // Reset animation
        const resetTimeout = setTimeout(() => {
          setVisibleLines([]);
          setTypingLine({ index: -1, text: '' });
        }, 2000);
        timeouts.push(resetTimeout);
        return;
      }

      const currentLine = TERMINAL_LINES[lineIndex];
      
      if (charIndex === 0) {
        // Start typing this line
        currentDelay = currentLine.delay;
        const startTimeout = setTimeout(() => {
          setTypingLine({ index: lineIndex, text: '' });
          typeLine();
        }, currentDelay - (lineIndex > 0 ? TERMINAL_LINES[lineIndex - 1].delay : 0));
        timeouts.push(startTimeout);
        charIndex++;
        return;
      }

      if (charIndex <= currentLine.text.length) {
        // Type next character
        const charTimeout = setTimeout(() => {
          setTypingLine({ 
            index: lineIndex, 
            text: currentLine.text.slice(0, charIndex) 
          });
          charIndex++;
          typeLine();
        }, currentLine.cursor ? 0 : 30);
        timeouts.push(charTimeout);
      } else {
        // Line complete, add to visible lines
        setVisibleLines(prev => [...prev, currentLine]);
        setTypingLine({ index: -1, text: '' });
        lineIndex++;
        charIndex = 0;
        typeLine();
      }
    };

    typeLine();

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Multi-Model Intelligence",
      description: "Leverages GPT-5, Claude 3.5, Gemini 2.5, and Perplexity to deliver unparalleled insights from your documents.",
      color: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-500"
    },
    {
      icon: Sparkles,
      title: "Autonomous Agents",
      description: "ARIA automatically processes documents, extracts insights, generates summaries, and identifies patterns—without manual intervention.",
      color: "from-purple-500 to-pink-500",
      iconBg: "bg-purple-500"
    },
    {
      icon: Globe,
      title: "Real-Time Intelligence",
      description: "Combines your document library with live web data to provide comprehensive, up-to-date intelligence and research.",
      color: "from-orange-500 to-red-500",
      iconBg: "bg-orange-500"
    },
    {
      icon: Workflow,
      title: "Automated Workflows",
      description: "From categorization to duplicate detection to report generation—AI handles repetitive tasks so you can focus on decisions.",
      color: "from-green-500 to-emerald-500",
      iconBg: "bg-green-500"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Documents Processed" },
    { value: "500+", label: "Active Users" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9/5", label: "Rating" }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-950 to-indigo-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
            Not Just a Platform—An Intelligence Environment
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Your AI-Powered Intelligence Layer
          </h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Signal87 AI transforms documents into actionable intelligence. Watch as ARIA 
            autonomously processes, analyzes, and generates insights from your entire knowledge base.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start mb-16">
          {/* Terminal Demo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl"
          >
            {/* Terminal Header */}
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-sm text-slate-400 ml-2 font-mono">signal87ai-agent</span>
            </div>

            {/* Terminal Content */}
            <div className="p-6 font-mono text-sm min-h-[400px]">
              {visibleLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`mb-2 ${
                    line.success ? 'text-green-400' : 
                    line.warning ? 'text-yellow-400' : 
                    line.cursor ? 'text-blue-400' : 
                    'text-slate-300'
                  }`}
                >
                  {line.text}
                  {line.cursor && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      _
                    </motion.span>
                  )}
                </div>
              ))}
              {typingLine.index !== -1 && (
                <div
                  className={`mb-2 ${
                    TERMINAL_LINES[typingLine.index].success ? 'text-green-400' : 
                    TERMINAL_LINES[typingLine.index].warning ? 'text-yellow-400' : 
                    'text-slate-300'
                  }`}
                >
                  {typingLine.text}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block"
                  >
                    █
                  </motion.span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Feature Cards */}
          <div className="space-y-4">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${feature.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-800"
        >
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}