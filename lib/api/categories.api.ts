import { API } from "./axios";

export type CategoryType = "expense" | "income" | "asset" | "insight";

export interface AdminCategory {
  id: string;
  name: string;
  type: CategoryType | string;
  color_code: string;
  icon?: string | null;
  owned_by?: string;
  user_id?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  inUse?: boolean;
  in_use?: boolean;
  [key: string]: any;
}

export interface CategoriesPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface GetCategoriesResponse {
  success: boolean;
  message: string;
  data: AdminCategory[];
  pagination: CategoriesPagination;
}

export interface GetCategoriesParams {
  type?: CategoryType | "all" | string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateCategoryPayload {
  name: string;
  type: CategoryType;
  color_code: string;
  icon?: string;
}

export interface CreateCategoryResponse {
  success: boolean;
  message: string;
  data: AdminCategory;
}

export interface UpdateCategoryPayload {
  name?: string;
  type?: CategoryType;
  color_code?: string;
  icon?: string;
}

export interface UpdateCategoryResponse {
  success: boolean;
  message: string;
  data: AdminCategory;
}

export interface DeleteCategoryResponse {
  success: boolean;
  message: string;
}

export interface AdminCategoryStats {
  total: number;
  byType: {
    expense?: number;
    income?: number;
    asset?: number;
    insight?: number;
    [key: string]: number | undefined;
  };
  types?: {
    type: string;
    count: number;
  }[];
}

export interface GetCategoryStatsResponse {
  success: boolean;
  message: string;
  data: AdminCategoryStats;
}

export const getAdminCategories = async (
  params?: GetCategoriesParams
): Promise<GetCategoriesResponse> => {
  const cleanParams: Record<string, any> = {};

  if (params?.type && params.type !== "all") {
    cleanParams.type = params.type;
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

  const response = await API.get<GetCategoriesResponse>("/admin/categories", {
    params: cleanParams,
  });
  return response.data;
};

export const getAdminCategoryStats = async (): Promise<GetCategoryStatsResponse> => {
  const response = await API.get<GetCategoryStatsResponse>("/admin/categories/stats");
  return response.data;
};

export const createAdminCategory = async (
  payload: CreateCategoryPayload
): Promise<CreateCategoryResponse> => {
  const response = await API.post<CreateCategoryResponse>(
    "/admin/categories",
    payload
  );
  return response.data;
};

export const updateAdminCategory = async (
  id: string,
  payload: UpdateCategoryPayload
): Promise<UpdateCategoryResponse> => {
  const response = await API.patch<UpdateCategoryResponse>(
    `/admin/categories/${id}`,
    payload
  );
  return response.data;
};

export const deleteAdminCategory = async (
  id: string
): Promise<DeleteCategoryResponse> => {
  const response = await API.delete<DeleteCategoryResponse>(
    `/admin/categories/${id}`
  );
  return response.data;
};
