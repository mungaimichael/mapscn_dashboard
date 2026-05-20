/**
 * Tests for useFilterStore.ts
 *
 * Covers:
 *  - toBatteryRange  — boundary values
 *  - toTimestampRange — null, invalid date, and every bucket boundary
 *  - filterDriverFeatures — identity guard, status filter, optional-field
 *    skip logic, Battery=0 skip, and combined filters
 *  - Zustand store actions — every toggle/clear pair, setStatusFilter,
 *    toggleArcHubs / toggleZenoHubs
 *
 * The zustand/middleware `persist` layer is mocked so no localStorage
 * access is required during tests.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DriverFeature } from "@/components/map/useMapData";
import type { ActiveFilters } from "./useFilterStore";

// ---------------------------------------------------------------------------
// Mock zustand middleware so `persist` is a no-op passthrough.
// This must happen before the store module is imported.
// ---------------------------------------------------------------------------
vi.mock("zustand/middleware", async (importOriginal) => {
  const actual = await importOriginal<typeof import("zustand/middleware")>();
  return {
    ...actual,
    // Replace persist with a transparent passthrough so tests never touch
    // localStorage.
    persist: (fn: unknown) => fn,
    // devtools also wraps the config creator; keep it as a passthrough too.
    devtools: (fn: unknown) => fn,
  };
});

// Import after the mock is registered so the store picks up the no-op
// middleware.
import {
  toBatteryRange,
  toTimestampRange,
  filterDriverFeatures,
  useFilterStore,
} from "./useFilterStore";
import type { FilterState } from "./useFilterStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid DriverFeature, spreading in any property overrides. */
function makeFeature(
  overrides: Partial<DriverFeature["properties"]> = {},
): DriverFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [36.8219, -1.2921] },
    properties: {
      driverName: "Alice",
      licensePlate: "KDA 001A",
      phone: "+254700000001",
      status: "DRIVER_STATUS_ONLINE",
      movingStatus: null,
      BikeMake: "Roam",
      Battery: 80,
      GPSDateTime: null,
      timestamp: null,
      Heading: null,
      VehicleSpeed: null,
      IsIgnitionOn: null,
      statusDuration: null,
      ...overrides,
    },
  };
}

/** Snapshot of the store's default state (data fields only — no functions). */
const initialState: Omit<
  FilterState,
  | "toggleStatus"
  | "toggleMoving"
  | "toggleBikeMake"
  | "toggleBatteryRange"
  | "toggleUberTimestamp"
  | "toggleGpsTimestamp"
  | "toggleArcHubs"
  | "toggleZenoHubs"
  | "setStatusFilter"
  | "clearStatuses"
  | "clearMovingStatuses"
  | "clearBikeMakes"
  | "clearBatteryRanges"
  | "clearUberTimestamps"
  | "clearGpsTimestamps"
> = {
  statuses: [
    "DRIVER_STATUS_ONLINE",
    "DRIVER_STATUS_OFFLINE",
    "DRIVER_STATUS_ONTRIP",
    "DRIVER_STATUS_ENROUTE",
    "UNASSIGNED",
  ],
  movingStatuses: ["MOVING", "PARKED"],
  bikeMakes: ["Roam", "One Electric", "KINGCHE ARC", "Roam Air", "OTHERS", "Zeno Emara"],
  batteryRanges: ["critical", "low", "good"],
  uberTimestampRanges: ["recent", "today", "this_week", "older"],
  gpsTimestampRanges: ["recent", "today", "this_week", "older"],
  showArcHubs: true,
  showZenoHubs: true,
};

/** Reset the store to its initial defaults before each test. */
function resetStore() {
  useFilterStore.setState(initialState);
}

// ---------------------------------------------------------------------------
// 1. toBatteryRange
// ---------------------------------------------------------------------------

describe("toBatteryRange", () => {
  it("returns 'critical' for 0 (no-telemetry sentinel)", () => {
    expect(toBatteryRange(0)).toBe("critical");
  });

  it("returns 'critical' for 29 (one below the low threshold)", () => {
    expect(toBatteryRange(29)).toBe("critical");
  });

  it("returns 'low' for 30 (exact low boundary)", () => {
    expect(toBatteryRange(30)).toBe("low");
  });

  it("returns 'low' for 59 (one below the good threshold)", () => {
    expect(toBatteryRange(59)).toBe("low");
  });

  it("returns 'good' for 60 (exact good boundary)", () => {
    expect(toBatteryRange(60)).toBe("good");
  });

  it("returns 'good' for 100 (full charge)", () => {
    expect(toBatteryRange(100)).toBe("good");
  });
});

// ---------------------------------------------------------------------------
// 2. toTimestampRange
// ---------------------------------------------------------------------------

describe("toTimestampRange", () => {
  it("returns 'older' for null input (field absent)", () => {
    expect(toTimestampRange(null)).toBe("older");
  });

  it("returns 'older' for an invalid date string", () => {
    expect(toTimestampRange("not-a-date")).toBe("older");
  });

  it("returns 'recent' when diff is exactly 0 ms (now)", () => {
    const now = new Date().toISOString();
    expect(toTimestampRange(now)).toBe("recent");
  });

  it("returns 'recent' when diff is exactly 1 hour (boundary inclusive)", () => {
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    expect(toTimestampRange(oneHourAgo)).toBe("recent");
  });

  it("returns 'today' when diff is 1 ms over 1 hour", () => {
    const justOverHour = new Date(Date.now() - 3_600_001).toISOString();
    expect(toTimestampRange(justOverHour)).toBe("today");
  });

  it("returns 'today' when diff is exactly 24 hours (boundary inclusive)", () => {
    const exactlyOneDay = new Date(Date.now() - 86_400_000).toISOString();
    expect(toTimestampRange(exactlyOneDay)).toBe("today");
  });

  it("returns 'this_week' when diff is 1 ms over 24 hours", () => {
    const justOverDay = new Date(Date.now() - 86_400_001).toISOString();
    expect(toTimestampRange(justOverDay)).toBe("this_week");
  });

  it("returns 'this_week' when diff is exactly 7 days (boundary inclusive)", () => {
    const exactlyOneWeek = new Date(Date.now() - 604_800_000).toISOString();
    expect(toTimestampRange(exactlyOneWeek)).toBe("this_week");
  });

  it("returns 'older' when diff is 1 ms over 7 days", () => {
    const justOverWeek = new Date(Date.now() - 604_800_001).toISOString();
    expect(toTimestampRange(justOverWeek)).toBe("older");
  });

  it("returns 'older' for a date far in the past", () => {
    expect(toTimestampRange("2020-01-01T00:00:00.000Z")).toBe("older");
  });
});

// ---------------------------------------------------------------------------
// 3. filterDriverFeatures
// ---------------------------------------------------------------------------

describe("filterDriverFeatures", () => {
  /** A permissive filter that passes every possible value for all dimensions. */
  const allPass: ActiveFilters = {
    statuses: [
      "DRIVER_STATUS_ONLINE",
      "DRIVER_STATUS_OFFLINE",
      "DRIVER_STATUS_ONTRIP",
      "DRIVER_STATUS_ENROUTE",
      "UNASSIGNED",
    ],
    movingStatuses: ["MOVING", "PARKED"],
    bikeMakes: ["Roam", "One Electric", "KINGCHE ARC", "Roam Air", "OTHERS", "Zeno Emara"],
    batteryRanges: ["critical", "low", "good"],
    uberTimestampRanges: ["recent", "today", "this_week", "older"],
    gpsTimestampRanges: ["recent", "today", "this_week", "older"],
  };

  // --- Identity guard -------------------------------------------------------

  it("drops a feature whose driverName is an empty string", () => {
    const feature = makeFeature({ driverName: "" });
    expect(filterDriverFeatures([feature], allPass)).toHaveLength(0);
  });

  it("drops a feature whose licensePlate is an empty string", () => {
    const feature = makeFeature({ licensePlate: "" });
    expect(filterDriverFeatures([feature], allPass)).toHaveLength(0);
  });

  it("keeps a feature that has both driverName and licensePlate", () => {
    const feature = makeFeature();
    expect(filterDriverFeatures([feature], allPass)).toHaveLength(1);
  });

  // --- Status filter (always applied) --------------------------------------

  it("drops a feature whose status is not in the filter set", () => {
    const feature = makeFeature({ status: "DRIVER_STATUS_OFFLINE" });
    const filters: ActiveFilters = { ...allPass, statuses: ["DRIVER_STATUS_ONLINE"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(0);
  });

  it("keeps a feature whose status is in the filter set", () => {
    const feature = makeFeature({ status: "DRIVER_STATUS_ONTRIP" });
    const filters: ActiveFilters = {
      ...allPass,
      statuses: ["DRIVER_STATUS_ONTRIP", "DRIVER_STATUS_ENROUTE"],
    };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  // --- Optional field: movingStatus ----------------------------------------

  it("skips the movingStatus check when the field is null", () => {
    // Feature has movingStatus: null — must pass even when movingStatuses filter
    // is empty (no values would match), because null means the filter is skipped.
    const feature = makeFeature({ movingStatus: null });
    const filters: ActiveFilters = { ...allPass, movingStatuses: [] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  it("drops a feature whose movingStatus is not in the filter set", () => {
    const feature = makeFeature({ movingStatus: "MOVING" });
    const filters: ActiveFilters = { ...allPass, movingStatuses: ["PARKED"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(0);
  });

  it("keeps a feature whose movingStatus is in the filter set", () => {
    const feature = makeFeature({ movingStatus: "MOVING" });
    const filters: ActiveFilters = { ...allPass, movingStatuses: ["MOVING"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  // --- Optional field: BikeMake --------------------------------------------

  it("skips the BikeMake check when the field is null", () => {
    const feature = makeFeature({ BikeMake: null as unknown as "Roam" });
    const filters: ActiveFilters = { ...allPass, bikeMakes: [] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  it("drops a feature whose BikeMake is not in the filter set", () => {
    const feature = makeFeature({ BikeMake: "Roam" });
    const filters: ActiveFilters = { ...allPass, bikeMakes: ["One Electric"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(0);
  });

  it("keeps a feature whose BikeMake is in the filter set", () => {
    const feature = makeFeature({ BikeMake: "Zeno Emara" });
    const filters: ActiveFilters = { ...allPass, bikeMakes: ["Zeno Emara"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  // --- Optional field: Battery (0 = no telemetry, skip the check) ----------

  it("skips the Battery check when Battery is 0", () => {
    // Battery: 0 is the offline sentinel — must pass even when batteryRanges is empty.
    const feature = makeFeature({ Battery: 0 });
    const filters: ActiveFilters = { ...allPass, batteryRanges: [] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  it("skips the Battery check when Battery is null", () => {
    const feature = makeFeature({ Battery: null as unknown as number });
    const filters: ActiveFilters = { ...allPass, batteryRanges: [] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  it("drops a feature when Battery is 25 (critical) and batteryRanges only includes 'good'", () => {
    const feature = makeFeature({ Battery: 25 });
    const filters: ActiveFilters = { ...allPass, batteryRanges: ["good"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(0);
  });

  it("keeps a feature when Battery is 25 (critical) and batteryRanges includes 'critical'", () => {
    const feature = makeFeature({ Battery: 25 });
    const filters: ActiveFilters = { ...allPass, batteryRanges: ["critical"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  // --- Optional field: Uber timestamp (p.timestamp) -------------------------

  it("skips the Uber timestamp check when timestamp is null", () => {
    const feature = makeFeature({ timestamp: null });
    const filters: ActiveFilters = { ...allPass, uberTimestampRanges: [] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  it("drops a feature when its Uber timestamp falls outside the filter set", () => {
    // A date two weeks ago is 'older'; only 'recent' is in the filter.
    const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const feature = makeFeature({ timestamp: twoWeeksAgo });
    const filters: ActiveFilters = { ...allPass, uberTimestampRanges: ["recent"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(0);
  });

  it("keeps a feature when its Uber timestamp falls inside the filter set", () => {
    const thirtyMinutesAgo = new Date(Date.now() - 1_800_000).toISOString();
    const feature = makeFeature({ timestamp: thirtyMinutesAgo });
    const filters: ActiveFilters = { ...allPass, uberTimestampRanges: ["recent"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  // --- Optional field: GPS timestamp (p.GPSDateTime) -----------------------

  it("skips the GPS timestamp check when GPSDateTime is null", () => {
    const feature = makeFeature({ GPSDateTime: null });
    const filters: ActiveFilters = { ...allPass, gpsTimestampRanges: [] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(1);
  });

  it("drops a feature when its GPS timestamp falls outside the filter set", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const feature = makeFeature({ GPSDateTime: twoWeeksAgo });
    const filters: ActiveFilters = { ...allPass, gpsTimestampRanges: ["recent"] };
    expect(filterDriverFeatures([feature], filters)).toHaveLength(0);
  });

  // --- Combined filters ----------------------------------------------------

  it("returns only features that satisfy all active filters simultaneously", () => {
    const online = makeFeature({
      status: "DRIVER_STATUS_ONLINE",
      movingStatus: "MOVING",
      Battery: 80, // good
    });
    const offline = makeFeature({
      status: "DRIVER_STATUS_OFFLINE",
      movingStatus: "PARKED",
      Battery: 20, // critical
    });
    const noName = makeFeature({ driverName: "", status: "DRIVER_STATUS_ONLINE" });

    const filters: ActiveFilters = {
      ...allPass,
      statuses: ["DRIVER_STATUS_ONLINE"],
      batteryRanges: ["good"],
    };

    const result = filterDriverFeatures([online, offline, noName], filters);
    expect(result).toHaveLength(1);
    expect(result[0].properties.status).toBe("DRIVER_STATUS_ONLINE");
  });

  it("returns an empty array when the features input is empty", () => {
    expect(filterDriverFeatures([], allPass)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Zustand store actions
// ---------------------------------------------------------------------------

describe("useFilterStore — store actions", () => {
  beforeEach(resetStore);

  // --- toggleStatus --------------------------------------------------------

  it("toggleStatus removes a status that is already present", () => {
    useFilterStore.getState().toggleStatus("DRIVER_STATUS_ONLINE");
    expect(useFilterStore.getState().statuses).not.toContain("DRIVER_STATUS_ONLINE");
  });

  it("toggleStatus adds a status that is not currently present", () => {
    // Remove it first, then re-add.
    useFilterStore.getState().toggleStatus("DRIVER_STATUS_ONLINE");
    useFilterStore.getState().toggleStatus("DRIVER_STATUS_ONLINE");
    expect(useFilterStore.getState().statuses).toContain("DRIVER_STATUS_ONLINE");
  });

  it("toggleStatus does not alter other statuses in the array", () => {
    const before = useFilterStore.getState().statuses.filter(
      (s) => s !== "DRIVER_STATUS_ONLINE",
    );
    useFilterStore.getState().toggleStatus("DRIVER_STATUS_ONLINE");
    expect(useFilterStore.getState().statuses).toEqual(before);
  });

  // --- clearStatuses -------------------------------------------------------

  it("clearStatuses resets statuses to all five default values", () => {
    useFilterStore.getState().toggleStatus("DRIVER_STATUS_ONLINE");
    useFilterStore.getState().toggleStatus("DRIVER_STATUS_OFFLINE");
    useFilterStore.getState().clearStatuses();
    expect(useFilterStore.getState().statuses).toEqual(initialState.statuses);
  });

  // --- setStatusFilter -----------------------------------------------------

  it("setStatusFilter(value) isolates to a single-element array", () => {
    useFilterStore.getState().setStatusFilter("DRIVER_STATUS_ONTRIP");
    expect(useFilterStore.getState().statuses).toEqual(["DRIVER_STATUS_ONTRIP"]);
  });

  it("setStatusFilter(null) resets statuses to all defaults", () => {
    useFilterStore.getState().setStatusFilter("DRIVER_STATUS_ONTRIP");
    useFilterStore.getState().setStatusFilter(null);
    expect(useFilterStore.getState().statuses).toEqual(initialState.statuses);
  });

  // --- toggleMoving / clearMovingStatuses ----------------------------------

  it("toggleMoving removes MOVING when it is present", () => {
    useFilterStore.getState().toggleMoving("MOVING");
    expect(useFilterStore.getState().movingStatuses).not.toContain("MOVING");
  });

  it("toggleMoving adds MOVING after it was removed", () => {
    useFilterStore.getState().toggleMoving("MOVING");
    useFilterStore.getState().toggleMoving("MOVING");
    expect(useFilterStore.getState().movingStatuses).toContain("MOVING");
  });

  it("clearMovingStatuses resets to both default moving statuses", () => {
    useFilterStore.getState().toggleMoving("MOVING");
    useFilterStore.getState().clearMovingStatuses();
    expect(useFilterStore.getState().movingStatuses).toEqual(initialState.movingStatuses);
  });

  // --- toggleBikeMake / clearBikeMakes -------------------------------------

  it("toggleBikeMake removes a bike make that is present", () => {
    useFilterStore.getState().toggleBikeMake("Roam");
    expect(useFilterStore.getState().bikeMakes).not.toContain("Roam");
  });

  it("toggleBikeMake adds a bike make that was removed", () => {
    useFilterStore.getState().toggleBikeMake("Roam");
    useFilterStore.getState().toggleBikeMake("Roam");
    expect(useFilterStore.getState().bikeMakes).toContain("Roam");
  });

  it("clearBikeMakes resets to all six default bike makes", () => {
    useFilterStore.getState().toggleBikeMake("Roam");
    useFilterStore.getState().toggleBikeMake("One Electric");
    useFilterStore.getState().clearBikeMakes();
    expect(useFilterStore.getState().bikeMakes).toEqual(initialState.bikeMakes);
  });

  // --- toggleBatteryRange / clearBatteryRanges -----------------------------

  it("toggleBatteryRange removes 'critical' when present", () => {
    useFilterStore.getState().toggleBatteryRange("critical");
    expect(useFilterStore.getState().batteryRanges).not.toContain("critical");
  });

  it("toggleBatteryRange adds 'critical' after it was removed", () => {
    useFilterStore.getState().toggleBatteryRange("critical");
    useFilterStore.getState().toggleBatteryRange("critical");
    expect(useFilterStore.getState().batteryRanges).toContain("critical");
  });

  it("clearBatteryRanges resets to all three default ranges", () => {
    useFilterStore.getState().toggleBatteryRange("critical");
    useFilterStore.getState().clearBatteryRanges();
    expect(useFilterStore.getState().batteryRanges).toEqual(initialState.batteryRanges);
  });

  // --- toggleUberTimestamp / clearUberTimestamps ---------------------------

  it("toggleUberTimestamp removes 'older' when present", () => {
    useFilterStore.getState().toggleUberTimestamp("older");
    expect(useFilterStore.getState().uberTimestampRanges).not.toContain("older");
  });

  it("toggleUberTimestamp adds 'older' after it was removed", () => {
    useFilterStore.getState().toggleUberTimestamp("older");
    useFilterStore.getState().toggleUberTimestamp("older");
    expect(useFilterStore.getState().uberTimestampRanges).toContain("older");
  });

  it("clearUberTimestamps resets to all four default timestamp ranges", () => {
    useFilterStore.getState().toggleUberTimestamp("recent");
    useFilterStore.getState().clearUberTimestamps();
    expect(useFilterStore.getState().uberTimestampRanges).toEqual(
      initialState.uberTimestampRanges,
    );
  });

  // --- toggleGpsTimestamp / clearGpsTimestamps -----------------------------

  it("toggleGpsTimestamp removes 'this_week' when present", () => {
    useFilterStore.getState().toggleGpsTimestamp("this_week");
    expect(useFilterStore.getState().gpsTimestampRanges).not.toContain("this_week");
  });

  it("toggleGpsTimestamp adds 'this_week' after it was removed", () => {
    useFilterStore.getState().toggleGpsTimestamp("this_week");
    useFilterStore.getState().toggleGpsTimestamp("this_week");
    expect(useFilterStore.getState().gpsTimestampRanges).toContain("this_week");
  });

  it("clearGpsTimestamps resets to all four default timestamp ranges", () => {
    useFilterStore.getState().toggleGpsTimestamp("recent");
    useFilterStore.getState().clearGpsTimestamps();
    expect(useFilterStore.getState().gpsTimestampRanges).toEqual(
      initialState.gpsTimestampRanges,
    );
  });

  // --- toggleArcHubs -------------------------------------------------------

  it("toggleArcHubs flips showArcHubs from true to false", () => {
    expect(useFilterStore.getState().showArcHubs).toBe(true);
    useFilterStore.getState().toggleArcHubs();
    expect(useFilterStore.getState().showArcHubs).toBe(false);
  });

  it("toggleArcHubs flips showArcHubs back to true on second call", () => {
    useFilterStore.getState().toggleArcHubs();
    useFilterStore.getState().toggleArcHubs();
    expect(useFilterStore.getState().showArcHubs).toBe(true);
  });

  it("toggleArcHubs does not affect showZenoHubs", () => {
    useFilterStore.getState().toggleArcHubs();
    expect(useFilterStore.getState().showZenoHubs).toBe(true);
  });

  // --- toggleZenoHubs ------------------------------------------------------

  it("toggleZenoHubs flips showZenoHubs from true to false", () => {
    expect(useFilterStore.getState().showZenoHubs).toBe(true);
    useFilterStore.getState().toggleZenoHubs();
    expect(useFilterStore.getState().showZenoHubs).toBe(false);
  });

  it("toggleZenoHubs flips showZenoHubs back to true on second call", () => {
    useFilterStore.getState().toggleZenoHubs();
    useFilterStore.getState().toggleZenoHubs();
    expect(useFilterStore.getState().showZenoHubs).toBe(true);
  });

  it("toggleZenoHubs does not affect showArcHubs", () => {
    useFilterStore.getState().toggleZenoHubs();
    expect(useFilterStore.getState().showArcHubs).toBe(true);
  });

  // --- Independence of filter slices ---------------------------------------

  it("a clear action on one slice does not affect any other slice", () => {
    // Mutate statuses, then clear only battery — statuses should still reflect
    // the mutation.
    useFilterStore.getState().toggleStatus("DRIVER_STATUS_ONLINE");
    useFilterStore.getState().clearBatteryRanges();

    const state = useFilterStore.getState();
    // Statuses still has the toggled state (one item removed)
    expect(state.statuses).not.toContain("DRIVER_STATUS_ONLINE");
    // Battery was cleared back to defaults
    expect(state.batteryRanges).toEqual(initialState.batteryRanges);
    // Everything else is untouched
    expect(state.movingStatuses).toEqual(initialState.movingStatuses);
    expect(state.bikeMakes).toEqual(initialState.bikeMakes);
    expect(state.uberTimestampRanges).toEqual(initialState.uberTimestampRanges);
    expect(state.gpsTimestampRanges).toEqual(initialState.gpsTimestampRanges);
  });
});
