export interface DevicePosition {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
}

/**
 * One fresh, high-accuracy fix. `maximumAge: 0` refuses a cached position,
 * because the whole point is proving where the rep is now.
 */
export function getDevicePosition(timeoutMs = 15_000): Promise<DevicePosition> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      reject(new Error("Location needs a secure (HTTPS) page. Open Sellora over https."));
      return;
    }

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("This device or browser cannot share its location."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        }),
      (error) => reject(new Error(describeGeolocationError(error.code))),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

export function describeGeolocationError(code: number): string {
  switch (code) {
    case 1:
      return "Location permission was denied. Allow location for this site and try again.";
    case 2:
      return "Your location is unavailable right now. Move outdoors or turn on GPS and try again.";
    case 3:
      return "Getting your location took too long. Try again.";
    default:
      return "Your location could not be read.";
  }
}
