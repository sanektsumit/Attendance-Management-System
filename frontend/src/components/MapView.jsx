import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Green Icon for Logged In Location (SVG Data URI)
const greenIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42"><path fill="%2310B981" stroke="%23047857" stroke-width="1.5" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12zm0 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>`,
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -38],
});

// Yellow Icon for Logged Out Location (SVG Data URI)
const yellowIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42"><path fill="%23F59E0B" stroke="%23B45309" stroke-width="1.5" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12zm0 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>`,
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -38],
});

// Black Icon for Exact Current Live Location (SVG Data URI)
const blackIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="46"><path fill="%230F172A" stroke="%2364748B" stroke-width="1.5" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12zm0 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>`,
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [0, -42],
});

// Helper component to smoothly pan/recenter map view when center prop updates
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const MapView = ({
  center = [28.57126, 77.21991],
  zoom = 14,
  punchInLoc,
  punchOutLoc,
  currentLoc,
  officeCenter = [28.57126, 77.21991],
  radiusMeters = 200,
  markers = [],
}) => {
  const mapCenter = currentLoc?.lat
    ? [currentLoc.lat, currentLoc.lng]
    : punchInLoc?.lat
    ? [punchInLoc.lat, punchInLoc.lng]
    : center;

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-inner min-h-[350px]">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
        <ChangeView center={mapCenter} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Office Geofence Circle Boundary */}
        {officeCenter && officeCenter[0] && (
          <Circle
            center={officeCenter}
            radius={radiusMeters}
            pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.15, weight: 2, dashArray: '4, 4' }}
          />
        )}

        {/* 1. Single Employee Logged In Location Marker */}
        {punchInLoc?.lat && punchInLoc?.lng && (
          <Marker position={[punchInLoc.lat, punchInLoc.lng]} icon={greenIcon}>
            <Popup>
              <div className="text-xs space-y-1.5 p-1 min-w-[160px]">
                <div className="font-bold text-emerald-600 flex items-center gap-1">
                  <span>🟢</span> Logged In Location
                </div>
                <div className="text-slate-800 font-medium leading-snug">{punchInLoc.address || 'Address recorded'}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  GPS: {punchInLoc.lat.toFixed(4)}, {punchInLoc.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Single Employee Logged Out Location Marker */}
        {punchOutLoc?.lat && punchOutLoc?.lng && (
          <Marker position={[punchOutLoc.lat, punchOutLoc.lng]} icon={yellowIcon}>
            <Popup>
              <div className="text-xs space-y-1.5 p-1 min-w-[160px]">
                <div className="font-bold text-amber-600 flex items-center gap-1">
                  <span>🟡</span> Logged Out Location
                </div>
                <div className="text-slate-800 font-medium leading-snug">{punchOutLoc.address || 'Address recorded'}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  GPS: {punchOutLoc.lat.toFixed(4)}, {punchOutLoc.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 3. Exact Current Live Location Marker */}
        {currentLoc?.lat && currentLoc?.lng && (
          <Marker position={[currentLoc.lat, currentLoc.lng]} icon={blackIcon}>
            <Popup>
              <div className="text-xs space-y-1.5 p-1 min-w-[160px]">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span>⚫</span> Exact Live Position
                </div>
                <div className="text-slate-700">Real-Time Active GPS</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  GPS: {currentLoc.lat.toFixed(4)}, {currentLoc.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Bulk markers for Admin Map View (Day-wise Employee Logins) */}
        {markers.map((item, idx) => {
          if (!item.lat || !item.lng) return null;
          const markerIcon = item.type === 'PUNCH_OUT' ? yellowIcon : greenIcon;
          return (
            <Marker key={item.id || idx} position={[item.lat, item.lng]} icon={markerIcon}>
              <Popup>
                <div className="text-xs space-y-1.5 p-1 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-bold text-slate-900 text-sm">{item.empName || item.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.status === 'LATE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.status || 'PRESENT'}
                    </span>
                  </div>

                  <div className="text-slate-600 text-[11px]">
                    <span className="font-semibold text-slate-800">Dept:</span> {item.dept || 'Staff'}
                  </div>

                  <div className="text-indigo-600 font-medium text-[11px] flex items-center gap-1">
                    <span>⏰ Log In Time:</span> {item.subtitle || 'N/A'}
                  </div>

                  <div className="text-slate-700 leading-tight text-[11px] border-t border-slate-100 pt-1">
                    📍 {item.address || 'Address logged'}
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    GPS: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
