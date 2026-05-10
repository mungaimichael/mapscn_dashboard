import { memo } from "react";
import { cn } from "@/lib/utils";
import { BatteryGauge } from "@/components/ui/BatteryGauge";
import type { DriverProperties } from "@/components/map/useMapData";
import { useTranslation } from "react-i18next";

const STATUS_KEYS = [
  "DRIVER_STATUS_ONLINE",
  "DRIVER_STATUS_ONTRIP",
  "DRIVER_STATUS_ENROUTE",
  "DRIVER_STATUS_OFFLINE",
  "UNASSIGNED",
] as const;

type StatusType = (typeof STATUS_KEYS)[number];

const STATUS_STYLE: Record<StatusType, { color: string; dot: string }> = {
  DRIVER_STATUS_ONLINE: { color: "text-emerald-400", dot: "bg-emerald-400" },
  DRIVER_STATUS_ONTRIP: { color: "text-blue-400", dot: "bg-blue-400" },
  DRIVER_STATUS_ENROUTE: { color: "text-violet-400", dot: "bg-violet-400" },
  DRIVER_STATUS_OFFLINE: { color: "text-zinc-500", dot: "bg-zinc-500" },
  UNASSIGNED: { color: "text-amber-400", dot: "bg-amber-400" },
};



type DriverListItemProps = {
  driver: DriverProperties;
  isSelected: boolean;
  onClick: () => void;
};

function DriverListItemInner({ driver, isSelected, onClick }: DriverListItemProps) {
  const { t } = useTranslation();
  
  const statusKey = (driver.status as StatusType) || "UNASSIGNED";
  const style = STATUS_STYLE[statusKey] || STATUS_STYLE.UNASSIGNED;
  const label = t(`status.${statusKey.replace("DRIVER_STATUS_", "").toLowerCase()}`);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200",
        "hover:bg-black/[0.03] dark:hover:bg-white/[0.03] focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20",
        isSelected && "bg-black/[0.06] dark:bg-white/[0.08] shadow-[inset_3px_0_0_0_oklch(var(--sidebar-primary))]"
      )}
    >
      
      <div className="relative shrink-0">
        <div
          className={cn(
            "size-9 rounded-full flex items-center justify-center",
            "bg-black/[0.06] dark:bg-white/[0.06] text-xs font-bold text-foreground/60 uppercase tracking-wide"
          )}
        >
          {driver.driverName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2",
            "border-sidebar",
            style.dot
          )}
        />
      </div>

      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground/90 truncate leading-tight">
          {driver.driverName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-wider">
            {driver.licensePlate === "UNASSIGNED" ? "—" : driver.licensePlate}
          </span>
          <span className={cn("text-[10px] font-medium tabular-nums", style.color)}>
            {label}
          </span>
        </div>
      </div>

      
      <div className="shrink-0">
        <BatteryGauge value={driver.Battery} size={44} />
      </div>
    </button>
  );
}

export const DriverListItem = memo(DriverListItemInner);
