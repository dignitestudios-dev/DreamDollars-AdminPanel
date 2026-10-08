import { API } from './axios';

export interface AdminLoginCredentials {
  email: string;
  password: string;
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
  const response = await API.post<AdminLoginResponse>(
    "/admin/login",
    credentials,
    {
      headers: {
        accept: "application/json",
        deviceuniqueid: "device-uuid-12345",
        devicemodel: "iPhone 15 Pro",
        "Content-Type": "application/json",
      },
    }
  );

  const data = response.data;
  const token = data?.token || data?.data?.token || data?.data?.accessToken;
  if (token && typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
  }

  return data;
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
    }
  }
};

// Login API call
export const login = async (credentials: any) => {
  const response = await API.post('/auth/login', credentials);
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