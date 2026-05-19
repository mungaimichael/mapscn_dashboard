import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react";
import { MapClusterLayer, MapPopup, useMap } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import type { DriverGeoJSON, DriverProperties, DriverStatus, MovingStatus, BikeMake } from "./useMapData";

export type FilterState = {
  statuses: DriverStatus[];
  movingStatuses: MovingStatus[];
  bikeMakes: BikeMake[];
  showArcHubs: boolean;
  showZenoHubs: boolean;
};

const getCursorSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"></path>
</svg>
`;

const STATUS_COLORS: Record<string, string> = {
  DRIVER_STATUS_ONLINE: "#34d399", // emerald-400
  DRIVER_STATUS_ONTRIP: "#60a5fa", // blue-400
  DRIVER_STATUS_ENROUTE: "#a78bfa", // violet-400
  DRIVER_STATUS_OFFLINE: "#71717a", // zinc-500
  UNASSIGNED: "#fbbf24", // amber-400
  DEFAULT: "#60a5fa", // blue-400
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

    // Ensure driver has valid coordinates
    const coords = (f.geometry as GeoJSON.Point).coordinates;
    if (!coords || coords[0] == null || coords[1] == null) return false;

    const statusOk = !p.status || statusSet.has(p.status);
    const movingOk = !p.movingStatus || movingSet.has(p.movingStatus);
    const bikeOk = !p.BikeMake || bikeSet.has(p.BikeMake as BikeMake);
    return statusOk && movingOk && bikeOk;
  });

  return { type: "FeatureCollection", features } as DriverGeoJSON;
}

function DriverPopupContent({ feature }: { feature: GeoJSON.Feature }) {
  const { t } = useTranslation();
  const p = (feature?.properties ?? {}) as DriverProperties;
  
  const coordinates = (feature?.geometry as GeoJSON.Point)?.coordinates;
  if (!coordinates || coordinates.length < 2) return null;
  const [lng, lat] = coordinates;
  
  const [copied, setCopied] = useState(false);
 
  const batteryColor =
    (p.Battery ?? 0) >= 70
      ? "text-green-600 dark:text-green-400"
      : (p.Battery ?? 0) >= 30
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
 
  const statusKey = p.status?.replace("DRIVER_STATUS_", "").toLowerCase() || "unassigned";

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
        <span className="text-muted-foreground">{t("status.label") || "Status"}</span>
        <span className="font-semibold tabular-nums">{t(`status.${statusKey}`)}</span>

        <span className="text-muted-foreground">{t("status.moving_label") || "Moving"}</span>
        <span className="font-semibold capitalize tabular-nums">
          {t(`status.${p.movingStatus?.toLowerCase()}`)}
        </span>

        <span className="text-muted-foreground">{t("status.battery") || "Battery"}</span>
        <span className={`font-bold tabular-nums ${batteryColor}`}>{p.Battery}%</span>

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
  selectedId?: string | null;
};

function DriverClustersInner({ data, filters, selectedId }: DriverClustersProps) {
  const { map, isLoaded } = useMap();
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);

  // Load custom colored cursor icons for unclustered points
  useEffect(() => {
    if (!isLoaded || !map) return;
    Object.entries(STATUS_COLORS).forEach(([status, color]) => {
      const id = `cursor-${status}`;
      if (!map.hasImage(id)) {
        const img = new Image(24, 24);
        img.onload = () => {
          if (!map.hasImage(id)) map.addImage(id, img);
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getCursorSvg(color))}`;
      }
    });
  }, [isLoaded, map]);
  const [popupData, setPopupData] = useState<{feature: GeoJSON.Feature, coords: [number, number]} | null>(null);

  // Derive filtered data during render — no useEffect needed
  const filteredData = useMemo(
    () => applyFilters(data, filters),
    [data, filters]
  );

  // Vercel Best Practice: Adjusting state during render (avoids double render cycle from useEffect)
  if (selectedId !== prevSelectedId) {
    setPrevSelectedId(selectedId ?? null);
    
    if (selectedId && data) {
      const feature = data.features.find(
        (f) => (f.properties as DriverProperties).driverUuid === selectedId
      );
      if (feature) {
        setPopupData({
          feature,
          coords: (feature.geometry as GeoJSON.Point).coordinates as [number, number]
        });
      } else {
        setPopupData(null);
      }
    } else {
      setPopupData(null);
    }
  }

  const handlePointClick = useCallback(
    (feature: GeoJSON.Feature, coords: [number, number]) => {
      setPopupData({ feature, coords });
    },
    []
  );

  const handleClosePopup = useCallback(() => {
    setPopupData(null);
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
        clusterColors={["#51bbd6", "#f1f075", "#f28cb1"]}
        clusterThresholds={[100, 750]}
        pointIcon={[
          "match",
          ["get", "status"],
          "DRIVER_STATUS_ONLINE", "cursor-DRIVER_STATUS_ONLINE",
          "DRIVER_STATUS_ONTRIP", "cursor-DRIVER_STATUS_ONTRIP",
          "DRIVER_STATUS_ENROUTE", "cursor-DRIVER_STATUS_ENROUTE",
          "DRIVER_STATUS_OFFLINE", "cursor-DRIVER_STATUS_OFFLINE",
          "UNASSIGNED", "cursor-UNASSIGNED",
          "cursor-DEFAULT"
        ]}
        onPointClick={handlePointClick}
      />

      {popupData && (
        <MapPopup
          longitude={popupData.coords[0]}
          latitude={popupData.coords[1]}
          onClose={handleClosePopup}
          closeButton={false}
          closeOnClick={true}
          closeOnMove={false}
        >
          <div className="animate-in fade-in-0 zoom-in-95 duration-200 ease-out">
            <DriverPopupContent feature={popupData.feature} />
          </div>
        </MapPopup>
      )}
    </>
  );
}

export const DriverClusters = memo(DriverClustersInner);
