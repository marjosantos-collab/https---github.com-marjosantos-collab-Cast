import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Clock, MessageCircle } from "lucide-react";
import { SectionHead, Reveal } from "./Reveal";
import { Field } from "./BookingParts";
import { api, formatApiError } from "@/lib/api";
import { SITE } from "@/lib/siteInfo";

const empty = { name: "", email: "", phone: "", subject: "", message: "" };

const INFO = [
  [Phone, "Telefone", SITE.phone],
  [MessageCircle, "WhatsApp", SITE.whatsapp],
  [Mail, "E-mail", SITE.email],
  [MapPin, "Endereço", SITE.address],
  [Clock, "Horário", SITE.hours],
];

export const Contact = () => {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contacts", form);
      toast.success("Mensagem enviada! Retornaremos em breve.");
      setForm(empty);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contato" className="relative py-24 sm:py-32 bg-alt border-t border-white/5" data-testid="contact-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-14">
        <div className="lg:col-span-5">
          <SectionHead index="05" label="Contato" title={<>Vamos <em className="gold-text">conversar</em>.</>} />
          <Reveal delay={0.1} className="mt-12 space-y-6">
            {INFO.map(([Icon, label, val]) => (
              <div key={label} className="flex items-start gap-4" data-testid={`contact-info-${label.toLowerCase().replace(/[^a-z]/g, "")}`}>
                <span className="h-11 w-11 shrink-0 rounded-full border border-white/10 grid place-items-center text-sage">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-mono-x text-[11px] uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="text-white mt-1">{val}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal delay={0.15} className="lg:col-span-7">
          <form onSubmit={submit} className="rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-10 grid sm:grid-cols-2 gap-6" data-testid="contact-form">
            <Field label="Nome" value={form.name} onChange={set("name")} testId="contact-name-input" required />
            <Field label="E-mail" type="email" value={form.email} onChange={set("email")} testId="contact-email-input" required />
            <Field label="Telefone (opcional)" value={form.phone} onChange={set("phone")} testId="contact-phone-input" />
            <Field label="Assunto" value={form.subject} onChange={set("subject")} testId="contact-subject-input" required />
            <div className="sm:col-span-2">
              <Field label="Sua mensagem" textarea value={form.message} onChange={set("message")} testId="contact-message-input" required />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              data-testid="contact-submit-button"
              className="btn-gold sm:col-span-2 rounded-full py-4 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar mensagem"}
            </motion.button>
          </form>
        </Reveal>
      </div>
    </section>
  );
};
