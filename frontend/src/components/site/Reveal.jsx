import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, y = 40, className = "" }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

export const SectionHead = ({ index, label, title, className = "" }) => (
  <Reveal className={className}>
    <div className="flex items-center gap-4 mb-6">
      <span className="font-mono-x text-xs text-slate-400">{index}</span>
      <span className="h-px w-10 bg-sage/60" />
      <span className="overline">{label}</span>
    </div>
    <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.02] text-white">
      {title}
    </h2>
  </Reveal>
);
