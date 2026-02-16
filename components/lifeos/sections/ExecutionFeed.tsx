import type { TimelineItem } from "@/components/lifeos/types";

type Props = {
  timeline: TimelineItem[];
};

export default function ExecutionFeed({ timeline }: Props) {
  return (
    <article className="glass rounded-[1.4rem] p-5 md:p-6">
      <h3 className="text-2xl font-extrabold">Daily Execution Feed</h3>
      <div className="fade-mask mt-4 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
        {timeline.map((item) => (
          <div key={item.id} className="relative rounded-xl border border-[color:var(--line)] bg-white/80 p-3 pl-5">
            <span className="absolute left-2 top-5 h-2.5 w-2.5 rounded-full bg-[#0ec5a4]" />
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[color:var(--text-soft)]">
              {item.time}
            </p>
            <p className="mt-1 font-semibold">{item.event}</p>
            <p className="mt-1 text-sm text-[color:var(--text-soft)]">{item.info}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
