import { MessagesSquare } from 'lucide-react'

function V2XFeed({ feed }) {
  const items = [...feed].reverse()

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,24,.95),rgba(3,7,12,.95))]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <MessagesSquare className="h-5 w-5 text-cyan-300" />
        <div>
          <h2 className="font-serif text-2xl text-white">V2X Debate Feed</h2>
          <p className="text-sm text-slate-400">Live signboard logic from the corridor brain.</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-sm text-slate-400">
            Waiting for the first operational debate near a major stop...
          </div>
        ) : (
          items.map((entry, index) => (
            <article key={`${entry.stop}-${index}`} className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{entry.stop}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                <span>{entry.bus_1_id}</span>
                <span className="text-white/30">vs</span>
                <span>{entry.bus_2_id}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-100">{entry.decision.reasoning_for_signboard}</p>
              <div className="mt-3 flex gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>{entry.bus_1_id}: {entry.decision.bus_1_action}</span>
                <span>{entry.bus_2_id}: {entry.decision.bus_2_action}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export default V2XFeed
