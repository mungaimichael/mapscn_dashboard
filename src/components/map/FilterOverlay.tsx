import { memo } from "react";
import type { DriverStatus, MovingStatus } from "./useMapData";
import type { FilterState } from "./DriverClusters";

const ALL_STATUSES: { value: DriverStatus; label: string }[] = [
  { value: "DRIVER_STATUS_ONLINE", label: "Online" },
  { value: "DRIVER_STATUS_OFFLINE", label: "Offline" },
  { value: "DRIVER_STATUS_ONTRIP", label: "On Trip" },
  { value: "DRIVER_STATUS_ENROUTE", label: "En Route" },
  { value: "UNASSIGNED", label: "Unassigned" },
];

const ALL_MOVING: { value: MovingStatus; label: string }[] = [
  { value: "MOVING", label: "Moving" },
  { value: "PARKED", label: "Parked" },
];

function ChipButton({
  active,
  onClick,
  children,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
        "border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? (activeClass ?? "border-transparent bg-foreground text-background")
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

type FilterOverlayProps = {
  filters: FilterState;
  onToggleStatus: (s: DriverStatus) => void;
  onToggleMoving: (m: MovingStatus) => void;
  driverCount: number;
};

function FilterOverlayInner({
  filters,
  onToggleStatus,
  onToggleMoving,
  driverCount,
}: FilterOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-3">
      
      <div className="pointer-events-auto flex flex-wrap gap-1.5 rounded-xl border border-border/60 bg-background/90 backdrop-blur-sm p-2 shadow-sm">
        <span className="self-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pr-1">
          Status
        </span>
        {ALL_STATUSES.map(({ value, label }) => {
          const isActive = filters.statuses.includes(value);
          const activeClass =
            value === "DRIVER_STATUS_ONLINE"
              ? "border-transparent bg-green-500 text-white"
              : value === "DRIVER_STATUS_ONTRIP"
              ? "border-transparent bg-blue-500 text-white"
              : value === "DRIVER_STATUS_ENROUTE"
              ? "border-transparent bg-purple-500 text-white"
              : value === "DRIVER_STATUS_OFFLINE"
              ? "border-transparent bg-zinc-500 text-white"
              : "border-transparent bg-amber-500 text-white";

          return (
            <ChipButton
              key={value}
              active={isActive}
              onClick={() => onToggleStatus(value)}
              activeClass={activeClass}
            >
              {label}
            </ChipButton>
          );
        })}
      </div>

      
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <div className="flex gap-1.5 rounded-xl border border-border/60 bg-background/90 backdrop-blur-sm p-2 shadow-sm">
          {ALL_MOVING.map(({ value, label }) => (
            <ChipButton
              key={value}
              active={filters.movingStatuses.includes(value)}
              onClick={() => onToggleMoving(value)}
            >
              {label}
            </ChipButton>
          ))}
        </div>
        <div className="rounded-xl border border-border/60 bg-background/90 backdrop-blur-sm px-3 py-1.5 shadow-sm">
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {driverCount}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">drivers</span>
        </div>
      </div>
    </div>
  );
}

export const FilterOverlay = memo(FilterOverlayInner);
