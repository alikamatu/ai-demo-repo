import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import type { WorkflowEngineStatusResponse } from "@/lib/lifeos-contracts";

type Props = {
  status: WorkflowEngineStatusResponse | null;
  error: string | null;
  submitting: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onSubmitIntent: (intent: string) => void;
};

const starterIntents = [
  "Apply to 8 backend roles and schedule interviews this week",
  "Plan meals for 7 days and auto-order groceries",
  "Prepare social posts for this week and schedule publishing",
];

export default function WorkflowEnginePanel({
  status,
  error,
  submitting,
  refreshing,
  onRefresh,
  onSubmitIntent,
}: Props) {
  const [intent, setIntent] = useState(starterIntents[0]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = intent.trim();
    if (!next || submitting) return;
    onSubmitIntent(next);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-[1.4rem] border border-[color:var(--line)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="badge-chip inline-flex bg-white/70 text-[#0e3c63]">Workflow Engine</p>
          <h3 className="mt-2 text-2xl font-extrabold">Parallel Execution Bridge</h3>
          <p className="mt-1 text-sm text-[color:var(--text-soft)]">
            Sends intents to the upstream Python orchestration engine for DAG scheduling and approval gates.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing || submitting}
          className="rounded-xl border border-[color:var(--line-strong)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--text-main)] transition hover:bg-[#f7fbff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Checking..." : "Check Engine"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Status</p>
          <p className="mt-2 text-xl font-extrabold text-[color:var(--text-main)]">
            {status?.available ? "Connected" : "Offline"}
          </p>
          <p
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
              status?.available ? "bg-[#0ec5a4]/20 text-[#0d7a67]" : "bg-[#f25f5c]/18 text-[#a23a38]"
            }`}
          >
            {status?.available ? "Ready for Runs" : "Unavailable"}
          </p>
          <p className="mt-2 text-xs text-[color:var(--text-soft)] break-all">Base URL: {status?.baseUrl ?? "n/a"}</p>
          <p className="mt-1 text-xs text-[color:var(--text-soft)]">Last check: {status?.checkedAt ?? "n/a"}</p>
          {error ? <p className="mt-2 text-xs font-semibold text-[#9a2f2b]">{error}</p> : null}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">Submit Intent</p>
          <label className="mt-2 block text-sm font-semibold text-[color:var(--text-main)]">
            Natural language request
            <textarea
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-[color:var(--line-strong)] bg-white px-3 py-2 text-sm font-normal"
              placeholder="Apply to roles, plan events, organize docs..."
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {starterIntents.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setIntent(sample)}
                className="rounded-lg border border-[color:var(--line-strong)] bg-white/80 px-2 py-1 text-xs font-semibold text-[color:var(--text-soft)] hover:text-[color:var(--text-main)]"
              >
                Use sample
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={submitting || !intent.trim()}
            className="mt-3 rounded-xl bg-[#10263b] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Run via Workflow Engine"}
          </button>
        </form>
      </div>
    </motion.section>
  );
}
