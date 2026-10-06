import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SectionHead, Reveal } from "./Reveal";

const STEPS = [
  ["Análise inicial", "Entendemos seu perfil, objetivo da viagem e prazos. Você recebe um checklist personalizado de documentos."],
  ["Formulários & taxas", "Preenchemos com você o requerimento da Polícia Federal ou o DS-160 e orientamos o pagamento das taxas oficiais."],
  ["Agendamento estratégico", "Buscamos as melhores datas disponíveis na Polícia Federal, no CASV e no Consulado."],
  ["Preparação & entrevista", "Simulação da entrevista consular, revisão final da pasta de documentos e acompanhamento até a conclusão."],
];

export const Process = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const h = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section id="processo" className="relative py-24 sm:py-32 bg-alt border-y border-white/5" data-testid="process-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-14">
        <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
          <SectionHead index="02" label="Como funciona" title={<>Quatro etapas.<br /><em className="gold-text">Zero</em> improviso.</>} />
          <Reveal delay={0.1} className="mt-10">
            <div className="relative overflow-hidden rounded-[28px] aspect-[4/3]">
              <motion.img
                style={{ y: imgY, scale: 1.2 }}
                src="/images/consult.jpg"
                alt="Consultora em atendimento com cliente"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-ink/10" />
            </div>
          </Reveal>
        </div>

        <div ref={ref} className="lg:col-span-7 relative pl-8 sm:pl-12">
          <div className="absolute left-0 top-2 bottom-2 w-px bg-white/10">
            <motion.div style={{ height: h }} className="w-px bg-sage" />
          </div>
          {STEPS.map(([t, d], i) => (
            <Reveal key={t} delay={0.05} className="relative pb-16 last:pb-0">
              <span className="absolute -left-8 sm:-left-12 top-3 -translate-x-1/2 h-3 w-3 rounded-full bg-ink border border-sage" />
              <div className="flex items-baseline gap-5" data-testid={`process-step-${i + 1}`}>
                <span className="font-display text-6xl sm:text-7xl outline-text leading-none">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-3xl sm:text-4xl text-white">{t}</h3>
                  <p className="mt-3 text-slate-300 leading-relaxed max-w-lg">{d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
