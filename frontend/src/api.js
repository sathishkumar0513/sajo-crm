import axios from "axios";

let csrfToken = "";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000/api" : "/api"),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const cookieToken = document.cookie.split("; ").find((value) => value.startsWith("csrftoken="))?.split("=")[1];
  const csrf = cookieToken ? decodeURIComponent(cookieToken) : csrfToken;
  if (csrf) config.headers["X-CSRFToken"] = csrf;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes("/auth/csrf/") && response.data?.csrfToken) {
      csrfToken = response.data.csrfToken;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/")) {
      originalRequest._retry = true;
      try {
        await api.post("/auth/refresh/");
        return api(originalRequest);
      } catch (refreshError) {
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(error);
  },
);

export default api;
