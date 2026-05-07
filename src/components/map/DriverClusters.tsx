import { memo, useMemo, useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { MapClusterLayer, MapPopup } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import type { DriverGeoJSON, DriverProperties, DriverStatus, MovingStatus, BikeMake } from "./useMapData";

export type FilterState = {
  statuses: DriverStatus[];
  movingStatuses: MovingStatus[];
  bikeMakes: BikeMake[];
  showArcHubs: boolean;
  showZenoHubs: boolean;
};

function applyFilters(
  data: DriverGeoJSON | undefined,
  filters: FilterState
): DriverGeoJSON {
  if (!data) return { type: "FeatureCollection", features: [] };

  const statusSet = new Set(filters.statuses);
  const movingSet = new Set(filters.movingStatuses);
  const bikeSet = new Set(filters.bikeMakes);

  const features = data.features.filter((f) => {
    const p = f.properties as DriverProperties;
    const statusOk = !p.status || statusSet.has(p.status);
    const movingOk = !p.movingStatus || movingSet.has(p.movingStatus);
    const bikeOk = !p.BikeMake || bikeSet.has(p.BikeMake as BikeMake);
    return statusOk && movingOk && bikeOk;
  });

  return { type: "FeatureCollection", features } as DriverGeoJSON;
}

function DriverPopupContent({ feature }: { feature: GeoJSON.Feature }) {
  const p = feature.properties as DriverProperties;
  const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
  const [copied, setCopied] = useState(false);

  const batteryColor =
    p.Battery >= 70
      ? "text-green-600 dark:text-green-400"
      : p.Battery >= 30
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const statusLabel: Record<string, string> = {
    DRIVER_STATUS_ONLINE: "Online",
    DRIVER_STATUS_OFFLINE: "Offline",
    DRIVER_STATUS_ONTRIP: "On Trip",
    DRIVER_STATUS_ENROUTE: "En Route",
    UNASSIGNED: "Unassigned",
  };

  const handleCopy = () => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-56 space-y-3 p-1">
      <div>
        <p className="font-bold text-sm text-foreground">{p.driverName}</p>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          {p.licensePlate}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
        <span className="text-muted-foreground">Status</span>
        <span className="font-semibold">{statusLabel[p.status] ?? p.status}</span>

        <span className="text-muted-foreground">Moving</span>
        <span className="font-semibold capitalize">{p.movingStatus?.toLowerCase()}</span>

        <span className="text-muted-foreground">Battery</span>
        <span className={`font-bold ${batteryColor}`}>{p.Battery}%</span>

        <span className="text-muted-foreground">Speed</span>
        <span className="font-semibold tabular-nums">{p.VehicleSpeed} km/h</span>
      </div>

      <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1">
        <div className="flex items-center justify-between group">
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Location</span>
            <code className="text-[10px] font-mono opacity-80">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </code>
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "p-1.5 rounded-md transition-all",
              copied 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
            )}
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground/60 italic leading-none">
          Last seen: {p.GPSDateTime}
        </p>
      </div>
    </div>
  );
}

type DriverClustersProps = {
  data: DriverGeoJSON | undefined;
  filters: FilterState;
  selectedId?: number | null;
};

function DriverClustersInner({ data, filters }: DriverClustersProps) {
  const [popupFeature, setPopupFeature] = useState<GeoJSON.Feature | null>(null);
  const [popupCoords, setPopupCoords] = useState<[number, number] | null>(null);

  // Derive filtered data during render — no useEffect needed
  const filteredData = useMemo(
    () => applyFilters(data, filters),
    [data, filters]
  );

  const handlePointClick = useCallback(
    (feature: GeoJSON.Feature, coords: [number, number]) => {
      setPopupFeature(feature);
      setPopupCoords(coords);
    },
    []
  );

  const handleClosePopup = useCallback(() => {
    setPopupFeature(null);
    setPopupCoords(null);
  }, []);

  // We count how many bikes in each cluster have specific statuses
  const clusterProperties = useMemo(() => ({
    online_count: ["+", ["case", ["==", ["get", "status"], "DRIVER_STATUS_ONLINE"], 1, 0]],
    on_trip_count: ["+", ["case", ["==", ["get", "status"], "DRIVER_STATUS_ONTRIP"], 1, 0]],
    low_battery_count: ["+", ["case", ["<", ["get", "Battery"], 30], 1, 0]],
  }), []);

  return (
    <>
      <MapClusterLayer
        data={filteredData}
        clusterMaxZoom={14}
        clusterRadius={50}
        clusterProperties={clusterProperties}
        // Colors from MapLibre official example: Cyan, Yellow, Pink
        clusterColors={["#51bbd6", "#f1f075", "#f28cb1"]}
        clusterThresholds={[100, 750]}
        pointColor="#3b82f6"
        onPointClick={handlePointClick}
      />

      {popupFeature && popupCoords && (
        <MapPopup
          longitude={popupCoords[0]}
          latitude={popupCoords[1]}
          onClose={handleClosePopup}
          closeButton={false}
          closeOnClick={true}
          closeOnMove={false}
        >
          <div className="animate-in fade-in-0 zoom-in-95 duration-200 ease-out">
            <DriverPopupContent feature={popupFeature} />
          </div>
        </MapPopup>
      )}
    </>
  );
}

export const DriverClusters = memo(DriverClustersInner);
