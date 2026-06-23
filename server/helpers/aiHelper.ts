// utils/aiHelper.ts

export async function generateConversationTitle(
  text: string,
  selectedModel?: string,
): Promise<string> {
  const shortText = text.substring(0, 1000);

  // Clean instructions for the AI
  const systemPrompt =
    "You are a concise assistant. Summarize the user input into a short title of 3 to 5 words. Do not use quotes, explanations, punctuation, or filler words. Reply with ONLY the title.";

  try {
    const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

    const r = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: `Generate a title for: ${shortText}`,
        system: systemPrompt,
        stream: false,
      }),
    });

    if (r.ok) {
      const d = await r.json();
      return d.response?.trim().replace(/["']/g, "") || "New Chat";
    } else {
      console.warn(`[aiHelper] Ollama returned status ${r.status}.`);
    }
  } catch (error) {
    console.error(
      "[aiHelper] Local title generation failed via Ollama:",
      error,
    );
  }

  return "New Chat";
}
