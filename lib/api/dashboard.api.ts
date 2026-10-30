import { API } from "./axios";

export interface NewUsersBreakdown {
  today?: number;
  last7Days?: number;
  last30Days?: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  paidUsers: number;
  subscribedUsers: number;
  newUsers: number | NewUsersBreakdown;
  unreadChats: number;
  unreadMessages: number;
  [key: string]: any;
}

export interface DashboardStatsResponse {
  success?: boolean;
  message?: string;
  data: DashboardStats;
  [key: string]: any;
}

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await API.get<DashboardStatsResponse>(
    "/admin/dashboard/stats",
    {
      headers: {
        accept: "application/json",
      },
    }
  );
  return response.data;
};

// User Growth API
export interface UserGrowthPoint {
  period?: string;
  label: string;
  month?: number;
  year?: number;
  newUsers: number;
  totalUsers: number;
  count?: number;
}

export interface UserGrowthSummary {
  totalNewUsersInRange?: number;
  totalUsersAtEnd?: number;
}

export interface UserGrowthRange {
  startDate?: string;
  endDate?: string;
}

export interface UserGrowthData {
  filterType?: "monthly" | "yearly" | "range";
  granularity?: "daily" | "weekly" | "monthly" | "yearly";
  range?: UserGrowthRange;
  summary?: UserGrowthSummary;
  chart: UserGrowthPoint[];
}

export interface UserGrowthResponse {
  success?: boolean;
  message?: string;
  data?: UserGrowthData | UserGrowthPoint[] | any;
  chart?: UserGrowthPoint[];
  summary?: UserGrowthSummary;
  [key: string]: any;
}

export interface UserGrowthParams {
  filterType?: "monthly" | "yearly" | "range";
  granularity?: "daily" | "weekly" | "monthly" | "yearly";
  year?: number | string;
  startDate?: string;
  endDate?: string;
}

export const getUserGrowth = async (
  params?: UserGrowthParams
): Promise<UserGrowthResponse> => {
  const response = await API.get<UserGrowthResponse>(
    "/admin/dashboard/user-growth",
    {
      params,
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};