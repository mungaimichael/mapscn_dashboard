import { memo, useMemo, useState } from "react";
import { Search, Users, Sun, Moon, Map as MapIcon, CheckCircle2, Circle, X, Globe, ChevronDown, Settings2 } from "lucide-react";
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
        <div className="flex items-center gap-2.5 mb-4">
          {/* Close button - Mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 -ml-1 rounded-md text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="size-4" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalOnline}
              </span>
            </div>

            {/* Mobile close handled here, settings moved to dedicated section */}
          </div>
        </div>

        <div className="relative">
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
      </div>

      {/* ── Preferences Section ── */}
      <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]">
        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
          <Settings2 className="size-3" /> Preferences
        </p>
        
        <div className="flex items-center justify-between gap-2">
          {/* Language Selector */}
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-label="Select language"
              aria-expanded={isLangOpen}
              aria-haspopup="listbox"
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                "bg-background border-black/[0.08] dark:border-white/[0.08]",
                "text-foreground/60 hover:text-foreground/80",
                isLangOpen && "border-emerald-500/40 ring-1 ring-emerald-500/20"
              )}
            >
              <div className="flex items-center gap-2">
                <Globe className="size-3.5 text-emerald-500/60" />
                <span className="text-[11px] font-medium">
                  {i18n.language === "en" ? "English" : "Kiswahili"}
                </span>
              </div>
              <ChevronDown className={cn("size-3 transition-transform opacity-40", isLangOpen && "rotate-180")} />
            </button>

            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)} />
                <div className="absolute left-0 bottom-full mb-1.5 w-full py-1 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-background shadow-xl z-20 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <button
                    onClick={() => changeLanguage("en")}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[11px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] flex items-center justify-between",
                      i18n.language === "en" ? "text-emerald-500 font-bold" : "text-foreground/60"
                    )}
                  >
                    English {i18n.language === "en" && <CheckCircle2 className="size-3" />}
                  </button>
                  <button
                    onClick={() => changeLanguage("sw")}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[11px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] flex items-center justify-between",
                      i18n.language === "sw" ? "text-emerald-500 font-bold" : "text-foreground/60"
                    )}
                  >
                    Kiswahili {i18n.language === "sw" && <CheckCircle2 className="size-3" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className={cn(
              "size-8 shrink-0 rounded-md flex items-center justify-center transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
              "bg-background border-black/[0.08] dark:border-white/[0.08]",
              "text-foreground/40 hover:text-emerald-500 hover:border-emerald-500/30"
            )}
          >
            {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.06]">
        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <MapIcon className="size-3" /> {t("sidebar.map_layers")}
        </p>
        <div className="space-y-1.5">
          <button
            onClick={() => dispatch({ type: "TOGGLE_ARC_HUBS" })}
            className={cn(
              "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] transition-colors",
              filters.showArcHubs
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <span>{t("sidebar.arc_hubs")}</span>
            {filters.showArcHubs ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
          </button>
          <button
            onClick={() => dispatch({ type: "TOGGLE_ZENO_HUBS" })}
            className={cn(
              "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] transition-colors",
              filters.showZenoHubs
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <span>{t("sidebar.zeno_hubs")}</span>
            {filters.showZenoHubs ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.06]">
        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-2">
          {t("sidebar.bike_status")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS(t).map(({ value, label }) => {
            const isActive = activeStatus === value;
            return (
              <button
                key={value}
                onClick={() => handleStatusToggle(value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium border transition-all",
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

      <div className="px-4 py-2 flex items-center gap-1.5 border-b border-black/[0.04] dark:border-white/[0.04]">
        <Users className="size-3 text-foreground/30" />
        <span className="text-[10px] text-foreground/35">
          {t("sidebar.driver_count", { count: filtered.length })}
        </span>
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
