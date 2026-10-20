import { API } from "./axios";

export interface ChatAttachment {
  url: string;
  key?: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  type: "text" | "media";
  text?: string;
  attachments?: ChatAttachment[];
  is_deleted?: boolean;
  tempId?: string;
  created_at: string;
  isOptimistic?: boolean;
  hasError?: boolean;
}

export type ChatUserStatus = "deleted" | "active" | "inactive";

export interface ChatRoom {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  user_avatar_emoji: string | null;
  user_status?: ChatUserStatus | string;
  last_message_text: string | null;
  last_message_sender_type: "user" | "admin" | null;
  last_message_sent_at: string | null;
  user_unread_count: number;
  admin_unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface GetAdminRoomsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetRoomsResult {
  success: boolean;
  rooms: ChatRoom[];
  pagination?: ChatPagination;
}

export interface GetMessagesResult {
  success: boolean;
  room?: {
    id?: string;
    user_id?: string;
    admin_unread_count?: number;
    user_name?: string;
    user_email?: string;
    user_status?: ChatUserStatus | string;
  };
  messages: ChatMessage[];
  pagination?: ChatPagination;
}

export interface ClearChatResponse {
  success: boolean;
  message: string;
  data?: {
    message?: string;
    roomId?: string;
  };
}


/**
 * Fetch all conversations for admin sidebar (robust to both array and object response)
 */
export const getAdminChatRooms = async (
  params?: GetAdminRoomsParams
): Promise<GetRoomsResult> => {
  const cleanParams: Record<string, any> = {
    page: params?.page || 1,
    limit: params?.limit || 20,
  };
  if (params?.search && params.search.trim()) {
    cleanParams.search = params.search.trim();
  }

  const response = await API.get<any>("/chat/admin/rooms", {
    params: cleanParams,
  });

  const raw = response.data;
  let roomsList: ChatRoom[] = [];
  let paginationData: ChatPagination | undefined = undefined;

  if (Array.isArray(raw)) {
    roomsList = raw;
  } else if (raw && Array.isArray(raw.data)) {
    roomsList = raw.data;
    paginationData = raw.pagination;
  } else if (raw && raw.data && Array.isArray(raw.data.rooms)) {
    roomsList = raw.data.rooms;
    paginationData = raw.data.pagination || raw.pagination;
  } else if (raw && Array.isArray(raw.rooms)) {
    roomsList = raw.rooms;
    paginationData = raw.pagination;
  }

  // Ensure user_status is properly extracted and normalized on each room
  roomsList = roomsList.map((room: any) => ({
    ...room,
    user_status: (
      room.user_status ||
      room.userStatus ||
      room.user?.status ||
      room.user?.user_status ||
      room.status ||
      "active"
    )
      .toString()
      .toLowerCase(),
  }));

  return {
    success: true,
    rooms: roomsList,
    pagination: paginationData,
  };
};

/**
 * Fetch messages history for a selected room
 * Supports array direct response `[ {...} ]`, `{ data: [ {...} ] }`, `{ data: { messages: [...] } }`
 */
export const getChatMessages = async (
  roomId: string,
  params?: { page?: number; limit?: number }
): Promise<GetMessagesResult> => {
  const cleanParams = {
    page: params?.page || 1,
    limit: params?.limit || 30,
  };

  const response = await API.get<any>(`/chat/messages/${roomId}`, {
    params: cleanParams,
  });

  const raw = response.data;
  let messagesList: ChatMessage[] = [];
  let roomData = undefined;
  let paginationData: ChatPagination | undefined = undefined;

  if (Array.isArray(raw)) {
    messagesList = raw;
  } else if (raw && Array.isArray(raw.data)) {
    messagesList = raw.data;
    paginationData = raw.pagination;
  } else if (raw && raw.data && Array.isArray(raw.data.messages)) {
    messagesList = raw.data.messages;
    roomData = raw.data.room;
    paginationData = raw.data.pagination || raw.pagination;
  } else if (raw && Array.isArray(raw.messages)) {
    messagesList = raw.messages;
    roomData = raw.room;
    paginationData = raw.pagination;
  }

  // Filter out any messages marked as deleted
  messagesList = messagesList.filter((m) => !m.is_deleted);

  return {
    success: true,
    room: roomData,
    messages: messagesList,
    pagination: paginationData || {
      currentPage: cleanParams.page,
      itemsPerPage: cleanParams.limit,
      totalItems: messagesList.length,
      totalPages:
        messagesList.length >= cleanParams.limit
          ? cleanParams.page + 1
          : cleanParams.page,
    },
  };
};

/**
 * Send message (text, attachments, or both)
 */
export const sendChatMessage = async (
  roomId: string,
  payload: {
    text?: string;
    files?: File[];
    tempId?: string;
  }
): Promise<ChatMessage> => {
  const hasFiles = payload.files && payload.files.length > 0;
  let responseData: any;

  if (hasFiles) {
    const formData = new FormData();
    if (payload.text) {
      formData.append("text", payload.text);
    }
    if (payload.tempId) {
      formData.append("tempId", payload.tempId);
    }
    payload.files?.forEach((file) => {
      formData.append("files", file);
    });

    const response = await API.post<any>(
      `/chat/messages/${roomId}`,
      formData
    );
    responseData = response.data;
  } else {
    // Pure text payload
    const body: { text?: string; tempId?: string } = {};
    if (payload.text) body.text = payload.text;
    if (payload.tempId) body.tempId = payload.tempId;

    const response = await API.post<any>(
      `/chat/messages/${roomId}`,
      body
    );
    responseData = response.data;
  }

  if (responseData && responseData.data && !Array.isArray(responseData.data)) {
    return responseData.data;
  }
  return responseData;
};

/**
 * Clear chat messages for admin view only
 */
export const clearChatRoom = async (
  roomId: string
): Promise<ClearChatResponse> => {
  const response = await API.post<ClearChatResponse>(
    `/chat/rooms/${roomId}/clear`
  );
  return response.data;
};


