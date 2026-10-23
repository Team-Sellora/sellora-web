import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { env } from "@/config/env";
import { loadGoogleMaps, onGoogleMapsAuthFailure } from "@/lib/loadGoogleMaps";
import type { GoogleMap, GoogleMarker, GoogleMapsNamespace } from "@/lib/googleMapsTypes";
import type { DeliveryDetail, DeliveryPosition } from "../types";
import { isLiveTrackingViewer } from "../trackingAccess";
import { useDeliveryLocation } from "../hooks";
import { MapErrorBoundary } from "./MapErrorBoundary";

export interface DeliveryLiveTrackingProps {
  delivery: DeliveryDetail;
}

export function LiveTrackingFallback({
  capturedAt,
}: Readonly<{
  capturedAt?: string | null | undefined;
}>) {
  return (
    <div
      role="region"
      aria-label="Live tracking fallback"
      className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/40 p-6 text-center text-sm"
    >
      <p className="font-medium text-foreground">Map unavailable</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {capturedAt ? `Last updated: ${format(new Date(capturedAt), "PPp")}` : "No position yet"}
      </p>
    </div>
  );
}

interface MapViewProps {
  position: DeliveryPosition;
  shop: { latitude: number; longitude: number } | null;
  maps: GoogleMapsNamespace;
}

function MapView({ position, shop, maps }: Readonly<MapViewProps>) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const deliveryMarkerRef = useRef<GoogleMarker | null>(null);
  const shopMarkerRef = useRef<GoogleMarker | null>(null);
  const hasFittedBoundsRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // DECISION 3: The map is created once; polling only moves markers
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new maps.Map(mapContainerRef.current, {
        center: { lat: position.latitude, lng: position.longitude },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    const map = mapInstanceRef.current;

    // Delivery marker (updated on each poll)
    if (!deliveryMarkerRef.current) {
      deliveryMarkerRef.current = new maps.Marker({
        position: { lat: position.latitude, lng: position.longitude },
        map,
        title: "Delivery location",
      });
    } else {
      deliveryMarkerRef.current.setPosition({ lat: position.latitude, lng: position.longitude });
    }

    // Shop marker (created once if coordinates stored)
    if (shop && !shopMarkerRef.current) {
      shopMarkerRef.current = new maps.Marker({
        position: { lat: shop.latitude, lng: shop.longitude },
        map,
        title: "Shop location",
      });
    }

    // Fit bounds once on initial render so manual user panning/zooming is not fought
    if (!hasFittedBoundsRef.current) {
      const bounds = new maps.LatLngBounds();
      bounds.extend({ lat: position.latitude, lng: position.longitude });
      if (shop) {
        bounds.extend({ lat: shop.latitude, lng: shop.longitude });
        map.fitBounds(bounds, 40);
      } else {
        map.setCenter({ lat: position.latitude, lng: position.longitude });
        map.setZoom(15);
      }
      hasFittedBoundsRef.current = true;
    }
  }, [maps, position.latitude, position.longitude, shop]);

  return (
    <div>
      <div
        ref={mapContainerRef}
        data-testid="google-map-container"
        className="h-64 w-full rounded-md border border-border"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Last updated: {format(new Date(position.capturedAt), "PPp")}
      </p>
    </div>
  );
}

export function DeliveryLiveTracking({ delivery }: Readonly<DeliveryLiveTrackingProps>) {
  const { role } = useSelloraAuth();
  const isViewer = isLiveTrackingViewer(role);
  const isInTransit = delivery.status === "InTransit";

  const { data, isLoading, isError } = useDeliveryLocation(delivery.id, {
    enabled: isViewer && isInTransit,
  });

  const [mapsApi, setMapsApi] = useState<GoogleMapsNamespace | null>(null);
  const [mapScriptError, setMapScriptError] = useState(false);

  useEffect(() => {
    if (!isViewer || !isInTransit) return;

    if (!env.googleMapsApiKey) {
      setMapScriptError(true);
      return;
    }

    const unsubscribeAuthFailure = onGoogleMapsAuthFailure(() => {
      setMapScriptError(true);
    });

    loadGoogleMaps()
      .then((maps) => {
        setMapsApi(maps);
      })
      .catch(() => {
        setMapScriptError(true);
      });

    return () => {
      unsubscribeAuthFailure();
    };
  }, [isViewer, isInTransit]);

  if (!isViewer || !isInTransit) {
    return null;
  }

  const fallback = <LiveTrackingFallback capturedAt={data?.position?.capturedAt} />;

  return (
    <div className="mt-6">
      <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Live tracking
      </h4>

      {isLoading && (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Loading tracking update...
        </div>
      )}

      {isError && (
        <p className="py-2 text-xs text-muted-foreground">Couldn't load tracking update.</p>
      )}

      {!isLoading && !isError && (
        <MapErrorBoundary fallback={fallback}>
          {mapScriptError || !mapsApi || !data?.position ? (
            fallback
          ) : (
            <MapView position={data.position} shop={data.shop} maps={mapsApi} />
          )}
        </MapErrorBoundary>
      )}
    </div>
  );
}
