import { useState, useCallback, useReducer, useRef } from "react";
import { Map, MapControls } from "@/components/ui/map";
import type { MapRef } from "@/components/ui/map";
import { DriverClusters } from "./DriverClusters";
import { HubsLayer } from "./HubsLayer";
import { DriverSidebar } from "./sidebar/DriverSidebar";
import { useDriverData, useArcHubs, useZenoHubs } from "./useMapData";
import { useTheme } from "@/hooks/useTheme";
import type { FilterState } from "./DriverClusters";
import type { DriverStatus, MovingStatus } from "./useMapData";

// Nairobi center
const INITIAL_CENTER: [number, number] = [36.82598, -1.29901];
const INITIAL_ZOOM = 10.5;

const DEFAULT_FILTERS: FilterState = {
  statuses: [
    "DRIVER_STATUS_ONLINE",
    "DRIVER_STATUS_OFFLINE",
    "DRIVER_STATUS_ONTRIP",
    "DRIVER_STATUS_ENROUTE",
    "UNASSIGNED",
  ],
  movingStatuses: ["MOVING", "PARKED"],
  bikeMakes: ["Roam", "One Electric", "KINGCHE ARC", "Roam Air"],
  showArcHubs: true,
  showZenoHubs: true,
};

export type FilterAction =
  | { type: "TOGGLE_STATUS"; payload: DriverStatus }
  | { type: "TOGGLE_MOVING"; payload: MovingStatus }
  | { type: "TOGGLE_ARC_HUBS" }
  | { type: "TOGGLE_ZENO_HUBS" }
  | { type: "SET_STATUS_FILTER"; status: DriverStatus | null };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "TOGGLE_STATUS": {
      const exists = state.statuses.includes(action.payload);
      return {
        ...state,
        statuses: exists
          ? state.statuses.filter((s) => s !== action.payload)
          : [...state.statuses, action.payload],
      };
    }
    case "TOGGLE_MOVING": {
      const exists = state.movingStatuses.includes(action.payload);
      return {
        ...state,
        movingStatuses: exists
          ? state.movingStatuses.filter((m) => m !== action.payload)
          : [...state.movingStatuses, action.payload],
      };
    }
    case "TOGGLE_ARC_HUBS":
      return { ...state, showArcHubs: !state.showArcHubs };
    case "TOGGLE_ZENO_HUBS":
      return { ...state, showZenoHubs: !state.showZenoHubs };
    case "SET_STATUS_FILTER":
      return {
        ...state,
        statuses: action.status
          ? [action.status]
          : [
              "DRIVER_STATUS_ONLINE",
              "DRIVER_STATUS_OFFLINE",
              "DRIVER_STATUS_ONTRIP",
              "DRIVER_STATUS_ENROUTE",
              "UNASSIGNED",
            ],
      };
    default:
      return state;
  }
}

export function MapDashboard() {
  const [filters, dispatch] = useReducer(filterReducer, DEFAULT_FILTERS);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const mapRef = useRef<MapRef>(null);
  const { theme } = useTheme();

  // All three fetches fire concurrently via React Query
  const { data: driverData } = useDriverData();
  const { data: arcHubs } = useArcHubs();
  const { data: zenoHubs } = useZenoHubs();

  // Fly to driver on sidebar click
  const handleDriverSelect = useCallback(
    (id: number, coords: [number, number]) => {
      setSelectedDriverId((prev) => (prev === id ? null : id));
      mapRef.current?.flyTo({
        center: coords,
        zoom: 15,
        duration: 1200,
        essential: true,
      });
    },
    []
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Left sidebar ── */}
      <DriverSidebar
        data={driverData}
        selectedId={selectedDriverId}
        onSelect={handleDriverSelect}
        filters={filters}
        dispatch={dispatch}
      />

      {/* ── Vertical divider ── */}
      <div className="w-px bg-black/10 dark:bg-white/[0.06] shrink-0" />

      {/* ── Map ── */}
      <div className="relative flex-1 overflow-hidden">
        <Map
          ref={mapRef}
          center={INITIAL_CENTER}
          zoom={INITIAL_ZOOM}
          theme={theme}
          dragRotate={true}
          touchZoomRotate={true}
        >
          <MapControls position="bottom-right" showZoom showCompass showFullscreen />

          <DriverClusters
            data={driverData}
            filters={filters}
            selectedId={selectedDriverId}
          />

          {filters.showArcHubs && <HubsLayer data={arcHubs} label="Arc Hub" />}
          {filters.showZenoHubs && <HubsLayer data={zenoHubs} label="Zeno Hub" />}
        </Map>
      </div>
    </div>
  );
}
