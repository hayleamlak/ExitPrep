import axios from "axios";

const AUTH_STORAGE_KEY = "exitprep_auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      delete api.defaults.headers.common.Authorization;

      if (!window.location.pathname.startsWith("/signin")) {
        window.location.assign("/signin");
      }
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export default api;
