import { motion } from "framer-motion";
import { ArrowUpRight, BookOpenCheck, Users, RefreshCcw } from "lucide-react";
import { SectionHead } from "./Reveal";
import { scrollToId } from "@/lib/lenis";

const ease = [0.16, 1, 0.3, 1];

const Card = ({ className = "", delay = 0, children, testId }) => (
  <motion.article
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 1, delay, ease }}
    whileHover={{ y: -6 }}
    data-testid={testId}
    className={`group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-surface ${className}`}
  >
    {children}
  </motion.article>
);

const PhotoCard = ({ img, alt, tag, title, text, list, testId, className, delay }) => (
  <Card className={`min-h-[460px] ${className}`} delay={delay} testId={testId}>
    <img src={img} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-[1.6s] ease-out group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
    <div className="relative h-full flex flex-col justify-end p-7 sm:p-10">
      <span className="overline mb-4">{tag}</span>
      <h3 className="font-display text-4xl sm:text-5xl text-white leading-none">{title}</h3>
      <p className="mt-4 max-w-md text-slate-300 text-sm sm:text-base leading-relaxed">{text}</p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {list.map((l) => (
          <li key={l} className="rounded-full border border-white/15 bg-white/5 backdrop-blur px-3 py-1.5 text-xs text-slate-200">{l}</li>
        ))}
      </ul>
      <button
        onClick={() => scrollToId("agendar")}
        data-testid={`${testId}-cta`}
        className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sage w-fit"
      >
        Agendar este serviço
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
      </button>
    </div>
  </Card>
);

const SmallCard = ({ icon: Icon, title, text, testId, className, delay }) => (
  <Card className={`p-7 sm:p-9 flex flex-col justify-between min-h-[260px] ${className}`} delay={delay} testId={testId}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(var(--sage)/0.16),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="relative h-12 w-12 rounded-2xl border border-sage/30 grid place-items-center text-sage">
      <Icon className="h-5 w-5" />
    </div>
    <div className="relative mt-8">
      <h3 className="font-display text-3xl text-white">{title}</h3>
      <p className="mt-3 text-sm text-slate-300 leading-relaxed">{text}</p>
    </div>
  </Card>
);

export const Services = () => (
  <section id="servicos" className="relative py-24 sm:py-32" data-testid="services-section">
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div className="grid lg:grid-cols-12 gap-8 items-end mb-16">
        <SectionHead index="01" label="Serviços" title={<>Especialistas em dois<br className="hidden sm:block" /> documentos que <em className="gold-text">abrem portas</em>.</>} className="lg:col-span-8" />
        <p className="lg:col-span-4 text-slate-300 leading-relaxed">
          Cuidamos da parte burocrática para que você foque no que importa: a sua viagem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 md:auto-rows-[minmax(260px,auto)]">
        <PhotoCard
          testId="service-card-passaporte"
          className="md:col-span-7"
          img="/images/hero.jpg"
          alt="Passaporte com carimbos"
          tag="Polícia Federal"
          title="Passaporte Brasileiro"
          text="Primeira emissão, renovação ou passaporte de menores. Orientamos a documentação, o preenchimento do requerimento, a GRU e o agendamento na Polícia Federal."
          list={["Primeira via", "Renovação", "Menores de idade", "Perda ou roubo"]}
        />
        <PhotoCard
          testId="service-card-visto"
          className="md:col-span-5 md:row-span-2"
          img="/images/liberty.jpg"
          alt="Estátua da Liberdade em Nova York"
          tag="Consulado dos EUA"
          title="Visto Americano"
          text="Turismo e negócios (B1/B2). Preenchimento estratégico do DS-160, pagamento da taxa, agendamento no CASV e consulado e simulação completa da entrevista."
          list={["DS-160", "Taxa MRV", "CASV", "Simulação de entrevista"]}
          delay={0.1}
        />
        <SmallCard
          testId="service-card-renovacao"
          className="md:col-span-4"
          icon={RefreshCcw}
          title="Renovação de Visto"
          text="Verificamos se você se enquadra na dispensa de entrevista e conduzimos todo o processo de renovação."
          delay={0.15}
        />
        <SmallCard
          testId="service-card-familia"
          className="md:col-span-3"
          icon={Users}
          title="Família"
          text="Processos em grupo, organizados em um só cronograma."
          delay={0.2}
        />
      </div>

      <div className="mt-6 flex items-center gap-3 text-sm text-slate-400">
        <BookOpenCheck className="h-4 w-4 text-sage" />
        As taxas governamentais e consulares são pagas diretamente aos órgãos oficiais.
      </div>
    </div>
  </section>
);
