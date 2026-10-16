import { API } from "./axios";
import { AdminCategory } from "./categories.api";

export interface AdminInsight {
  id: string;
  title: string;
  description: string;
  external_link?: string | null;
  category_id: string;
  category?: AdminCategory | null;
  thumbnail_id?: string | null;
  thumbnail_url?: string | null;
  thumbnail?: string | null;
  video_id?: string | null;
  video_url?: string | null;
  video?: string | null;
  status: "active" | "inactive" | string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface InsightsPagination {
  total?: number;
  totalItems?: number;
  page?: number;
  currentPage?: number;
  limit?: number;
  itemsPerPage?: number;
  totalPages: number;
}

export interface GetInsightsResponse {
  success: boolean;
  message: string;
  data: AdminInsight[];
  pagination: InsightsPagination;
}

export interface GetInsightsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category_id?: string;
}

export interface CreateInsightPayload {
  title: string;
  description: string;
  category_id: string;
  status?: "active" | "inactive" | string;
  thumbnail?: File | null;
  video?: File | null;
  external_link?: string;
  [key: string]: any;
}

export interface CreateInsightResponse {
  success: boolean;
  message: string;
  data: AdminInsight;
}

export interface GetInsightDetailResponse {
  success: boolean;
  message: string;
  data: AdminInsight;
}

export interface UpdateInsightPayload {
  title?: string;
  description?: string;
  category_id?: string;
  status?: "active" | "inactive" | string;
  thumbnail?: File | null;
  video?: File | null;
  external_link?: string | null;
  [key: string]: any;
}

export interface UpdateInsightResponse {
  success: boolean;
  message: string;
  data: AdminInsight;
}

export interface DeleteInsightResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const getAdminInsights = async (
  params?: GetInsightsParams
): Promise<GetInsightsResponse> => {
  const cleanParams: Record<string, any> = {};

  if (params?.page) cleanParams.page = params.page;
  if (params?.limit) cleanParams.limit = params.limit;
  if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
  if (params?.status && params.status !== "all") cleanParams.status = params.status;
  if (params?.category_id && params.category_id !== "all") cleanParams.category_id = params.category_id;

  const response = await API.get<GetInsightsResponse>("/admin/insights", {
    params: cleanParams,
  });
  return response.data;
};

export const getAdminInsightById = async (
  id: string
): Promise<GetInsightDetailResponse> => {
  const response = await API.get<GetInsightDetailResponse>(`/admin/insights/${id}`);
  return response.data;
};

export const createAdminInsight = async (
  data: FormData | CreateInsightPayload
): Promise<CreateInsightResponse> => {
  let body: FormData;

  if (data instanceof FormData) {
    body = data;
  } else {
    body = new FormData();
    body.append("title", data.title);
    body.append("description", data.description);
    body.append("category_id", data.category_id);
    if (data.status) body.append("status", data.status);

    if (data.thumbnail instanceof File) {
      body.append("thumbnail", data.thumbnail);
    }
    if (data.video instanceof File) {
      body.append("video", data.video);
    }
    if (data.external_link && data.external_link.trim()) {
      body.append("external_link", data.external_link.trim());
    }
  }

  const response = await API.post<CreateInsightResponse>("/admin/insights", body, { timeout: 0 });
  return response.data;
};

export const updateAdminInsight = async (
  id: string,
  data: FormData | UpdateInsightPayload
): Promise<UpdateInsightResponse> => {
  let body: FormData;

  if (data instanceof FormData) {
    body = data;
  } else {
    body = new FormData();
    if (data.title !== undefined) body.append("title", data.title);
    if (data.description !== undefined) body.append("description", data.description);
    if (data.category_id !== undefined) body.append("category_id", data.category_id);
    if (data.status !== undefined) body.append("status", data.status);

    if (data.thumbnail instanceof File) {
      body.append("thumbnail", data.thumbnail);
    }
    if (data.video instanceof File) {
      body.append("video", data.video);
    }
    if (data.external_link !== undefined) {
      body.append("external_link", data.external_link || "");
    }
  }

  const response = await API.patch<UpdateInsightResponse>(`/admin/insights/${id}`, body);
  return response.data;
};

export const deleteAdminInsight = async (
  id: string
): Promise<DeleteInsightResponse> => {
  const response = await API.delete<DeleteInsightResponse>(`/admin/insights/${id}`);
  return response.data;
};
