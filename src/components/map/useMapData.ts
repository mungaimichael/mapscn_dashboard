import { useQuery } from "@tanstack/react-query";
import { MOCK_DRIVERS, MOCK_ARC_HUBS, MOCK_ZENO_HUBS } from "@/data/mockData";

// --- Types ---

export type DriverStatus =
  | "DRIVER_STATUS_ONLINE"
  | "DRIVER_STATUS_OFFLINE"
  | "DRIVER_STATUS_ONTRIP"
  | "DRIVER_STATUS_ENROUTE"
  | "UNASSIGNED";

export type MovingStatus = "MOVING" | "PARKED";

export type BikeMake = "Roam" | "One Electric" | "KINGCHE ARC" | "Roam Air";

export type DriverProperties = {
  driverName: string;
  licensePlate: string;
  phone: string;
  status: DriverStatus;
  movingStatus: MovingStatus;
  BikeMake: BikeMake;
  Battery: number;
  GPSDateTime: string;
  timestamp: string;
  Heading: number;
  VehicleSpeed: number;
  IsIgnitionOn: boolean;
  statusDuration: number;
};

export type HubProperties = {
  name: string;
  full: number;
  total_charging: number;
  total_batteries: number;
  availableswaps: number;
  last_updated: string;
  chargingbin1: number;
  chargingbin2: number;
  chargingbin3: number;
  chargingbin4: number;
};

export type DriverFeature = GeoJSON.Feature<GeoJSON.Point, DriverProperties>;
export type HubFeature = GeoJSON.Feature<GeoJSON.Point, HubProperties>;

export type DriverGeoJSON = GeoJSON.FeatureCollection<GeoJSON.Point, DriverProperties>;
export type HubGeoJSON = GeoJSON.FeatureCollection<GeoJSON.Point, HubProperties>;

// ---------------------------------------------------------------------------
// Mock hooks — swap these for real fetch calls when the backend is ready
// ---------------------------------------------------------------------------

/** Simulates a live polling feed of driver positions (refreshes every 15s) */
export function useDriverData() {
  return useQuery<DriverGeoJSON>({
    queryKey: ["driver-status"],
    queryFn: () => Promise.resolve(MOCK_DRIVERS),
    refetchInterval: 15_000,
    staleTime: 15_000,
  });
}

/** Arc Ride battery swap stations */
export function useArcHubs() {
  return useQuery<HubGeoJSON>({
    queryKey: ["arc-hubs"],
    queryFn: () => Promise.resolve(MOCK_ARC_HUBS),
    staleTime: Infinity,
  });
}

/** Zeno battery swap stations */
export function useZenoHubs() {
  return useQuery<HubGeoJSON>({
    queryKey: ["zeno-hubs"],
    queryFn: () => Promise.resolve(MOCK_ZENO_HUBS),
    staleTime: Infinity,
  });
}

