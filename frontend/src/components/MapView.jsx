// frontend/src/components/MapView.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { weatherApi } from '../api';
import './MapView.css';

// Leaflet's default marker icon path breaks under Vite's bundling since it
// expects the images to be served from a relative path that doesn't survive
// bundling - point it at CDN-hosted marker images instead of patching webpack.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ---------------------------------------------------------------------------
// Generic multi-stop color interpolation. Each layer below defines its own
// gradient as a list of [position 0-1, hex color] stops - this walks to the
// right bracket and blends between the two nearest stops, so we get one
// color function that works for a 3-stop red/yellow/green scale AND a
// 6-stop AQI scale without duplicating the blending logic per layer.
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  };
}

function blend(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function colorForStops(t, stops) {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const [posA, colorA] = stops[i];
    const [posB, colorB] = stops[i + 1];
    if (clamped >= posA && clamped <= posB) {
      const localT = posB === posA ? 0 : (clamped - posA) / (posB - posA);
      return blend(colorA, colorB, localT);
    }
  }
  return stops[stops.length - 1][1];
}

// leaflet.heat wants its gradient as a plain {position: color} object rather
// than the [position, color] tuples the rest of this file uses - convert
// once per layer instead of keeping two parallel formats by hand.
function stopsToHeatGradient(stops) {
  return Object.fromEntries(stops);
}

// ---------------------------------------------------------------------------
// Layer definitions. Each one reuses the SAME grid-point data the backend
// already fetches for the persona score - no extra API calls - just reads a
// different field off each point and colors it with its own scale. Adding a
// new overlay later means adding one entry here, not touching the map logic.
// ---------------------------------------------------------------------------
const LAYERS = {
  zones: {
    label: 'Persona Zones',
    icon: '🎯',
    valueKey: 'score',
    normalize: (v) => v / 100,
    stops: [[0, '#ef4444'], [0.5, '#facc15'], [1, '#22c55e']],
    legend: ['Unhealthy', 'Good'],
    tooltip: (p) => `${p.score}/100 · ${p.category}`,
    popupTitle: (p, persona) => `${persona} suitability: ${p.score}/100`,
    popupBody: (p) => p.category,
    note: (persona) =>
      `Zones approximate ${persona || 'persona'} suitability from sampled points near the map's current center - not dense sensor coverage. Pan the map to sample a new area.`
  },
  wind: {
    label: 'Wind Speed',
    icon: '💨',
    valueKey: 'wind',
    // 40 km/h is a reasonable "strong for a city day" ceiling - anything at
    // or above that saturates to the top color instead of needing a higher,
    // rarely-reached max to normalize against.
    normalize: (v) => v / 40,
    stops: [[0, '#e0f2fe'], [0.5, '#38bdf8'], [1, '#1e3a8a']],
    legend: ['Calm', 'Windy'],
    tooltip: (p) => `${p.wind} km/h`,
    popupTitle: (p) => `Wind speed: ${p.wind} km/h`,
    popupBody: () => null,
    note: () =>
      'Wind speed sampled from points near the map\'s current center - not dense sensor coverage. Pan the map to sample a new area.'
  },
  aqi: {
    label: 'Air Quality',
    icon: '🌫️',
    valueKey: 'aqi',
    // US-EPA index runs 1 (Good) to 6 (Hazardous).
    normalize: (v) => (v - 1) / 5,
    stops: [
      [0, '#22c55e'], [0.2, '#facc15'], [0.4, '#f97316'],
      [0.6, '#ef4444'], [0.8, '#a855f7'], [1, '#7f1d1d']
    ],
    legend: ['Good', 'Hazardous'],
    tooltip: (p) => (p.aqi != null ? `AQI ${p.aqi}/6 · ${p.aqiCategory}` : 'AQI unavailable'),
    popupTitle: (p) => (p.aqi != null ? `Air quality: ${p.aqiCategory}` : 'Air quality unavailable'),
    popupBody: (p) => (p.aqi != null ? `US-EPA index ${p.aqi}/6` : null),
    note: () =>
      'Air quality sampled from points near the map\'s current center (US-EPA index) - not dense sensor coverage. Pan the map to sample a new area.'
  },
  humidity: {
    label: 'Humidity',
    icon: '💧',
    valueKey: 'humidity',
    normalize: (v) => v / 100,
    stops: [[0, '#f0f9ff'], [0.5, '#38bdf8'], [1, '#0c4a6e']],
    legend: ['Dry', 'Humid'],
    tooltip: (p) => `${p.humidity}% humidity`,
    popupTitle: (p) => `Humidity: ${p.humidity}%`,
    popupBody: () => null,
    note: () =>
      'Humidity sampled from points near the map\'s current center - not dense sensor coverage. Pan the map to sample a new area.'
  }
};

const DEBOUNCE_MS = 700; // wait for panning/zooming to settle before refetching

// Recenters the map only on first load (city change) - not on every pan,
// since the whole point of this component is to let the user pan freely
// and have zones follow them without being yanked back to the city center.
function RecenterOnce({ lat, lng }) {
  const map = useMap();
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Draws the actual heat layer imperatively (leaflet.heat isn't a React
// component - it mutates the underlying Leaflet map directly) and keeps it
// in sync whenever the scored points or active layer change.
function HeatLayer({ points, layerKey }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    const layer = LAYERS[layerKey];
    const latLngs = points
      .filter((p) => p[layer.valueKey] != null)
      .map((p) => [p.lat, p.lng, Math.max(0, Math.min(1, layer.normalize(p[layer.valueKey])))]);

    // Layer switches need a fresh heatLayer (gradient/options can't be
    // swapped on an existing instance) - tear down the old one first.
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    layerRef.current = L.heatLayer(latLngs, {
      radius: 45,
      blur: 32,
      maxZoom: 14,
      max: 1.0,
      minOpacity: 0.28,
      gradient: stopsToHeatGradient(layer.stops)
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [points, layerKey, map]);

  return null;
}

// Renders one small colored dot per sampled point on top of the soft heat
// wash - hover shows a quick tooltip, tap/click opens a popup with the exact
// reading. Turns the abstract color blob into something you can actually
// interrogate point by point, instead of just an ambient tint.
function MetricMarkers({ points, layerKey, persona }) {
  const layer = LAYERS[layerKey];
  return points
    .filter((p) => p[layer.valueKey] != null)
    .map((p, idx) => {
      const color = colorForStops(layer.normalize(p[layer.valueKey]), layer.stops);
      const body = layer.popupBody(p);
      return (
        <CircleMarker
          key={`${p.lat}-${p.lng}-${idx}`}
          center={[p.lat, p.lng]}
          radius={10}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 0.92 }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            {layer.tooltip(p)}
          </Tooltip>
          <Popup>
            <strong>{layer.popupTitle(p, persona)}</strong>
            {body && (<><br />{body}</>)}
          </Popup>
        </CircleMarker>
      );
    });
}

// Watches for the user panning/zooming and reports the new center (debounced)
// so the parent can fetch data for wherever they've scrolled to, not just
// the original city.
function ViewTracker({ onViewChange }) {
  const timerRef = useRef(null);

  const handleMove = useCallback((map) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const center = map.getCenter();
      onViewChange(center.lat, center.lng);
    }, DEBOUNCE_MS);
  }, [onViewChange]);

  const map = useMapEvents({
    moveend: () => handleMove(map),
    zoomend: () => handleMove(map)
  });

  return null;
}

function MapView({ latitude, longitude, location, persona }) {
  // null = no overlay showing. Clicking the active pill again clears it -
  // that's the "select or don't select" toggle, without a separate "Off"
  // button cluttering the row.
  const [activeLayer, setActiveLayer] = useState('zones');
  const [points, setPoints] = useState([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  // Tracks whatever point the overlay should currently be centered on -
  // starts at the city, then follows the map as the user pans.
  const [dataCenter, setDataCenter] = useState(null);

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setDataCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!dataCenter || !persona || !activeLayer) return;

    let cancelled = false;
    setPointsLoading(true);
    // One endpoint powers every layer - it already returns score, wind,
    // humidity, and AQI per sampled point - so switching layers never
    // triggers a new fetch, only a re-render with a different field/gradient.
    weatherApi.getZone(dataCenter.lat, dataCenter.lng, persona)
      .then((res) => {
        if (!cancelled) setPoints(res.data.points || []);
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      })
      .finally(() => {
        if (!cancelled) setPointsLoading(false);
      });

    return () => { cancelled = true; };
  }, [dataCenter, persona, activeLayer]);

  const handleViewChange = useCallback((lat, lng) => {
    setDataCenter({ lat, lng });
  }, []);

  if (latitude == null || longitude == null) return null;

  const layer = activeLayer ? LAYERS[activeLayer] : null;

  return (
    <div className="map-card">
      <div className="map-card-header">
        <h3>Map{layer ? ` · ${layer.label}` : ''}</h3>
      </div>

      <div className="map-layer-tabs" role="group" aria-label="Map overlay">
        {Object.entries(LAYERS).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            className={activeLayer === key ? 'map-layer-tab active' : 'map-layer-tab'}
            onClick={() => setActiveLayer((prev) => (prev === key ? null : key))}
          >
            <span>{cfg.icon}</span> {cfg.label}
          </button>
        ))}
      </div>

      <div className="map-container">
        <MapContainer
          center={[latitude, longitude]}
          zoom={11}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]} icon={markerIcon}>
            <Popup>{location}</Popup>
          </Marker>
          {layer && <HeatLayer points={points} layerKey={activeLayer} />}
          {layer && <MetricMarkers points={points} layerKey={activeLayer} persona={persona} />}
          <RecenterOnce lat={latitude} lng={longitude} />
          {layer && <ViewTracker onViewChange={handleViewChange} />}
        </MapContainer>
      </div>

      {layer && (
        <div className="map-legend-wrap">
          {pointsLoading && <span className="map-legend-loading">Updating {layer.label.toLowerCase()} for this area…</span>}
          <div className="map-legend">
            <span className="map-legend-label">{layer.legend[0]}</span>
            <span
              className="map-legend-gradient"
              style={{ background: `linear-gradient(to right, ${layer.stops.map(([, c]) => c).join(', ')})` }}
            />
            <span className="map-legend-label">{layer.legend[1]}</span>
          </div>
        </div>
      )}

      <p className="map-zone-note">
        {layer ? layer.note(persona) : 'Tap a layer above to see live conditions for this area.'}
      </p>
    </div>
  );
}

export default MapView;
