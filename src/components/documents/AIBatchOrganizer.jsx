import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Sparkles, Loader2, FileText, Tag, Folder } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { invokeGeminiLLM, isGeminiConfigured } from '@/api/geminiClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function AIBatchOrganizer({ isOpen, onClose, selectedDocuments, onComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);

  const organizeDocuments = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Analyzing documents...');

    try {
      // Step 1: Analyze documents
      setProgress(20);
      const documentData = selectedDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        tags: doc.tags,
        ai_summary: doc.ai_summary,
        extracted_content: doc.extracted_content?.substring(0, 500)
      }));

      setCurrentStep('Generating AI recommendations...');
      setProgress(40);

      // Step 2: Get AI recommendations
      const prompt = `Analyze these documents and provide organization recommendations:

Documents: ${JSON.stringify(documentData)}

For each document, suggest:
1. The most appropriate category (business, legal, financial, research, personal, academic, medical, other)
2. Relevant tags for better organization
3. A suggested folder structure if grouping is beneficial

Return recommendations in this JSON format:
{
  "recommendations": [
    {
      "document_id": "string",
      "suggested_category": "string",
      "suggested_tags": ["tag1", "tag2"],
      "confidence": 0.95,
      "reasoning": "Brief explanation"
    }
  ],
  "folder_structure": [
    {
      "folder_name": "string",
      "document_ids": ["id1", "id2"],
      "reasoning": "Why these documents should be grouped"
    }
  ]
}`;

      const batchOrgSchema = {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                document_id: { type: "string" },
                suggested_category: { type: "string" },
                suggested_tags: { type: "array", items: { type: "string" } },
                confidence: { type: "number" },
                reasoning: { type: "string" }
              }
            }
          },
          folder_structure: {
            type: "array",
            items: {
              type: "object",
              properties: {
                folder_name: { type: "string" },
                document_ids: { type: "array", items: { type: "string" } },
                reasoning: { type: "string" }
              }
            }
          }
        }
      };

      let aiResponse;
      if (isGeminiConfigured()) {
        console.log('[Gemini] Running batch organization via Gemini 2.0 Flash');
        aiResponse = await invokeGeminiLLM({
          prompt,
          response_json_schema: batchOrgSchema,
        });
      } else {
        aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: batchOrgSchema,
        });
      }

      setProgress(60);
      setCurrentStep('Preparing recommendations...');

      // Step 3: Format suggestions
      const recommendations = aiResponse?.recommendations || [];
      const formattedSuggestions = recommendations.map(rec => {
        const document = selectedDocuments.find(doc => doc.id === rec.document_id);
        return {
          ...rec,
          document,
          applied: false
        };
      });

      setSuggestions(formattedSuggestions);
      setCurrentStep('Ready for review.');
      setProgress(100);

    } catch (error) {
      console.error("Failed to organize documents:", error);
      toast.error(`Failed to organize documents with AI - ${error.message}`);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyAllSuggestions = async () => {
    setIsProcessing(true);
    setCurrentStep('Applying organization changes...');
    setError(null);

    try {
      for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        if (suggestion.confidence > 0.7) {
          await base44.entities.Document.update(suggestion.document_id, {
            category: suggestion.suggested_category,
            tags: [...new Set([...(suggestion.document.tags || []), ...suggestion.suggested_tags])]
          });

          setSuggestions(prev => prev.map((s, idx) =>
            idx === i ? { ...s, applied: true } : s
          ));
        }
        setProgress((i + 1) / suggestions.length * 100);
      }

      setIsComplete(true);
      setCurrentStep('Organization complete!');
      toast.success('Documents organized successfully!');

      setTimeout(() => {
        onComplete();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error applying suggestions:', error);
      setCurrentStep('Error applying changes');
      toast.error(`Error applying changes: ${error.message}`);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const applySingleSuggestion = async (index) => {
    const suggestion = suggestions[index];
    setError(null);
    try {
      await base44.entities.Document.update(suggestion.document_id, {
        category: suggestion.suggested_category,
        tags: [...new Set([...(suggestion.document.tags || []), ...suggestion.suggested_tags])]
      });

      setSuggestions(prev => prev.map((s, idx) =>
        idx === index ? { ...s, applied: true } : s
      ));
      toast.success(`Applied suggestion for "${suggestion.document.title}"`);
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast.error(`Error applying suggestion: ${error.message}`);
      setError(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Document Organizer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-700 text-red-300">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress Section */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                <span className="text-sm text-gray-300">{currentStep}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Initial State */}
          {!isProcessing && suggestions.length === 0 && !isComplete && (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Organize {selectedDocuments.length} Documents
              </h3>
              <p className="text-gray-400 mb-6">
                AI will analyze your documents and suggest optimal categories, tags, and folder structures.
              </p>
              <Button onClick={organizeDocuments} className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Start AI Organization
              </Button>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && !isComplete && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
                <Button
                  onClick={applyAllSuggestions}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  Apply All High-Confidence
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.document_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 rounded-lg border transition-colors ${
                        suggestion.applied
                          ? 'bg-green-900/20 border-green-700'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <h4 className="font-medium text-white truncate">
                              {suggestion.document.title}
                            </h4>
                            {suggestion.applied && (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Tag className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-300">Category:</span>
                              <Badge className="bg-blue-900/60 text-blue-300">
                                {suggestion.suggested_category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(suggestion.confidence * 100)}% confidence
                              </Badge>
                            </div>

                            {suggestion.suggested_tags.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <Tag className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-300">Tags:</span>
                                {suggestion.suggested_tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <p className="text-xs text-gray-400">
                              {suggestion.reasoning}
                            </p>
                          </div>
                        </div>

                        {!suggestion.applied && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applySingleSuggestion(index)}
                            className="border-slate-600"
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Complete State */}
          {isComplete && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Organization Complete!
              </h3>
              <p className="text-gray-400">
                Your documents have been organized with AI-suggested categories and tags.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}