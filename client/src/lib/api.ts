import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("safepath_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem("safepath_token", data.accessToken);
        err.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(err.config);
      } catch {
        localStorage.removeItem("safepath_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;
