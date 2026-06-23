// content.js
// Injected into every page. Extracts readable text and sends it to the sidebar.

/**
 * Extracts and purifies core content text from the current DOM tree.
 * Clones the node map to avoid breaking active page layouts during element removal.
 */
function extractPageText() {
  const NOISE_TAGS = ["script", "style", "nav", "footer", "header", "aside", "noscript", "iframe", "meta", "link"];
  const clone = document.documentElement.cloneNode(true);

  // Strip non-content blocks out of the working space
  NOISE_TAGS.forEach(tag => {
    clone.querySelectorAll(tag).forEach(el => el.remove());
  });

  // Targeted structural fallback order to isolate content body
  const mainContent = clone.querySelector("article") ||
                      clone.querySelector("main") ||
                      clone.querySelector("[role='main']") ||
                      clone.querySelector("[role='article']") ||
                      clone.querySelector(".content") ||
                      clone.querySelector(".post") ||
                      clone.querySelector(".entry-content") ||
                      clone.body;

  let text = mainContent ? (mainContent.innerText || mainContent.textContent || "") : "";
  
  // Condense horizontal spacing while preserving readable structural linebreaks
  return text
    .replace(/\n\n\n+/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Packs extracted content and dispatches it over the background application runtime runtime channel.
 */
function publishPageContent() {
  const text = extractPageText();
  
  if (text && text.length > 50) {
    chrome.runtime.sendMessage({
      type: "PAGE_CONTENT",
      title: document.title,
      url: window.location.href,
      text: text,
    }).catch(err => {
      // Gracefully silence catch logs when the receiver context (sidebar UI) is unmounted
      console.debug("Sidebar connection dormant, message queued or skipped:", err.message);
    });
  }
}

// Debounce state manager to control message frequency thresholds
let publishTimer = null;
function publishPageContentDebounced(delay = 500) {
  clearTimeout(publishTimer);
  publishTimer = setTimeout(() => {
    publishPageContent();
  }, delay);
}

// Listener waiting for precise on-demand data extraction pulls from the Sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_CONTENT") {
    const text = extractPageText();
    console.log(`[content.js] GET_PAGE_CONTENT: extracted ${text.length} characters`);
    sendResponse({
      type: "PAGE_CONTENT",
      title: document.title,
      url: window.location.href,
      text: text,
    });
  }
  return true;
});

// Initialization execution strategy
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => publishPageContent());
} else {
  publishPageContent();
}

// Global window layout updates and visibility lifecycle hooks
window.addEventListener("load", () => publishPageContentDebounced(200));
window.addEventListener("DOMContentLoaded", () => publishPageContentDebounced(100));
window.addEventListener("pageshow", () => publishPageContentDebounced(300));
window.addEventListener("hashchange", () => publishPageContentDebounced(500));
window.addEventListener("popstate", () => publishPageContentDebounced(500));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    publishPageContentDebounced(200);
  }
});

// Intercept window history mutations for dynamic client-side SPA routing wrappers
const _pushState = history.pushState;
history.pushState = function () {
  const ret = _pushState.apply(this, arguments);
  publishPageContentDebounced(150);
  return ret;
};

const _replaceState = history.replaceState;
history.replaceState = function () {
  const ret = _replaceState.apply(this, arguments);
  publishPageContentDebounced(150);
  return ret;
};