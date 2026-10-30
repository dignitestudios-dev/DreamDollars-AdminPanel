import { API } from "./axios";

export type FaqStatus = "active" | "inactive";

export interface AdminFaq {
  id: string;
  question: string;
  answer: string;
  status?: FaqStatus | string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqsPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface GetFaqsResponse {
  success: boolean;
  message: string;
  data: AdminFaq[];
  pagination: FaqsPagination;
}

export interface GetFaqsParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: FaqStatus | "all" | string;
}

export interface GetFaqByIdResponse {
  success: boolean;
  message: string;
  data: AdminFaq;
}

export interface CreateFaqPayload {
  question: string;
  answer: string;
  status?: FaqStatus;
}

export interface CreateFaqResponse {
  success: boolean;
  message: string;
  data: AdminFaq;
}

export interface UpdateFaqPayload {
  question?: string;
  answer?: string;
  status?: FaqStatus;
}

export interface UpdateFaqResponse {
  success: boolean;
  message: string;
  data: AdminFaq;
}

export interface DeleteFaqResponse {
  success: boolean;
  message: string;
}

/**
 * Fetch all FAQs with pagination and optional search and status filter
 */
export const getAdminFaqs = async (
  params?: GetFaqsParams
): Promise<GetFaqsResponse> => {
  const cleanParams: Record<string, any> = {};

  if (params?.page) {
    cleanParams.page = params.page;
  }
  if (params?.limit) {
    cleanParams.limit = params.limit;
  }
  if (params?.search && params.search.trim()) {
    cleanParams.search = params.search.trim();
  }
  if (params?.status && params.status !== "all") {
    cleanParams.status = params.status;
  }

  const response = await API.get<GetFaqsResponse>("/admin/faqs", {
    params: cleanParams,
  });
  return response.data;
};

/**
 * Fetch single FAQ by ID
 */
export const getAdminFaqById = async (
  id: string
): Promise<GetFaqByIdResponse> => {
  const response = await API.get<GetFaqByIdResponse>(`/admin/faqs/${id}`);
  return response.data;
};

/**
 * Create new FAQ
 */
export const createAdminFaq = async (
  payload: CreateFaqPayload
): Promise<CreateFaqResponse> => {
  const response = await API.post<CreateFaqResponse>("/admin/faqs", payload);
  return response.data;
};

/**
 * Update FAQ by ID
 */
export const updateAdminFaq = async (
  id: string,
  payload: UpdateFaqPayload
): Promise<UpdateFaqResponse> => {
  const response = await API.patch<UpdateFaqResponse>(
    `/admin/faqs/${id}`,
    payload
  );
  return response.data;
};

/**
 * Quick toggle FAQ status (active / inactive)
 */
export const toggleAdminFaqStatus = async (
  id: string,
  status: FaqStatus
): Promise<UpdateFaqResponse> => {
  return updateAdminFaq(id, { status });
};

/**
 * Delete FAQ by ID
 */
export const deleteAdminFaq = async (
  id: string
): Promise<DeleteFaqResponse> => {
  const response = await API.delete<DeleteFaqResponse>(`/admin/faqs/${id}`);
  return response.data;
};
