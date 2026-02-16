import type { ApprovalItem } from "@/components/lifeos/types";

type Props = {
  approvals: ApprovalItem[];
  onApprovalUpdate: (approvalId: string, status: "approved" | "rejected") => void;
};

export default function ApprovalsPanel({ approvals, onApprovalUpdate }: Props) {
  return (
    <div className="glass rounded-[1.4rem] p-5 md:p-6">
      <h3 className="text-2xl font-extrabold">Approvals Inbox</h3>
      <p className="mt-2 text-sm text-[color:var(--text-soft)]">
        You stay in control. LifeOS pauses only where your policy says approval is required.
      </p>

      <div className="mt-4 space-y-3">
        {approvals.length === 0 && (
          <div className="rounded-xl border border-[color:var(--line)] bg-white/80 p-3 text-sm text-[color:var(--text-soft)]">
            No pending approvals. All autonomous tasks are currently compliant.
          </div>
        )}

        {approvals.map((item) => (
          <div key={item.id} className="rounded-xl border border-[color:var(--line)] bg-white/80 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-[color:var(--text-soft)]">{item.note}</p>
              </div>
              <span
                className={`badge-chip ${
                  item.status === "pending"
                    ? "bg-[#ff9f1c]/15 text-[#7a4a05]"
                    : item.status === "approved"
                      ? "bg-[#0ec5a4]/15 text-[#0c6f5f]"
                      : "bg-[#f25f5c]/15 text-[#7d2f2d]"
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => onApprovalUpdate(item.id, "approved")}
                className="rounded-md bg-[#10263b] px-3 py-1.5 text-sm font-semibold text-white"
              >
                {item.cta}
              </button>
              <button
                onClick={() => onApprovalUpdate(item.id, "rejected")}
                className="rounded-md border border-[color:var(--line-strong)] bg-white px-3 py-1.5 text-sm font-semibold"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
