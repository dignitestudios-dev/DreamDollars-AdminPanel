import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { app } from "./config";

let messagingInstance: Messaging | null = null;

/**
 * Get the Firebase Messaging instance if supported in the current environment
 */
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn("[FCM] Firebase Cloud Messaging is not supported in this browser environment.");
    return null;
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }

  return messagingInstance;
};

/**
 * Synchronously retrieves stored FCM registration token from localStorage if available
 */
export const getStoredFcmToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("fcmToken");
};

/**
 * Request notification permission from the user and retrieve the FCM device registration token
 * @param vapidKey Optional Web Push VAPID certificate key
 * @param forceRefresh Force retrieving a new token from Firebase even if cached
 * @returns FCM registration token string or null if permission was denied or not supported
 */

export const requestFcmToken = async (
  vapidKey?: string,
  forceRefresh: boolean = false
): Promise<string | null> => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window)
  ) {
    return null;
  }

  // Return cached token only when forceRefresh is false
  if (!forceRefresh) {
    const cached = localStorage.getItem("fcmToken");
    if (cached) {
      return cached;
    }
  }

  try {
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.warn("[FCM] Notification permission denied");
        return null;
      }
    }

    const messaging = await getFirebaseMessaging();

    if (!messaging) {
      console.warn("[FCM] Messaging is not supported");
      return null;
    }

    const serviceWorkerRegistration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    const resolvedVapidKey =
      vapidKey ||
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!resolvedVapidKey) {
      throw new Error("Firebase VAPID key is missing");
    }

    const token = await getToken(messaging, {
      vapidKey: resolvedVapidKey,
      serviceWorkerRegistration,
    });

    if (!token) {
      console.warn("[FCM] No registration token returned");
      return null;
    }

    console.log("[FCM] Current token:", token);
    localStorage.setItem("fcmToken", token);

    return token;
  } catch (error) {
    console.error("[FCM] Token retrieval failed:", error);
    return null;
  }
};


/**
 * Listen for push notification messages arriving while the app is in the foreground
 * @param callback Callback executed when a push message is received
 * @returns Unsubscribe function
 */
export const onForegroundMessage = async (
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return null;
  }

  return onMessage(messaging, (payload) => {
    console.log("[FCM] Incoming foreground message:", payload);
    callback(payload);
  });
};
