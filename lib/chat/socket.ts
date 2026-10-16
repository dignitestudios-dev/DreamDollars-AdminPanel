import { io, Socket } from "socket.io-client";
import { baseURL } from "@/lib/api/axios";

let socketInstance: Socket | null = null;

export const getChatSocket = (): Socket | null => {
  if (typeof window === "undefined") {
    // In SSR, return null
    return null;
  }

  const token = localStorage.getItem("authToken");

  if (!token) {
    if (socketInstance) {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketInstance = null;
    }
    return null;
  }

  const formattedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  // If token has changed on an existing socket, reconnect with new token
  const authRecord = socketInstance?.auth as Record<string, unknown> | undefined;
  if (socketInstance && authRecord?.token !== formattedToken) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }

  if (!socketInstance || socketInstance.disconnected) {
    socketInstance = io(baseURL, {
      auth: {
        token: formattedToken,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      console.log("[ChatSocket] Connected to Admin Chat Socket:", socketInstance?.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[ChatSocket] Connection error:", err.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[ChatSocket] Disconnected:", reason);
    });
  }

  return socketInstance;
};

export const disconnectChatSocket = () => {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
};
