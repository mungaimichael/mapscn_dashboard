import { memo, useMemo } from "react";
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
  const fullCount = p.full ?? p.availableswaps ?? p.fullbatteriesno ?? 0;
  const chargingCount = p.total_charging ?? 0;

  return (
    <div className="w-56 py-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-foreground tracking-tight">{p.name}</p>
        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_oklch(var(--sidebar-primary)/0.4)]" />
      </div>
      
      <div className="grid grid-cols-2 gap-px bg-border/50 border border-border rounded-lg overflow-hidden mb-3">
        <div className="bg-background px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Full</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">{fullCount}</p>
        </div>
        <div className="bg-background px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Charging</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-none">{chargingCount}</p>
        </div>
      </div>

      <div className="space-y-2 px-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Charge Levels</span>
          <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Inventory</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">90–99%</span>
            <span className="text-xs font-bold text-foreground tabular-nums">{p.chargingbin1 ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">80–89%</span>
            <span className="text-xs font-bold text-foreground tabular-nums">{p.chargingbin2 ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">70–79%</span>
            <span className="text-xs font-bold text-foreground tabular-nums">{p.chargingbin3 ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">&lt; 70%</span>
            <span className="text-xs font-bold text-foreground tabular-nums">{p.chargingbin4 ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type HubsLayerProps = {
  data: HubGeoJSON | undefined;
  label?: string;
};

function HubsLayerInner({ data, label = "Hub" }: HubsLayerProps) {
  const features = useMemo(() => data?.features ?? [], [data]);

  return (
    <>
      {features.map((feature, i) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        const id = feature.id?.toString() ?? `${label}-${i}`;
        const fullCount = props.full ?? props.availableswaps ?? props.fullbatteriesno ?? 0;
        const color = hubColor(fullCount);

        return (
          <MapMarker key={id} longitude={lng} latitude={lat}>
            <MarkerContent>
              
              <button
                type="button"
                aria-label={`${label}: ${props.name}`}
                className="flex size-8 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ backgroundColor: color }}
              >
                <span className="text-[9px] font-bold text-white leading-none">
                  {fullCount}
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
