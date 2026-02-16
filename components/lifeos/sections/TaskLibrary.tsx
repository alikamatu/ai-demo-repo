import { motion } from "framer-motion";
import type { Domain, QuickAction } from "@/components/lifeos/types";

type Props = {
  domains: Domain[];
  selectedDomain: Domain;
  actions: QuickAction[];
  runningActionId: string | null;
  onSelectDomain: (domain: Domain) => void;
  onRunAction: (actionId: string) => void;
};

export default function TaskLibrary({
  domains,
  selectedDomain,
  actions,
  runningActionId,
  onSelectDomain,
  onRunAction,
}: Props) {
  return (
    <div className="glass rounded-[1.2rem] p-4 md:rounded-[1.4rem] md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h3 className="text-2xl font-extrabold">One-Click Task Library</h3>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {domains.map((domain) => (
            <button
              key={domain}
              onClick={() => onSelectDomain(domain)}
              className={`min-w-max rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] transition ${
                selectedDomain === domain
                  ? "border-transparent bg-[#10263b] text-white"
                  : "border-[color:var(--line-strong)] bg-white/70 text-[color:var(--text-soft)]"
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {actions.map((action, idx) => (
          <motion.article
            key={action.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl border border-[color:var(--line)] bg-white/75 p-4"
          >
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[color:var(--text-soft)]">
              {action.domain}
            </p>
            <h4 className="mt-2 text-lg font-extrabold">{action.title}</h4>
            <p className="mt-2 text-sm text-[color:var(--text-soft)]">{action.detail}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="badge-chip bg-white text-[#0e3c63]">ETA {action.eta}</span>
              <button
                onClick={() => onRunAction(action.id)}
                disabled={runningActionId === action.id}
                className="rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70"
              >
                {runningActionId === action.id ? "Running..." : "Run now"}
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
