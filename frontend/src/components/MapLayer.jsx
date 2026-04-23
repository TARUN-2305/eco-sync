import { MapContainer, Marker, Polyline, TileLayer, Tooltip, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const busIcon = (label) =>
  L.divIcon({
    className: '',
    html: `<div style="background:linear-gradient(135deg,#f97316,#fb7185);color:#fff;border:2px solid rgba(255,255,255,.7);padding:7px 10px;border-radius:999px;font:700 12px/1 ui-sans-serif;box-shadow:0 10px 20px rgba(0,0,0,.35);">${label}</div>`,
    iconSize: [84, 32],
    iconAnchor: [42, 16],
  })

function stopColor(waiting) {
  if (waiting >= 20) return '#f97316'
  if (waiting >= 10) return '#facc15'
  return '#34d399'
}

function MapLayer({ routePolyline, buses, stops }) {
  const center = routePolyline?.[Math.floor(routePolyline.length / 2)] ?? [12.8858, 77.5738]

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-[620px] w-full">
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={routePolyline} pathOptions={{ color: '#22d3ee', weight: 5, opacity: 0.8 }} />

      {stops.map((stop) => (
        <CircleMarker
          key={stop.name}
          center={[stop.lat, stop.lng]}
          radius={Math.max(8, Math.min(24, 8 + stop.waiting))}
          pathOptions={{ color: stopColor(stop.waiting), fillColor: stopColor(stop.waiting), fillOpacity: 0.45 }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            <div className="space-y-1">
              <strong>{stop.name}</strong>
              <div>{stop.waiting} waiting</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}

      {buses.map((bus) => (
        <Marker key={bus.id} position={[bus.lat, bus.lng]} icon={busIcon(bus.id.replace('_', ' '))}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <div className="space-y-1">
              <strong>{bus.id}</strong>
              <div>{bus.passengers} passengers</div>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapLayer
