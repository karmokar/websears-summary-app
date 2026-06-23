const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getShareConverastion(token: string) {
  const response = await fetch(`${API_BASE_URL}/share/${token}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load share conversation");
  }
  return response.json();
}