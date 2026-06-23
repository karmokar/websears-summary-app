import apiFetch from "../lib/api";

export const sendPrompt = (
  prompt: string,
  file: File | null,
  selectedModel?: string,
  conversationId?: string | number,
) => {
  const formData = new FormData();
  formData.append("text", prompt);
  if (file) {
    formData.append("file", file);
  }
  if (selectedModel) {
    formData.append("model", selectedModel);
  }
  if (conversationId) {
    formData.append("conversationId", String(conversationId));
  }
  return apiFetch("/chat", {
    method: "POST",
    body: formData,
  });
};
