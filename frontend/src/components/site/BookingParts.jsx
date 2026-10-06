import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { SERVICE_LABELS } from "@/lib/api";

export const ServicePicker = ({ value, onChange }) => (
  <div>
    <p className="overline mb-4">1 · Serviço</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.entries(SERVICE_LABELS).map(([k, label]) => (
        <button
          type="button"
          key={k}
          onClick={() => onChange(k)}
          data-testid={`booking-service-${k}`}
          className={`text-left rounded-2xl border px-5 py-4 text-sm transition-colors duration-300 ${
            value === k ? "border-sage bg-sage/10 text-sage font-medium" : "border-white/10 text-slate-300 hover:border-white/30"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

const tomorrow = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
};

export const BookingDatePicker = ({ value, onChange }) => (
  <div data-testid="booking-calendar">
    <p className="overline mb-4">2 · Data</p>
    <div className="rounded-2xl border border-white/10 bg-ink/60 w-fit max-w-full">
      <Calendar
        mode="single"
        locale={ptBR}
        selected={value}
        onSelect={(d) => d && onChange(d)}
        disabled={[{ before: tomorrow() }, { dayOfWeek: [0, 6] }]}
        classNames={{
          day_selected: "bg-sage text-onsage hover:bg-sage hover:text-onsage focus:bg-sage",
          day_today: "border border-white/20",
          caption_label: "text-sm font-medium capitalize",
        }}
      />
    </div>
  </div>
);

export const TimeSlots = ({ date, slots, value, onChange }) => (
  <div>
    <p className="overline mb-4">3 · Horário</p>
    {!date ? (
      <p className="text-sm text-slate-400" data-testid="booking-time-hint">Selecione uma data para ver os horários disponíveis.</p>
    ) : (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 gap-2.5" data-testid="booking-time-slots">
        {slots.map((s) => (
          <button
            type="button"
            key={s.time}
            disabled={!s.available}
            onClick={() => onChange(s.time)}
            data-testid={`booking-time-${s.time.replace(":", "")}`}
            className={`rounded-xl border py-3 font-mono-x text-sm transition-colors duration-300 ${
              value === s.time
                ? "border-sage bg-sage text-onsage"
                : s.available
                ? "border-white/10 text-slate-200 hover:border-sage/60"
                : "border-white/5 text-slate-600 line-through cursor-not-allowed"
            }`}
          >
            {s.time}
          </button>
        ))}
      </div>
    )}
  </div>
);

export const Field = ({ label, value, onChange, testId, type = "text", textarea, required }) => {
  const cls =
    "peer w-full bg-transparent border-b border-white/15 pt-6 pb-2 text-white placeholder-transparent focus:outline-none focus:border-sage transition-colors";
  return (
    <label className="relative block">
      {textarea ? (
        <textarea rows={3} required={required} minLength={required ? 5 : undefined} placeholder={label} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId} className={`${cls} resize-none`} />
      ) : (
        <input type={type} placeholder={label} value={value} required={required} onChange={(e) => onChange(e.target.value)} data-testid={testId} className={cls} />
      )}
      <span className="absolute left-0 top-0 text-xs text-slate-400 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs peer-focus:text-sage">
        {label}
      </span>
    </label>
  );
};
