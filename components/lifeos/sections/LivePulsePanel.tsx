import type { LivePulse } from "@/lib/lifeos-contracts";

type Props = {
  pulse: LivePulse | null;
  loading: boolean;
  onRefresh: () => void;
};

export default function LivePulsePanel({ pulse, loading, onRefresh }: Props) {
  return (
    <section className="glass rounded-[1.2rem] p-4 md:rounded-[1.4rem] md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-2xl font-extrabold">Live Pulse</h3>
        <button
          onClick={onRefresh}
          className="rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-1.5 text-sm font-semibold"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[color:var(--text-soft)]">Weather</p>
          <p className="mt-2 text-2xl font-black text-[color:var(--text-main)]">
            {pulse ? `${pulse.weather.temperatureC}°C` : "--"}
          </p>
          <p className="text-sm text-[color:var(--text-soft)]">
            {pulse ? `${pulse.weather.city} · ${pulse.weather.condition}` : "Loading weather..."}
          </p>
        </article>

        <article className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[color:var(--text-soft)]">Top Job Signal</p>
          <p className="mt-2 line-clamp-2 text-base font-extrabold text-[color:var(--text-main)]">
            {pulse ? pulse.jobs.role : "Loading jobs..."}
          </p>
          <p className="text-sm text-[color:var(--text-soft)]">
            {pulse ? `${pulse.jobs.company} · ${pulse.jobs.location}` : ""}
          </p>
          {pulse && (
            <a className="mt-2 inline-block text-sm font-semibold text-[#2c7be5]" href={pulse.jobs.url} target="_blank" rel="noreferrer noopener">
              Open listing
            </a>
          )}
        </article>

        <article className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[color:var(--text-soft)]">News Pulse</p>
          <p className="mt-2 line-clamp-2 text-base font-extrabold text-[color:var(--text-main)]">
            {pulse ? pulse.news.headline : "Loading headline..."}
          </p>
          <p className="text-sm text-[color:var(--text-soft)]">
            {pulse ? `${pulse.news.source} · ${pulse.news.points} points` : ""}
          </p>
          {pulse && (
            <a className="mt-2 inline-block text-sm font-semibold text-[#2c7be5]" href={pulse.news.url} target="_blank" rel="noreferrer noopener">
              Open article
            </a>
          )}
        </article>
      </div>

      <p className="mt-3 text-xs text-[color:var(--text-soft)]">
        {pulse ? `Last updated ${new Date(pulse.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for live providers..."}
      </p>
    </section>
  );
}
