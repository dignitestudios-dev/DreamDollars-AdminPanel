import { API } from './axios';
import { getDeviceId, getDeviceModel } from '@/lib/device';
import { getStoredFcmToken } from '@/lib/firebase/messaging';

export interface AdminLoginCredentials {
  email: string;
  password: string;
  fcmToken?: string | null;
  [key: string]: any;
}

export interface AdminLoginResponse {
  success?: boolean;
  message?: string;
  token?: string;
  data?: any;
  user?: any;
  admin?: any;
  [key: string]: any;
}

export interface AdminForgotPasswordPayload {
  email: string;
}

export interface AdminForgotPasswordResponse {
  success?: boolean;
  message?: string;
  [key: string]: any;
}

export interface AdminVerifyOtpPayload {
  email: string;
  otp: string;
}

export interface AdminVerifyOtpResponse {
  success?: boolean;
  message?: string;
  resetToken?: string;
  token?: string;
  data?: any;
  [key: string]: any;
}

export interface AdminResetPasswordPayload {
  email: string;
  otp: string;
  resetToken?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AdminResetPasswordResponse {
  success?: boolean;
  message?: string;
  [key: string]: any;
}

// Admin Login API call
export const adminLogin = async (
  credentials: AdminLoginCredentials
): Promise<AdminLoginResponse> => {
  const fcmToken =
    credentials.fcmToken ||
    getStoredFcmToken() ||
    (typeof window !== "undefined" ? localStorage.getItem("fcmToken") : null);

  const deviceId =
    typeof window !== "undefined"
      ? (await getDeviceId()) || "device-uuid-12345"
      : "server-instance";
  const deviceModel =
    typeof window !== "undefined"
      ? getDeviceModel() || "Web Admin"
      : "Next.js Server";

  const requestHeaders: Record<string, string> = {
    accept: "application/json",
    deviceuniqueid: deviceId,
    devicemodel: deviceModel,
    "Content-Type": "application/json",
  };

  if (fcmToken) {
    requestHeaders["fcmtoken"] = fcmToken;
    requestHeaders["fcm-token"] = fcmToken;
    requestHeaders["devicetoken"] = fcmToken;
  }

  const payload: Record<string, any> = {
    email: credentials.email,
    password: credentials.password,
    fcmToken: fcmToken || (credentials.fcmToken !== undefined ? credentials.fcmToken : ""),
  };

  try {
    const response = await API.post<AdminLoginResponse>(
      "/admin/login",
      payload,
      {
        headers: requestHeaders,
      }
    );

    const data = response.data;
    const token = data?.token || data?.data?.token || data?.data?.accessToken;
    if (token && typeof window !== "undefined") {
      localStorage.setItem("authToken", token);
    }

    return data;
  } catch (error: any) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "";

    // If backend rejects unexpected body key (e.g. "Unexpected: fcmToken"), retry without fcmToken in body but keep in headers
    if (
      payload.fcmToken &&
      typeof errMsg === "string" &&
      errMsg.includes("Unexpected: fcmToken")
    ) {
      console.warn("[adminLogin] Backend rejected fcmToken in body, retrying with fcmToken in headers only...");
      const fallbackPayload = {
        email: credentials.email,
        password: credentials.password,
      };

      const retryResponse = await API.post<AdminLoginResponse>(
        "/admin/login",
        fallbackPayload,
        {
          headers: requestHeaders,
        }
      );

      const data = retryResponse.data;
      const token = data?.token || data?.data?.token || data?.data?.accessToken;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
      }

      return data;
    }

    throw error;
  }
};

// Admin Forgot Password API call
export const adminForgotPassword = async (
  payload: AdminForgotPasswordPayload
): Promise<AdminForgotPasswordResponse> => {
  const response = await API.post<AdminForgotPasswordResponse>(
    "/admin/forgot-password",
    payload,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Admin Verify OTP API call
export const adminVerifyOtp = async (
  payload: AdminVerifyOtpPayload
): Promise<AdminVerifyOtpResponse> => {
  const response = await API.post<AdminVerifyOtpResponse>(
    "/admin/verify-otp",
    payload,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Admin Reset Password API call
export const adminResetPassword = async (
  payload: AdminResetPasswordPayload
): Promise<AdminResetPasswordResponse> => {
  const response = await API.post<AdminResetPasswordResponse>(
    "/admin/reset-password",
    payload,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Admin Get Profile API call
export interface AdminProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profilePictureId?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProfileResponse {
  success?: boolean;
  message?: string;
  data?: AdminProfileData;
  [key: string]: any;
}

export const getAdminProfile = async (): Promise<AdminProfileResponse> => {
  const response = await API.get<AdminProfileResponse>("/admin/profile", {
    headers: {
      accept: "application/json",
    },
  });
  return response.data;
};

// Admin Update Profile API call (multipart/form-data)
export interface AdminUpdateProfilePayload {
  name?: string;
  phone?: string;
  profilePicture?: File | null;
}

export const updateAdminProfile = async (
  payload: AdminUpdateProfilePayload
): Promise<AdminProfileResponse> => {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.phone !== undefined) formData.append("phone", payload.phone);
  if (payload.profilePicture) {
    formData.append("profilePicture", payload.profilePicture);
  }

  const response = await API.patch<AdminProfileResponse>(
    "/admin/profile",
    formData,
    {
      headers: {
        accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Admin Logout API call
export const adminLogout = async () => {
  try {
    await API.post(
      "/admin/logout",
      {},
      {
        headers: {
          accept: "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Admin logout error:", error);
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("fcmToken");
      localStorage.removeItem("deviceuniqueid");
    }
  }
};

// Login API call
export const login = async (credentials: any) => {
  const fcmToken =
    credentials?.fcmToken ||
    getStoredFcmToken() ||
    (typeof window !== "undefined" ? localStorage.getItem("fcmToken") : null);

  const payload = {
    ...credentials,
    ...(fcmToken ? { fcmToken } : {}),
  };

  const response = await API.post('/auth/login', payload);
  // Store token in localStorage (handled by interceptor, but can be done here too)
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  return response.data;
};

// Register API call
export const register = async (credentials: any) => {
  const response = await API.post('/auth/register', credentials);
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  return response.data;
};

// Logout API call
export const logout = async () => {
  try {
    await API.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always remove token locally
    localStorage.removeItem('authToken');
  }
};

// Get current user profile
export const getProfile = async () => {
  const response = await API.get('/auth/profile');
  return response.data;
};

// Refresh token (if needed)
export const refreshToken = async () => {
  const response = await API.post('/auth/refresh');
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  return response.data;
};