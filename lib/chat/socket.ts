import { io, Socket } from "socket.io-client";
import { baseURL } from "@/lib/api/axios";

let socketInstance: Socket | null = null;

export const getChatSocket = (): Socket => {
  if (typeof window === "undefined") {
    // In SSR, return dummy object or null
    return null as unknown as Socket;
  }

  const token = localStorage.getItem("authToken");

  if (!socketInstance || socketInstance.disconnected) {
    socketInstance = io(baseURL, {
      auth: {
        token: token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "",
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
    socketInstance.disconnect();
    socketInstance = null;
  }
};
