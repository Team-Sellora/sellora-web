import { env } from "@/config/env";
import type { GoogleMapsNamespace } from "./googleMapsTypes";

let loadPromise: Promise<GoogleMapsNamespace> | null = null;
let authFailureCallbackRegistered = false;
let authFailed = false;
const authFailureListeners = new Set<() => void>();

export function onGoogleMapsAuthFailure(listener: () => void): () => void {
  authFailureListeners.add(listener);
  if (authFailed) {
    listener();
  }
  return () => {
    authFailureListeners.delete(listener);
  };
}

export function loadGoogleMaps(apiKey?: string, timeoutMs = 10_000): Promise<GoogleMapsNamespace> {
  const key = apiKey ?? env.googleMapsApiKey;

  if (!key) {
    return Promise.reject(new Error("Google Maps API key is missing."));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available."));
  }

  if (authFailed) {
    return Promise.reject(new Error("Google Maps authentication failed (gm_authFailure)."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<GoogleMapsNamespace>((resolve, reject) => {
    // DECISION 2: Wire gm_authFailure to catch invalid or referrer-blocked keys
    if (!authFailureCallbackRegistered) {
      authFailureCallbackRegistered = true;
      const prevAuthFailure = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
      (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
        authFailed = true;
        loadPromise = null;
        if (typeof prevAuthFailure === "function") {
          prevAuthFailure();
        }
        for (const listener of authFailureListeners) {
          listener();
        }
        reject(new Error("Google Maps authentication failed (gm_authFailure)."));
      };
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.async = true;
    script.defer = true;

    const timeoutTimer = setTimeout(() => {
      loadPromise = null;
      script.remove();
      reject(new Error("Google Maps script loading timed out."));
    }, timeoutMs);

    script.onload = () => {
      clearTimeout(timeoutTimer);
      if (authFailed) {
        reject(new Error("Google Maps authentication failed (gm_authFailure)."));
        return;
      }
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        loadPromise = null;
        reject(new Error("Google Maps script loaded but maps object unavailable."));
      }
    };

    script.onerror = () => {
      clearTimeout(timeoutTimer);
      loadPromise = null;
      script.remove();
      reject(new Error("Failed to load Google Maps script."));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function __resetGoogleMapsLoaderForTesting(): void {
  loadPromise = null;
  authFailureCallbackRegistered = false;
  authFailed = false;
  authFailureListeners.clear();
  delete (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
}
