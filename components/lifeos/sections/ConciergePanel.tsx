import { motion } from "framer-motion";

export default function ConciergePanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-[1.4rem] border border-[color:var(--line)] p-5 md:flex md:items-center md:justify-between md:p-6"
    >
      <div>
        <h3 className="text-2xl font-extrabold">Concierge Mode for Real Life</h3>
        <p className="mt-2 max-w-3xl text-sm text-[color:var(--text-soft)] md:text-base">
          Say "organize my week" and LifeOS handles task prioritization, event coordination, transport timing,
          shopping lists, and meal orders. You get one clear timeline instead of ten disconnected apps.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
        <button className="rounded-xl bg-[#0ec5a4] px-4 py-2 font-semibold text-[#09362f]">Start Concierge</button>
        <button className="rounded-xl border border-[color:var(--line-strong)] bg-white px-4 py-2 font-semibold text-[color:var(--text-main)]">
          View Demo Run
        </button>
      </div>
    </motion.section>
  );
}
