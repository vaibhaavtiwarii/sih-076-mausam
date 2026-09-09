// frontend/src/components/MapView.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

// Recenters the map when the city (and therefore lat/lng) changes, since
// MapContainer only reads its `center` prop on first mount.
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// 0-100 persona score -> a color on a green (good) to red (unhealthy) scale,
// matching the same language used in AirQualityCard/ScoreRing elsewhere in
// the app so the map doesn't introduce a fourth different color system.
function scoreToColor(score) {
  if (score >= 75) return '#2dd4bf'; // Good
  if (score >= 55) return '#a3e635'; // Moderate
  if (score >= 35) return '#fb923c'; // Poor
  return '#f87171'; // Unhealthy
}

const LEGEND_ITEMS = [
  { label: 'Good', color: '#2dd4bf' },
  { label: 'Moderate', color: '#a3e635' },
  { label: 'Poor', color: '#fb923c' },
  { label: 'Unhealthy', color: '#f87171' }
];

function ZoneOverlay({ points }) {
  return points.map((point, i) => (
    <Circle
      key={`${point.lat}-${point.lng}-${i}`}
      center={[point.lat, point.lng]}
      radius={7000}
      pathOptions={{
        color: scoreToColor(point.score),
        fillColor: scoreToColor(point.score),
        fillOpacity: 0.35,
        weight: 1
      }}
    >
      <Tooltip direction="top" opacity={0.9}>
        {point.category} · Score {point.score}/100
      </Tooltip>
    </Circle>
  ));
}

function MapView({ latitude, longitude, location, persona }) {
  const [showZones, setShowZones] = useState(true);
  const [zonePoints, setZonePoints] = useState([]);
  const [zoneLoading, setZoneLoading] = useState(false);

  useEffect(() => {
    if (latitude == null || longitude == null || !persona || !showZones) return;

    let cancelled = false;
    setZoneLoading(true);
    weatherApi.getZone(latitude, longitude, persona)
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
  }, [latitude, longitude, persona, showZones]);

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
          {showZones && <ZoneOverlay points={zonePoints} />}
          <Recenter lat={latitude} lng={longitude} />
        </MapContainer>
      </div>
      {showZones && (
        <div className="map-legend">
          {LEGEND_ITEMS.map((item) => (
            <span key={item.label} className="map-legend-item">
              <span className="map-legend-swatch" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
          {zoneLoading && <span className="map-legend-loading">Updating zones…</span>}
        </div>
      )}
      <p className="map-zone-note">
        Zones approximate {persona || 'persona'} suitability from nearby sampled points - not dense sensor coverage.
      </p>
    </div>
  );
}

export default MapView;
