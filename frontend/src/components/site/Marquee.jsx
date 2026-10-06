const ITEMS = [
  "Passaporte Brasileiro",
  "Visto Americano B1/B2",
  "Formulário DS-160",
  "Agendamento CASV & Consulado",
  "Simulação de Entrevista",
  "Polícia Federal",
  "Renovação de Visto",
];

const Row = () => (
  <div className="flex shrink-0 items-center">
    {ITEMS.map((t, i) => (
      <span key={t} className="flex items-center">
        <span className={`font-display text-5xl sm:text-7xl px-8 whitespace-nowrap ${i % 2 ? "outline-text italic" : "text-white"}`}>
          {t}
        </span>
        <span className="text-sage text-3xl">✦</span>
      </span>
    ))}
  </div>
);

export const Marquee = () => (
  <section className="relative py-12 border-y border-white/5 overflow-hidden bg-ink" data-testid="editorial-marquee">
    <div className="marquee-track flex w-max">
      <Row />
      <Row />
    </div>
  </section>
);
