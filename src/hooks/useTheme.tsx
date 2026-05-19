/**
 * useTheme — thin compatibility shim over useThemeStore.
 *
 * The old ThemeProvider context is no longer needed; useThemeStore handles
 * persistence and <html> class syncing internally. This file is kept so that
 * any future call-sites using the `useTheme` name continue to work.
 */
export { useThemeStore as useTheme } from "@/store";
