import { memo, useMemo, useState, useCallback } from "react";
import {
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerLabel,
} from "@/components/ui/map";
import type { HubGeoJSON, HubProperties } from "./useMapData";

// Battery fill color based on `full` percentage
function hubColor(full: number): string {
  if (full >= 60) return "#22c55e"; // green-500
  if (full >= 30) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function HubPopupContent({ p }: { p: HubProperties }) {
  return (
    <div className="w-52 space-y-2 text-sm">
      <p className="font-semibold text-foreground">{p.name}</p>
      <p className="text-xs text-muted-foreground">
        Updated: {p.last_updated}
      </p>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className="rounded bg-green-50 dark:bg-green-950 px-2 py-1 text-green-700 dark:text-green-400">
          <span className="font-bold">{p.full}</span> full
        </div>
        <div className="rounded bg-amber-50 dark:bg-amber-950 px-2 py-1 text-amber-700 dark:text-amber-400">
          <span className="font-bold">{p.total_charging}</span> charging
        </div>
      </div>
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p>90–99%: <span className="font-medium text-foreground">{p.chargingbin1}</span></p>
        <p>80–89%: <span className="font-medium text-foreground">{p.chargingbin2}</span></p>
        <p>70–79%: <span className="font-medium text-foreground">{p.chargingbin3}</span></p>
        <p>Below 70%: <span className="font-medium text-foreground">{p.chargingbin4}</span></p>
      </div>
    </div>
  );
}

type HubsLayerProps = {
  data: HubGeoJSON | undefined;
  label?: string;
};

function HubsLayerInner({ data, label = "Hub" }: HubsLayerProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const features = useMemo(() => data?.features ?? [], [data]);

  const handleClick = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <>
      {features.map((feature, i) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        const id = feature.id?.toString() ?? `${label}-${i}`;
        const color = hubColor(props.full);

        return (
          <MapMarker key={id} longitude={lng} latitude={lat}>
            <MarkerContent>
              {/* Hub dot — color encodes battery fill level */}
              <button
                type="button"
                aria-label={`${label}: ${props.name}`}
                onClick={() => handleClick(id)}
                className="flex size-8 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ backgroundColor: color }}
              >
                <span className="text-[9px] font-bold text-white leading-none">
                  {props.full}
                </span>
              </button>
            </MarkerContent>
            <MarkerLabel position="bottom">
              <span className="text-[9px] font-medium text-foreground/80 bg-background/70 rounded px-1 py-0.5">
                {props.name}
              </span>
            </MarkerLabel>
            <MarkerPopup closeButton>
              <HubPopupContent p={props} />
            </MarkerPopup>
          </MapMarker>
        );
      })}
    </>
  );
}

export const HubsLayer = memo(HubsLayerInner);
