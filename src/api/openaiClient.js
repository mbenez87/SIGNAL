/**
 * OpenAI / Perplexity chat client for Aria (Dashboard) and Aria V2 (Intelligence).
 *
 * Both providers use the same OpenAI-compatible chat completions format, so one
 * function covers both. Provider selection is automatic based on which key is set:
 *
 *   Priority 1 — OpenAI     VITE_OPENAI_API_KEY      → gpt-4o-mini
 *   Priority 2 — Perplexity VITE_PERPLEXITY_API_KEY  → llama-3.1-sonar-large-128k-online
 *
 * Set either (or both) in your .env file. The .env file is git-ignored.
 *
 * Security note: like all VITE_ env vars these are bundled into the client build.
 * For public production traffic, proxy through a server-side Base44 function that
 * stores the key as an encrypted secret.
 */

const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    getKey: () => import.meta.env.VITE_OPENAI_API_KEY,
  },
  perplexity: {
    url: 'https://api.perplexity.ai/chat/completions',
    model: 'llama-3.1-sonar-large-128k-online',
    getKey: () => import.meta.env.VITE_PERPLEXITY_API_KEY,
  },
};

/** Returns the active provider object, or null if none is configured. */
function getProvider() {
  for (const [name, cfg] of Object.entries(PROVIDERS)) {
    if (cfg.getKey()) return { name, ...cfg };
  }
  return null;
}

/** Returns true when at least one chat API key is present. */
export function isChatConfigured() {
  return !!getProvider();
}

/** Returns a human-readable label of the active provider, e.g. "openai/gpt-4o-mini". */
export function getChatProviderLabel() {
  const p = getProvider();
  return p ? `${p.name}/${p.model}` : 'unconfigured';
}

/**
 * Send a chat completion request to OpenAI or Perplexity.
 *
 * @param {object} options
 * @param {Array<{role: string, content: string}>} options.messages
 *   Full conversation history in OpenAI message format (role: 'user'|'assistant').
 *   Do NOT include the system message here — pass it via systemPrompt instead.
 * @param {string} options.systemPrompt
 *   System-level instructions prepended to the conversation.
 * @param {number} [options.temperature=0.7]
 * @param {number} [options.maxTokens=4096]
 *
 * @returns {Promise<{content: string, model_used: string}>}
 */
export async function sendChatMessage({
  messages,
  systemPrompt,
  temperature = 0.7,
  maxTokens = 4096,
}) {
  const provider = getProvider();
  if (!provider) {
    throw new Error(
      'No chat API key configured. Add VITE_OPENAI_API_KEY or VITE_PERPLEXITY_API_KEY to your .env file.'
    );
  }

  const body = {
    model: provider.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
    temperature,
    max_tokens: maxTokens,
  };

  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.getKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || res.statusText;
    throw new Error(`${provider.name} API error ${res.status}: ${msg}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  return {
    content,
    model_used: `${provider.name}/${provider.model}`,
  };
}
