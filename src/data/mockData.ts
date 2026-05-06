import type { DriverGeoJSON, HubGeoJSON } from "@/components/map/useMapData";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rnd(min: number, max: number, decimals = 6) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function batteryForStatus(
  status: string,
  moving: string
): number {
  // Offline bikes tend to be low battery; moving ones are mid-range
  if (status === "DRIVER_STATUS_OFFLINE") return rnd(5, 35, 0);
  if (moving === "MOVING") return rnd(35, 92, 0);
  return rnd(20, 80, 0);
}

// ---------------------------------------------------------------------------
// Driver mock data  (~45 drivers spread across Nairobi)
// ---------------------------------------------------------------------------
const DRIVER_SEED: {
  name: string;
  phone: string;
  plate: string;
  make: string;
  status: string;
  moving: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
}[] = [
  // --- CBD & Nairobi West ---
  { name: "James Kamau", phone: "0712345601", plate: "KMGN835C", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.2841, lng: 36.8237, heading: 45, speed: 28 },
  { name: "Peter Otieno", phone: "0712345602", plate: "KMGL860S", make: "Roam", status: "DRIVER_STATUS_ONTRIP", moving: "MOVING", lat: -1.2923, lng: 36.8195, heading: 180, speed: 34 },
  { name: "Samuel Njoroge", phone: "0712345603", plate: "KMGK638Y", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.2890, lng: 36.8245, heading: 0, speed: 0 },
  { name: "David Mutua", phone: "0712345604", plate: "KMGL001K", make: "One Electric", status: "DRIVER_STATUS_OFFLINE", moving: "PARKED", lat: -1.2867, lng: 36.8178, heading: 270, speed: 0 },
  { name: "Collins Waweru", phone: "0712345605", plate: "KMGM068S", make: "KINGCHE ARC", status: "DRIVER_STATUS_ENROUTE", moving: "MOVING", lat: -1.2798, lng: 36.8312, heading: 90, speed: 42 },

  // --- Westlands / Parklands ---
  { name: "Brian Omondi", phone: "0712345606", plate: "KMGN873C", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.2641, lng: 36.8052, heading: 135, speed: 22 },
  { name: "Alex Kiprotich", phone: "0712345607", plate: "KMGK641Y", make: "Roam", status: "DRIVER_STATUS_ONTRIP", moving: "MOVING", lat: -1.2689, lng: 36.8123, heading: 200, speed: 30 },
  { name: "Kevin Mwangi", phone: "0712345608", plate: "KMGL835S", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.2714, lng: 36.7992, heading: 0, speed: 0 },
  { name: "Emmanuel Kiptoo", phone: "0712345609", plate: "KMGL002K", make: "One Electric", status: "DRIVER_STATUS_OFFLINE", moving: "PARKED", lat: -1.2756, lng: 36.8017, heading: 0, speed: 0 },

  // --- Kilimani / Lavington ---
  { name: "Isaac Maina", phone: "0712345610", plate: "KMGM080S", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.2902, lng: 36.7841, heading: 310, speed: 25 },
  { name: "Dennis Cheruiyot", phone: "0712345611", plate: "KMGK654Y", make: "Roam", status: "DRIVER_STATUS_ONTRIP", moving: "MOVING", lat: -1.2958, lng: 36.7789, heading: 60, speed: 38 },
  { name: "George Njuguna", phone: "0712345612", plate: "KMGL836S", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.2871, lng: 36.7903, heading: 0, speed: 0 },

  // --- Karen / Langata ---
  { name: "Felix Ndungu", phone: "0712345613", plate: "KMGM085S", make: "KINGCHE ARC", status: "DRIVER_STATUS_OFFLINE", moving: "PARKED", lat: -1.3347, lng: 36.7133, heading: 0, speed: 0 },
  { name: "Paul Muthoni", phone: "0712345614", plate: "KMGK649Y", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.3412, lng: 36.7212, heading: 45, speed: 20 },
  { name: "Martin Korir", phone: "0712345615", plate: "KMGL003K", make: "One Electric", status: "DRIVER_STATUS_ENROUTE", moving: "MOVING", lat: -1.3289, lng: 36.7445, heading: 90, speed: 45 },
  { name: "Simon Kariuki", phone: "0712345616", plate: "KMGN880A", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.3378, lng: 36.7382, heading: 0, speed: 0 },

  // --- South B / South C ---
  { name: "Patrick Gitonga", phone: "0712345617", plate: "KMGM090S", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONTRIP", moving: "MOVING", lat: -1.3078, lng: 36.8312, heading: 270, speed: 33 },
  { name: "Stephen Wangui", phone: "0712345618", plate: "KMGK652Y", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.3145, lng: 36.8245, heading: 180, speed: 27 },
  { name: "Joseph Mugo", phone: "0712345619", plate: "KMGL837S", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.3214, lng: 36.8189, heading: 0, speed: 0 },
  { name: "Charles Wekesa", phone: "0712345620", plate: "KMGL004K", make: "One Electric", status: "DRIVER_STATUS_OFFLINE", moving: "PARKED", lat: -1.3012, lng: 36.8423, heading: 0, speed: 0 },

  // --- Industrial Area / Uhuru Highway ---
  { name: "Victor Ochieng", phone: "0712345621", plate: "KMGM095S", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.3089, lng: 36.8445, heading: 0, speed: 18 },
  { name: "Francis Mwenda", phone: "0712345622", plate: "KMGK645Y", make: "Roam", status: "DRIVER_STATUS_ENROUTE", moving: "MOVING", lat: -1.3123, lng: 36.8512, heading: 45, speed: 52 },
  { name: "Michael Kimani", phone: "0712345623", plate: "KMGL838S", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.3056, lng: 36.8589, heading: 0, speed: 0 },

  // --- Eastleigh / Pangani ---
  { name: "Robert Kamande", phone: "0712345624", plate: "KMGN808C", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONTRIP", moving: "MOVING", lat: -1.2734, lng: 36.8534, heading: 135, speed: 29 },
  { name: "Andrew Mutugi", phone: "0712345625", plate: "KMGK658Y", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.2678, lng: 36.8612, heading: 90, speed: 21 },
  { name: "John Maina", phone: "0712345626", plate: "KMGL005K", make: "One Electric", status: "DRIVER_STATUS_OFFLINE", moving: "PARKED", lat: -1.2812, lng: 36.8678, heading: 0, speed: 0 },
  { name: "Anthony Odhiambo", phone: "0712345627", plate: "KMGN814A", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.2589, lng: 36.8489, heading: 0, speed: 0 },

  // --- Kasarani / Thika Road ---
  { name: "Christopher Ngethe", phone: "0712345628", plate: "KMGM097S", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.2189, lng: 36.8945, heading: 45, speed: 36 },
  { name: "Timothy Mwai", phone: "0712345629", plate: "KMGK660Y", make: "Roam", status: "DRIVER_STATUS_ENROUTE", moving: "MOVING", lat: -1.2312, lng: 36.8812, heading: 200, speed: 48 },
  { name: "Daniel Omollo", phone: "0712345630", plate: "KMGL839S", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.2445, lng: 36.8723, heading: 0, speed: 0 },
  { name: "Joshua Wachira", phone: "0712345631", plate: "KMGN820A", make: "KINGCHE ARC", status: "DRIVER_STATUS_OFFLINE", moving: "PARKED", lat: -1.2156, lng: 36.9012, heading: 0, speed: 0 },

  // --- Ruiru / Juja ---
  { name: "Solomon Wanjiku", phone: "0712345632", plate: "KMGP084X", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONTRIP", moving: "MOVING", lat: -1.1512, lng: 36.9589, heading: 90, speed: 44 },
  { name: "Henry Mutiso", phone: "0712345633", plate: "KMGL840S", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.1678, lng: 36.9412, heading: 270, speed: 31 },
  { name: "Nicholas Kamau", phone: "0712345634", plate: "KMGL006K", make: "One Electric", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.1823, lng: 36.9234, heading: 0, speed: 0 },

  // --- Kikuyu / Limuru Road ---
  { name: "Elijah Kipchumba", phone: "0712345635", plate: "KMGP091X", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.2489, lng: 36.6623, heading: 315, speed: 26 },
  { name: "Richard Njoki", phone: "0712345636", plate: "KMGK682Y", make: "Roam", status: "DRIVER_STATUS_OFFLINE", moving: "PARKED", lat: -1.2567, lng: 36.6789, heading: 0, speed: 0 },
  { name: "Steven Mwangi", phone: "0712345637", plate: "KMGL841S", make: "Roam", status: "DRIVER_STATUS_ENROUTE", moving: "MOVING", lat: -1.2412, lng: 36.6912, heading: 45, speed: 39 },

  // --- Rongai / Ngong ---
  { name: "Benjamin Omondi", phone: "0712345638", plate: "KMGM955K", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.3978, lng: 36.7445, heading: 180, speed: 22 },
  { name: "Lawrence Wairimu", phone: "0712345639", plate: "KMGK670Y", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.3845, lng: 36.7312, heading: 0, speed: 0 },
  { name: "Ernest Muriuki", phone: "0712345640", plate: "KMGL155Y", make: "KINGCHE ARC", status: "DRIVER_STATUS_OFFLINE", moving: "PARKED", lat: -1.3712, lng: 36.7567, heading: 0, speed: 0 },

  // --- Embakasi / Airport ---
  { name: "Walter Kimwele", phone: "0712345641", plate: "KMGP094X", make: "KINGCHE ARC", status: "DRIVER_STATUS_ONTRIP", moving: "MOVING", lat: -1.3134, lng: 36.8934, heading: 90, speed: 37 },
  { name: "Caleb Gitau", phone: "0712345642", plate: "KMGK672Y", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "MOVING", lat: -1.3278, lng: 36.9012, heading: 45, speed: 28 },
  { name: "Albert Kamau", phone: "0712345643", plate: "KMGL842S", make: "Roam", status: "DRIVER_STATUS_ONLINE", moving: "PARKED", lat: -1.3389, lng: 36.9145, heading: 0, speed: 0 },
  { name: "Raymond Oduya", phone: "0712345644", plate: "UNASSIGNED", make: "Roam", status: "UNASSIGNED", moving: "PARKED", lat: -1.3023, lng: 36.8756, heading: 0, speed: 0 },
  { name: "Edwin Muthoka", phone: "0712345645", plate: "UNASSIGNED", make: "KINGCHE ARC", status: "UNASSIGNED", moving: "PARKED", lat: -1.2934, lng: 36.8867, heading: 0, speed: 0 },
];

// ---------------------------------------------------------------------------
// Build driver GeoJSON
// ---------------------------------------------------------------------------
export const MOCK_DRIVERS: DriverGeoJSON = {
  type: "FeatureCollection",
  features: DRIVER_SEED.map((d, i) => {
    const battery = batteryForStatus(d.status, d.moving);
    return {
      type: "Feature",
      id: i + 1,
      geometry: {
        type: "Point",
        coordinates: [d.lng + rnd(-0.003, 0.003), d.lat + rnd(-0.003, 0.003)],
      },
      properties: {
        driverName: d.name,
        licensePlate: d.plate,
        phone: d.phone,
        status: d.status as any,
        movingStatus: d.moving as any,
        BikeMake: d.make as any,
        Battery: battery,
        GPSDateTime: new Date(Date.now() - rnd(0, 300_000, 0)).toISOString(),
        timestamp: new Date().toISOString(),
        Heading: d.heading,
        VehicleSpeed: d.moving === "PARKED" ? 0 : d.speed + rnd(-5, 5, 0),
        IsIgnitionOn: d.moving === "MOVING",
        statusDuration: rnd(0, 7200, 0),
      },
    };
  }),
};

// ---------------------------------------------------------------------------
// Arc Ride swap stations (battery full = full batteries ready to swap)
// ---------------------------------------------------------------------------
export const MOCK_ARC_HUBS: HubGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: 1,
      geometry: { type: "Point", coordinates: [36.8923, -1.2680] },
      properties: {
        name: "Umoja Hub",
        full: 8,
        total_charging: 5,
        total_batteries: 16,
        availableswaps: 8,
        last_updated: "2025-05-06 13:55",
        chargingbin1: 2,
        chargingbin2: 1,
        chargingbin3: 1,
        chargingbin4: 1,
      },
    },
    {
      type: "Feature",
      id: 2,
      geometry: { type: "Point", coordinates: [36.9052, -1.2601] },
      properties: {
        name: "Kayole Hub",
        full: 3,
        total_charging: 8,
        total_batteries: 16,
        availableswaps: 3,
        last_updated: "2025-05-06 14:02",
        chargingbin1: 3,
        chargingbin2: 2,
        chargingbin3: 2,
        chargingbin4: 1,
      },
    },
    {
      type: "Feature",
      id: 3,
      geometry: { type: "Point", coordinates: [36.8934, -1.1889] },
      properties: {
        name: "Githurai Hub",
        full: 11,
        total_charging: 3,
        total_batteries: 16,
        availableswaps: 11,
        last_updated: "2025-05-06 13:48",
        chargingbin1: 1,
        chargingbin2: 1,
        chargingbin3: 1,
        chargingbin4: 0,
      },
    },
    {
      type: "Feature",
      id: 4,
      geometry: { type: "Point", coordinates: [36.7734, -1.2489] },
      properties: {
        name: "Kinoo Hub",
        full: 5,
        total_charging: 6,
        total_batteries: 16,
        availableswaps: 5,
        last_updated: "2025-05-06 13:59",
        chargingbin1: 2,
        chargingbin2: 2,
        chargingbin3: 1,
        chargingbin4: 1,
      },
    },
    {
      type: "Feature",
      id: 5,
      geometry: { type: "Point", coordinates: [36.6623, -1.2478] },
      properties: {
        name: "Kikuyu Hub",
        full: 9,
        total_charging: 4,
        total_batteries: 16,
        availableswaps: 9,
        last_updated: "2025-05-06 14:05",
        chargingbin1: 2,
        chargingbin2: 1,
        chargingbin3: 1,
        chargingbin4: 0,
      },
    },
    {
      type: "Feature",
      id: 6,
      geometry: { type: "Point", coordinates: [36.7634, -1.2789] },
      properties: {
        name: "Kawangware Hub",
        full: 2,
        total_charging: 9,
        total_batteries: 16,
        availableswaps: 2,
        last_updated: "2025-05-06 14:01",
        chargingbin1: 3,
        chargingbin2: 3,
        chargingbin3: 2,
        chargingbin4: 1,
      },
    },
    {
      type: "Feature",
      id: 7,
      geometry: { type: "Point", coordinates: [36.8512, -1.2656] },
      properties: {
        name: "Pangani Hub",
        full: 7,
        total_charging: 5,
        total_batteries: 16,
        availableswaps: 7,
        last_updated: "2025-05-06 13:52",
        chargingbin1: 2,
        chargingbin2: 1,
        chargingbin3: 1,
        chargingbin4: 1,
      },
    },
    {
      type: "Feature",
      id: 8,
      geometry: { type: "Point", coordinates: [36.8234, -1.3134] },
      properties: {
        name: "Mombasa Road Hub",
        full: 12,
        total_charging: 2,
        total_batteries: 16,
        availableswaps: 12,
        last_updated: "2025-05-06 14:10",
        chargingbin1: 1,
        chargingbin2: 1,
        chargingbin3: 0,
        chargingbin4: 0,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Zeno swap stations
// ---------------------------------------------------------------------------
export const MOCK_ZENO_HUBS: HubGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: 101,
      geometry: { type: "Point", coordinates: [36.7767, -1.3145] },
      properties: {
        name: "Ngong Road Station",
        full: 6,
        total_charging: 4,
        total_batteries: 12,
        availableswaps: 6,
        last_updated: "2025-05-06 14:03",
        chargingbin1: 2,
        chargingbin2: 1,
        chargingbin3: 1,
        chargingbin4: 0,
      },
    },
    {
      type: "Feature",
      id: 102,
      geometry: { type: "Point", coordinates: [36.8534, -1.2712] },
      properties: {
        name: "Eastleigh Station",
        full: 1,
        total_charging: 7,
        total_batteries: 12,
        availableswaps: 1,
        last_updated: "2025-05-06 13:57",
        chargingbin1: 3,
        chargingbin2: 2,
        chargingbin3: 2,
        chargingbin4: 0,
      },
    },
    {
      type: "Feature",
      id: 103,
      geometry: { type: "Point", coordinates: [36.8045, -1.2912] },
      properties: {
        name: "Haile Selassie Station",
        full: 10,
        total_charging: 2,
        total_batteries: 12,
        availableswaps: 10,
        last_updated: "2025-05-06 14:08",
        chargingbin1: 1,
        chargingbin2: 1,
        chargingbin3: 0,
        chargingbin4: 0,
      },
    },
    {
      type: "Feature",
      id: 104,
      geometry: { type: "Point", coordinates: [36.8845, -1.3289] },
      properties: {
        name: "Embakasi Station",
        full: 4,
        total_charging: 5,
        total_batteries: 12,
        availableswaps: 4,
        last_updated: "2025-05-06 14:00",
        chargingbin1: 2,
        chargingbin2: 2,
        chargingbin3: 1,
        chargingbin4: 0,
      },
    },
    {
      type: "Feature",
      id: 105,
      geometry: { type: "Point", coordinates: [36.7245, -1.3345] },
      properties: {
        name: "Karen Station",
        full: 8,
        total_charging: 3,
        total_batteries: 12,
        availableswaps: 8,
        last_updated: "2025-05-06 14:06",
        chargingbin1: 1,
        chargingbin2: 1,
        chargingbin3: 1,
        chargingbin4: 0,
      },
    },
  ],
};
