import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { DriverStatus, MovingStatus, DriverFeature } from "@/components/map/useMapData";

export type BikeMakeFilter = "Roam" | "One Electric" | "KINGCHE ARC" | "Roam Air" | "OTHERS" | "Zeno Emara";
export type BatteryRange = "critical" | "low" | "good";
export type TimestampRange = "recent" | "today" | "this_week" | "older";

const toggle = <T>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

export const toBatteryRange = (pct: number): BatteryRange =>
  pct >= 60 ? "good" : pct >= 30 ? "low" : "critical";

export const toTimestampRange = (dateStr: string | null): TimestampRange => {
  if (!dateStr) return "older";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return "older";
  if (diff <= 3_600_000) return "recent";
  if (diff <= 86_400_000) return "today";
  if (diff <= 604_800_000) return "this_week";
  return "older";
};

export type ActiveFilters = {
  statuses: DriverStatus[];
  movingStatuses: MovingStatus[];
  bikeMakes: BikeMakeFilter[];
  batteryRanges: BatteryRange[];
  uberTimestampRanges: TimestampRange[];
  gpsTimestampRanges: TimestampRange[];
};

export function filterDriverFeatures(
  features: DriverFeature[],
  filters: ActiveFilters,
): DriverFeature[] {
  const statusSet = new Set(filters.statuses);
  const movingSet = new Set(filters.movingStatuses);
  const bikeSet = new Set(filters.bikeMakes);
  const batterySet = new Set(filters.batteryRanges);
  const uberTsSet = new Set(filters.uberTimestampRanges);
  const gpsTsSet = new Set(filters.gpsTimestampRanges);

  return features.filter((f) => {
    const p = f.properties;

    // Drop features with no identity — everything else is optional telemetry
    if (!p.driverName || !p.licensePlate) return false;

    // Uber status is always present — always apply this filter
    if (!statusSet.has(p.status)) return false;

    // Optional telemetry: skip the check when the value is absent
    if (p.movingStatus != null && !movingSet.has(p.movingStatus)) return false;
    if (p.BikeMake != null && !bikeSet.has(p.BikeMake as BikeMakeFilter)) return false;

    // Battery: 0 signals no telemetry data (offline bikes) — skip if absent or zero
    if (p.Battery != null && p.Battery > 0 && !batterySet.has(toBatteryRange(p.Battery))) return false;

    // Uber timestamp: skip if field is absent
    if (p.timestamp != null && !uberTsSet.has(toTimestampRange(p.timestamp))) return false;

    // GPS timestamp: many offline bikes have no GPSDateTime — skip if absent
    if (p.GPSDateTime != null && !gpsTsSet.has(toTimestampRange(p.GPSDateTime))) return false;

    return true;
  });
}

export interface FilterState {
  statuses: DriverStatus[];
  movingStatuses: MovingStatus[];
  bikeMakes: BikeMakeFilter[];
  batteryRanges: BatteryRange[];
  uberTimestampRanges: TimestampRange[];
  gpsTimestampRanges: TimestampRange[];
  showArcHubs: boolean;
  showZenoHubs: boolean;

  toggleStatus: (s: DriverStatus) => void;
  toggleMoving: (m: MovingStatus) => void;
  toggleBikeMake: (m: BikeMakeFilter) => void;
  toggleBatteryRange: (r: BatteryRange) => void;
  toggleUberTimestamp: (r: TimestampRange) => void;
  toggleGpsTimestamp: (r: TimestampRange) => void;
  toggleArcHubs: () => void;
  toggleZenoHubs: () => void;
  setStatusFilter: (s: DriverStatus | null) => void;
  clearStatuses: () => void;
  clearMovingStatuses: () => void;
  clearBikeMakes: () => void;
  clearBatteryRanges: () => void;
  clearUberTimestamps: () => void;
  clearGpsTimestamps: () => void;
}

const DEFAULT_STATUSES: DriverStatus[] = [
  "DRIVER_STATUS_ONLINE",
  "DRIVER_STATUS_OFFLINE",
  "DRIVER_STATUS_ONTRIP",
  "DRIVER_STATUS_ENROUTE",
  "UNASSIGNED",
];

const DEFAULT_MOVING: MovingStatus[] = ["MOVING", "PARKED"];

const DEFAULT_BIKE_MAKES: BikeMakeFilter[] = [
  "Roam",
  "One Electric",
  "KINGCHE ARC",
  "Roam Air",
  "OTHERS",
  "Zeno Emara",
];

const DEFAULT_BATTERY_RANGES: BatteryRange[] = ["critical", "low", "good"];
const DEFAULT_TIMESTAMP_RANGES: TimestampRange[] = ["recent", "today", "this_week", "older"];

export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set) => ({
        statuses: DEFAULT_STATUSES,
        movingStatuses: DEFAULT_MOVING,
        bikeMakes: DEFAULT_BIKE_MAKES,
        batteryRanges: DEFAULT_BATTERY_RANGES,
        uberTimestampRanges: DEFAULT_TIMESTAMP_RANGES,
        gpsTimestampRanges: DEFAULT_TIMESTAMP_RANGES,
        showArcHubs: true,
        showZenoHubs: true,

        toggleStatus: (s) =>
          set((state) => ({ statuses: toggle(state.statuses, s) }), false, "toggleStatus"),

        toggleMoving: (m) =>
          set((state) => ({ movingStatuses: toggle(state.movingStatuses, m) }), false, "toggleMoving"),

        toggleBikeMake: (m) =>
          set((state) => ({ bikeMakes: toggle(state.bikeMakes, m) }), false, "toggleBikeMake"),

        toggleBatteryRange: (r) =>
          set((state) => ({ batteryRanges: toggle(state.batteryRanges, r) }), false, "toggleBatteryRange"),

        toggleUberTimestamp: (r) =>
          set((state) => ({ uberTimestampRanges: toggle(state.uberTimestampRanges, r) }), false, "toggleUberTimestamp"),

        toggleGpsTimestamp: (r) =>
          set((state) => ({ gpsTimestampRanges: toggle(state.gpsTimestampRanges, r) }), false, "toggleGpsTimestamp"),

        toggleArcHubs: () =>
          set((s) => ({ showArcHubs: !s.showArcHubs }), false, "toggleArcHubs"),

        toggleZenoHubs: () =>
          set((s) => ({ showZenoHubs: !s.showZenoHubs }), false, "toggleZenoHubs"),

        setStatusFilter: (status) =>
          set({ statuses: status ? [status] : DEFAULT_STATUSES }, false, "setStatusFilter"),

        clearStatuses: () => set({ statuses: DEFAULT_STATUSES }, false, "clearStatuses"),
        clearMovingStatuses: () => set({ movingStatuses: DEFAULT_MOVING }, false, "clearMovingStatuses"),
        clearBikeMakes: () => set({ bikeMakes: DEFAULT_BIKE_MAKES }, false, "clearBikeMakes"),
        clearBatteryRanges: () => set({ batteryRanges: DEFAULT_BATTERY_RANGES }, false, "clearBatteryRanges"),
        clearUberTimestamps: () => set({ uberTimestampRanges: DEFAULT_TIMESTAMP_RANGES }, false, "clearUberTimestamps"),
        clearGpsTimestamps: () => set({ gpsTimestampRanges: DEFAULT_TIMESTAMP_RANGES }, false, "clearGpsTimestamps"),
      }),
      {
        name: "map-filters",
        partialize: (state) => ({
          statuses: state.statuses,
          movingStatuses: state.movingStatuses,
          bikeMakes: state.bikeMakes,
          batteryRanges: state.batteryRanges,
          uberTimestampRanges: state.uberTimestampRanges,
          gpsTimestampRanges: state.gpsTimestampRanges,
          showArcHubs: state.showArcHubs,
          showZenoHubs: state.showZenoHubs,
        }),
      },
    ),
    { name: "Filters" },
  ),
);
