import { useEffect, memo } from "react";
import { useMap } from "@/components/ui/map";

function Map3DBuildingsInner() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const sourceId = "openfreemap";
    const layerId = "3d-buildings";

    console.log("Map3DBuildings: Initializing...");

    // Force a 3D perspective
    map.easeTo({
      pitch: 60,
      bearing: -17,
      zoom: 16,
      duration: 1500
    });

    const setupLayer = () => {
      try {
        // 1. Add Source using direct Tile URL for maximum compatibility
        if (!map.getSource(sourceId)) {
          console.log("Map3DBuildings: Adding source...");
          map.addSource(sourceId, {
            type: "vector",
            // Using the direct planet URL which contains the building layer
            url: "https://tiles.openfreemap.org/planet"
          });
        }

        // 2. Add Layer
        if (!map.getLayer(layerId)) {
          console.log("Map3DBuildings: Adding layer...");
          
          map.addLayer({
            id: layerId,
            source: sourceId,
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 13, // Show even earlier for debugging
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["get", "render_height"],
                0, "lightgray",
                200, "royalblue",
                400, "lightblue"
              ],
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13, 0,
                16, ["get", "render_height"]
              ],
              "fill-extrusion-base": [
                "case",
                [">=", ["zoom"], 16],
                ["get", "render_min_height"],
                0
              ],
              "fill-extrusion-opacity": 1.0 // Fully opaque for visibility
            }
          });
          console.log("Map3DBuildings: Layer added successfully.");
        }
      } catch (err) {
        console.error("Map3DBuildings Error:", err);
      }
    };

    // Run setup
    if (map.isStyleLoaded()) {
      setupLayer();
    } else {
      map.once("styledata", setupLayer);
    }

    return () => {
      console.log("Map3DBuildings: Cleaning up...");
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      map.easeTo({ pitch: 0, duration: 500 });
    };
  }, [map, isLoaded]);

  return null;
}

export const Map3DBuildings = memo(Map3DBuildingsInner);
