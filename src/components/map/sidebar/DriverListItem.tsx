import { memo } from "react";
import { cn } from "@/lib/utils";
import { BatteryGauge } from "@/components/ui/BatteryGauge";
import type { DriverProperties } from "@/components/map/useMapData";

// --- Status config ---
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  DRIVER_STATUS_ONLINE: {
    label: "Online",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  DRIVER_STATUS_ONTRIP: {
    label: "On Trip",
    color: "text-blue-400",
    dot: "bg-blue-400",
  },
  DRIVER_STATUS_ENROUTE: {
    label: "En Route",
    color: "text-violet-400",
    dot: "bg-violet-400",
  },
  DRIVER_STATUS_OFFLINE: {
    label: "Offline",
    color: "text-zinc-500",
    dot: "bg-zinc-500",
  },
  UNASSIGNED: {
    label: "Unassigned",
    color: "text-amber-400",
    dot: "bg-amber-400",
  },
};

function batteryClass(pct: number) {
  // kept for any other uses
  if (pct >= 70) return "text-emerald-400";
  if (pct >= 30) return "text-amber-400";
  return "text-red-400";
}

type DriverListItemProps = {
  driver: DriverProperties;
  isSelected: boolean;
  onClick: () => void;
};

function DriverListItemInner({ driver, isSelected, onClick }: DriverListItemProps) {
  const cfg = STATUS_CONFIG[driver.status] ?? STATUS_CONFIG.UNASSIGNED;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20",
        isSelected && "bg-black/[0.05] dark:bg-white/[0.06] border-l-2 border-emerald-500"
      )}
    >
      {/* Status avatar */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "size-9 rounded-full flex items-center justify-center",
            "bg-black/[0.06] dark:bg-white/[0.06] text-xs font-bold text-foreground/60 uppercase tracking-wide"
          )}
        >
          {driver.driverName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        {/* Live status dot */}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2",
            "border-sidebar",
            cfg.dot
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground/90 truncate leading-tight">
          {driver.driverName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-wider">
            {driver.licensePlate === "UNASSIGNED" ? "—" : driver.licensePlate}
          </span>
          <span className={cn("text-[10px] font-medium", cfg.color)}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Battery gauge */}
      <div className="shrink-0">
        <BatteryGauge value={driver.Battery} size={44} />
      </div>
    </button>
  );
}

export const DriverListItem = memo(DriverListItemInner);
