import { motion } from "framer-motion";
import type { LlmMode, LlmStatusResponse } from "@/lib/lifeos-contracts";

type Props = {
  status: LlmStatusResponse | null;
  loading: boolean;
  switching: boolean;
  onRefresh: () => void;
  onChangeMode: (mode: LlmMode) => void;
};

const modeLabels: Record<LlmMode, string> = {
  mock: "Demo Mode",
  openai: "OpenAI",
  ollama: "Ollama",
  llamacpp: "Local LLM",
};

export default function LlmControlPanel({ status, loading, switching, onRefresh, onChangeMode }: Props) {
  const mode = status?.mode;
  const options = status?.options ?? ["mock", "openai", "ollama", "llamacpp"];

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
          <p className="badge-chip inline-flex bg-white/70 text-[#0e3c63]">AI Engine</p>
          <h3 className="mt-2 text-2xl font-extrabold">Model Control Center</h3>
          <p className="mt-1 text-sm text-[color:var(--text-soft)]">
            Choose the intelligence source. LifeOS checks connection health in real time.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading || switching}
          className="rounded-xl border border-[color:var(--line-strong)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--text-main)] transition hover:bg-[#f7fbff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh Status"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
            Current Engine
          </p>
          <p className="mt-2 text-xl font-extrabold text-[color:var(--text-main)]">
            {mode ? modeLabels[mode] : "Unknown"}
          </p>
          <p
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
              status?.ready ? "bg-[#0ec5a4]/20 text-[#0d7a67]" : "bg-[#f25f5c]/18 text-[#a23a38]"
            }`}
          >
            {status?.ready ? "Ready" : "Needs Attention"}
          </p>
          <p className="mt-2 text-sm text-[color:var(--text-soft)]">{status?.reason ?? "Checking provider..."}</p>
          <p className="mt-1 text-xs text-[color:var(--text-soft)]">Model: {status?.model ?? "n/a"}</p>
        </div>

        <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
            Switch Provider
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const active = option === mode;
              return (
                <button
                  key={option}
                  onClick={() => onChangeMode(option)}
                  disabled={switching || active}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-[#0ec5a4] bg-[#0ec5a4]/20 text-[#0d7a67]"
                      : "border-[color:var(--line-strong)] bg-white text-[color:var(--text-main)] hover:bg-[#f7fbff]"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {switching && !active ? "Switching..." : active ? `Using ${modeLabels[option]}` : modeLabels[option]}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[color:var(--text-soft)]">
            Tip: Local LLM works offline after model setup. OpenAI needs API key.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
