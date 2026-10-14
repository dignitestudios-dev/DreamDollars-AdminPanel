import axios from "axios";
import { getDeviceId, getDeviceModel } from "@/lib/device";
import { store } from "@/lib/store";
import { setServerError } from "@/lib/slices/uiSlice";

export const baseURL = process.env.NEXT_PUBLIC_API_URL || "https://api.dev.dreamdollars.me";

// Create an Axios instance
export const API = axios.create({
  baseURL: baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "accept": "application/json",
  },
});

// Request Interceptor
API.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.authorization = `Bearer ${token}`;
      }

      // Dynamically attach device fingerprint unique ID and device model
      if (!config.headers["deviceuniqueid"]) {
        config.headers["deviceuniqueid"] = await getDeviceId();
      }
      if (!config.headers["devicemodel"]) {
        config.headers["devicemodel"] = getDeviceModel();
      }
    } else {
      if (!config.headers["deviceuniqueid"]) {
        config.headers["deviceuniqueid"] = "server-instance";
      }
      if (!config.headers["devicemodel"]) {
        config.headers["devicemodel"] = "Next.js Server";
      }
    }

    // When sending FormData, let browser/Axios set multipart/form-data with proper boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isNetworkOr5xx = !error?.response || (status && status >= 500);

    if (isNetworkOr5xx && typeof window !== "undefined") {
      // Exclude check if browser is completely offline (handled by ConnectionStatus)
      if (navigator.onLine) {
        store.dispatch(setServerError(true));
      }
    }

    if (
      status === 401 &&
      !error?.config?.url?.includes("/login") &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/auth/login")
    ) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      const currentPath = window.location.pathname + window.location.search;
      const returnUrl = encodeURIComponent(currentPath);
      window.location.href = `/auth/login?returnUrl=${returnUrl}`;
    }
    return Promise.reject(error);
  }
);

