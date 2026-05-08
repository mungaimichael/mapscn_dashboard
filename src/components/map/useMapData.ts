import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { driverMockData } from "@/data/drivers";
import { swapStationData } from "@/data/swapstations";

export type DriverStatus =
  | "DRIVER_STATUS_ONLINE"
  | "DRIVER_STATUS_OFFLINE"
  | "DRIVER_STATUS_ONTRIP"
  | "DRIVER_STATUS_ENROUTE"
  | "UNASSIGNED";

export type MovingStatus = "MOVING" | "PARKED";

export type BikeMake = "Roam" | "One Electric" | "KINGCHE ARC" | "Roam Air" | "OTHERS" | "Zeno Emara";

export type DriverProperties = {
  driverUuid?: string;
  driverName: string;
  licensePlate: string;
  phone: string;
  status: DriverStatus;
  movingStatus: MovingStatus | null;
  BikeMake: BikeMake;
  Battery: number;
  GPSDateTime: string | null;
  timestamp: string | null;
  Heading: number | null;
  VehicleSpeed: number | null;
  IsIgnitionOn: boolean | null;
  statusDuration: number | null;
};

export type HubProperties = {
  name: string;
  fullbatteriesno?: number;
  availableswaps: number;
  last_updated: string;
  batteries_available?: number;
  // Legacy and visualization fields
  full?: number;
  total_charging?: number;
  total_batteries?: number;
  chargingbin1?: number;
  chargingbin2?: number;
  chargingbin3?: number;
  chargingbin4?: number;
};

export type DriverFeature = GeoJSON.Feature<GeoJSON.Point, DriverProperties>;
export type HubFeature = GeoJSON.Feature<GeoJSON.Point, HubProperties>;

export type DriverGeoJSON = GeoJSON.FeatureCollection<GeoJSON.Point, DriverProperties>;
export type HubGeoJSON = GeoJSON.FeatureCollection<GeoJSON.Point, HubProperties>;

// ── Viewport type for the debounced hook ──────────────────────────────
export type MapViewport = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};

/**
 * Debounced viewport tracker.
 *
 * The raw `onViewportChange` from the Map fires every frame (~60 fps)
 * during pan / zoom. Putting that straight into React state (and especially
 * into a React-Query key) is catastrophic:
 *   - 60 setState calls / second → 60 re-renders / second of the whole tree
 *   - Each new key creates a fresh React-Query cache entry + triggers a fetch
 *
 * This hook stores the latest viewport in a ref (zero re-renders) and only
 * flushes to state once the map has been **idle for `debounceMs`** (default 300ms).
 * It then invalidates the specified query keys so data is refreshed for the
 * new viewport.
 */
export function useMapViewport(debounceMs = 300) {
  const queryClient = useQueryClient();
  const latestRef = useRef<MapViewport | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settled, setSettled] = useState(0); // bumped when the map settles

  const handleViewportChange = useCallback(
    (vp: MapViewport) => {
      // Store in ref – NO state update, NO re-render
      latestRef.current = vp;

      // Reset the idle timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Map has been idle for `debounceMs` → flush
        setSettled((n) => n + 1);
      }, debounceMs);
    },
    [debounceMs],
  );

  // When the map settles, invalidate all map data queries so they refetch
  useEffect(() => {
    if (settled === 0) return; // skip initial mount
    queryClient.invalidateQueries({ queryKey: ["driver-status"] });
    queryClient.invalidateQueries({ queryKey: ["arc-hubs"] });
    queryClient.invalidateQueries({ queryKey: ["zeno-hubs"] });
  }, [settled, queryClient]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { handleViewportChange };
}

// ── Data hooks ────────────────────────────────────────────────────────

/** Live polling feed of driver positions (refreshes every 2 s) */
export function useDriverData() {
  return useQuery<DriverGeoJSON>({
    queryKey: ["driver-status"],
    queryFn: () => Promise.resolve(driverMockData as unknown as DriverGeoJSON),
    refetchInterval: 2_000,
    staleTime: 2_000,
  });
}

/** Swap stations (refreshes only on viewport change via invalidation) */
export function useArcHubs() {
  return useQuery<HubGeoJSON>({
    queryKey: ["arc-hubs"],
    queryFn: () => Promise.resolve(swapStationData as unknown as HubGeoJSON),
    staleTime: 30_000,
  });
}

/** Swap stations (refreshes only on viewport change via invalidation) */
export function useZenoHubs() {
  return useQuery<HubGeoJSON>({
    queryKey: ["zeno-hubs"],
    queryFn: () => Promise.resolve(swapStationData as unknown as HubGeoJSON),
    staleTime: 30_000,
  });
}

