import { useEffect, useState, useRef } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { TextareaForm } from "@/components/TextareaForm";
import { sendPrompt } from "@/services/chatService";
import { ChatHistory } from "@/components/chatHistory";
import { getConversationsMessages } from "@/services/conversationService";
import { createPortal } from "react-dom";

// --- Extension Services ---
import { useExtensionState } from "../hooks/useExtensionState";
import { callLocalModel, callOpenAI, callOllama } from "../services/api";

export interface Message {
  role: "user" | "model";
  content: string;
}

interface DashboardProps {
  isExtension?: boolean;
}

const MODELS = [
  { value: "local:combined", label: "Combined" },
  { value: "local:bart", label: "BART" },
  { value: "local:t5", label: "T5" },
  { value: "local:textrank", label: "TextRank" },
  { value: "cloud:ollama", label: "Llama 3.2" },
];

function ModelSelector({
  selectedModel,
  onModelChange,
}: {
  selectedModel: string;
  onModelChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom - 8,
        left: rect.right - 140, // align right edge
      });
    }
    setOpen((o) => !o);
  };

  const selected = MODELS.find((m) => m.value === selectedModel);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 bg-transparent text-base font-medium text-muted-foreground hover:text-foreground transition-colors outline-none border-none cursor-pointer"
      >
        {selected?.label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              transform: "translateY(-100%)",
            }}
            className="bg-background border border-border rounded-xl shadow-lg py-1.5 min-w-[140px] z-[9999]"
          >
            {MODELS.map((m) => (
              <div
                key={m.value}
                onMouseDown={(e) => {
                  e.preventDefault(); // ← prevents blur before click fires
                  onModelChange(m.value);
                  setOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer rounded-lg mx-1 transition-colors ${
                  selectedModel === m.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {m.label}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
export default function Dashboard({ isExtension = false }: DashboardProps) {
  // ==========================================
  // 1. WEB APP STATE & HOOKS
  // ==========================================
  const { user, activeConversationId, addConversation, selectConversation } =
    useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  useEffect(() => {
    // Only fetch chat history if we are in the Web UI and have a conversation selected
    if (activeConversationId && !isExtension) {
      setIsLoadingResponse(true);
      getConversationsMessages(activeConversationId)
        .then(setMessages)
        .finally(() => setIsLoadingResponse(false));
    } else {
      setMessages([]);
    }
  }, [activeConversationId, isExtension]);

  const handelPromptSubmit = async (prompt: string, file: File | null) => {
    const userMessage = file ? `${prompt}(File:${file.name})` : prompt;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoadingResponse(true);

    try {
      // Always go through Node backend — it handles routing to FastAPI or Gemini
      const result = await sendPrompt(
        prompt,
        file,
        selectedModel,
        activeConversationId ?? undefined,
      );

      setMessages((prev) => [
        ...prev,
        { role: "model", content: result.response },
      ]);

      if (!activeConversationId && result.conversationId && user) {
        const newConvo = {
          ID: result.conversationId,
          title: result.title || "New Chat",
          userId: user.ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addConversation(newConvo);
        selectConversation(newConvo.ID);
      }
    } catch (error) {
      console.error("Failed to send Prompt:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setIsLoadingResponse(false);
    }
  };
  // ==========================================
  // 2. EXTENSION STATE & HOOKS
  // ==========================================
  const extState = useExtensionState();
  const [activeTab, setActiveTab] = useState("summarize");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [selectedModel, setSelectedModel] = useState("local:combined");
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!extState.pageContent.text) {
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
          extState.pageContent.text,
          modelName,
          extState.serverUrl,
        );
        finalSummary = data.final_summary || data.summary;
      } else if (provider === "cloud" && modelName === "ollama") {
        const data = await callOllama(
          extState.pageContent.text,
          extState.ollamaUrl,
          null,
        );
        finalSummary = data.summary;
      } else if (provider === "cloud" && modelName === "openai") {
        if (!extState.keys["openai"])
          throw new Error("Missing OpenAI API Key in Settings.");
        const data = await callOpenAI(
          extState.pageContent.text,
          extState.keys["openai"],
        );
        finalSummary = data.summary;
      }

      if (!finalSummary)
        throw new Error("The model returned an empty summary.");

      setSummaryResult(finalSummary);
      extState.saveToHistory({
        title: extState.pageContent.title || "Untitled Page",
        url: extState.pageContent.url || "",
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

  // ==========================================
  // 3. RENDER EXTENSION UI (If isExtension is true)
  // ==========================================
  if (isExtension) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-3 border-b border-border bg-card shrink-0 gap-2">
          <div className="font-serif text-lg font-semibold tracking-tight">
            web<span className="text-primary">sears</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="p-1.5 border border-border rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm"
              onClick={extState.toggleTheme}
            >
              {extState.theme === "dark" ? "🌙" : "☀"}
            </button>
            <button
              className="p-1.5 border border-border rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm"
              onClick={extState.grabActivePageContent}
            >
              ↺
            </button>
            <button
              className="p-1.5 border border-border rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm"
              onClick={() => setActiveTab("settings")}
            >
              ⚙
            </button>
          </div>
        </header>

        {/* Tabs */}
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

        {/* Panels */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-hide">
          {activeTab === "summarize" && (
            <>
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <div className="text-sm font-semibold leading-tight mb-1 text-foreground">
                  {extState.pageContent.title || "Waiting for page…"}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {extState.pageContent.url}
                </div>
              </div>
              <div>
                <select
                  className="w-full bg-background border border-border rounded-md text-xs px-3 py-2 outline-none focus:border-primary transition-colors"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <optgroup label="🖥 Local Models">
                    <option value="local:combined">
                      Combined (BART + T5 + LexRank)
                    </option>
                  </optgroup>
                  <optgroup label="☁ Cloud APIs">
                    <option value="cloud:openai">OpenAI GPT-4o</option>
                  </optgroup>
                </select>
              </div>
              <button
                className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-medium text-xs px-4 py-2.5 rounded-md hover:bg-primary/90 disabled:opacity-50"
                onClick={handleSummarize}
                disabled={isSummarizing || !extState.pageContent.text}
              >
                {isSummarizing ? "Summarizing..." : "✦ Summarize this page"}
              </button>
              {errorMsg && (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-xs text-destructive whitespace-pre-wrap mt-2">
                  {errorMsg}
                </div>
              )}
              {summaryResult && (
                <div className="bg-card border border-border rounded-lg overflow-hidden mt-2 p-3 text-[13px] leading-relaxed text-foreground">
                  {summaryResult}
                </div>
              )}
            </>
          )}
          {activeTab === "history" && (
            <div className="text-center text-xs text-muted-foreground py-8">
              History tracking preserved here.
            </div>
          )}
          {activeTab === "settings" && (
            <div className="text-center text-xs text-muted-foreground py-8">
              API Configs preserved here.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. RENDER WEB UI (If isExtension is false)
  // ==========================================
  const hasMessages = messages.length > 0;
  return (
    // Changed hardcoded colors to Tailwind Global theme colors!
    <div className="h-screen flex bg-background">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="relative flex flex-1 flex-col flex-grow items-center p-8 bg-muted overflow-hidden">
            {!hasMessages && (
              <div className="flex flex-col items-center justify-center flex-1 w-full gap-6 px-8">
                <h1
                  className="text-6xl text-foreground select-none"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  Hello {user?.Username || "there"}
                </h1>
                <div className="w-full max-w-3xl">
                  <TextareaForm
                    onSubmit={handelPromptSubmit}
                    isLoading={isLoadingResponse}
                    modelSelector={
                      <ModelSelector
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                      />
                    }
                  />
                </div>
              </div>
            )}

            {/* ── Has messages: chat layout ── */}
            {hasMessages && (
              <>
                <div className="flex-1 overflow-y-auto scrollbar-hide p-8 w-full max-w-4xl">
                  <ChatHistory
                    messages={messages}
                    isLoading={isLoadingResponse}
                    user={user}
                  />
                </div>
                <div className="w-full max-w-4xl p-4">
                  <TextareaForm
                    onSubmit={handelPromptSubmit}
                    isLoading={isLoadingResponse}
                    modelSelector={
                      <ModelSelector
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                      />
                    }
                  />
                </div>
              </>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
