import { useState } from "react";
import "../index.css"; // Ensure this points to your new Tailwind index.css

import { useExtensionState } from "../hooks/useExtensionState";
import { callLocalModel, callOpenAI, callOllama } from "../services/api";

export default function SidebarApp() {
  const {
    theme,
    toggleTheme,
    serverUrl,
    ollamaUrl,
    saveUrls,
    keys,
    saveKey,
    history,
    clearHistory,
    saveToHistory,
    pageContent,
    grabActivePageContent,
  } = useExtensionState();

  const [activeTab, setActiveTab] = useState("summarize");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [selectedModel, setSelectedModel] = useState("local:combined");
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!pageContent.text) {
      setErrorMsg("No readable text found on this page.");
      return;
    }

    setIsSummarizing(true);
    setErrorMsg(null);
    setSummaryResult(null);

    try {
      let finalSummary = "";
      const [provider, modelName] = selectedModel.split(":");

      if (provider === "local") {
        const data = await callLocalModel(
          pageContent.text,
          modelName,
          serverUrl,
        );
        finalSummary = data.final_summary || data.summary;
      } else if (provider === "cloud" && modelName === "ollama") {
        const data = await callOllama(pageContent.text, ollamaUrl, null);
        finalSummary = data.summary;
      } else if (provider === "cloud" && modelName === "openai") {
        if (!keys["openai"])
          throw new Error("Missing OpenAI API Key in Settings.");
        const data = await callOpenAI(pageContent.text, keys["openai"]);
        finalSummary = data.summary;
      }

      if (!finalSummary)
        throw new Error("The model returned an empty summary.");

      setSummaryResult(finalSummary);

      saveToHistory({
        title: pageContent.title || "Untitled Page",
        url: pageContent.url || "",
        model: selectedModel,
        summary: finalSummary,
        sourceType: "link",
        date: new Date().toISOString(),
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An unknown error occurred.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between p-3 border-b border-border bg-card shrink-0 gap-2">
        <div className="font-serif text-lg font-semibold tracking-tight">
          web<span className="text-primary">sears</span>
        </div>

        {isSummarizing && (
          <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1 font-medium">
            🔒 <span>Summarizing…</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            className="p-1.5 border border-border rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-sm leading-none"
            onClick={toggleTheme}
            title={`Theme: ${theme}`}
          >
            {theme === "dark" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
            {theme === "light" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            )}
            {theme === "wood" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 8c.7 1.4 1 2.9 1 4.4C18 17.2 15.3 21 12 21S6 17.2 6 12.4C6 9.6 7.4 7 9.5 5.5" />
                <path d="M12 2c.6 1.7.8 3.5.5 5.3" />
              </svg>
            )}
            {theme === "cherry" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3z" />
                <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3z" />
                <path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12" />
                <path d="M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 3.13 10 7z" />
              </svg>
            )}
            {theme === "night-blue" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
            )}
            {theme === "shady-dark" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 10 10 0 1 1 0-20" />
              </svg>
            )}
          </button>
          <button
            className="p-1.5 border border-border rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-sm leading-none"
            onClick={grabActivePageContent}
            title="Re-grab page content"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
          <button
            className="p-1.5 border border-border rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-sm leading-none"
            onClick={() => setActiveTab("settings")}
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="flex border-b border-border bg-card shrink-0">
        {["summarize", "upload", "history", "settings"].map((tab) => (
          <div
            key={tab}
            className={`flex-1 py-2.5 text-center text-[10px] font-medium uppercase tracking-widest cursor-pointer border-b-2 transition-all ${
              activeTab === tab
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* ── PANELS ── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-hide">
        {/* 1. SUMMARIZE PANEL */}
        {activeTab === "summarize" && (
          <>
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <div className="text-sm font-semibold leading-tight mb-1 text-foreground">
                {pageContent.title || "Waiting for page…"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {pageContent.url}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5">
                {pageContent.text
                  ? `~${pageContent.text.split(/\s+/).length} words ready`
                  : "No text extracted"}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
                Model / Provider
              </label>
              <select
                className="w-full bg-background border border-border rounded-md text-xs px-3 py-2 outline-none focus:border-primary transition-colors"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <optgroup label="🖥 Local Models">
                  <option value="local:combined">
                    Combined (BART + T5 + LexRank)
                  </option>
                  <option value="local:bart">BART</option>
                </optgroup>
                <optgroup label="🦙 Ollama (local)">
                  <option value="cloud:ollama">Ollama Llama 3.2</option>
                </optgroup>
                <optgroup label="☁ Cloud APIs">
                  <option value="cloud:openai">OpenAI GPT-4o</option>
                </optgroup>
              </select>
            </div>

            <button
              className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-medium text-xs px-4 py-2.5 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              onClick={handleSummarize}
              disabled={isSummarizing || !pageContent.text}
            >
              {isSummarizing ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              ) : (
                <span>✦ Summarize this page</span>
              )}
            </button>

            {errorMsg && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-xs text-destructive whitespace-pre-wrap">
                {errorMsg}
              </div>
            )}

            {summaryResult && (
              <div className="bg-card border border-border rounded-lg overflow-hidden mt-2">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    ✦ Summary
                  </span>
                </div>
                <div className="p-3 text-[13px] leading-relaxed text-foreground">
                  {summaryResult}
                </div>
              </div>
            )}
          </>
        )}

        {/* 2. UPLOAD PANEL */}
        {activeTab === "upload" && (
          <div className="text-center text-xs text-muted-foreground py-8">
            File upload UI will go here.
          </div>
        )}

        {/* 3. HISTORY PANEL */}
        {activeTab === "history" && (
          <>
            {history.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                No history yet
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-lg p-3 hover:border-primary transition-colors cursor-pointer"
                  >
                    <strong className="text-sm text-foreground block mb-1">
                      {item.title}
                    </strong>
                    <div className="text-[10px] text-muted-foreground mb-1.5">
                      {item.model} • {new Date(item.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-3">
                      {item.summary}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              className="w-full flex items-center justify-center bg-destructive/10 text-destructive border border-destructive/30 font-medium text-xs px-4 py-2 rounded-md hover:bg-destructive/20 transition-all mt-2"
              onClick={clearHistory}
            >
              Clear history
            </button>
          </>
        )}

        {/* 4. SETTINGS PANEL */}
        {activeTab === "settings" && (
          <>
            <div className="bg-card border border-border rounded-lg p-3 mb-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Local Server
              </div>
              <div className="flex flex-col gap-1.5 mb-3">
                <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Server URL
                </label>
                <input
                  className="w-full bg-background border border-border rounded-md text-xs px-3 py-2 outline-none focus:border-primary transition-colors"
                  type="text"
                  value={serverUrl}
                  onChange={(e) => saveUrls(e.target.value, ollamaUrl)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Ollama URL
                </label>
                <input
                  className="w-full bg-background border border-border rounded-md text-xs px-3 py-2 outline-none focus:border-primary transition-colors"
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => saveUrls(serverUrl, e.target.value)}
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Cloud API Keys
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  OpenAI {keys["openai"] ? "✓" : ""}
                </label>
                <input
                  className="w-full bg-background border border-border rounded-md text-xs px-3 py-2 outline-none focus:border-primary transition-colors"
                  type="password"
                  placeholder={keys["openai"] ? "••••••••••••" : "sk-…"}
                  onChange={(e) => saveKey("openai", e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
