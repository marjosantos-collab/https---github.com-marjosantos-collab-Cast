import { motion } from "framer-motion";
import { Stamp } from "lucide-react";

const ease = [0.16, 1, 0.3, 1];

export const HeroFrame = ({ rx, ry }) => (
  <motion.div
    style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
    className="relative mx-auto w-full max-w-[440px]"
    data-testid="hero-frame"
  >
    <motion.div
      initial={{ clipPath: "inset(100% 0 0 0 round 999px 999px 24px 24px)" }}
      animate={{ clipPath: "inset(0% 0 0 0 round 999px 999px 24px 24px)" }}
      transition={{ duration: 1.6, delay: 0.5, ease }}
      className="relative aspect-[3/4] overflow-hidden bg-surface"
    >
      <motion.img
        src="/images/hero.jpg"
        alt="Passaporte aberto com carimbos de viagem"
        initial={{ scale: 1.35 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 2.2, delay: 0.5, ease }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_20%,rgb(var(--ink)/0.88)_85%)]" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <p className="overline mb-2">Documento · Destino</p>
        <p className="font-display text-2xl sm:text-3xl text-white leading-tight">
          Cada carimbo começa com um processo bem feito.
        </p>
      </div>
    </motion.div>

    <motion.div
      style={{ transform: "translateZ(60px)" }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.4, duration: 1, ease }}
      className="absolute -left-6 sm:-left-12 top-16 h-28 w-28 sm:h-32 sm:w-32"
    >
      <svg viewBox="0 0 120 120" className="spin-slow absolute inset-0 h-full w-full">
        <defs>
          <path id="circ" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <circle cx="60" cy="60" r="58" style={{ fill: "rgb(var(--ink))", stroke: "rgb(var(--sage) / 0.45)" }} />
        <text style={{ fill: "rgb(var(--sage))" }} fontSize="10" fontFamily="JetBrains Mono">
          <textPath href="#circ" textLength="286" lengthAdjust="spacing">AGENDE · PASSAPORTE · VISTO · </textPath>
        </text>
      </svg>
      <Stamp className="absolute inset-0 m-auto h-7 w-7 text-white" />
    </motion.div>

    <motion.div
      style={{ transform: "translateZ(40px)" }}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.6, duration: 1, ease }}
      className="absolute -right-2 sm:-right-8 bottom-24 rounded-2xl border border-white/10 bg-surface/80 backdrop-blur-xl px-5 py-4"
    >
      <p className="font-mono-x text-[11px] text-slate-400 uppercase tracking-widest">Status</p>
      <p className="text-white text-sm font-medium mt-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" /> Documentação conferida
      </p>
    </motion.div>
  </motion.div>
);
