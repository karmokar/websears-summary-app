import { useState, useEffect } from "react";
import { backgroundMessage, ALL_PROVIDERS } from "@/services/api";

export interface SummaryHistoryItem {
  id: number;
  title: string;
  url: string;
  model: string;
  summary: string;
  sourceType: string;
  date: string;
}

export function useExtensionState() {
  const [theme, setThemeState] = useState("dark");
  const [serverUrl, setServerUrl] = useState("http://localhost:5001");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<SummaryHistoryItem[]>([]);

  const [pageContent, setPageContent] = useState({
    text: "",
    title: "",
    url: "",
  });

  useEffect(() => {
    // Check if we are running inside the Chrome Extension environment
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(
        ["serverUrl", "ollamaUrl", "keys", "theme", "summaryHistory"],
        (data) => {
          if (data.serverUrl) setServerUrl(data.serverUrl as string);
          if (data.ollamaUrl) setOllamaUrl(data.ollamaUrl as string);
          if (data.keys) setKeys(data.keys as Record<string, string>);
          if (data.summaryHistory) setHistory(data.summaryHistory as any[]);

          const initialTheme = (data.theme as string) || "dark";
          setThemeState(initialTheme);
          document.documentElement.setAttribute("data-theme", initialTheme);
          const darkThemes = [
            "dark",
            "wood",
            "cherry",
            "night-blue",
            "shady-dark",
          ];
          if (darkThemes.includes(initialTheme)) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        },
      );
    }

    // Auto-grab page content on load
    grabActivePageContent();
  }, []);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    const darkThemes = ["dark", "wood", "cherry", "night-blue", "shady-dark"];
    if (darkThemes.includes(newTheme)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ theme: newTheme });
    }
  };

  const toggleTheme = () => {
    const THEME_CYCLE = [
      "dark",
      "light",
      "wood",
      "cherry",
      "night-blue",
      "shady-dark",
    ];
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  };

  // --- Settings Management ---
  const saveKey = (Provider: string, key: string) => {
    const newKeys = { ...keys, [Provider]: key };
    setKeys(newKeys);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ keys: newKeys });
    }
  };

  const clearKeys = () => {
    const emptyKeys = Object.fromEntries(ALL_PROVIDERS.map((p) => [p, ""]));
    setKeys(emptyKeys);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.remove("keys");
    }
  };

  const saveUrls = (server: string, ollama: string) => {
    setServerUrl(server);
    setOllamaUrl(ollama);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ serverUrl: server, ollamaUrl: ollama });
    }
  };

  // --- History Management ---
  const saveToHistory = (entry: Omit<SummaryHistoryItem, "id">) => {
    const newItem = { ...entry, id: Date.now() };
    const newHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(newHistory);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ summaryHistory: newHistory });
    }
  };

  const clearHistory = () => {
    setHistory([]);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.remove("summaryHistory");
    }
  };

  // --- Page Content Grabber ---
  const grabActivePageContent = async () => {
    try {
      const payload = await backgroundMessage({
        type: "GET_ACTIVE_PAGE_CONTENT",
      });
      if (payload?.ok && payload?.data) {
        setPageContent({
          text: payload.data.text || "",
          title: payload.data.title || "",
          url: payload.data.url || "",
        });
      }
    } catch (err) {
      console.log(
        "Could not access page content. Note: Won't work on chrome:// URLs.",
      );
    }
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    serverUrl,
    ollamaUrl,
    saveUrls,
    keys,
    saveKey,
    clearKeys,
    history,
    saveToHistory,
    clearHistory,
    pageContent,
    grabActivePageContent,
  };
}
