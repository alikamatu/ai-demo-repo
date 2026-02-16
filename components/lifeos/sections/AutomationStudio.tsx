import type { Automation } from "@/components/lifeos/types";

type Props = {
  automations: Automation[];
  onToggleAutomation: (automationId: string) => void;
};

export default function AutomationStudio({ automations, onToggleAutomation }: Props) {
  return (
    <article className="glass rounded-[1.4rem] p-5 md:p-6">
      <h3 className="text-2xl font-extrabold">Automation Studio</h3>
      <p className="mt-2 text-sm text-[color:var(--text-soft)]">
        Configure in plain English. Example: "Every morning, apply to top 5 matching roles and update me."
      </p>
      <div className="mt-4 space-y-2">
        {automations.map((flow) => (
          <div key={flow.id} className="rounded-xl border border-[color:var(--line)] bg-white/80 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{flow.name}</p>
              <span
                className={`badge-chip ${
                  flow.status === "active"
                    ? "bg-[#0ec5a4]/15 text-[#0c6f5f]"
                    : flow.status === "review"
                      ? "bg-[#ff9f1c]/15 text-[#7a4a05]"
                      : "bg-[#f25f5c]/15 text-[#7d2f2d]"
                }`}
              >
                {flow.status}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-soft)]">
              {flow.trigger}
            </p>
            <p className="mt-2 text-sm text-[color:var(--text-soft)]">{flow.effect}</p>
            <button
              onClick={() => onToggleAutomation(flow.id)}
              className="mt-3 rounded-md border border-[color:var(--line-strong)] bg-white px-3 py-1.5 text-sm font-semibold"
            >
              {flow.status === "active" ? "Pause" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}
