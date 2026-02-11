import { base44 } from "@/api/base44Client";

// ============================================================================
// CONSTANTS
// ============================================================================

const EMBEDDING_DIMENSIONS = 384;

const SIMILARITY_THRESHOLDS = {
  DUPLICATE: 0.95,
  VERSION: 0.85,
  RELATED: 0.70,
};

const ENTITY_CATEGORIES = {
  chemicals: [
    "sarin", "vx", "tabun", "soman", "novichok", "chlorine", "mustard gas",
    "ricin", "anthrax", "botulinum", "phosgene", "hydrogen cyanide",
    "lewisite", "agent orange", "white phosphorus", "thermite",
    "ammonium nitrate", "rdx", "petn", "c4", "semtex", "tnt",
    "acetone peroxide", "tatp", "hmtd", "anfo",
  ],
  weapons: [
    "ak-47", "ak-74", "m16", "m4", "ar-15", "rpg", "rpg-7", "ied",
    "vbied", "svbied", "eod", "manpad", "stinger", "javelin", "tow",
    "kalashnikov", "glock", "beretta", "sig sauer", "hk416",
    "m249", "m240", "pkm", "dshk", "zu-23", "s-300", "s-400",
    "patriot", "iron dome", "grad", "bm-21", "iskander", "scud",
    "tomahawk", "hellfire", "jdam", "moab", "thermobaric",
    "mortar", "howitzer", "artillery", "drone", "uav", "ucav",
  ],
};

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

/**
 * Generate a document embedding vector using the backend generateEmbeddings function.
 * Falls back to a local TF-IDF-style hash if the backend call fails.
 * @param {string} text - Document text content
 * @returns {Promise<number[]>} - 384-dimension embedding vector
 */
export async function generateDocumentEmbedding(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  // Truncate to first 8192 chars for embedding model limits
  const truncatedText = text.substring(0, 8192);

  try {
    const result = await base44.functions.invoke("generateEmbeddings", {
      text: truncatedText,
      model: "all-MiniLM-L6-v2",
    });

    if (result?.data?.embedding && Array.isArray(result.data.embedding)) {
      return result.data.embedding;
    }

    // If the backend returns a different format, try common alternatives
    if (result?.data?.embeddings?.[0]) {
      return result.data.embeddings[0];
    }

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    console.warn("Unexpected embedding response format, using fallback");
    return generateLocalEmbedding(truncatedText);
  } catch (error) {
    console.warn("Embedding generation failed, using local fallback:", error.message);
    return generateLocalEmbedding(truncatedText);
  }
}

/**
 * Local fallback embedding using deterministic hashing.
 * Not as good as transformer embeddings, but provides basic similarity matching.
 */
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

  // L2 normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

// ============================================================================
// SIMILARITY COMPUTATION
// ============================================================================

/**
 * Compute cosine similarity between two embedding vectors.
 * @param {number[]} a - First embedding
 * @param {number[]} b - Second embedding
 * @returns {number} - Similarity score between 0 and 1
 */
export function computeCosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find duplicate, version, and related documents by comparing embeddings.
 * @param {number[]} targetEmbedding - The embedding of the document to compare
 * @param {string} targetDocId - The ID of the target document (excluded from results)
 * @param {Array<{id: string, metadata: object}>} allDocuments - All documents with their metadata
 * @returns {{duplicates: Array, versions: Array, related: Array}}
 */
export function findSimilarDocuments(targetEmbedding, targetDocId, allDocuments) {
  const duplicates = [];
  const versions = [];
  const related = [];

  if (!targetEmbedding || targetEmbedding.every((v) => v === 0)) {
    return { duplicates, versions, related };
  }

  for (const doc of allDocuments) {
    if (doc.id === targetDocId) continue;

    const docEmbedding = doc.metadata?.analysis?.embedding;
    if (!docEmbedding || !Array.isArray(docEmbedding)) continue;

    const similarity = computeCosineSimilarity(targetEmbedding, docEmbedding);

    if (similarity >= SIMILARITY_THRESHOLDS.DUPLICATE) {
      duplicates.push({
        doc_id: doc.id,
        title: doc.title,
        similarity,
        type: "duplicate",
        created_date: doc.created_date,
      });
    } else if (similarity >= SIMILARITY_THRESHOLDS.VERSION) {
      versions.push({
        doc_id: doc.id,
        title: doc.title,
        similarity,
        type: "version",
        created_date: doc.created_date,
      });
    } else if (similarity >= SIMILARITY_THRESHOLDS.RELATED) {
      related.push({
        doc_id: doc.id,
        title: doc.title,
        similarity,
        type: "related",
        created_date: doc.created_date,
      });
    }
  }

  // Sort each category by similarity descending
  duplicates.sort((a, b) => b.similarity - a.similarity);
  versions.sort((a, b) => b.similarity - a.similarity);
  related.sort((a, b) => b.similarity - a.similarity);

  return { duplicates, versions, related };
}

// ============================================================================
// ENTITY EXTRACTION
// ============================================================================

/**
 * Extract intelligence entities from document text using LLM + pattern matching.
 * @param {string} text - Document text content
 * @returns {Promise<object>} - Extracted entities by category
 */
export async function extractEntities(text) {
  if (!text || text.trim().length === 0) {
    return { chemicals: [], weapons: [], people: [], organizations: [], locations: [], dates: [] };
  }

  // Run pattern matching and LLM extraction in parallel
  const [patternEntities, llmEntities] = await Promise.all([
    extractPatternEntities(text),
    extractLLMEntities(text),
  ]);

  // Merge results, deduplicating
  return mergeEntities(patternEntities, llmEntities);
}

/**
 * Pattern-based entity extraction for chemicals and weapons.
 * Runs locally without API calls for known entity lists.
 */
function extractPatternEntities(text) {
  const lowerText = text.toLowerCase();
  const results = { chemicals: [], weapons: [], people: [], organizations: [], locations: [], dates: [] };

  for (const chemical of ENTITY_CATEGORIES.chemicals) {
    if (lowerText.includes(chemical)) {
      results.chemicals.push({
        text: chemical,
        confidence: 0.95,
        source: "pattern",
      });
    }
  }

  for (const weapon of ENTITY_CATEGORIES.weapons) {
    if (lowerText.includes(weapon)) {
      results.weapons.push({
        text: weapon,
        confidence: 0.95,
        source: "pattern",
      });
    }
  }

  // Extract dates using regex patterns
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
  results.dates = Array.from(dateSet).map((d) => ({
    text: d,
    confidence: 0.90,
    source: "pattern",
  }));

  return results;
}

/**
 * LLM-based entity extraction for people, organizations, locations,
 * and additional chemicals/weapons not in our pattern lists.
 */
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

/**
 * Merge entities from multiple sources, deduplicating by normalized text.
 */
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

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

/**
 * Calculate a composite confidence score from multiple signal components.
 * @param {object} params
 * @param {number} params.retrievalScore - Cosine similarity from semantic search (0-1)
 * @param {object} params.entities - Extracted entities with confidence scores
 * @param {number} params.sourceReliability - Source reliability weight (0-1)
 * @param {number} params.groundingScore - Citation verification score (0-1)
 * @returns {object} - Composite score with breakdown
 */
export function calculateConfidenceScore({
  retrievalScore = 0,
  entities = {},
  sourceReliability = 0.5,
  groundingScore = 0,
}) {
  // Extraction confidence: average confidence of all extracted entities
  const allEntities = Object.values(entities).flat();
  const extractionConfidence =
    allEntities.length > 0
      ? allEntities.reduce((sum, e) => sum + (e.confidence || 0), 0) / allEntities.length
      : 0;

  // Weighted composite
  const weights = {
    retrieval: 0.30,
    extraction: 0.25,
    source_reliability: 0.25,
    grounding: 0.20,
  };

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

// ============================================================================
// CHRONOLOGICAL THREADING
// ============================================================================

/**
 * Build chronological threads linking documents that mention the same entities.
 * Groups documents by shared entities and sorts by date.
 * @param {Array<{id: string, title: string, created_date: string, metadata: object}>} documents
 * @returns {Array<{entity: string, category: string, thread: Array}>}
 */
export function buildChronologicalThreads(documents) {
  const entityDocMap = new Map();

  for (const doc of documents) {
    const entities = doc.metadata?.analysis?.entities;
    if (!entities) continue;

    const categories = ["chemicals", "weapons", "people", "organizations", "locations"];
    for (const category of categories) {
      const entityList = entities[category] || [];
      for (const entity of entityList) {
        const key = `${category}::${entity.text.toLowerCase().trim()}`;
        if (!entityDocMap.has(key)) {
          entityDocMap.set(key, {
            entity: entity.text,
            category,
            documents: [],
          });
        }
        entityDocMap.get(key).documents.push({
          doc_id: doc.id,
          title: doc.title,
          created_date: doc.created_date,
          confidence: entity.confidence,
        });
      }
    }
  }

  // Filter to entities mentioned in 2+ documents, sort docs by date
  const threads = [];
  for (const [, thread] of entityDocMap) {
    // Deduplicate by doc_id
    const seen = new Set();
    thread.documents = thread.documents.filter((d) => {
      if (seen.has(d.doc_id)) return false;
      seen.add(d.doc_id);
      return true;
    });

    if (thread.documents.length >= 2) {
      thread.documents.sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
      threads.push(thread);
    }
  }

  // Sort threads by number of documents (most connected first)
  threads.sort((a, b) => b.documents.length - a.documents.length);

  return threads;
}

// ============================================================================
// SEMANTIC SEARCH
// ============================================================================

/**
 * Perform semantic search across documents using embedding similarity.
 * @param {string} query - Search query text
 * @param {Array<{id: string, title: string, metadata: object}>} documents - Documents to search
 * @param {object} options
 * @param {number} options.threshold - Minimum similarity threshold (default: 0.3)
 * @param {number} options.maxResults - Maximum results to return (default: 20)
 * @returns {Promise<Array<{doc_id: string, title: string, similarity: number, confidence: object}>>}
 */
export async function semanticSearch(query, documents, options = {}) {
  const { threshold = 0.3, maxResults = 20 } = options;

  const queryEmbedding = await generateDocumentEmbedding(query);

  const results = [];

  for (const doc of documents) {
    const docEmbedding = doc.metadata?.analysis?.embedding;
    if (!docEmbedding || !Array.isArray(docEmbedding)) continue;

    const similarity = computeCosineSimilarity(queryEmbedding, docEmbedding);

    if (similarity >= threshold) {
      results.push({
        doc_id: doc.id,
        title: doc.title,
        file_type: doc.file_type,
        category: doc.category,
        similarity: Math.round(similarity * 1000) / 1000,
        confidence: doc.metadata?.analysis?.confidence_score || null,
        entities: doc.metadata?.analysis?.entities || null,
        created_date: doc.created_date,
        ai_summary: doc.ai_summary,
      });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, maxResults);
}

// ============================================================================
// FULL DOCUMENT ANALYSIS PIPELINE
// ============================================================================

/**
 * Run the complete analysis pipeline on a document.
 * This is called after upload and AI processing is complete.
 * @param {object} document - The document record
 * @param {string} textContent - Extracted text content
 * @param {Array} allDocuments - All existing documents for comparison
 * @returns {Promise<object>} - Complete analysis results
 */
export async function analyzeDocument(document, textContent, allDocuments = []) {
  const results = {
    embedding: null,
    entities: null,
    confidence_score: null,
    relationships: { duplicates: [], versions: [], related: [] },
  };

  try {
    // Run embedding generation and entity extraction in parallel
    const [embedding, entities] = await Promise.all([
      generateDocumentEmbedding(textContent),
      extractEntities(textContent),
    ]);

    results.embedding = embedding;
    results.entities = entities;

    // Find similar documents
    if (allDocuments.length > 0) {
      results.relationships = findSimilarDocuments(
        embedding,
        document.id,
        allDocuments
      );
    }

    // Calculate confidence score
    results.confidence_score = calculateConfidenceScore({
      retrievalScore: 0,
      entities,
      sourceReliability: estimateSourceReliability(document),
      groundingScore: estimateGroundingScore(textContent, entities),
    });

    // Store analysis results in document metadata
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

    return results;
  } catch (error) {
    console.error("Document analysis failed:", error);

    // Store partial results if any
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

/**
 * Estimate source reliability based on document metadata.
 */
function estimateSourceReliability(document) {
  let score = 0.5; // Base score

  // Higher reliability for certain categories
  const highReliabilityCategories = ["legal", "financial", "academic", "technical"];
  if (highReliabilityCategories.includes(document.category)) {
    score += 0.15;
  }

  // PDF documents tend to be more formally published
  if (document.file_type === "pdf") {
    score += 0.05;
  }

  // Documents with completed AI processing are verified
  if (document.processing_status === "completed") {
    score += 0.10;
  }

  // Documents with existing tags suggest curation
  if (document.tags && document.tags.length > 0) {
    score += 0.05;
  }

  return Math.min(score, 1.0);
}

/**
 * Estimate grounding score based on entity presence in text.
 */
function estimateGroundingScore(text, entities) {
  if (!text || !entities) return 0.5;

  const allEntities = Object.values(entities).flat();
  if (allEntities.length === 0) return 0.5;

  const lowerText = text.toLowerCase();
  let grounded = 0;

  for (const entity of allEntities) {
    if (lowerText.includes(entity.text.toLowerCase())) {
      grounded++;
    }
  }

  return allEntities.length > 0 ? grounded / allEntities.length : 0.5;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Analyze multiple documents with progress tracking.
 * @param {Array} documents - Documents to analyze
 * @param {function} onProgress - Progress callback (current, total)
 */
export async function batchAnalyzeDocuments(documents, onProgress = null) {
  const results = [];
  const docsWithContent = documents.filter((d) => d.extracted_content);

  for (let i = 0; i < docsWithContent.length; i++) {
    const doc = docsWithContent[i];
    try {
      const result = await analyzeDocument(doc, doc.extracted_content, documents);
      results.push({ doc_id: doc.id, status: "success", result });
    } catch (error) {
      results.push({ doc_id: doc.id, status: "error", error: error.message });
    }

    if (onProgress) {
      onProgress(i + 1, docsWithContent.length);
    }

    // Rate limiting between documents
    if (i < docsWithContent.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}
