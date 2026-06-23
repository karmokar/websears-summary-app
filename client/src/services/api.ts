export const ALL_PROVIDERS = [
  "openai",
  "gemini",
  "anthropic",
  "mistral",
  "groq",
  "cohere",
];
const GEMINI_MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
];

const generatePrompt = (text: string) =>
  `Summarize the following text clearly and concisely. Break it into 4-6 key points if possible, then provide a brief paragraph summary. Return only the summary content:\n\n${text.slice(0, 12000)}`;

// ── Background Bridge Helper ──
export function backgroundMessage(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response: any) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function fetchJsonWithError(
  url: string,
  options: RequestInit,
  label: string,
) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (e: any) {
    throw new Error(`${label}: Failed to fetch — ${e.message}`);
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      json?.error?.message || json?.message || `${label} ${response.status}`,
    );
  }
  return json;
}

// ── Local AI Server Calls ──
export async function checkServerHealth(serverUrl: string): Promise<boolean> {
  try {
    const r = await fetch(`${serverUrl}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function detectLlamaModel(
  serverUrl: string,
): Promise<string | null> {
  try {
    const response = await fetch(`${serverUrl}/llama/detect`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      const data = await response.json();
      if (data?.status === "connected" && data?.recommended) {
        return data.recommended;
      }
    }
  } catch (err) {
    console.warn("Llama detection failed, will use fallback");
  }
  return null;
}

export async function callLocalModel(
  text: string,
  model: string,
  serverUrl: string,
) {
  const TIMEOUT_MS = 120000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (model === "combined") {
      const form = new FormData();
      form.append("text", text);
      const r = await fetch(`${serverUrl}/summarize`, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new Error(
          `Model error (${r.status}): ${body.slice(0, 300) || "Server returned an error."}`,
        );
      }
      return await r.json();
    }

    // Single model mode
    const r = await fetch(`${serverUrl}/summarize/selective`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new Error(
        `Model error (${r.status}): ${body.slice(0, 300) || "Server returned an error."}`,
      );
    }
    return await r.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Summarization timeout. Text may be too long.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Cloud API Calls ──

export async function callOpenAI(text: string, key: string) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "You are a concise summarization assistant. Format key insights as numbered points followed by a summary paragraph.",
        },
        { role: "user", content: generatePrompt(text) },
      ],
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `OpenAI ${r.status}`);
  }
  const d = await r.json();
  return { summary: d.choices[0].message.content };
}

export async function callGemini(text: string, key: string) {
  let lastError = null;
  for (const model of GEMINI_MODEL_CANDIDATES) {
    try {
      const data = await fetchJsonWithError(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: generatePrompt(text) }] }],
          }),
        },
        "Gemini",
      );
      const summary = data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("\n")
        .trim();
      if (!summary) throw new Error(`Gemini returned empty for ${model}.`);
      return { summary, model_used: model };
    } catch (error: any) {
      lastError = error;
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("not found") || msg.includes("unsupported")) continue;
      throw error;
    }
  }
  throw lastError || new Error("No supported Gemini model found.");
}

export async function callAnthropic(text: string, key: string) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 600,
      messages: [{ role: "user", content: generatePrompt(text) }],
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Anthropic ${r.status}`);
  }
  const d = await r.json();
  return { summary: d.content[0].text };
}

export async function callMistral(text: string, key: string) {
  const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      max_tokens: 600,
      messages: [{ role: "user", content: generatePrompt(text) }],
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Mistral ${r.status}`);
  }
  const d = await r.json();
  return { summary: d.choices[0].message.content };
}

export async function callGroq(text: string, key: string) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "Summarize clearly with numbered key points followed by a brief summary paragraph.",
        },
        { role: "user", content: generatePrompt(text) },
      ],
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Groq ${r.status}`);
  }
  const d = await r.json();
  return { summary: d.choices[0].message.content };
}

export async function callOllama(
  text: string,
  ollamaUrl: string,
  detectedModel: string | null,
) {
  const model = detectedModel || "llama3.2";
  const baseUrl = ollamaUrl.replace(/\/$/, "");

  const response = await backgroundMessage({
    type: "OLLAMA_FETCH",
    url: `${baseUrl}/api/generate`,
    options: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: generatePrompt(text),
        stream: false,
      }),
    },
  });

  if (!response?.ok) {
    throw new Error(response?.error || `Ollama failed to connect to ${model}`);
  }

  if (!response?.data?.response) {
    throw new Error(
      `Ollama (${model}): No response. Run 'ollama pull ${model}'.`,
    );
  }
  return { summary: response.data.response, model_used: model };
}

