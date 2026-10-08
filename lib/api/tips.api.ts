import { API } from "./axios";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type TipStatus = "active" | "inactive";

export interface AdminTip {
  id: string;
  title: string;
  description: string;
  day_of_week: DayOfWeek | string;
  status: TipStatus | string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipsPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface GetTipsResponse {
  success: boolean;
  message: string;
  data: AdminTip[];
  pagination: TipsPagination;
}

export interface GetTipsParams {
  search?: string;
  day_of_week?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetTipByIdResponse {
  success: boolean;
  message: string;
  data: AdminTip;
}

export interface CreateTipPayload {
  title: string;
  description: string;
  day_of_week: DayOfWeek | string;
  status?: TipStatus | string;
}

export interface CreateTipResponse {
  success: boolean;
  message: string;
  data: AdminTip;
}

export interface UpdateTipPayload {
  title?: string;
  description?: string;
  day_of_week?: DayOfWeek | string;
  status?: TipStatus | string;
}

export interface UpdateTipResponse {
  success: boolean;
  message: string;
  data: AdminTip;
}

export interface DeleteTipResponse {
  success: boolean;
  message: string;
}

export interface NotificationTimeData {
  notificationTime: string;
}

export interface GetNotificationTimeResponse {
  success: boolean;
  message: string;
  data: NotificationTimeData;
}

export interface UpdateNotificationTimePayload {
  notificationTime: string;
}

export interface UpdateNotificationTimeResponse {
  success: boolean;
  message: string;
  data?: NotificationTimeData;
}

/**
 * Fetch all tips with optional search, day_of_week, status, and pagination
 */
export const getAdminTips = async (
  params?: GetTipsParams
): Promise<GetTipsResponse> => {
  const cleanParams: Record<string, any> = {};

  if (params?.day_of_week && params.day_of_week !== "all") {
    cleanParams.day_of_week = params.day_of_week;
  }
  if (params?.status && params.status !== "all") {
    cleanParams.status = params.status;
  }
  if (params?.page) {
    cleanParams.page = params.page;
  }
  if (params?.limit) {
    cleanParams.limit = params.limit;
  }
  if (params?.search && params.search.trim()) {
    cleanParams.search = params.search.trim();
  }

  const response = await API.get<GetTipsResponse>("/admin/tips", {
    params: cleanParams,
  });
  return response.data;
};

/**
 * Fetch a single tip by ID
 */
export const getAdminTipById = async (
  id: string
): Promise<GetTipByIdResponse> => {
  const response = await API.get<GetTipByIdResponse>(`/admin/tips/${id}`);
  return response.data;
};

/**
 * Create/Upsert a new tip
 */
export const createAdminTip = async (
  payload: CreateTipPayload
): Promise<CreateTipResponse> => {
  const response = await API.post<CreateTipResponse>("/admin/tips", payload);
  return response.data;
};

/**
 * Update an existing tip by ID
 */
export const updateAdminTip = async (
  id: string,
  payload: UpdateTipPayload
): Promise<UpdateTipResponse> => {
  const response = await API.patch<UpdateTipResponse>(
    `/admin/tips/${id}`,
    payload
  );
  return response.data;
};

/**
 * Delete a tip by ID
 */
export const deleteAdminTip = async (
  id: string
): Promise<DeleteTipResponse> => {
  const response = await API.delete<DeleteTipResponse>(`/admin/tips/${id}`);
  return response.data;
};

/**
 * Get daily notification time configured for tips
 */
export const getDailyNotificationTime = async (): Promise<GetNotificationTimeResponse> => {
  const response = await API.get<GetNotificationTimeResponse>(
    "/admin/tips/notification-time"
  );
  return response.data;
};

/**
 * Upsert daily notification time for tips
 */
export const updateDailyNotificationTime = async (
  payload: UpdateNotificationTimePayload
): Promise<UpdateNotificationTimeResponse> => {
  const response = await API.post<UpdateNotificationTimeResponse>(
    "/admin/tips/notification-time",
    payload
  );
  return response.data;
};
