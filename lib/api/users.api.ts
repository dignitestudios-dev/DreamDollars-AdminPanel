import { API } from "./axios";

export interface AdminUser {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  profilePic?: string | null;
  avatarEmoji?: string | null;
  subscriptionStatus?: string; // Note: Not used in UI as per user instruction
  isSubscribed: boolean;
  accountStatus: string; // "active" | "inactive" | string
  isDeactivatedByAdmin?: boolean;
  isEmailVerified: boolean;
  isProfileCompleted: boolean;
  joinedDate: string;
  [key: string]: any;
}

export interface UsersPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface GetUsersResponse {
  success?: boolean;
  message?: string;
  data: AdminUser[];
  pagination: UsersPagination;
  [key: string]: any;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isSubscribed?: boolean | string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export const getAdminUsers = async (
  params?: GetUsersParams
): Promise<GetUsersResponse> => {
  const cleanParams: Record<string, any> = {};

  if (params?.page) cleanParams.page = params.page;
  if (params?.limit) cleanParams.limit = params.limit;
  if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
  if (params?.status && params.status !== "all") cleanParams.status = params.status;
  if (params?.isSubscribed !== undefined && params.isSubscribed !== "all") {
    cleanParams.isSubscribed = params.isSubscribed;
  }
  if (params?.startDate) cleanParams.startDate = params.startDate;
  if (params?.endDate) cleanParams.endDate = params.endDate;
  if (params?.sortBy) cleanParams.sortBy = params.sortBy;
  if (params?.order) cleanParams.order = params.order;

  const response = await API.get<GetUsersResponse>("/admin/users", {
    params: cleanParams,
    headers: {
      accept: "application/json",
    },
  });
  return response.data;
};

// User Detail Types
export interface UserProfile {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  bio?: string | null;
  authType?: string;
  profilePic?: string | null;
  avatarEmoji?: string | null;
  subscriptionStatus?: string; // strictly omitted from UI
  isSubscribed: boolean;
  accountStatus: string;
  isDeactivatedByAdmin?: boolean;
  isEmailVerified: boolean;
  isProfileCompleted: boolean;
  joinedDate: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface UserSettings {
  occupation?: string | null;
  currency?: string | null;
  financialGoals?: string[];
  [key: string]: any;
}

export interface UserInsights {
  totalBudgets?: number;
  totalGoals?: number;
  completedGoals?: number;
  inProgressGoals?: number;
  totalSavingsPots?: number;
  totalDebts?: number;
  activeDebts?: number;
  totalIncomeSources?: number;
  totalAssets?: number;
  totalInvestments?: number;
  activeSessionsCount?: number;
  lastActiveAt?: string | null;
  [key: string]: any;
}

export interface UserDetailData {
  profile: UserProfile;
  settings?: UserSettings;
  insights?: UserInsights;
}

export interface GetUserDetailsResponse {
  success: boolean;
  message: string;
  data: UserDetailData;
}

export interface UpdateUserStatusResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const getUserDetails = async (
  userId: string
): Promise<GetUserDetailsResponse> => {
  const response = await API.get<GetUserDetailsResponse>(
    `/admin/users/${userId}`,
    {
      headers: {
        accept: "application/json",
      },
    }
  );
  return response.data;
};

export const updateUserStatus = async (
  userId: string,
  status: "active" | "inactive" | string
): Promise<UpdateUserStatusResponse> => {
  const response = await API.patch<UpdateUserStatusResponse>(
    `/admin/users/${userId}/status`,
    { status },
    {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};
