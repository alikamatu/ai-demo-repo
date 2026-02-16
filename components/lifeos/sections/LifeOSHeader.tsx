import type { ApprovalItem } from "@/components/lifeos/types";
import type { AuthUser, LlmMode } from "@/lib/lifeos-contracts";

type Props = {
  pendingApprovals: ApprovalItem[];
  isHydrating: boolean;
  lastSyncedAt: string | null;
  llmMode?: LlmMode;
  llmReady?: boolean;
  user: AuthUser;
  onReset: () => void;
  onLogout: () => void;
};

function formatSyncLabel(value: string | null): string {
  if (!value) return "Not synced yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced yet";

  return `Synced ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function LifeOSHeader({
  pendingApprovals,
  isHydrating,
  lastSyncedAt,
  llmMode,
  llmReady,
  user,
  onReset,
  onLogout,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-[#f6efe6]/92 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-7xl gap-3 px-3 py-3 sm:px-4 md:px-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--text-soft)] sm:text-xs">
              Personal AI Operating System
            </p>
            <h1 className="text-xl font-black leading-tight sm:text-2xl md:text-3xl">
              LIFE<span className="gradient-text">OS</span>
            </h1>
            <p className="mt-1 text-xs text-[color:var(--text-soft)]">{user.name} · {user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-chip bg-[#0ec5a4]/12 text-[#0d7a67]">Auto Mode On</span>
            {llmMode ? (
              <span
                className={`badge-chip ${llmReady ? "bg-[#0ec5a4]/12 text-[#0d7a67]" : "bg-[#f25f5c]/12 text-[#a23a38]"}`}
              >
                {llmMode.toUpperCase()} {llmReady ? "Ready" : "Offline"}
              </span>
            ) : null}
            <span className="badge-chip bg-white/75 text-[color:var(--text-soft)]">
              {isHydrating ? "Syncing..." : formatSyncLabel(lastSyncedAt)}
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <button className="min-w-max rounded-xl border border-[color:var(--line-strong)] bg-white/80 px-3 py-2 text-sm font-semibold text-[color:var(--text-main)]">
            Review {pendingApprovals.length} approvals
          </button>
          <button
            onClick={onReset}
            className="min-w-max rounded-xl border border-[color:var(--line-strong)] bg-[#10263b] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#173651]"
          >
            Reset Workspace
          </button>
          <button
            onClick={onLogout}
            className="min-w-max rounded-xl border border-[color:var(--line-strong)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--text-main)]"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
