import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Image, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ThumbnailGenerator({ onComplete }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResults(null);
    toast.info("Generating thumbnails for all PDFs...");

    try {
      const { data } = await base44.functions.invoke('batchGenerateThumbnails', {});
      
      setResults(data.results);
      
      if (data.results.successful > 0) {
        toast.success(`Successfully generated ${data.results.successful} thumbnail(s)`);
        if (onComplete) onComplete();
      }
      
      if (data.results.failed > 0) {
        toast.warning(`${data.results.failed} thumbnail(s) failed to generate`);
      }

      if (data.results.total === 0) {
        toast.info("All PDFs already have thumbnails!");
      }
    } catch (error) {
      console.error("Thumbnail generation error:", error);
      toast.error("Failed to generate thumbnails: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-full p-2">
            <Image className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900 text-sm">
              PDF Thumbnail Generator
            </h3>
            <p className="text-xs text-slate-600">
              Generate preview thumbnails for all PDFs without them
            </p>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Image className="w-4 h-4 mr-2" />
              Generate
            </>
          )}
        </Button>
      </div>

      {results && (
        <div className="mt-3 p-2 bg-white rounded border border-blue-200">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              <span className="text-slate-700">
                <strong>{results.successful}</strong> successful
              </span>
            </div>
            
            {results.failed > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-slate-700">
                  <strong>{results.failed}</strong> failed
                </span>
              </div>
            )}
            
            <div className="text-slate-600">
              Total: <strong>{results.total}</strong>
            </div>

            {results.errors && results.errors.length > 0 && (
              <details className="ml-auto">
                <summary className="text-red-600 cursor-pointer">
                  View errors ({results.errors.length})
                </summary>
                <div className="mt-2 space-y-1 text-xs text-slate-600 max-h-32 overflow-auto">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="pl-2 border-l-2 border-red-200">
                      <span className="font-medium">{err.document}:</span> {err.error}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}