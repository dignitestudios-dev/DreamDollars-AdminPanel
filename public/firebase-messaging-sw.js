
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDoHckMzXrScOdG-ipd-1NKcSZkRHQM_ew",
  authDomain: "dream-dollars-1eaee.firebaseapp.com",
  projectId: "dream-dollars-1eaee",
  storageBucket: "dream-dollars-1eaee.firebasestorage.app",
  messagingSenderId: "1093351334049",
  appId: "1:1093351334049:web:e5b2f44f57dd708c1d90e0",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[FCM] Background payload received:", payload);

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "Dream Dollars Admin";

  const options = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "You have a new notification.",
    icon: payload.notification?.icon || payload.data?.icon || "/images/logo.png",
    badge: "/favicon.ico",
    data: payload.data || {},
  };

  return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow("/")
  );
});
