import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, FileText, Loader2, CheckCircle2, Sparkles, Download, Paperclip, File } from "lucide-react";

const COMMAND = "Generate a report from my most recent legal bills";
const TYPING_SPEED = 50;
const PAUSE_BEFORE_RESET = 4000;

const AI_RESPONSE = `I've analyzed your most recent legal bills and generated a summary. Here's what I found:

**Total Legal Expenses (Last Quarter)**
• Total Billed: $47,250
• Average Hourly Rate: $425
• Total Hours: 111.2 hours

**Top 3 Expense Categories**
1. Contract Review & Negotiation - $18,900 (40%)
2. Litigation Support - $15,750 (33%)
3. Compliance Consulting - $12,600 (27%)

**Key Insights**
• Legal expenses increased 15% compared to previous quarter
• Most billable hours occurred in October (42 hours)
• 3 invoices are currently pending payment (total: $8,450)

**Recommendations**
• Consider negotiating flat-fee arrangements for routine contract reviews
• Monthly retainer could save approximately $2,300/quarter
• Budget allocation for Q1 2025: $52,000 (projected 10% increase)

The full detailed report has been saved to your workspace as "Legal Bills Analysis - Q4 2024.pdf"`;

export default function ReportGenerationDemo() {
  const [step, setStep] = useState("idle");
  const [typedText, setTypedText] = useState("");
  const [typedResponse, setTypedResponse] = useState("");
  const [showResponse, setShowResponse] = useState(false);

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedText(COMMAND);
      setTypedResponse(AI_RESPONSE);
      setShowResponse(true);
      return;
    }

    let timeout;

    const runAnimation = async () => {
      // Reset
      setStep("idle");
      setTypedText("");
      setTypedResponse("");
      setShowResponse(false);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Typing question
      setStep("typing");
      for (let i = 0; i <= COMMAND.length; i++) {
        await new Promise(resolve => {
          timeout = setTimeout(() => {
            setTypedText(COMMAND.slice(0, i));
            resolve();
          }, TYPING_SPEED);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setStep("processing");
      setShowResponse(true);

      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Typing response
      setStep("responding");
      for (let i = 0; i <= AI_RESPONSE.length; i++) {
        await new Promise(resolve => {
          timeout = setTimeout(() => {
            setTypedResponse(AI_RESPONSE.slice(0, i));
            resolve();
          }, 15);
        });
      }

      setStep("complete");
      await new Promise(resolve => setTimeout(resolve, PAUSE_BEFORE_RESET));
      runAnimation();
    };

    runAnimation();

    return () => clearTimeout(timeout);
  }, [prefersReducedMotion]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* User Input Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl max-w-[85%] shadow-lg">
          <p className="text-sm">
            {typedText}
            {step === "typing" && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-0.5 h-4 bg-white ml-0.5"
              />
            )}
          </p>
        </div>
      </motion.div>

      {/* AI Response */}
      <AnimatePresence>
        {showResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 text-slate-200 px-5 py-4 rounded-2xl max-w-[90%] shadow-2xl">
              {step === "processing" ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-sm text-slate-300">Analyzing your legal bills...</span>
                </div>
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-line">
                  {typedResponse}
                  {step === "responding" && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5"
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}