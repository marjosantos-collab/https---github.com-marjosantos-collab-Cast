import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHead, Reveal } from "./Reveal";

const QA = [
  ["A assessoria garante a aprovação do visto?", "Não. A decisão é exclusiva do oficial consular. Nosso trabalho é garantir que seu processo esteja correto, completo e que você chegue preparado para a entrevista."],
  ["Quais documentos preciso para o passaporte brasileiro?", "Em geral: documento de identidade, CPF, título de eleitor com quitação eleitoral, certificado de reservista (homens de 18 a 45 anos) e o passaporte anterior, se houver. Enviamos um checklist personalizado na análise inicial."],
  ["O que é o formulário DS-160?", "É o formulário online obrigatório para solicitar o visto americano de não-imigrante. Ele precisa ser preenchido com atenção, pois as informações são usadas na entrevista."],
  ["As taxas oficiais estão incluídas no valor da assessoria?", "Não. Taxas como a GRU da Polícia Federal e a taxa consular (MRV) são pagas diretamente aos órgãos oficiais. Orientamos todo o processo de pagamento."],
  ["O atendimento pode ser online?", "Sim. Você escolhe no agendamento e indica sua preferência nas observações; confirmamos o formato no contato de confirmação."],
];

export const Faq = () => (
  <section id="faq" className="relative py-24 sm:py-32" data-testid="faq-section">
    <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12">
      <SectionHead index="04" label="Dúvidas frequentes" title={<>Perguntas<br /><em className="gold-text">honestas</em>.</>} className="lg:col-span-4" />
      <Reveal delay={0.1} className="lg:col-span-8">
        <Accordion type="single" collapsible className="border-t border-white/10">
          {QA.map(([q, a], i) => (
            <AccordionItem key={q} value={`q${i}`} className="border-white/10">
              <AccordionTrigger data-testid={`faq-trigger-${i}`} className="py-7 text-left font-display text-2xl sm:text-3xl text-white hover:no-underline hover:text-sage transition-colors">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-base leading-relaxed pb-7 max-w-2xl">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </div>
  </section>
);
