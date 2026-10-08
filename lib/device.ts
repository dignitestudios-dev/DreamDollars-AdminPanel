import FingerprintJS from "@fingerprintjs/fingerprintjs";

let fpPromise: Promise<any> | null = null;
let cachedDeviceId: string | null = null;

/**
 * Detects device model and browser/OS information from userAgent.
 */
export function getDeviceModel(): string {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "Web Admin Panel";
  }

  const ua = navigator.userAgent || "";

  const isMobile = /Mobi|Android/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua);

  // OS detection
  let os = "Unknown OS";
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.2/i.test(ua)) os = "Windows 8";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone/i.test(ua)) os = "iPhone";
  else if (/iPad/i.test(ua)) os = "iPad";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+([\d.]+)/i);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/Linux/i.test(ua)) os = "Linux";

  // Browser detection
  let browser = "Web Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Chromium|Edg|OPR/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome|CriOS|FxiOS|Edg|OPR/i.test(ua)) browser = "Safari";
  else if (/OPR\//i.test(ua) || /Opera\//i.test(ua)) browser = "Opera";

  const deviceType = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";
  return `${browser} (${deviceType} - ${os})`;
}

/**
 * Generates a random UUID fallback if fingerprinting fails.
 */
function generateFallbackId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "dev-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Gets or generates a unique fingerprint device ID.
 * Caches in localStorage for instant access on subsequent requests.
 */
export async function getDeviceId(): Promise<string> {
  if (typeof window === "undefined") {
    return "server-instance";
  }

  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  // Check localStorage first
  const storedId = localStorage.getItem("deviceuniqueid");
  if (storedId) {
    cachedDeviceId = storedId;
    return storedId;
  }

  try {
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }
    const fp = await fpPromise;
    const result = await fp.get();
    if (result && typeof result.visitorId === "string" && result.visitorId) {
      const visitorId = result.visitorId;
      cachedDeviceId = visitorId;
      localStorage.setItem("deviceuniqueid", visitorId);
      return visitorId;
    }
  } catch (error) {
    console.warn("FingerprintJS load error, using fallback ID:", error);
  }

  // Fallback if FingerprintJS fails
  const fallbackId = generateFallbackId();
  cachedDeviceId = fallbackId;
  localStorage.setItem("deviceuniqueid", fallbackId);
  return fallbackId;
}

/**
 * Synchronously retrieves the cached or stored device ID if already initialized,
 * otherwise returns null.
 */
export function getStoredDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  return cachedDeviceId || localStorage.getItem("deviceuniqueid");
}
