import { useCallback, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Users, Box } from "lucide-react";
import { Map, MapControls } from "@/components/ui/map";
import type { MapRef } from "@/components/ui/map";
import { DriverClusters } from "./DriverClusters";
import { HubsLayer } from "./HubsLayer";
import { DriverSidebar } from "./sidebar/DriverSidebar";
import { MapSummaryBox } from "./MapSummaryBox";
import { Map3DBuildings } from "./Map3DBuildings";
import { useDriverData, useArcHubs, useZenoHubs, useMapViewport } from "./useMapData";
import type { DriverGeoJSON } from "./useMapData";
import { useThemeStore, useMapUIStore, useFilterStore, filterDriverFeatures } from "@/store";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const INITIAL_CENTER: [number, number] = [36.82598, -1.29901];
const INITIAL_ZOOM = 10.5;

export function MapDashboard() {
  const mapRef = useRef<MapRef>(null);

  const theme = useThemeStore((s) => s.theme);
  const is3DMode = useMapUIStore((s) => s.is3DMode);
  const toggle3DMode = useMapUIStore((s) => s.toggle3DMode);
  const isSidebarOpen = useMapUIStore((s) => s.isSidebarOpen);
  const openSidebar = useMapUIStore((s) => s.openSidebar);
  const closeSidebar = useMapUIStore((s) => s.closeSidebar);
  const toggleSelectedDriver = useMapUIStore((s) => s.toggleSelectedDriver);
  const showArcHubs = useFilterStore((s) => s.showArcHubs);
  const showZenoHubs = useFilterStore((s) => s.showZenoHubs);
  const statuses = useFilterStore((s) => s.statuses);
  const movingStatuses = useFilterStore((s) => s.movingStatuses);
  const bikeMakes = useFilterStore((s) => s.bikeMakes);
  const batteryRanges = useFilterStore((s) => s.batteryRanges);
  const uberTimestampRanges = useFilterStore((s) => s.uberTimestampRanges);
  const gpsTimestampRanges = useFilterStore((s) => s.gpsTimestampRanges);

  const { handleViewportChange } = useMapViewport(300);

  const { data: driverData, isLoading: isDriversLoading } = useDriverData();

  const filteredDriverData = useMemo<DriverGeoJSON>(() => ({
    type: "FeatureCollection",
    features: filterDriverFeatures(driverData?.features ?? [], {
      statuses,
      movingStatuses,
      bikeMakes,
      batteryRanges,
      uberTimestampRanges,
      gpsTimestampRanges,
    }),
  }), [driverData, statuses, movingStatuses, bikeMakes, batteryRanges, uberTimestampRanges, gpsTimestampRanges]);
  const { data: arcHubs } = useArcHubs();
  const { data: zenoHubs } = useZenoHubs();

  const isInitialLoading = isDriversLoading && !driverData;

  const handleDriverSelect = useCallback(
    (id: string, coords: [number, number]) => {
      const currentId = useMapUIStore.getState().selectedDriverId;
      const isNewSelection = currentId !== id;

      toggleSelectedDriver(id);

      if (isNewSelection && coords[0] != null && coords[1] != null) {
        mapRef.current?.flyTo({
          center: coords,
          zoom: 15,
          duration: 1200,
          essential: true,
        });

        if (window.innerWidth < 1024) {
          closeSidebar();
        }
      }
    },
    [toggleSelectedDriver, closeSidebar],
  );

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {isInitialLoading ? <LoadingScreen /> : null}

      {isSidebarOpen ? (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={closeSidebar}
        />
      ) : null}

      <DriverSidebar
        data={filteredDriverData}
        onSelect={handleDriverSelect}
      />

      <div className="hidden lg:block w-px bg-black/10 dark:bg-white/[0.06] shrink-0" />

      <div className="relative flex-1 overflow-hidden">
        <button
          onClick={openSidebar}
          aria-label="Open sidebar"
          className={cn(
            "lg:hidden absolute top-4 left-4 z-30 size-10 rounded-full",
            "bg-background border border-border shadow-lg flex items-center justify-center",
            "text-foreground/70 hover:text-foreground transition-transform active:scale-95",
          )}
        >
          <Users className="size-5" />
        </button>

        <button
          onClick={toggle3DMode}
          aria-label="Toggle 3D Buildings"
          title="Toggle 3D Buildings"
          className={cn(
            "absolute top-4 right-4 z-30 size-10 rounded-full",
            "border shadow-lg flex items-center justify-center transition-all active:scale-95",
            is3DMode
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground/70 border-border hover:text-foreground",
          )}
        >
          <Box className="size-5" />
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
          <Map3DBuildings enabled={is3DMode} />

          <DriverClusters data={filteredDriverData} />

          {showArcHubs ? <HubsLayer data={arcHubs} label="Arc Hub" /> : null}
          {showZenoHubs ? <HubsLayer data={zenoHubs} label="Zeno Hub" /> : null}
        </Map>

        <MapSummaryBox data={filteredDriverData} />
      </div>
    </div>
  );
}
