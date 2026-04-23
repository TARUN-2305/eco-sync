import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ROUTE_STOPS = [
  [12.9784, 77.6408], [12.9700, 77.6500], [12.9610, 77.6600],
  [12.9520, 77.6680], [12.9440, 77.6740], [12.9350, 77.6770],
  [12.9260, 77.6730], [12.9180, 77.6660], [12.9100, 77.6550],
  [12.9050, 77.6420], [12.9020, 77.6290], [12.9020, 77.6160],
  [12.9050, 77.6040], [12.9100, 77.5930], [12.9180, 77.5840],
  [12.9280, 77.5780], [12.9390, 77.5760], [12.9500, 77.5790],
  [12.9600, 77.5850], [12.9690, 77.5950], [12.9760, 77.6060],
  [12.9800, 77.6170], [12.9820, 77.6280], [12.9820, 77.6310],
  [12.9810, 77.6330], [12.9800, 77.6360], [12.9800, 77.6380],
  [12.9795, 77.6395], [12.9790, 77.6403], [12.9784, 77.6408],
];

const STOP_NAMES = [
  'Hebbal','Esteem Mall','Nagawara','Hennur','KR Puram',
  'Tin Factory','Marathahalli','Bellandur','Sarjapur Rd','HSR Layout',
  'Silk Board','BTM Layout','JP Nagar','Bannerghatta Rd','Gottigere',
  'Uttarahalli','Kengeri','Mysore Rd','Peenya','Jalahalli',
  'Yeshwanthpur','Tumkur Rd','Mathikere','HBR Layout','Banaswadi',
  'Horamavu','Ramamurthy Nagar','Varthur','Whitefield','Hebbal Loop'
];

// Fetch road path between two stops via OSRM public API
async function fetchRoadPath(fromIdx, toIdx) {
  const [lat1, lon1] = ROUTE_STOPS[fromIdx];
  const [lat2, lon2] = ROUTE_STOPS[toIdx % ROUTE_STOPS.length];
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.routes?.[0]) {
      return data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    }
  } catch (e) { /* fall through */ }
  return [ROUTE_STOPS[fromIdx], ROUTE_STOPS[toIdx % ROUTE_STOPS.length]];
}

// Animate marker along an array of [lat,lon] waypoints over `duration` ms
function animateAlongPath(marker, path, duration) {
  let start = null;
  let id;
  const n = path.length - 1;
  function step(ts) {
    if (!start) start = ts;
    const t = Math.min((ts - start) / duration, 1);
    const pos = t * n;
    const i = Math.min(Math.floor(pos), n - 1);
    const frac = pos - i;
    const [la1, lo1] = path[i];
    const [la2, lo2] = path[Math.min(i + 1, n)];
    marker.setLatLng([la1 + (la2 - la1) * frac, lo1 + (lo2 - lo1) * frac]);
    if (t < 1) id = requestAnimationFrame(step);
  }
  id = requestAnimationFrame(step);
  return () => cancelAnimationFrame(id);
}

function getBusLoad(loads, id) {
  return loads.find(l => l.id === id)?.load ?? 0;
}
function getQueue(stopQueues, idx) {
  return stopQueues.find(s => s.stop === idx)?.queue ?? 0;
}
function busColor(load, action) {
  if (action === 1) return ['#3b82f6', '#3b82f688'];
  if (load >= 60)   return ['#ef4444', '#ef444488'];
  if (load >= 30)   return ['#f59e0b', '#f59e0b88'];
  return             ['#22c55e', '#22c55e88'];
}
function makeBusIcon(busId, load, action) {
  const [bg, glow] = busColor(load, action);
  const sym = action === 1 ? '⏸' : action === 2 ? '⏭' : '▶';
  const pulse = action === 1 ? 'animation:holdPulse 1s ease-in-out infinite;' : '';
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};color:white;border:2.5px solid rgba(255,255,255,0.9);border-radius:50%;
      width:40px;height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-weight:900;font-family:Inter,sans-serif;box-shadow:0 0 16px ${glow},0 2px 10px rgba(0,0,0,.5);
      cursor:pointer;${pulse}">
      <span style="font-size:13px;line-height:1">${sym}</span>
      <span style="font-size:8.5px;opacity:.9;line-height:1.1">${load}p</span>
    </div>
    ${action === 1 ? `<div style="position:absolute;top:0;left:0;width:40px;height:40px;border-radius:50%;
      border:2px solid ${bg};animation:ripple 1.2s ease-out infinite;pointer-events:none;"></div>` : ''}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function AllLayers({ buses, loads, stopQueues, busActions }) {
  const map = useMap();
  const busMarkersRef  = useRef({});
  const stopMarkersRef = useRef([]);
  const roadPathsRef   = useRef({});   // cache: "fromIdx" -> [lat,lon][]
  const cancelAnimRef  = useRef({});   // cancel fns per bus
  const prevStopRef    = useRef({});   // last known stop per bus

  // --- Draw stop circles once, update on each tick ---
  useEffect(() => {
    // Create stop markers if not yet created
    if (stopMarkersRef.current.length === 0) {
      ROUTE_STOPS.forEach((pos, i) => {
        const m = L.circleMarker(pos, { radius: 5, color: '#3b82f6', fillColor: '#1e3a8a', fillOpacity: 0.9, weight: 1.5 })
          .addTo(map)
          .bindTooltip('', { direction: 'top', className: 'bus-tooltip', offset: [0, -6] });
        stopMarkersRef.current[i] = m;
      });
    }

    // Update stop markers with current queue data
    stopMarkersRef.current.forEach((m, i) => {
      const q = getQueue(stopQueues, i);
      const r = Math.min(5 + q * 0.5, 18);
      const color = q > 20 ? '#ef4444' : q > 8 ? '#f59e0b' : '#3b82f6';
      m.setRadius(r);
      m.setStyle({ color, fillColor: color, fillOpacity: 0.35 });
      m.setTooltipContent(`<b>🚏 ${STOP_NAMES[i]}</b><br/>Waiting: <b>${q}</b> passengers`);
    });
  }, [stopQueues, map]);

  // --- Animate buses along real roads ---
  useEffect(() => {
    if (!buses.length) return;

    buses.forEach(async (bus) => {
      const stopIdx = bus.stop % ROUTE_STOPS.length;
      const load    = getBusLoad(loads, bus.id);
      const action  = busActions[bus.id] ?? 0;
      const icon    = makeBusIcon(bus.id, load, action);
      const pos     = ROUTE_STOPS[stopIdx];

      // Create marker if new
      if (!busMarkersRef.current[bus.id]) {
        const m = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(map);
        m.bindTooltip('', { direction: 'top', className: 'bus-tooltip', offset: [0, -28] });
        busMarkersRef.current[bus.id] = m;
        prevStopRef.current[bus.id]   = stopIdx;
      }

      const marker = busMarkersRef.current[bus.id];

      // Update icon (color/action badge) every tick
      marker.setIcon(icon);

      // Update tooltip
      const actionLabel = action === 1 ? 'HOLDING 🛑 (preventing bunching)' : action === 2 ? 'SKIPPING ⏭ (rebalancing route)' : 'PROCEEDING ▶';
      const queue = getQueue(stopQueues, stopIdx);
      marker.setTooltipContent(
        `<b>Bus ${bus.id}</b><br/>📍 ${STOP_NAMES[stopIdx]}<br/>🎯 ${actionLabel}<br/>👥 Onboard: ${load}/80<br/>🚏 Waiting here: ${queue}`
      );

      // Animate along road if stop changed
      const prevStop = prevStopRef.current[bus.id];
      if (stopIdx !== prevStop) {
        // Cancel previous animation
        cancelAnimRef.current[bus.id]?.();

        const cacheKey = `${prevStop}->${stopIdx}`;
        if (!roadPathsRef.current[cacheKey]) {
          roadPathsRef.current[cacheKey] = await fetchRoadPath(prevStop, stopIdx);
        }
        const path = roadPathsRef.current[cacheKey];
        cancelAnimRef.current[bus.id] = animateAlongPath(marker, path, 950);
        prevStopRef.current[bus.id] = stopIdx;
      }
    });
  }, [buses, loads, busActions, stopQueues, map]);

  // Cleanup
  useEffect(() => () => {
    Object.values(busMarkersRef.current).forEach(m => m.remove());
    stopMarkersRef.current.forEach(m => m.remove());
    Object.values(cancelAnimRef.current).forEach(c => c?.());
  }, []);

  return null;
}

export function MapView({ buses, loads, stopQueues, busActions }) {
  return (
    <div className="w-full h-full relative">
      <style>{`
        @keyframes ripple    { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.4);opacity:0} }
        @keyframes holdPulse { 0%,100%{opacity:1} 50%{opacity:.55} }
        .leaflet-container   { background:#020817; }
        .bus-tooltip {
          background:rgba(2,8,23,.97)!important; border:1px solid #1e3a5f!important;
          color:#e2e8f0!important; font-family:Inter,sans-serif!important; font-size:12px!important;
          border-radius:10px!important; padding:8px 12px!important; line-height:1.65!important;
          box-shadow:0 4px 24px rgba(0,0,0,.6)!important;
        }
        .leaflet-tooltip::before { display:none!important; }
      `}</style>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/95 border border-slate-700 rounded-xl p-3 text-xs shadow-2xl backdrop-blur space-y-1.5" style={{minWidth:170}}>
        <div className="text-slate-400 font-bold uppercase tracking-wider pb-1 border-b border-slate-700">Bus Action</div>
        <div className="flex items-center gap-2"><span className="text-green-400 font-bold">▶ PROCEED</span><span className="text-slate-500 ml-auto">moving</span></div>
        <div className="flex items-center gap-2"><span className="text-blue-400 font-bold">⏸ HOLD</span><span className="text-slate-500 ml-auto">anti-bunch</span></div>
        <div className="flex items-center gap-2"><span className="text-orange-400 font-bold">⏭ SKIP</span><span className="text-slate-500 ml-auto">rebalance</span></div>
        <div className="text-slate-400 font-bold uppercase tracking-wider pt-1 pb-1 border-t border-slate-700">Load</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"/><span className="text-slate-300">&lt;30 comfortable</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"/><span className="text-slate-300">30–60 busy</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/><span className="text-slate-300">&gt;60 overcrowded</span></div>
        <div className="text-slate-400 font-bold uppercase tracking-wider pt-1 pb-1 border-t border-slate-700">Stop Queue</div>
        <div className="text-slate-400">Dot grows + turns red as passengers build up</div>
      </div>

      <MapContainer center={[12.9400, 77.6200]} zoom={12} style={{ height:'100%', width:'100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <AllLayers buses={buses} loads={loads} stopQueues={stopQueues} busActions={busActions} />
      </MapContainer>
    </div>
  );
}
