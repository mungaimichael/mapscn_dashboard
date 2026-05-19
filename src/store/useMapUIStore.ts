import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface MapUIState {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;

  selectedDriverId: string | null;
  setSelectedDriver: (id: string | null) => void;
  toggleSelectedDriver: (id: string) => void;

  is3DMode: boolean;
  toggle3DMode: () => void;
}

export const useMapUIStore = create<MapUIState>()(
  devtools(
    (set) => ({
      isSidebarOpen: false,
      openSidebar: () => set({ isSidebarOpen: true }, false, "openSidebar"),
      closeSidebar: () => set({ isSidebarOpen: false }, false, "closeSidebar"),

      selectedDriverId: null,
      setSelectedDriver: (id) =>
        set({ selectedDriverId: id }, false, "setSelectedDriver"),
      toggleSelectedDriver: (id) =>
        set(
          (s) => ({
            selectedDriverId: s.selectedDriverId === id ? null : id,
          }),
          false,
          "toggleSelectedDriver",
        ),

      is3DMode: false,
      toggle3DMode: () =>
        set((s) => ({ is3DMode: !s.is3DMode }), false, "toggle3DMode"),
    }),
    { name: "MapUI" },
  ),
);
