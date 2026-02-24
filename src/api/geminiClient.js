/**
 * Gemini 2.0 Flash client for Signal87 AI
 *
 * This module provides direct access to Google's Gemini API as an alternative
 * to the Base44 InvokeLLM integration. It supports:
 *  - Text-only prompts (generation, analysis, batch org)
 *  - Multimodal prompts with file attachments (PDF, image document analysis)
 *  - Structured JSON output via Gemini's native responseSchema
 *
 * Configuration:
 *   Set VITE_GEMINI_API_KEY in your .env file (this file is git-ignored).
 *   Example:  VITE_GEMINI_API_KEY=AIza...
 *
 * Security note:
 *   Vite env vars prefixed with VITE_ are bundled into the client build and
 *   visible to browser users. For a production deployment with public traffic,
 *   proxy these calls through a server-side Base44 function that stores the
 *   key as an encrypted secret.
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Returns true when a Gemini API key is present in the environment. */
export function isGeminiConfigured() {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
}

/**
 * Convert a File/Blob object or a remote URL to a base64-encoded data string
 * plus its MIME type, ready for Gemini's inline_data part.
 */
async function toBase64Part(source) {
  let blob;

  if (source instanceof File || source instanceof Blob) {
    blob = source;
  } else {
    // Remote URL — fetch the bytes
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to fetch file (${response.status}): ${source}`);
    blob = await response.blob();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        mime_type: blob.type || 'application/octet-stream',
        data: base64,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Invoke the Gemini 2.0 Flash model.
 *
 * @param {object} options
 * @param {string}  options.prompt               - The text prompt.
 * @param {File|string} [options.file]            - Original File object (preferred, avoids re-fetch).
 * @param {string}  [options.file_url]            - Fallback remote URL for the file.
 * @param {object}  [options.response_json_schema] - JSON Schema for structured output.
 *                                                   When provided, responseMimeType is set to
 *                                                   "application/json" and Gemini returns valid JSON.
 * @returns {Promise<object>} Parsed JSON when schema provided, or { content: string } otherwise.
 */
export async function invokeGeminiLLM({ prompt, file, file_url, response_json_schema }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Add VITE_GEMINI_API_KEY to your .env file.'
    );
  }

  const parts = [];

  // Attach file content when a document needs to be analysed
  const fileSource = file || file_url;
  if (fileSource) {
    try {
      const inlineData = await toBase64Part(fileSource);
      parts.push({ inline_data: inlineData });
    } catch (err) {
      // Non-fatal — proceed with text-only analysis
      console.warn('[Gemini] Could not attach file, falling back to text-only:', err.message);
    }
  }

  parts.push({ text: prompt });

  const generationConfig = {
    temperature: 0.3,
    maxOutputTokens: 4096,
  };

  // Enable native structured JSON output when a schema is provided
  if (response_json_schema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = response_json_schema;
  }

  const requestBody = {
    contents: [{ parts, role: 'user' }],
    generationConfig,
  };

  const res = await fetch(`${GEMINI_BASE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || res.statusText;
    throw new Error(`Gemini API error ${res.status}: ${msg}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (response_json_schema) {
    try {
      // Strip markdown fences if the model included them despite responseMimeType
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned);
    } catch {
      console.warn('[Gemini] JSON parse failed, returning empty object. Raw text:', text.slice(0, 300));
      return {};
    }
  }

  return { content: text };
}
