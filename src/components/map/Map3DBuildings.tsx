import { useEffect, memo } from "react";
import { useMap } from "@/components/ui/map";

type Map3DBuildingsProps = {
  enabled?: boolean;
};

function Map3DBuildingsInner({ enabled = true }: Map3DBuildingsProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const layerId = "3d-buildings";

    if (!enabled) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      return;
    }

    // Force a 3D perspective
    map.easeTo({
      pitch: 60,
      bearing: -17,
      zoom: 16,
      duration: 1500
    });

    const setupLayer = () => {
      try {
        // The base map style from Carto already provides a source named 'carto'
        const sourceId = "carto";

        // 2. Add Layer beneath symbols
        if (!map.getLayer(layerId)) {
          const layers = map.getStyle().layers;
          let labelLayerId;
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout && (layers[i].layout as any)['text-field']) {
              labelLayerId = layers[i].id;
              break;
            }
          }
          
          map.addLayer({
            id: layerId,
            source: sourceId,
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "render_height"], 10],
                0, "lightgray",
                200, "royalblue",
                400, "lightblue"
              ],
              "fill-extrusion-height": ["coalesce", ["get", "render_height"], 15],
              "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
              "fill-extrusion-opacity": 0.8
            }
          }, labelLayerId);
        }
      } catch (err) {
        console.error("Map3DBuildings Error:", err);
      }
    };

    if (map.isStyleLoaded()) {
      setupLayer();
    } else {
      map.once("styledata", setupLayer);
    }
    
    return () => {
      // Remove layer if component unmounts
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    };
  }, [map, isLoaded, enabled]);

  return null;
}

export const Map3DBuildings = memo(Map3DBuildingsInner);
