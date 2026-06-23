import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const checkAuthStatus = async () => {
  try {
    const res = await api.get("/auth/check-auth");
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401 || err.response?.status === 400) {
      return { user: null }; // ✅ silent, no throw
    }
    throw err;
  }
};

export const logoutUser = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};