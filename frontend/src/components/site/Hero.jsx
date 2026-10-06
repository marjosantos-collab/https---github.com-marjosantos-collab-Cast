import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { scrollToId } from "@/lib/lenis";
import { HeroFrame } from "./HeroFrame";

const LINES = [
  { text: "Seu passaporte.", cls: "text-white" },
  { text: "Seu visto.", cls: "italic gold-text" },
  { text: "Sem atalhos,", cls: "text-white" },
  { text: "sem erros.", cls: "outline-text" },
];

const ease = [0.16, 1, 0.3, 1];

export const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 80, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 80, damping: 18 });

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative min-h-[100svh] pt-28 sm:pt-32 pb-16 overflow-hidden"
      data-testid="hero-section"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 right-[-10%] h-[620px] w-[620px] rounded-full bg-sage/10 blur-[140px]" />
        <div className="absolute inset-y-0 left-[8%] w-px bg-white/5" />
        <div className="absolute inset-y-0 right-[8%] w-px bg-white/5" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        <motion.div style={{ y: titleY }} className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="h-2 w-2 rounded-full bg-sage animate-pulse" />
            <span className="overline">Assessoria · Passaporte & Visto Americano</span>
          </motion.div>

          <h1 className="font-display font-medium tracking-tight leading-[0.92] text-[3.4rem] sm:text-7xl lg:text-[6.4rem]" data-testid="hero-title">
            {LINES.map((l, i) => (
              <span key={l.text} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className={`block ${l.cls}`}
                  initial={{ y: "110%", rotate: 3 }}
                  animate={{ y: "0%", rotate: 0 }}
                  transition={{ duration: 1.2, delay: 0.35 + i * 0.12, ease }}
                >
                  {l.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 1, ease }}
            className="mt-10 max-w-xl text-base sm:text-lg text-slate-300 leading-relaxed"
          >
            A Cast Assessoria conduz você por cada etapa — documentação, formulários, taxas,
            agendamentos e preparação para a entrevista — com acompanhamento individual do início ao fim.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 1, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={() => scrollToId("agendar")}
              data-testid="hero-book-button"
              className="btn-gold group inline-flex items-center gap-3 rounded-full pl-7 pr-2 py-2 text-sm font-semibold"
            >
              Agendar minha assessoria
              <span className="h-10 w-10 rounded-full bg-ink text-sage grid place-items-center transition-transform duration-500 group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </button>
            <button
              onClick={() => scrollToId("servicos")}
              data-testid="hero-services-button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-4 text-sm text-white hover:border-sage/60 hover:text-sage transition-colors"
            >
              Ver serviços <ArrowDownRight className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>

        <div className="lg:col-span-5" style={{ perspective: 1200 }}>
          <HeroFrame rx={rx} ry={ry} />
        </div>
      </div>
    </section>
  );
};
