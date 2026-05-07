import { memo, useMemo, useState } from "react";
import { Search, Users, Sun, Moon, Map as MapIcon, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DriverListItem } from "./DriverListItem";
import { useTheme } from "@/hooks/useTheme";
import type { DriverGeoJSON, DriverProperties, DriverStatus } from "@/components/map/useMapData";
import type { FilterState } from "../DriverClusters";
import type { FilterAction } from "../MapDashboard";

type StatusFilter = DriverStatus | "ALL";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRIVER_STATUS_ONLINE", label: "Online" },
  { value: "DRIVER_STATUS_ONTRIP", label: "On Trip" },
  { value: "DRIVER_STATUS_ENROUTE", label: "En Route" },
  { value: "DRIVER_STATUS_OFFLINE", label: "Offline" },
  { value: "UNASSIGNED", label: "Unassigned" },
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
  selectedId: number | null;
  onSelect: (id: number, coords: [number, number]) => void;
  filters: FilterState;
  dispatch: React.Dispatch<FilterAction>;
};

function DriverSidebarInner({ data, selectedId, onSelect, filters, dispatch }: DriverSidebarProps) {
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const { theme, toggleTheme } = useTheme();

  const filtered = useMemo(() => {
    const features = data?.features ?? [];
    return features.filter((f) => {
      const p = f.properties as DriverProperties;
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
    <aside className="flex flex-col h-full w-72 shrink-0 bg-sidebar">
      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5 mb-4">

          {/* Right-side controls */}
          <div className="ml-auto flex items-center gap-2">
            {/* Online count */}
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalOnline}
              </span>
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={cn(
                "size-7 rounded-md flex items-center justify-center transition-colors",
                "text-foreground/40 hover:text-foreground/70",
                "hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
              )}
            >
              {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground/30" />
          <input
            type="text"
            placeholder="Search driver or plate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "w-full pl-8 pr-3 py-2 rounded-lg text-xs",
              "bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08]",
              "text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            )}
          />
        </div>
      </div>

      {/* ── Map Layers ── */}
      <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.06]">
        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <MapIcon className="size-3" /> Map Layers
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
            <span>Arc Ride Hubs</span>
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
            <span>Zeno Hubs</span>
            {filters.showZenoHubs ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
          </button>
        </div>
      </div>

      {/* ── Driver Filters ── */}
      <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.06]">
        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-2">
          Bike Status
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(({ value, label }) => {
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

      {/* ── Driver count ── */}
      <div className="px-4 py-2 flex items-center gap-1.5 border-b border-black/[0.04] dark:border-white/[0.04]">
        <Users className="size-3 text-foreground/30" />
        <span className="text-[10px] text-foreground/35">
          {filtered.length} driver{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Scrollable list ── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-foreground/30">
            <Users className="size-8 mb-2 opacity-30" />
            <p className="text-xs">No drivers found</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.03]">
            {filtered.map((f) => {
              const id = f.id as number;
              const [lng, lat] = f.geometry.coordinates;
              return (
                <DriverListItem
                  key={id}
                  driver={f.properties as DriverProperties}
                  isSelected={selectedId === id}
                  onClick={() => onSelect(id, [lng, lat])}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 border-t border-black/[0.05] dark:border-white/[0.06]">
        <p className="text-[9px] text-foreground/20 text-center">
          Data refreshes every 15s
        </p>
      </div>
    </aside>
  );
}

export const DriverSidebar = memo(DriverSidebarInner);
