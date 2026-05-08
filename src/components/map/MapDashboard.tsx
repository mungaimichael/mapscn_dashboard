import { useState, useCallback, useReducer, useRef } from "react";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { Map, MapControls } from "@/components/ui/map";
import type { MapRef } from "@/components/ui/map";
import { DriverClusters } from "./DriverClusters";
import { HubsLayer } from "./HubsLayer";
import { DriverSidebar } from "./sidebar/DriverSidebar";
import { useDriverData, useArcHubs, useZenoHubs, useMapViewport } from "./useMapData";
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
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const { theme } = useTheme();

  // Debounced viewport tracker — invalidates queries only after map is idle for 300ms
  const { handleViewportChange } = useMapViewport(300);

  // All three fetches fire concurrently via React Query
  const { data: driverData } = useDriverData();
  const { data: arcHubs } = useArcHubs();
  const { data: zenoHubs } = useZenoHubs();

  // Fly to driver on sidebar click
  const handleDriverSelect = useCallback(
    (id: string, coords: [number, number]) => {
      setSelectedDriverId((prev) => {
        const isNewSelection = prev !== id;
        
        // Only fly if we are selecting a new driver and coordinates are valid
        if (isNewSelection && coords && coords[0] != null && coords[1] != null) {
          mapRef.current?.flyTo({
            center: coords,
            zoom: 15,
            duration: 1200,
            essential: true,
          });
          
          // On mobile, close sidebar when a driver is selected to show the map
          if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }

        return isNewSelection ? id : null;
      });
    },
    []
  );

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* ── Mobile Overlay ── */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <DriverSidebar
        data={driverData}
        selectedId={selectedDriverId}
        onSelect={handleDriverSelect}
        filters={filters}
        dispatch={dispatch}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* ── Desktop Divider ── */}
      <div className="hidden lg:block w-px bg-black/10 dark:bg-white/[0.06] shrink-0" />

      {/* ── Map Content ── */}
      <div className="relative flex-1 overflow-hidden">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={cn(
            "lg:hidden absolute top-4 left-4 z-30 size-10 rounded-full",
            "bg-background border border-border shadow-lg flex items-center justify-center",
            "text-foreground/70 hover:text-foreground transition-transform active:scale-95"
          )}
        >
          <Users className="size-5" />
        </button>

        <Map
          ref={mapRef}
          center={INITIAL_CENTER}
          zoom={INITIAL_ZOOM}
          theme={theme}
          dragRotate={true}
          touchZoomRotate={true}
          onViewportChange={handleViewportChange}
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
