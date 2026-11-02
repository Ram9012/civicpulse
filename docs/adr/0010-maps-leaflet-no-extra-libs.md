# ADR 0010: Leaflet + OpenStreetMap, hand-rolled map tools

**Status:** accepted. **Decider:** Ramansh.

## Context
We need a location picker, a report map, and the reference site's extras: clusters, heatmap, satellite layer, export.

## Decision
- **Leaflet** via `react-leaflet`, with **OpenStreetMap** tiles. Satellite view uses Esri World Imagery tiles. No API keys, no billing.
- Markers are `CircleMarker`s (avoids Leaflet's default-icon bundling problems with Vite).
- **Clusters** are a small grid-bucketing function that depends on zoom. **Heatmap** is large translucent circles that darken where they overlap. **Export** builds a GeoJSON file in the browser. All live in `apps/web/src/components/maps.tsx`.

## Why
- No paid service or secret to manage; fits the free-tier constraint.
- Plugins like `leaflet.markercluster` and `leaflet.heat` would add dependencies and wrapper code for features we can approximate in ~60 lines.
- Everything stays inside the frontend, so Jerome owns it end to end.

## Alternatives rejected
- **Google Maps / Mapbox:** need keys and billing.
- **Heavy GIS libraries (deck.gl, MapLibre GL):** overkill, larger bundle.

## Consequences
- OSM's public tile server has a usage policy; fine for a prototype, but a production launch should use a tile provider or self-hosted tiles.
- The grid clusters and circle heatmap are approximations, not true kernel density. Fine for hundreds of points; rework if we reach thousands.
- Reverse geocoding (address from pin) is not included; users type an area label instead, which also keeps exact addresses off public pages.
