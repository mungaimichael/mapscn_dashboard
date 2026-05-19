import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("gw-theme") as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        theme: getInitialTheme(),
        toggleTheme: () =>
          set(
            (s) => ({ theme: s.theme === "dark" ? "light" : "dark" }),
            false,
            "toggleTheme",
          ),
      }),
      { name: "gw-theme" },
    ),
    { name: "Theme" },
  ),
);

function syncThemeClass(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

syncThemeClass(useThemeStore.getState().theme);
useThemeStore.subscribe((s) => syncThemeClass(s.theme));
