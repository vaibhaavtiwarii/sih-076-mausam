// frontend/src/components/MapView.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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
  React.useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function MapView({ latitude, longitude, location }) {
  if (latitude == null || longitude == null) return null;

  return (
    <div className="map-card">
      <h3>Map</h3>
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
          <Recenter lat={latitude} lng={longitude} />
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
