import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, FileText, CheckCircle2, Loader2 } from "lucide-react";

const TYPED_TEXT = "Analyze my insurance PDFs, extract key terms, and generate a risk summary.";
const TYPING_SPEED = 50; // ms per character
const PAUSE_BEFORE_RESET = 2000;

const WORKFLOW_STEPS = [
  { id: 1, label: "Locate documents", duration: 600 },
  { id: 2, label: "Open + index", duration: 800 },
  { id: 3, label: "Extract entities", duration: 1000 },
  { id: 4, label: "Summarize risks", duration: 1200 },
  { id: 5, label: "Export report", duration: 800 }
];

const FINAL_RESULTS = {
  risks: [
    "High deductible ($5,000) may impact claims",
    "Limited coverage for natural disasters",
    "Policy renewal required in 60 days"
  ],
  fields: [
    "Policy #: INS-2024-7891",
    "Premium: $1,245/year",
    "Deductible: $5,000"
  ]
};

export default function AnimatedDemo() {
  const [step, setStep] = useState("idle");
  const [typedText, setTypedText] = useState("");
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (prefersReducedMotion) {
      // Show final static state
      setTypedText(TYPED_TEXT);
      setCompletedSteps(WORKFLOW_STEPS.map(s => s.id));
      setShowResults(true);
      return;
    }

    let timeout;

    const runAnimation = async () => {
      // Reset
      setStep("typing");
      setTypedText("");
      setCurrentWorkflowStep(0);
      setCompletedSteps([]);
      setShowResults(false);

      // Typing animation
      for (let i = 0; i <= TYPED_TEXT.length; i++) {
        await new Promise(resolve => {
          timeout = setTimeout(() => {
            setTypedText(TYPED_TEXT.slice(0, i));
            resolve();
          }, TYPING_SPEED);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      setStep("processing");

      // Workflow steps
      for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
        setCurrentWorkflowStep(i);
        await new Promise(resolve => {
          timeout = setTimeout(() => {
            setCompletedSteps(prev => [...prev, WORKFLOW_STEPS[i].id]);
            resolve();
          }, WORKFLOW_STEPS[i].duration);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setStep("complete");
      setShowResults(true);

      // Pause before reset
      await new Promise(resolve => setTimeout(resolve, PAUSE_BEFORE_RESET));
      
      // Loop
      runAnimation();
    };

    runAnimation();

    return () => clearTimeout(timeout);
  }, [prefersReducedMotion]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
      >
        {/* Chat Input Area */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="relative">
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-600/50">
              <Search className="w-5 h-5 text-slate-400" />
              <div className="flex-1 text-slate-200 text-sm font-mono">
                {typedText}
                {step === "typing" && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5"
                  />
                )}
              </div>
              <Send className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          {/* Processing Status */}
          {(step === "processing" || step === "complete") && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 text-sm text-slate-400"
            >
              {step === "processing" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Processing documents...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Analysis complete</span>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Workflow Steps */}
        {(step === "processing" || step === "complete") && (
          <div className="p-6 border-b border-slate-700/50">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Document Workflow
            </div>
            <div className="space-y-2">
              {WORKFLOW_STEPS.map((workflowStep, idx) => {
                const isCompleted = completedSteps.includes(workflowStep.id);
                const isCurrent = currentWorkflowStep === idx && !isCompleted;

                return (
                  <motion.div
                    key={workflowStep.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      isCompleted 
                        ? "bg-green-500/10 border border-green-500/20" 
                        : isCurrent 
                        ? "bg-blue-500/10 border border-blue-500/20" 
                        : "bg-slate-800/30 border border-slate-700/30"
                    }`}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </motion.div>
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                    )}
                    <span className={`text-sm ${
                      isCompleted || isCurrent ? "text-slate-200" : "text-slate-500"
                    }`}>
                      {workflowStep.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 bg-slate-800/30"
            >
              <div className="space-y-4">
                {/* Risks */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold text-slate-200">Key Risks Identified</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {FINAL_RESULTS.risks.map((risk, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="text-sm text-slate-400"
                      >
                        • {risk}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Extracted Fields */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-slate-200">Extracted Data</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FINAL_RESULTS.fields.map((field, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300 border border-slate-600/50"
                      >
                        {field}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Export Status */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-3 border-t border-slate-700/50"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Report exported as </span>
                    <span className="text-blue-400 font-mono">insurance_analysis.pdf</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}