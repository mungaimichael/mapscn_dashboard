import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { DriverStatus, MovingStatus } from "@/components/map/useMapData";

export type BikeMakeFilter = "Roam" | "One Electric" | "KINGCHE ARC" | "Roam Air";

export interface FilterState {
  statuses: DriverStatus[];
  movingStatuses: MovingStatus[];
  bikeMakes: BikeMakeFilter[];
  showArcHubs: boolean;
  showZenoHubs: boolean;

  toggleStatus: (s: DriverStatus) => void;
  toggleMoving: (m: MovingStatus) => void;
  toggleArcHubs: () => void;
  toggleZenoHubs: () => void;
  setStatusFilter: (s: DriverStatus | null) => void;
}

const DEFAULT_STATUSES: DriverStatus[] = [
  "DRIVER_STATUS_ONLINE",
  "DRIVER_STATUS_OFFLINE",
  "DRIVER_STATUS_ONTRIP",
  "DRIVER_STATUS_ENROUTE",
  "UNASSIGNED",
];

const DEFAULT_MOVING: MovingStatus[] = ["MOVING", "PARKED"];

const DEFAULT_BIKE_MAKES: BikeMakeFilter[] = [
  "Roam",
  "One Electric",
  "KINGCHE ARC",
  "Roam Air",
];

export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set) => ({
        statuses: DEFAULT_STATUSES,
        movingStatuses: DEFAULT_MOVING,
        bikeMakes: DEFAULT_BIKE_MAKES,
        showArcHubs: true,
        showZenoHubs: true,

        toggleStatus: (s) =>
          set(
            (state) => ({
              statuses: state.statuses.includes(s)
                ? state.statuses.filter((x) => x !== s)
                : [...state.statuses, s],
            }),
            false,
            "toggleStatus",
          ),

        toggleMoving: (m) =>
          set(
            (state) => ({
              movingStatuses: state.movingStatuses.includes(m)
                ? state.movingStatuses.filter((x) => x !== m)
                : [...state.movingStatuses, m],
            }),
            false,
            "toggleMoving",
          ),

        toggleArcHubs: () =>
          set((s) => ({ showArcHubs: !s.showArcHubs }), false, "toggleArcHubs"),

        toggleZenoHubs: () =>
          set(
            (s) => ({ showZenoHubs: !s.showZenoHubs }),
            false,
            "toggleZenoHubs",
          ),

        setStatusFilter: (status) =>
          set(
            { statuses: status ? [status] : DEFAULT_STATUSES },
            false,
            "setStatusFilter",
          ),
      }),
      {
        name: "map-filters",
        partialize: (state) => ({
          statuses: state.statuses,
          movingStatuses: state.movingStatuses,
          bikeMakes: state.bikeMakes,
          showArcHubs: state.showArcHubs,
          showZenoHubs: state.showZenoHubs,
        }),
      },
    ),
    { name: "Filters" },
  ),
);
