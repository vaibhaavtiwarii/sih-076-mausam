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

// Straightforward stoplight gradient - red (bad) -> yellow (mid) -> green
// (good), keyed 0-1 as leaflet.heat expects. Kept to three stops so the
// red/green read stays obvious at a glance instead of drifting into
// ambiguous teal/orange tones that don't map cleanly to "good" or "bad".
const ZONE_GRADIENT = {
  0.0: '#ef4444',
  0.5: '#facc15',
  1.0: '#22c55e'
};

// Same red -> yellow -> green scale as ZONE_GRADIENT above, but as a plain
// function returning a solid color for a 0-100 score - used for the
// per-point markers, which need one definite color per dot rather than
// leaflet.heat's gradient-lookup format.
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

function scoreToColor(score) {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped <= 50) return blend('#ef4444', '#facc15', clamped / 50);
  return blend('#facc15', '#22c55e', (clamped - 50) / 50);
}

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
// in sync whenever the scored points change.
function HeatZoneLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    const latLngs = points.map((p) => [p.lat, p.lng, p.score / 100]);

    if (!layerRef.current) {
      layerRef.current = L.heatLayer(latLngs, {
        radius: 45,
        blur: 32,
        maxZoom: 14,
        max: 1.0,
        minOpacity: 0.28,
        gradient: ZONE_GRADIENT
      }).addTo(map);
    } else {
      layerRef.current.setLatLngs(latLngs);
    }

    return () => {
      // Only remove on unmount, not on every point update - setLatLngs
      // above handles updates without tearing the layer down and back up.
    };
  }, [points, map]);

  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
}

// Renders one small colored dot per sampled zone point on top of the soft
// heat wash - hover shows a quick tooltip, tap/click opens a popup with the
// exact score. Turns the abstract color blob into something you can
// actually interrogate point by point, instead of just an ambient tint.
function ZoneMarkers({ points, persona }) {
  return points.map((p, idx) => (
    <CircleMarker
      key={`${p.lat}-${p.lng}-${idx}`}
      center={[p.lat, p.lng]}
      radius={10}
      pathOptions={{
        color: '#ffffff',
        weight: 2,
        fillColor: scoreToColor(p.score),
        fillOpacity: 0.92
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={1}>
        {p.score}/100 · {p.category}
      </Tooltip>
      <Popup>
        <strong>{persona} suitability: {p.score}/100</strong>
        <br />
        {p.category}
      </Popup>
    </CircleMarker>
  ));
}

// Watches for the user panning/zooming and reports the new center (debounced)
// so the parent can fetch zone data for wherever they've scrolled to, not
// just the original city.
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
  const [showZones, setShowZones] = useState(true);
  const [zonePoints, setZonePoints] = useState([]);
  const [zoneLoading, setZoneLoading] = useState(false);
  // Tracks whatever point the zones should currently be centered on -
  // starts at the city, then follows the map as the user pans.
  const [zoneCenter, setZoneCenter] = useState(null);

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setZoneCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!zoneCenter || !persona || !showZones) return;

    let cancelled = false;
    setZoneLoading(true);
    weatherApi.getZone(zoneCenter.lat, zoneCenter.lng, persona)
      .then((res) => {
        if (!cancelled) setZonePoints(res.data.points || []);
      })
      .catch(() => {
        if (!cancelled) setZonePoints([]);
      })
      .finally(() => {
        if (!cancelled) setZoneLoading(false);
      });

    return () => { cancelled = true; };
  }, [zoneCenter, persona, showZones]);

  const handleViewChange = useCallback((lat, lng) => {
    setZoneCenter({ lat, lng });
  }, []);

  if (latitude == null || longitude == null) return null;

  return (
    <div className="map-card">
      <div className="map-card-header">
        <h3>Map{persona ? ` · ${persona} Zones` : ''}</h3>
        <label className="map-zone-toggle">
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) => setShowZones(e.target.checked)}
          />
          Show zones
        </label>
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
          {showZones && <HeatZoneLayer points={zonePoints} />}
          {showZones && <ZoneMarkers points={zonePoints} persona={persona} />}
          <RecenterOnce lat={latitude} lng={longitude} />
          {showZones && <ViewTracker onViewChange={handleViewChange} />}
        </MapContainer>
      </div>
      {showZones && (
        <div className="map-legend-wrap">
          {zoneLoading && <span className="map-legend-loading">Updating zones for this area…</span>}
          <div className="map-legend">
            <span className="map-legend-label">Unhealthy</span>
            <span className="map-legend-gradient" />
            <span className="map-legend-label">Good</span>
          </div>
        </div>
      )}
      <p className="map-zone-note">
        Zones approximate {persona || 'persona'} suitability from sampled points near the map's current center - not dense sensor coverage. Pan the map to sample a new area.
      </p>
    </div>
  );
}

export default MapView;
