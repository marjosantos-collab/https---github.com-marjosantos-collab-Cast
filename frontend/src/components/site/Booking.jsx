import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { SectionHead, Reveal } from "./Reveal";
import { BookingDatePicker, ServicePicker, TimeSlots, Field } from "./BookingParts";
import { api, formatApiError, SERVICE_LABELS } from "@/lib/api";

const empty = { name: "", email: "", phone: "", notes: "" };
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const Booking = () => {
  const [service, setService] = useState("passaporte");
  const [date, setDate] = useState(null);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!date) return;
    let active = true;
    setTime("");
    api
      .get("/bookings/availability", { params: { date: toISO(date) } })
      .then((r) => active && setSlots(Array.isArray(r.data?.slots) ? r.data.slots : []))
      .catch(() => active && setSlots([]));
    return () => {
      active = false;
    };
  }, [date]);

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !time) return toast.error("Escolha uma data e um horário.");
    setLoading(true);
    try {
      const { data } = await api.post("/bookings", { ...form, service, date: toISO(date), time });
      setDone(data);
      toast.success("Assessoria agendada com sucesso!");
      setForm(empty);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="agendar" className="relative py-24 sm:py-32" data-testid="booking-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-end mb-14">
          <SectionHead index="03" label="Agendamento" title={<>Reserve sua<br /><em className="gold-text">assessoria</em>.</>} className="lg:col-span-7" />
          <p className="lg:col-span-5 text-slate-300 leading-relaxed">
            Escolha o serviço, o dia e o horário. Nossa equipe confirma o atendimento pelo seu e-mail ou WhatsApp.
          </p>
        </div>

        <Reveal>
          {done ? (
            <Confirmation data={done} onReset={() => { setDone(null); setDate(null); setTime(""); }} />
          ) : (
            <form onSubmit={submit} className="grid lg:grid-cols-12 gap-6" data-testid="booking-form">
              <div className="lg:col-span-7 rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-9 space-y-9">
                <ServicePicker value={service} onChange={setService} />
                <div className="grid md:grid-cols-2 gap-8">
                  <BookingDatePicker value={date} onChange={setDate} />
                  <TimeSlots date={date} slots={slots} value={time} onChange={setTime} />
                </div>
              </div>
              <div className="lg:col-span-5 rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-9 flex flex-col gap-5">
                <p className="overline">Seus dados</p>
                <Field label="Nome completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} testId="booking-name-input" required />
                <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} testId="booking-email-input" required />
                <Field label="Telefone / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} testId="booking-phone-input" required />
                <Field label="Observações (opcional)" textarea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} testId="booking-notes-input" />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  data-testid="booking-submit-button"
                  className="btn-gold mt-auto rounded-full py-4 text-sm font-semibold disabled:opacity-60"
                >
                  {loading ? "Enviando..." : "Confirmar agendamento"}
                </motion.button>
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
};

const Confirmation = ({ data, onReset }) => (
  <div className="rounded-[28px] border border-sage/30 bg-surface p-8 sm:p-14 text-left" data-testid="booking-confirmation">
    <CheckCircle2 className="h-12 w-12 text-sage" />
    <h3 className="mt-6 font-display text-4xl sm:text-5xl text-white">Agendamento recebido, {data?.name?.split(" ")[0]}.</h3>
    <p className="mt-4 text-slate-300 max-w-xl">
      {SERVICE_LABELS[data?.service]} · {data?.date?.split("-").reverse().join("/")} às {data?.time}. Em breve entraremos em contato para confirmar.
    </p>
    <button onClick={onReset} data-testid="booking-new-button" className="mt-8 rounded-full border border-white/15 px-6 py-3 text-sm text-white hover:border-sage transition-colors">
      Fazer novo agendamento
    </button>
  </div>
);
