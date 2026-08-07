import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api"),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("drilldeck_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("drilldeck_token");
      localStorage.removeItem("drilldeck_user");
      window.dispatchEvent(new Event("drilldeck:logout"));
    }
    return Promise.reject(error);
  }
);

export default api;
