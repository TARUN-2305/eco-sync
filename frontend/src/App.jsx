import { useEffect, useState } from 'react'
import { AlertTriangle, Bus, LoaderCircle, MapPinned, Radio } from 'lucide-react'
import MapLayer from './components/MapLayer.jsx'
import DynamicStops from './components/DynamicStops.jsx'
import V2XFeed from './components/V2XFeed.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'
const WS_BASE = import.meta.env.VITE_WS_BASE || API_BASE.replace(/^http/, 'ws')

function App() {
  const [mapData, setMapData] = useState(null)
  const [liveState, setLiveState] = useState({ buses: [], stops: {}, traffic: [], debate_history: [] })
  const [connectionState, setConnectionState] = useState('Connecting')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    let retryTimer

    async function loadMap() {
      try {
        const response = await fetch(`${API_BASE}/api/map`)
        if (!response.ok) {
          throw new Error(`Map fetch failed with ${response.status}`)
        }

        const payload = await response.json()
        if (isMounted) {
          setMapData(payload)
          setError('')
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message)
          retryTimer = window.setTimeout(loadMap, 2000)
        }
      }
    }

    loadMap()
    return () => {
      isMounted = false
      window.clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    let socket
    let reconnectTimer
    let cancelled = false

    function connect() {
      socket = new WebSocket(`${WS_BASE}/ws/live`)

      socket.onopen = () => {
        setConnectionState('Live')
        setError('')
      }

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data)
        setLiveState(payload)
      }

      socket.onerror = () => {
        setConnectionState('Interrupted')
      }

      socket.onclose = () => {
        if (cancelled) {
          return
        }

        setConnectionState('Reconnecting')
        reconnectTimer = window.setTimeout(connect, 2000)
      }
    }

    connect()

    return () => {
      cancelled = true
      window.clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [])

  const stopEntries = mapData
    ? Object.entries(mapData.stops).map(([name, stop]) => ({
        name,
        ...stop,
        waiting: liveState.stops[name]?.waiting ?? 0,
      }))
    : []

  const activeTraffic = liveState.traffic.length > 0 ? liveState.traffic : [{ location: 'Corridor', severity: 'Normal flow' }]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#143546_0%,#08131a_45%,#05080b_100%)] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1.65fr)_420px]">
        <section className="flex min-h-[70vh] flex-col rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-slate-950/55 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">ECO-SYNC V2X</p>
              <h1 className="font-serif text-3xl text-white">BMTC Route 378 Live Corridor</h1>
              <p className="text-sm text-slate-300">Kengeri TTMC to Electronic City on real OSRM asphalt geometry.</p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm">
              <Radio className="h-4 w-4 text-cyan-300" />
              <span className="font-medium">{connectionState}</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/60">
              {mapData ? (
                <MapLayer routePolyline={mapData.route_polyline} buses={liveState.buses} stops={stopEntries} />
              ) : (
                <div className="flex h-[620px] items-center justify-center gap-3 text-slate-300">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  <span>Loading route geometry...</span>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-cyan-200">
                  <MapPinned className="h-4 w-4" />
                  <h2 className="text-sm uppercase tracking-[0.2em]">Stop Pressure</h2>
                </div>
                <div className="space-y-3">
                  {stopEntries.map((stop) => (
                    <DynamicStops key={stop.name} stop={stop} />
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <h2 className="text-sm uppercase tracking-[0.2em]">Traffic Events</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-200">
                  {activeTraffic.map((event, index) => (
                    <div key={`${event.location}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="font-medium text-white">{event.location}</p>
                      <p className="text-slate-300">{event.severity}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-emerald-200">
                  <Bus className="h-4 w-4" />
                  <h2 className="text-sm uppercase tracking-[0.2em]">Fleet Snapshot</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-200">
                  {liveState.buses.map((bus) => (
                    <div key={bus.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <p className="font-medium text-white">{bus.id}</p>
                      <p>{bus.passengers} onboard</p>
                      <p>Path index {bus.path_index}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="flex min-h-[70vh] flex-col rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-2xl shadow-black/40">
          <V2XFeed feed={liveState.debate_history} />
          {error ? <p className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
        </section>
      </div>
    </main>
  )
}

export default App
