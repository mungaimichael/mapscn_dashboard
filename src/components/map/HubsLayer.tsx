import { memo, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  MapSource,
  MapLayer,
  MapPopup,
} from "@/components/ui/map";
import type { HubGeoJSON, HubProperties } from "./useMapData";

// Battery fill color based on `full` percentage
function hubColor(full: number): string {
  if (full >= 60) return "#22c55e"; // green-500
  if (full >= 30) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function HubPopupContent({ p }: { p: HubProperties }) {
  const { t } = useTranslation();
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
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">{t("hubs.full")}</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">{fullCount}</p>
        </div>
        <div className="bg-background px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">{t("hubs.charging")}</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-none">{chargingCount}</p>
        </div>
      </div>

      <div className="space-y-2 px-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">{t("hubs.charge_levels")}</span>
          <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">{t("hubs.inventory")}</span>
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
  const { t } = useTranslation();
  const [selectedHub, setSelectedHub] = useState<HubProperties | null>(null);
  const [popupCoords, setPopupCoords] = useState<[number, number] | null>(null);

  const sourceId = useMemo(() => `hubs-source-${label.replace(/\s+/g, "-").toLowerCase()}`, [label]);

  const geoJSON = useMemo(() => {
    if (!data) return { type: "FeatureCollection", features: [] };
    return {
      ...data,
      features: data.features.map(f => ({
        ...f,
        properties: {
          ...f.properties,
          fullCount: f.properties.full ?? f.properties.availableswaps ?? f.properties.fullbatteriesno ?? 0
        }
      }))
    };
  }, [data]);

  const handleHubClick = useCallback((e: any) => {
    const feature = e.features?.[0];
    if (feature) {
      setSelectedHub(feature.properties as HubProperties);
      setPopupCoords(feature.geometry.coordinates as [number, number]);
    }
  }, []);

  if (!data) return null;

  return (
    <>
      <MapSource id={sourceId} type="geojson" data={geoJSON}>
        {/* Background Circle */}
        <MapLayer
          id={`${sourceId}-circle`}
          source={sourceId}
          type="circle"
          paint={{
            "circle-color": [
              "step",
              ["get", "fullCount"],
              "#ef4444", // < 30
              30, "#f59e0b", // 30-60
              60, "#22c55e"  // >= 60
            ],
            "circle-radius": 16,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
          onClick={handleHubClick}
        />
        
        {/* Label (Number) */}
        <MapLayer
          id={`${sourceId}-label`}
          source={sourceId}
          type="symbol"
          layout={{
            "text-field": ["get", "fullCount"],
            "text-size": 10,
            "text-font": ["Open Sans Regular", "Arial Unicode MS Bold"],
            "text-allow-overlap": true,
          }}
          paint={{
            "text-color": "#ffffff",
          }}
        />

        {/* Hub Name Label below */}
        <MapLayer
          id={`${sourceId}-name`}
          source={sourceId}
          type="symbol"
          layout={{
            "text-field": ["get", "name"],
            "text-size": 9,
            "text-offset": [0, 2],
            "text-anchor": "top",
            "text-font": ["Open Sans Regular", "Arial Unicode MS Bold"],
          }}
          paint={{
            "text-color": "rgba(0,0,0,0.7)",
            "text-halo-color": "rgba(255,255,255,0.8)",
            "text-halo-width": 1,
          }}
        />
      </MapSource>

      {selectedHub && popupCoords && (
        <MapPopup
          longitude={popupCoords[0]}
          latitude={popupCoords[1]}
          onClose={() => setSelectedHub(null)}
          closeButton
        >
          <HubPopupContent p={selectedHub} />
        </MapPopup>
      )}
    </>
  );
}

export const HubsLayer = memo(HubsLayerInner);
