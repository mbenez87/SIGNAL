import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/components/workspace/WorkspaceContext";

// ============================================================================
// INTELLIGENCE ANALYSIS ENGINE (inlined - no separate file needed)
// Runs after upload + AI summary to generate: embeddings, entities,
// confidence scores, and document relationships.
// Stores everything in document.metadata.analysis
// ============================================================================

const EMBEDDING_DIMENSIONS = 384;

const SIMILARITY_THRESHOLDS = {
  DUPLICATE: 0.95,
  VERSION: 0.85,
  RELATED: 0.70,
};

const KNOWN_CHEMICALS = [
  "sarin", "vx", "tabun", "soman", "novichok", "chlorine", "mustard gas",
  "ricin", "anthrax", "botulinum", "phosgene", "hydrogen cyanide",
  "lewisite", "agent orange", "white phosphorus", "thermite",
  "ammonium nitrate", "rdx", "petn", "c4", "semtex", "tnt",
  "acetone peroxide", "tatp", "hmtd", "anfo",
];

const KNOWN_WEAPONS = [
  "ak-47", "ak-74", "m16", "m4", "ar-15", "rpg", "rpg-7", "ied",
  "vbied", "svbied", "eod", "manpad", "stinger", "javelin", "tow",
  "kalashnikov", "glock", "beretta", "sig sauer", "hk416",
  "m249", "m240", "pkm", "dshk", "zu-23", "s-300", "s-400",
  "patriot", "iron dome", "grad", "bm-21", "iskander", "scud",
  "tomahawk", "hellfire", "jdam", "moab", "thermobaric",
  "mortar", "howitzer", "artillery", "drone", "uav", "ucav",
];

// --- Embedding Generation (calls your existing generateEmbeddings function) ---

async function generateDocumentEmbedding(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }
  const truncatedText = text.substring(0, 8192);
  try {
    const result = await base44.functions.invoke("generateEmbeddings", {
      text: truncatedText,
      model: "all-MiniLM-L6-v2",
    });
    if (result?.data?.embedding && Array.isArray(result.data.embedding)) return result.data.embedding;
    if (result?.data?.embeddings?.[0]) return result.data.embeddings[0];
    if (Array.isArray(result?.data)) return result.data;
    console.warn("Unexpected embedding format, using local fallback");
    return generateLocalEmbedding(truncatedText);
  } catch (error) {
    console.warn("Embedding generation failed, using local fallback:", error.message);
    return generateLocalEmbedding(truncatedText);
  }
}

function generateLocalEmbedding(text) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = normalized.split(/\s+/).filter(Boolean);
  const embedding = new Array(EMBEDDING_DIMENSIONS).fill(0);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * 31 + j * 17 + i * 7) % EMBEDDING_DIMENSIONS;
      embedding[idx] += 1.0 / (1 + Math.log(1 + i));
    }
  }
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) embedding[i] /= magnitude;
  }
  return embedding;
}

// --- Cosine Similarity ---

function computeCosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0, magnitudeA = 0, magnitudeB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// --- Find Similar Documents (duplicates, versions, related) ---

function findSimilarDocuments(targetEmbedding, targetDocId, allDocuments) {
  const duplicates = [], versions = [], related = [];
  if (!targetEmbedding || targetEmbedding.every((v) => v === 0)) return { duplicates, versions, related };
  for (const doc of allDocuments) {
    if (doc.id === targetDocId) continue;
    const docEmbedding = doc.metadata?.analysis?.embedding;
    if (!docEmbedding || !Array.isArray(docEmbedding)) continue;
    const similarity = computeCosineSimilarity(targetEmbedding, docEmbedding);
    const entry = { doc_id: doc.id, title: doc.title, similarity, created_date: doc.created_date };
    if (similarity >= SIMILARITY_THRESHOLDS.DUPLICATE) {
      duplicates.push({ ...entry, type: "duplicate" });
    } else if (similarity >= SIMILARITY_THRESHOLDS.VERSION) {
      versions.push({ ...entry, type: "version" });
    } else if (similarity >= SIMILARITY_THRESHOLDS.RELATED) {
      related.push({ ...entry, type: "related" });
    }
  }
  duplicates.sort((a, b) => b.similarity - a.similarity);
  versions.sort((a, b) => b.similarity - a.similarity);
  related.sort((a, b) => b.similarity - a.similarity);
  return { duplicates, versions, related };
}

// --- Pattern-Based Entity Extraction (chemicals, weapons, dates) ---

function extractPatternEntities(text) {
  const lowerText = text.toLowerCase();
  const results = { chemicals: [], weapons: [], people: [], organizations: [], locations: [], dates: [] };
  for (const chemical of KNOWN_CHEMICALS) {
    if (lowerText.includes(chemical)) {
      results.chemicals.push({ text: chemical, confidence: 0.95, source: "pattern" });
    }
  }
  for (const weapon of KNOWN_WEAPONS) {
    if (lowerText.includes(weapon)) {
      results.weapons.push({ text: weapon, confidence: 0.95, source: "pattern" });
    }
  }
  const datePatterns = [
    /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s*\d{4}\b/gi,
    /\b\d{4}-\d{2}-\d{2}\b/g,
  ];
  const dateSet = new Set();
  for (const pattern of datePatterns) {
    const matches = text.match(pattern) || [];
    matches.forEach((m) => dateSet.add(m.trim()));
  }
  results.dates = Array.from(dateSet).map((d) => ({ text: d, confidence: 0.90, source: "pattern" }));
  return results;
}

// --- LLM Entity Extraction (people, orgs, locations via InvokeLLM) ---

async function extractLLMEntities(text) {
  const defaults = { chemicals: [], weapons: [], people: [], organizations: [], locations: [], dates: [] };
  const truncated = text.substring(0, 6000);
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an intelligence analyst performing Named Entity Recognition.
Extract ALL entities from the following document text. Be thorough and precise.

Categories to extract:
1. PEOPLE - Full names of individuals mentioned
2. ORGANIZATIONS - Government agencies, military units, companies, militant groups, NGOs
3. LOCATIONS - Countries, cities, regions, facilities, bases, geographic features
4. CHEMICALS - Chemical compounds, agents, substances (especially CBRN related)
5. WEAPONS - Weapon systems, platforms, munitions, equipment

For each entity, provide the exact text as it appears in the document.
Only return entities that are clearly present in the text.

Document text:
"""
${truncated}
"""`,
      response_json_schema: {
        type: "object",
        properties: {
          people: { type: "array", items: { type: "string" } },
          organizations: { type: "array", items: { type: "string" } },
          locations: { type: "array", items: { type: "string" } },
          chemicals: { type: "array", items: { type: "string" } },
          weapons: { type: "array", items: { type: "string" } },
        },
      },
    });
    return {
      chemicals: (result.chemicals || []).map((e) => ({ text: e, confidence: 0.80, source: "llm" })),
      weapons: (result.weapons || []).map((e) => ({ text: e, confidence: 0.80, source: "llm" })),
      people: (result.people || []).map((e) => ({ text: e, confidence: 0.85, source: "llm" })),
      organizations: (result.organizations || []).map((e) => ({ text: e, confidence: 0.82, source: "llm" })),
      locations: (result.locations || []).map((e) => ({ text: e, confidence: 0.83, source: "llm" })),
      dates: [],
    };
  } catch (error) {
    console.warn("LLM entity extraction failed:", error.message);
    return defaults;
  }
}

// --- Merge & Deduplicate Entities ---

function mergeEntities(a, b) {
  const categories = ["chemicals", "weapons", "people", "organizations", "locations", "dates"];
  const merged = {};
  for (const cat of categories) {
    const seen = new Map();
    const combined = [...(a[cat] || []), ...(b[cat] || [])];
    for (const entity of combined) {
      const key = entity.text.toLowerCase().trim();
      if (!seen.has(key) || seen.get(key).confidence < entity.confidence) {
        seen.set(key, entity);
      }
    }
    merged[cat] = Array.from(seen.values()).sort((x, y) => y.confidence - x.confidence);
  }
  return merged;
}

async function extractEntities(text) {
  if (!text || text.trim().length === 0) {
    return { chemicals: [], weapons: [], people: [], organizations: [], locations: [], dates: [] };
  }
  const [patternEntities, llmEntities] = await Promise.all([
    extractPatternEntities(text),
    extractLLMEntities(text),
  ]);
  return mergeEntities(patternEntities, llmEntities);
}

// --- Confidence Scoring ---

function calculateConfidenceScore({ retrievalScore = 0, entities = {}, sourceReliability = 0.5, groundingScore = 0 }) {
  const allEntities = Object.values(entities).flat();
  const extractionConfidence = allEntities.length > 0
    ? allEntities.reduce((sum, e) => sum + (e.confidence || 0), 0) / allEntities.length
    : 0;
  const weights = { retrieval: 0.30, extraction: 0.25, source_reliability: 0.25, grounding: 0.20 };
  const composite =
    retrievalScore * weights.retrieval +
    extractionConfidence * weights.extraction +
    sourceReliability * weights.source_reliability +
    groundingScore * weights.grounding;
  return {
    composite: Math.round(composite * 100) / 100,
    retrieval: Math.round(retrievalScore * 100) / 100,
    extraction: Math.round(extractionConfidence * 100) / 100,
    source_reliability: Math.round(sourceReliability * 100) / 100,
    grounding: Math.round(groundingScore * 100) / 100,
    entity_count: allEntities.length,
  };
}

function estimateSourceReliability(document) {
  let score = 0.5;
  if (["legal", "financial", "academic", "technical"].includes(document.category)) score += 0.15;
  if (document.file_type === "pdf") score += 0.05;
  if (document.processing_status === "completed") score += 0.10;
  if (document.tags && document.tags.length > 0) score += 0.05;
  return Math.min(score, 1.0);
}

function estimateGroundingScore(text, entities) {
  if (!text || !entities) return 0.5;
  const allEntities = Object.values(entities).flat();
  if (allEntities.length === 0) return 0.5;
  const lowerText = text.toLowerCase();
  let grounded = 0;
  for (const entity of allEntities) {
    if (lowerText.includes(entity.text.toLowerCase())) grounded++;
  }
  return allEntities.length > 0 ? grounded / allEntities.length : 0.5;
}

// --- Full Analysis Pipeline (called after AI summary completes) ---

async function runIntelligenceAnalysis(document, textContent) {
  const results = {
    embedding: null,
    entities: null,
    confidence_score: null,
    relationships: { duplicates: [], versions: [], related: [] },
  };
  try {
    // Step 1: Generate embedding + extract entities in parallel
    const [embedding, entities] = await Promise.all([
      generateDocumentEmbedding(textContent),
      extractEntities(textContent),
    ]);
    results.embedding = embedding;
    results.entities = entities;

    // Step 2: Find similar documents (duplicates/versions/related)
    const allDocs = await base44.entities.Document.filter(
      { is_trashed: false, processing_status: 'completed' },
      '-created_date'
    );
    if (allDocs.length > 0) {
      results.relationships = findSimilarDocuments(embedding, document.id, allDocs);
    }

    // Step 3: Calculate confidence score
    results.confidence_score = calculateConfidenceScore({
      retrievalScore: 0,
      entities,
      sourceReliability: estimateSourceReliability(document),
      groundingScore: estimateGroundingScore(textContent, entities),
    });

    // Step 4: Store everything in document.metadata.analysis
    const existingMetadata = document.metadata || {};
    await base44.entities.Document.update(document.id, {
      metadata: {
        ...existingMetadata,
        analysis: {
          embedding: results.embedding,
          entities: results.entities,
          confidence_score: results.confidence_score,
          relationships: results.relationships,
          analyzed_at: new Date().toISOString(),
          version: 1,
        },
      },
    });

    console.log(`Intelligence analysis completed for: ${document.title}`);
    return results;
  } catch (error) {
    console.error("Intelligence analysis failed:", error);
    // Store partial results even on failure
    try {
      const existingMetadata = document.metadata || {};
      await base44.entities.Document.update(document.id, {
        metadata: {
          ...existingMetadata,
          analysis: {
            ...results,
            error: error.message,
            analyzed_at: new Date().toISOString(),
            version: 1,
          },
        },
      });
    } catch (updateError) {
      console.error("Failed to store partial analysis:", updateError);
    }
    return results;
  }
}

// ============================================================================
// UPLOAD CONTEXT (your existing code + intelligence analysis trigger)
// ============================================================================

const UploadContext = createContext();

export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
  const [uploads, setUploads] = useState([]);
  const [status, setStatus] = useState({});
  const { activeWorkspace, user, validateWorkspaceAccess, isPersonalWorkspace } = useWorkspace();
  const CONCURRENT_UPLOADS = 3;

  const getFileTypeEnum = useCallback((mimeType, fileName) => {
    const fileExtension = fileName.toLowerCase().split('.').pop();
    if (mimeType === 'application/pdf' || fileExtension === 'pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    return 'other';
  }, []);

  const validateUploadContext = useCallback(async (workspaceId) => {
    if (!activeWorkspace) {
      throw new Error('No active workspace selected');
    }

    if (!user) {
      throw new Error('User not authenticated');
    }

    const fileTargetWorkspaceId = workspaceId === null ? 'personal' : workspaceId;

    if (fileTargetWorkspaceId !== activeWorkspace.id) {
      throw new Error('Upload workspace mismatch - refresh page and try again');
    }

    if (fileTargetWorkspaceId !== 'personal') {
      const hasAccess = await validateWorkspaceAccess(workspaceId, user.email);
      if (!hasAccess) {
        throw new Error('Access denied to target workspace');
      }
    }

    return true;
  }, [activeWorkspace, user, validateWorkspaceAccess]);

  const auditLog = useCallback((action, details) => {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        user_email: user?.email,
        workspace_id: activeWorkspace?.id,
        workspace_name: activeWorkspace?.name,
        session_id: sessionStorage.getItem('sessionId'),
        details
      };

      console.log('AUDIT LOG:', logEntry);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }, [user, activeWorkspace]);

  const retryWithBackoff = useCallback(async (fn, retries = 3, baseDelay = 1200) => {
    let attempt = 0;
    let lastErr;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const isServerOrTimeout =
          (err?.response?.status && err.response.status >= 500) ||
          /timeout|DatabaseTimeout|Failed to fetch|Network Error/i.test(err?.message || '') ||
          /timeout|DatabaseTimeout/i.test(JSON.stringify(err?.response?.data || {}));
        if (!isServerOrTimeout) break;
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Transient error, retrying attempt ${attempt + 1}/${retries} in ${delay}ms:`, err.message);
        await new Promise(res => setTimeout(res, delay));
        attempt += 1;
      }
    }
    console.error(`All retry attempts failed after ${retries} tries.`);
    throw lastErr;
  }, []);

  const processAIAnalysisInBackground = useCallback(async (document, file_url, fileName) => {
    try {
      let aiAnalysis = { summary: '', key_insights: [], suggested_tags: [] };
      let extractedContent = '';

      const fileExtension = fileName.toLowerCase().split('.').pop();
      const isExcelFile = ['xlsx', 'xls', 'csv'].includes(fileExtension);
      const isDocxFile = ['docx', 'doc'].includes(fileExtension);

      const isLargeFile = document.file_size && document.file_size > 10 * 1024 * 1024;
      const isPdfFile = fileExtension === 'pdf';

      if (isExcelFile) {
        aiAnalysis = {
          summary: `${fileName} is a spreadsheet document that has been analyzed and is ready for use.`,
          key_insights: ['Spreadsheet document processed', 'Contains structured data', 'Ready for analysis'],
          suggested_tags: ['spreadsheet', 'data', fileExtension]
        };
        extractedContent = `Spreadsheet file: ${fileName}. File contains structured data.`;
      } else if (isDocxFile) {
        aiAnalysis = {
          summary: `${fileName} is a Word document that has been processed. Content is available for search and analysis.`,
          key_insights: ['Word document processed', 'Contains text-based content', 'Ready for use'],
          suggested_tags: ['document', 'text', fileExtension]
        };
        extractedContent = `Word document: ${fileName}. Content has been indexed and is available.`;
      } else if (isPdfFile && isLargeFile) {
        aiAnalysis = {
          summary: `${fileName} is a large PDF document (${(document.file_size / 1024 / 1024).toFixed(1)}MB). Due to size constraints, automated AI analysis was skipped, but the document is fully accessible.`,
          key_insights: [
            'Large PDF document uploaded successfully',
            'AI analysis skipped due to file size (>10MB)',
            'Document is available for viewing and manual review',
            'Consider splitting large documents for AI analysis'
          ],
          suggested_tags: ['pdf', 'large-file', 'manual-review-needed']
        };
        extractedContent = `Large PDF file: ${fileName} (${(document.file_size / 1024 / 1024).toFixed(1)}MB). AI content extraction was skipped due to size limitations. Please review manually or consider splitting into smaller documents for automated analysis.`;
      } else {
        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze the attached document and provide:
1. A concise summary (2-3 sentences).
2. 3-5 key insights and important points.
3. A list of relevant tags for organization.
4. Extract the main text content (first 2000 characters).

IMPORTANT TAGGING RULES:
- If the document contains "referral agreement" or similar partnership terms, include the tag "referral agreement".
- If the document is "non-disclosure agreement" or "NDA", include the tag "nda".
- If the document appears to be an "invoice", "bill", or "receipt", include the tag "invoice".
- If the document is a "master services agreement" or "MSA", include the tag "msa".

If you cannot read the document (e.g., it's a non-text image), state that analysis is not possible.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              key_insights: { type: "array", items: { type: "string" } },
              suggested_tags: { type: "array", items: { type: "string" } },
              extracted_content: { type: "string" }
            }
          }
        });

        aiAnalysis = llmResult;
        extractedContent = llmResult.extracted_content || '';
      }

      await base44.entities.Document.update(document.id, {
        ai_summary: aiAnalysis.summary,
        key_insights: aiAnalysis.key_insights || [],
        extracted_content: extractedContent,
        tags: [...new Set([...(document.tags || []), ...(aiAnalysis.suggested_tags || [])])],
        processing_status: 'completed'
      });

      console.log(`AI analysis completed for document: ${document.title}`);

      // >>> NEW: After AI summary completes, run intelligence analysis <<<
      // This generates embeddings, extracts entities, calculates confidence,
      // and finds duplicate/related documents. Results stored in metadata.analysis.
      // Non-blocking: if it fails, the document still works normally.
      try {
        await runIntelligenceAnalysis(document, extractedContent);
      } catch (intelError) {
        console.warn(`Intelligence analysis failed for ${document.title}:`, intelError.message);
      }

    } catch (aiError) {
      console.warn(`AI analysis failed for ${fileName}:`, aiError);

      const isFileSizeError = aiError.message && aiError.message.includes('file size must be under');
      const fileSize = document.file_size ? (document.file_size / 1024 / 1024).toFixed(1) : 'unknown';

      let fallbackSummary;
      let fallbackInsights;

      if (isFileSizeError) {
        fallbackSummary = `${fileName} uploaded successfully but is too large (${fileSize}MB) for automated AI analysis. The document is fully accessible for manual review.`;
        fallbackInsights = [
          'Document uploaded successfully',
          'File size exceeds AI analysis limits (10MB)',
          'Available for manual review and download',
          'Consider splitting large documents for automated processing'
        ];
      } else {
        fallbackSummary = `${fileName} uploaded successfully. AI analysis encountered an issue but the document is available for use.`;
        fallbackInsights = ['AI analysis unavailable', 'Document ready for manual review'];
      }

      await base44.entities.Document.update(document.id, {
        ai_summary: fallbackSummary,
        key_insights: fallbackInsights,
        extracted_content: `File uploaded: ${fileName}. ${isFileSizeError ? 'File size exceeded AI analysis limits.' : 'Content analysis was not available.'}`,
        processing_status: 'completed'
      });
    }
  }, []);

  const processFile = useCallback(async (fileData) => {
    const { file, id, category, tags, workspace_id } = fileData;

    try {
      await validateUploadContext(workspace_id);

      auditLog('FILE_UPLOAD_START', {
        file_name: file.name,
        file_size: file.size,
        target_workspace: workspace_id
      });

      setStatus(prev => ({ ...prev, [id]: { ...prev[id], state: 'uploading', progress: 20 }}));

      const { file_url } = await retryWithBackoff(() => base44.integrations.Core.UploadFile({ file }), 3, 1200);

      if (!file_url) {
        throw new Error('File upload failed - no URL returned');
      }

      setStatus(prev => ({ ...prev, [id]: { ...prev[id], state: 'creating_document', progress: 60 }}));

      const fileTypeForEntity = getFileTypeEnum(file.type, file.name);
      let thumbnail_url = null;

      if (fileTypeForEntity === 'image') {
        thumbnail_url = file_url;
      }

      const finalWorkspaceId = workspace_id === 'personal' ? null : workspace_id;

      const documentData = {
        title: file.name,
        file_url: file_url,
        file_type: fileTypeForEntity,
        file_size: file.size,
        category,
        tags: tags || [],
        workspace_id: finalWorkspaceId,
        ai_summary: 'Processing... AI analysis in progress.',
        key_insights: ['Document uploaded successfully', 'AI analysis in progress'],
        extracted_content: `File uploaded: ${file.name}. AI processing will complete shortly.`,
        processing_status: 'processing',
        is_trashed: false,
        thumbnail_url: thumbnail_url,
      };

      const createdDocument = await retryWithBackoff(() => base44.entities.Document.create(documentData), 3, 1200);

      setStatus(prev => ({
        ...prev,
        [id]: {
          state: 'completed',
          progress: 100,
          document: createdDocument,
          message: 'Upload complete! AI analysis in progress...'
        }
      }));

      auditLog('FILE_UPLOAD_SUCCESS', {
        file_name: file.name,
        document_id: createdDocument.id,
        final_workspace: finalWorkspaceId,
        ai_analysis_success: false,
        file_url_exists: !!file_url
      });

      processAIAnalysisInBackground(createdDocument, file_url, file.name);

    } catch (error) {
      console.error('Error processing file:', error);

      auditLog('FILE_UPLOAD_ERROR', {
        file_name: file.name,
        error_message: error.message,
        target_workspace: workspace_id
      });

      setStatus(prev => ({
        ...prev,
        [id]: {
          state: 'failed',
          progress: 100,
          message: error.message || 'Upload failed - please check your workspace access and try again',
        }
      }));
    }
  }, [validateUploadContext, auditLog, getFileTypeEnum, processAIAnalysisInBackground, retryWithBackoff]);

  useEffect(() => {
    const processingIds = Object.keys(status).filter(
        id => status[id].state === 'uploading' || status[id].state === 'processing' || status[id].state === 'creating_document'
    );

    const readyToProcess = uploads.filter(
        f => status[f.id]?.state === 'queued'
    );

    const availableSlots = CONCURRENT_UPLOADS - processingIds.length;
    if (availableSlots <= 0 || readyToProcess.length === 0) {
        return;
    }

    const batchToProcess = readyToProcess.slice(0, availableSlots);

    batchToProcess.forEach(fileData => {
        setStatus(prev => ({ ...prev, [fileData.id]: { ...prev[fileData.id], state: 'uploading' }}));
        processFile(fileData);
    });

  }, [uploads, status, processFile]);

  const addToQueue = (files) => {
    if (!activeWorkspace) {
      console.error('Cannot upload: No active workspace');
      return;
    }

    const validatedFiles = files.map(f => ({
      ...f,
      workspace_id: f.workspace_id === 'personal' ? null : f.workspace_id,
      validated_at: Date.now(),
      user_email: user?.email
    }));

    setUploads(prev => [...prev, ...validatedFiles]);
    const newStatus = {};
    validatedFiles.forEach(f => {
      newStatus[f.id] = { state: 'queued', fileData: f };
    });
    setStatus(prev => ({...prev, ...newStatus}));

    auditLog('FILES_QUEUED', {
      file_count: files.length,
      target_workspace: activeWorkspace.id
    });
  };

  const value = {
    uploads,
    status,
    addToQueue,
    validateUploadContext
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};
