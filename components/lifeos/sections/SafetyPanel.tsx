type Props = {
  rules: string[];
};

export default function SafetyPanel({ rules }: Props) {
  return (
    <article className="glass rounded-[1.4rem] p-5 md:p-6">
      <h3 className="text-2xl font-extrabold">Trust & Safety Rules</h3>
      <p className="mt-2 text-sm text-[color:var(--text-soft)]">
        Control what the assistant can do automatically across money, privacy, legal, and communication.
      </p>
      <ul className="mt-4 space-y-2">
        {rules.map((rule) => (
          <li key={rule} className="rounded-lg border border-[color:var(--line)] bg-white/80 px-3 py-2 text-sm">
            {rule}
          </li>
        ))}
      </ul>
      <button className="mt-4 w-full rounded-xl bg-[#10263b] px-4 py-3 font-semibold text-white transition hover:bg-[#173651]">
        Open Policy Builder
      </button>
    </article>
  );
}
