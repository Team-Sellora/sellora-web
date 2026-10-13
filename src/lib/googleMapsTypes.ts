export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface MapOptions {
  center?: LatLngLiteral;
  zoom?: number;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
}

export interface MarkerOptions {
  position: LatLngLiteral;
  map?: GoogleMap | null;
  title?: string;
  label?: string | { text: string; color?: string; fontWeight?: string };
  icon?: string | { url: string; scaledSize?: { width: number; height: number } };
}

export interface GoogleMarker {
  setPosition(latLng: LatLngLiteral): void;
  setMap(map: GoogleMap | null): void;
  getPosition(): { lat(): number; lng(): number } | null | undefined;
}

export interface GoogleLatLngBounds {
  extend(point: LatLngLiteral): GoogleLatLngBounds;
  isEmpty(): boolean;
  getCenter(): { lat(): number; lng(): number };
}

export interface GoogleMap {
  setCenter(latLng: LatLngLiteral): void;
  setZoom(zoom: number): void;
  fitBounds(
    bounds: GoogleLatLngBounds,
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number },
  ): void;
}

export interface GoogleMapsNamespace {
  Map: new (element: HTMLElement, options?: MapOptions) => GoogleMap;
  Marker: new (options?: MarkerOptions) => GoogleMarker;
  LatLngBounds: new () => GoogleLatLngBounds;
}

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsNamespace;
    };
    gm_authFailure?: () => void;
  }
}
