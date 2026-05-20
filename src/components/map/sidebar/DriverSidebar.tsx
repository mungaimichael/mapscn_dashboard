import { memo, useCallback, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Globe,
  Moon,
  Search,
  Settings2,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { cn } from "@/lib/utils";
import { DriverListItem } from "./DriverListItem";
import { useThemeStore, useMapUIStore, useFilterStore } from "@/store";
import type { BikeMakeFilter, BatteryRange, TimestampRange } from "@/store";
import type {
  DriverGeoJSON,
  DriverProperties,
  DriverStatus,
} from "@/components/map/useMapData";

type StatusFilter = DriverStatus | "ALL";

const STATUS_FILTER_VALUES: StatusFilter[] = [
  "ALL",
  "DRIVER_STATUS_ONLINE",
  "DRIVER_STATUS_ONTRIP",
  "DRIVER_STATUS_ENROUTE",
  "DRIVER_STATUS_OFFLINE",
  "UNASSIGNED",
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

const UBER_STATUSES: { value: DriverStatus; label: string }[] = [
  { value: "DRIVER_STATUS_ONLINE", label: "Online" },
  { value: "DRIVER_STATUS_ONTRIP", label: "On Trip" },
  { value: "DRIVER_STATUS_ENROUTE", label: "En Route" },
  { value: "DRIVER_STATUS_OFFLINE", label: "Offline" },
  { value: "UNASSIGNED", label: "Unassigned" },
];

const MOVING_STATUSES: { value: "MOVING" | "PARKED"; label: string }[] = [
  { value: "MOVING", label: "Moving" },
  { value: "PARKED", label: "Parked" },
];

const BATTERY_RANGES: { value: BatteryRange; label: string }[] = [
  { value: "good", label: "Good (≥ 60%)" },
  { value: "low", label: "Low (30–59%)" },
  { value: "critical", label: "Critical (< 30%)" },
];

const BIKE_MAKES: { value: BikeMakeFilter; label: string }[] = [
  { value: "Roam", label: "Roam" },
  { value: "One Electric", label: "One Electric" },
  { value: "KINGCHE ARC", label: "Kingche Arc" },
  { value: "Zeno Emara", label: "Zeno Emara" },
  { value: "OTHERS", label: "Others" },
];

const TIMESTAMP_RANGES: { value: TimestampRange; label: string }[] = [
  { value: "recent", label: "Last 1 hour" },
  { value: "today", label: "Last 24 hours" },
  { value: "this_week", label: "Last 7 days" },
  { value: "older", label: "Older" },
];

function FilterSection({
  title,
  onClear,
  children,
}: {
  title: string;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div
        className="flex items-center justify-between py-1.5 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown
            className={cn(
              "size-3 text-foreground/40 transition-transform duration-200",
              !open && "-rotate-90",
            )}
          />
          <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.18em]">
            {title}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className=" border border-gray-300 w-[5rem] rounded-xl text-[9px] text-foreground/30 hover:text-foreground/60 hover:bg-slate-200 transition-colors"
        >
          Clear
        </button>
      </div>
      <div
        className={cn(
          "grid transition-all duration-200",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 pb-1.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className="flex items-center gap-2 px-1 py-0.5 rounded cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.03] group"
      onClick={onChange}
    >
      <div
        className={cn(
          "size-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
          checked
            ? "bg-emerald-500 border-emerald-500"
            : "border-black/20 dark:border-white/20 bg-transparent",
        )}
      >
        {checked && <Check className="size-2 text-white stroke-[3]" />}
      </div>
      <span className="text-[10px] text-foreground/60 group-hover:text-foreground/80 transition-colors">
        {label}
      </span>
    </label>
  );
}

type DriverSidebarProps = {
  data: DriverGeoJSON | undefined;
  onSelect: (id: string, coords: [number, number]) => void;
};

function DriverSidebarInner({ data, onSelect }: DriverSidebarProps) {
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("ALL");
  const [isLangOpen, setIsLangOpen] = useState(false);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isSidebarOpen = useMapUIStore((s) => s.isSidebarOpen);
  const closeSidebar = useMapUIStore((s) => s.closeSidebar);
  const selectedDriverId = useMapUIStore((s) => s.selectedDriverId);
  const showArcHubs = useFilterStore((s) => s.showArcHubs);
  const showZenoHubs = useFilterStore((s) => s.showZenoHubs);
  const toggleArcHubs = useFilterStore((s) => s.toggleArcHubs);
  const toggleZenoHubs = useFilterStore((s) => s.toggleZenoHubs);
  const statuses = useFilterStore((s) => s.statuses);
  const movingStatuses = useFilterStore((s) => s.movingStatuses);
  const bikeMakes = useFilterStore((s) => s.bikeMakes);
  const batteryRanges = useFilterStore((s) => s.batteryRanges);
  const uberTimestampRanges = useFilterStore((s) => s.uberTimestampRanges);
  const gpsTimestampRanges = useFilterStore((s) => s.gpsTimestampRanges);
  const toggleStatus = useFilterStore((s) => s.toggleStatus);
  const toggleMoving = useFilterStore((s) => s.toggleMoving);
  const toggleBikeMake = useFilterStore((s) => s.toggleBikeMake);
  const toggleBatteryRange = useFilterStore((s) => s.toggleBatteryRange);
  const toggleUberTimestamp = useFilterStore((s) => s.toggleUberTimestamp);
  const toggleGpsTimestamp = useFilterStore((s) => s.toggleGpsTimestamp);
  const clearStatuses = useFilterStore((s) => s.clearStatuses);
  const clearMovingStatuses = useFilterStore((s) => s.clearMovingStatuses);
  const clearBikeMakes = useFilterStore((s) => s.clearBikeMakes);
  const clearBatteryRanges = useFilterStore((s) => s.clearBatteryRanges);
  const clearUberTimestamps = useFilterStore((s) => s.clearUberTimestamps);
  const clearGpsTimestamps = useFilterStore((s) => s.clearGpsTimestamps);

  const { t, i18n } = useTranslation();

  // Memoize filter labels — rebuilds only when t() reference changes (language switch)
  const statusFilters = useMemo(
    () =>
      STATUS_FILTER_VALUES.map((value) => ({
        value,
        label: t(
          `status.${value === "ALL" ? "all" : value.replace("DRIVER_STATUS_", "").toLowerCase()}`,
        ),
      })),
    [t],
  );

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsLangOpen(false);
  };

  const filtered = useMemo(() => {
    const features = data?.features ?? [];
    return features.filter((f) => {
      const p = f.properties as DriverProperties;
      // Skip drivers without valid coordinates
      const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
      if (lng == null || lat == null) return false;
      const matchesStatus = activeStatus === "ALL" || p.status === activeStatus;
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
    [data],
  );

  const handleStatusToggle = (status: StatusFilter) => {
    setActiveStatus(status);
  };

  const downloadCSV = useCallback(() => {
    const headers = [
      "UUID", "Name", "License Plate", "Phone",
      "Status", "Moving Status", "Bike Make", "Battery (%)",
      "GPS DateTime", "Uber Timestamp", "Speed (km/h)", "Status Duration (min)",
    ];

    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const rows = filtered.map((f) => {
      const p = f.properties as DriverProperties;
      return [
        p.driverUuid, p.driverName, p.licensePlate, p.phone,
        p.status, p.movingStatus, p.BikeMake, p.Battery,
        p.GPSDateTime, p.timestamp, p.VehicleSpeed, p.statusDuration,
      ].map(escape).join(",");
    });

    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().replace("T", "_").replace(/:/g, "-").split(".")[0];
    a.href = url;
    a.download = `driver_data_${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <aside
      className={cn(
        "flex flex-col w-72 shrink-0 bg-sidebar transition-transform duration-300 ease-in-out z-50",
        "fixed inset-y-0 left-0 h-[100dvh] lg:h-full lg:relative lg:translate-x-0 overscroll-contain",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
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
                "text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40",
              )}
            />
          </div>

          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              "bg-background border-black/[0.08] dark:border-white/[0.08] text-foreground/60",
              isLangOpen && "border-emerald-500/40 text-emerald-500",
            )}
          >
            <Settings2 className="size-4" />
          </button>

          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] text-foreground/60"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Horizontal Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {statusFilters.map(({ value, label }) => {
            const isActive = activeStatus === value;
            return (
              <button
                key={value}
                onClick={() => handleStatusToggle(value)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-[10px] font-medium border transition-all",
                  isActive
                    ? value === "ALL"
                      ? "bg-foreground/10 text-foreground/80 border-foreground/15"
                      : ACTIVE_CHIP[value]
                    : "border-transparent bg-black/[0.04] dark:bg-white/[0.05] text-foreground/45 hover:text-foreground/65",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Collapsible Advanced Settings ── */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]",
          isLangOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 border-b-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 py-3 space-y-4 max-h-[55vh] overflow-y-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10">
            <div>
              <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-2">
                Preferences
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    changeLanguage(i18n.language === "en" ? "sw" : "en")
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md border border-black/[0.08] dark:border-white/[0.08] text-[11px] font-medium text-foreground/60"
                >
                  <Globe className="size-3.5" />{" "}
                  {i18n.language === "en" ? "English" : "Kiswahili"}
                </button>
                <button
                  onClick={toggleTheme}
                  className="size-9 flex items-center justify-center rounded-md border border-black/[0.08] dark:border-white/[0.08] text-foreground/60"
                >
                  {theme === "dark" ? (
                    <Sun className="size-3.5" />
                  ) : (
                    <Moon className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-2">
                {t("sidebar.map_layers")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleArcHubs}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 rounded-md border text-[10px] transition-colors",
                    showArcHubs
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                      : "border-black/[0.08] dark:border-white/[0.08] text-foreground/40",
                  )}
                >
                  Arc Hubs {showArcHubs && <CheckCircle2 className="size-3" />}
                </button>
                <button
                  onClick={toggleZenoHubs}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 rounded-md border text-[10px] transition-colors",
                    showZenoHubs
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-600"
                      : "border-black/[0.08] dark:border-white/[0.08] text-foreground/40",
                  )}
                >
                  Zeno Hubs{" "}
                  {showZenoHubs && <CheckCircle2 className="size-3" />}
                </button>
              </div>
            </div>

            {/* ── Filter Sections ── */}
            <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-2 space-y-0.5 ">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em]">
                  Filters
                </p>
                <button
                  onClick={() => {
                    clearStatuses();
                    clearMovingStatuses();
                    clearBikeMakes();
                    clearBatteryRanges();
                    clearUberTimestamps();
                    clearGpsTimestamps();
                  }}
                  className=" border border-gray-300 w-[5rem] rounded-xl font-semibold text-[9px] text-foreground/30 hover:text-foreground/60 hover:bg-slate-200 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <FilterSection title="Uber Status" onClear={clearStatuses}>
                {UBER_STATUSES.map(({ value, label }) => (
                  <CheckItem
                    key={value}
                    label={label}
                    checked={statuses.includes(value)}
                    onChange={() => toggleStatus(value)}
                  />
                ))}
              </FilterSection>

              <FilterSection
                title="Moving Status"
                onClear={clearMovingStatuses}
              >
                {MOVING_STATUSES.map(({ value, label }) => (
                  <CheckItem
                    key={value}
                    label={label}
                    checked={movingStatuses.includes(value)}
                    onChange={() => toggleMoving(value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Battery Level" onClear={clearBatteryRanges}>
                {BATTERY_RANGES.map(({ value, label }) => (
                  <CheckItem
                    key={value}
                    label={label}
                    checked={batteryRanges.includes(value)}
                    onChange={() => toggleBatteryRange(value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Bike Model" onClear={clearBikeMakes}>
                {BIKE_MAKES.map(({ value, label }) => (
                  <CheckItem
                    key={value}
                    label={label}
                    checked={bikeMakes.includes(value)}
                    onChange={() => toggleBikeMake(value)}
                  />
                ))}
              </FilterSection>

              <FilterSection
                title="Uber Timestamp"
                onClear={clearUberTimestamps}
              >
                {TIMESTAMP_RANGES.map(({ value, label }) => (
                  <CheckItem
                    key={value}
                    label={label}
                    checked={uberTimestampRanges.includes(value)}
                    onChange={() => toggleUberTimestamp(value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="GPS Timestamp" onClear={clearGpsTimestamps}>
                {TIMESTAMP_RANGES.map(({ value, label }) => (
                  <CheckItem
                    key={value}
                    label={label}
                    checked={gpsTimestampRanges.includes(value)}
                    onChange={() => toggleGpsTimestamp(value)}
                  />
                ))}
              </FilterSection>
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

        <div className="relative group">
          <button
            className="p-1.5 rounded-md border border-black/[0.08] dark:border-white/[0.08] text-foreground/50 hover:text-foreground/80 transition-colors"
            onClick={downloadCSV}
          >
            <Download className="size-3.5" />
          </button>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded text-[10px] bg-foreground text-background shadow-md whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            Download driver data
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
                    isSelected={selectedDriverId === id}
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
