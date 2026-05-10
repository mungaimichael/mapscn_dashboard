import { memo, useMemo, useState } from "react";
import { Search, Users, Sun, Moon, CheckCircle2, X, Globe, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { cn } from "@/lib/utils";
import { DriverListItem } from "./DriverListItem";
import { useTheme } from "@/hooks/useTheme";
import type { DriverGeoJSON, DriverProperties, DriverStatus } from "@/components/map/useMapData";
import type { FilterState } from "../DriverClusters";
import type { FilterAction } from "../MapDashboard";

type StatusFilter = DriverStatus | "ALL";

const STATUS_FILTERS: (t: any) => { value: StatusFilter; label: string }[] = (t) => [
  { value: "ALL", label: t("status.all") },
  { value: "DRIVER_STATUS_ONLINE", label: t("status.online") },
  { value: "DRIVER_STATUS_ONTRIP", label: t("status.ontrip") },
  { value: "DRIVER_STATUS_ENROUTE", label: t("status.enroute") },
  { value: "DRIVER_STATUS_OFFLINE", label: t("status.offline") },
  { value: "UNASSIGNED", label: t("status.unassigned") },
];

// Active chip colors per status
const ACTIVE_CHIP: Partial<Record<StatusFilter, string>> = {
  DRIVER_STATUS_ONLINE:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  DRIVER_STATUS_ONTRIP:
    "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  DRIVER_STATUS_ENROUTE:
    "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  DRIVER_STATUS_OFFLINE:
    "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/30",
  UNASSIGNED:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
};

type DriverSidebarProps = {
  data: DriverGeoJSON | undefined;
  selectedId: string | null;
  onSelect: (id: string, coords: [number, number]) => void;
  filters: FilterState;
  dispatch: React.Dispatch<FilterAction>;
  isOpen?: boolean;
  onClose?: () => void;
};

function DriverSidebarInner({ data, selectedId, onSelect, filters, dispatch, isOpen, onClose }: DriverSidebarProps) {
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsLangOpen(false);
  };


  const filtered = useMemo(() => {
    const features = data?.features ?? [];
    return features.filter((f) => {
      const p = f.properties as DriverProperties;
      // Skip drivers without valid coordinates — they can't be shown on the map
      const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
      if (lng == null || lat == null) return false;
      const matchesStatus =
        activeStatus === "ALL" || p.status === activeStatus;
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        p.driverName.toLowerCase().includes(q) ||
        p.licensePlate.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [data, activeStatus, query]);

  const totalOnline = useMemo(
    () =>
      (data?.features ?? []).filter((f) => {
        const s = (f.properties as DriverProperties).status;
        return (
          s === "DRIVER_STATUS_ONLINE" ||
          s === "DRIVER_STATUS_ONTRIP" ||
          s === "DRIVER_STATUS_ENROUTE"
        );
      }).length,
    [data]
  );

  const handleStatusToggle = (status: StatusFilter) => {
    setActiveStatus(status);
    dispatch({ type: "SET_STATUS_FILTER", status: status === "ALL" ? null : status });
  };

  return (
    <aside className={cn(
      "flex flex-col w-72 shrink-0 bg-sidebar transition-transform duration-300 ease-in-out z-50",
      "fixed inset-y-0 left-0 h-[100dvh] lg:h-full lg:relative lg:translate-x-0 overscroll-contain",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="px-4 pt-5 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground/30" />
            <input
              type="text"
              name="driver-search"
              autoComplete="off"
              spellCheck={false}
              placeholder={t("sidebar.search_placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "w-full pl-8 pr-3 py-2 rounded-lg text-xs",
                "bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08]",
                "text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40"
              )}
            />
          </div>
          
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              "bg-background border-black/[0.08] dark:border-white/[0.08] text-foreground/60",
              isLangOpen && "border-emerald-500/40 text-emerald-500"
            )}
          >
            <Settings2 className="size-4" />
          </button>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] text-foreground/60"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Horizontal Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {STATUS_FILTERS(t).map(({ value, label }) => {
            const isActive = activeStatus === value;
            return (
              <button
                key={value}
                onClick={() => handleStatusToggle(value)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-[10px] font-medium border transition-all",
                  isActive
                    ? (value === "ALL" ? "bg-foreground/10 text-foreground/80 border-foreground/15" : ACTIVE_CHIP[value])
                    : "border-transparent bg-black/[0.04] dark:bg-white/[0.05] text-foreground/45 hover:text-foreground/65"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Collapsible Advanced Settings ── */}
      <div className={cn(
        "grid transition-all duration-300 ease-in-out border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]",
        isLangOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 border-b-0"
      )}>
        <div className="overflow-hidden">
          <div className="px-4 py-3 space-y-4">
            <div>
              <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-2">Preferences</p>
              <div className="flex gap-2">
                <button
                  onClick={() => changeLanguage(i18n.language === "en" ? "sw" : "en")}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md border border-black/[0.08] dark:border-white/[0.08] text-[11px] font-medium text-foreground/60"
                >
                  <Globe className="size-3.5" /> {i18n.language === "en" ? "English" : "Kiswahili"}
                </button>
                <button
                  onClick={toggleTheme}
                  className="size-9 flex items-center justify-center rounded-md border border-black/[0.08] dark:border-white/[0.08] text-foreground/60"
                >
                  {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-2">{t("sidebar.map_layers")}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => dispatch({ type: "TOGGLE_ARC_HUBS" })}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 rounded-md border text-[10px] transition-colors",
                    filters.showArcHubs ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "border-black/[0.08] dark:border-white/[0.08] text-foreground/40"
                  )}
                >
                  Arc Hubs {filters.showArcHubs && <CheckCircle2 className="size-3" />}
                </button>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_ZENO_HUBS" })}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 rounded-md border text-[10px] transition-colors",
                    filters.showZenoHubs ? "bg-blue-500/10 border-blue-500/20 text-blue-600" : "border-black/[0.08] dark:border-white/[0.08] text-foreground/40"
                  )}
                >
                  Zeno Hubs {filters.showZenoHubs && <CheckCircle2 className="size-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <Users className="size-3 text-foreground/30" />
          <span className="text-[10px] font-bold text-foreground/35 uppercase tracking-wider">
            {t("sidebar.driver_count", { count: filtered.length })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {totalOnline} Online
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-foreground/30">
            <Users className="size-8 mb-2 opacity-30" />
            <p className="text-xs">{t("sidebar.no_drivers")}</p>
          </div>
        ) : (
          <Virtuoso
            data={filtered}
            className="h-full touch-pan-y scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10"
            itemContent={(idx, f) => {
              const p = f.properties as DriverProperties;
              const id = p.driverUuid ?? `driver-${idx}`;
              const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
              return (
                <div className="border-b border-black/[0.04] dark:border-white/[0.03]">
                  <DriverListItem
                    driver={p}
                    isSelected={selectedId === id}
                    onClick={() => onSelect(id, [lng, lat])}
                  />
                </div>
              );
            }}
          />
        )}
      </div>

      <div className="px-4 py-3 border-t border-black/[0.05] dark:border-white/[0.06]">
        <p className="text-[9px] text-foreground/20 text-center">
          {t("sidebar.refresh_rate")}
        </p>
      </div>
    </aside>
  );
}

export const DriverSidebar = memo(DriverSidebarInner);
