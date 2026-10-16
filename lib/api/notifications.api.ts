import { API } from "./axios";

export type BroadcastTargetType = "all" | "specific";

export interface SendBroadcastPayload {
  title: string;
  message: string;
  targetType: BroadcastTargetType;
  userIds?: string[];
  targetUserIds?: string[];
}

export interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  targetType: string;
  totalRecipients?: number;
  total_recipients?: number;
  adminId?: string;
  adminName?: string | null;
  adminEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface SendBroadcastResponse {
  success: boolean;
  message: string;
  data: {
    broadcast: BroadcastRecord;
    totalRecipients: number;
  };
}

export interface BroadcastsPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface GetBroadcastsResponse {
  success: boolean;
  message: string;
  data: BroadcastRecord[];
  pagination?: BroadcastsPagination;
}

export interface GetBroadcastsParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Send a broadcast push notification to all users or specific users
 */
export const sendBroadcastNotification = async (
  payload: SendBroadcastPayload
): Promise<SendBroadcastResponse> => {
  const finalPayload: Record<string, unknown> = {
    title: payload.title.trim(),
    message: payload.message.trim(),
    targetType: payload.targetType,
  };

  if (payload.targetType === "specific") {
    const ids = payload.targetUserIds || payload.userIds || [];
    finalPayload.targetUserIds = ids;
    finalPayload.userIds = ids;
  } else {
    finalPayload.targetUserIds = [];
    finalPayload.userIds = [];
  }

  const response = await API.post<SendBroadcastResponse>(
    "/notification/broadcast",
    finalPayload
  );
  return response.data;
};

/**
 * Get broadcast history list with pagination and optional search
 */
export const getBroadcastNotifications = async (
  params?: GetBroadcastsParams
): Promise<GetBroadcastsResponse> => {
  const cleanParams: Record<string, string | number> = {};
  if (params?.page) cleanParams.page = params.page;
  if (params?.limit) cleanParams.limit = params.limit;
  if (params?.search && params.search.trim()) {
    cleanParams.search = params.search.trim();
  }

  const response = await API.get<GetBroadcastsResponse>(
    "/notification/broadcasts",
    {
      params: cleanParams,
    }
  );
  return response.data;
};
