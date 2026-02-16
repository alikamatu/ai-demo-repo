import { motion } from "framer-motion";
import type { QuickAction, StatItem } from "@/components/lifeos/types";

type Props = {
  stats: StatItem[];
  assistantText: string;
  lastError: string | null;
  quickCommands: QuickAction[];
  runningActionId: string | null;
  onRunAction: (actionId: string) => void;
};

export default function MissionControl({
  stats,
  assistantText,
  lastError,
  quickCommands,
  runningActionId,
  onRunAction,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="glass relative overflow-hidden rounded-[1.35rem] border p-4 sm:p-5 md:rounded-[1.6rem] md:p-8"
    >
      <div className="absolute -right-10 top-0 h-52 w-52 rounded-full bg-[#0ec5a4]/20 blur-3xl" />
      <div className="absolute -bottom-10 left-10 h-52 w-52 rounded-full bg-[#2c7be5]/20 blur-3xl" />

      <div className="relative grid gap-4 lg:grid-cols-[1.18fr_0.9fr] lg:gap-5">
        <div>
          <p className="badge-chip inline-flex bg-white/70 text-[#0e3c63]">Mission Control</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black leading-[1.05] sm:text-4xl md:mt-4 md:text-5xl">
            One assistant to run your <span className="gradient-text">entire life workflow</span>
          </h2>
          <p className="mt-3 max-w-xl text-base text-[color:var(--text-soft)] sm:text-lg">
            Built for non-technical users. Say what you need in plain language, and LifeOS handles execution,
            updates, approvals, and follow-through.
          </p>
          {lastError ? (
            <p className="mt-3 rounded-xl border border-[#f25f5c]/40 bg-[#fff1f1] px-3 py-2 text-sm font-semibold text-[#9a2f2b]">
              Integration error: {lastError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-3 md:mt-5 md:gap-3">
            {stats.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[color:var(--line)] bg-white/65 p-3">
                <p className="text-2xl font-extrabold text-[color:var(--text-main)]">{item.value}</p>
                <p className="text-sm text-[color:var(--text-soft)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="command-ring rounded-3xl bg-[#10263b] p-[1px]">
          <div className="rounded-[calc(1.5rem-1px)] bg-[#0f2438] p-3.5 text-[#f4f8fb] sm:p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#95b4cf]">AI Command</p>
            <p className="mt-2 rounded-2xl bg-white/10 p-3 text-sm leading-relaxed sm:mt-3">{assistantText}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {quickCommands.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onRunAction(action.id)}
                  disabled={runningActionId === action.id}
                  className="rounded-xl bg-[#0ec5a4] px-3 py-2 text-sm font-semibold text-[#09362f] transition hover:brightness-95 disabled:cursor-progress disabled:opacity-70"
                >
                  {runningActionId === action.id ? "Running..." : action.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
