import { Trash2 } from "lucide-react";
import { SERVICE_LABELS } from "@/lib/api";

const BOOKING_STATUS = { pendente: "Pendente", confirmado: "Confirmado", concluido: "Concluído", cancelado: "Cancelado" };
const CONTACT_STATUS = { novo: "Novo", respondido: "Respondido", arquivado: "Arquivado" };
const fmtDate = (d) => (d ? d.split("-").reverse().join("/") : "");

const StatusSelect = ({ value, options, onChange, testId }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    data-testid={testId}
    className="rounded-full border border-white/10 bg-ink px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sage"
  >
    {Object.entries(options).map(([k, l]) => (
      <option key={k} value={k}>{l}</option>
    ))}
  </select>
);

const DelBtn = ({ onClick, testId }) => (
  <button
    onClick={() => window.confirm("Remover este registro?") && onClick()}
    data-testid={testId}
    className="h-8 w-8 grid place-items-center rounded-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
    aria-label="Remover"
  >
    <Trash2 className="h-4 w-4" />
  </button>
);

const Empty = ({ text, testId }) => (
  <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate-400" data-testid={testId}>{text}</div>
);

export const BookingsTable = ({ items, onStatus, onDelete }) => {
  if (!items.length) return <Empty text="Nenhum agendamento encontrado." testId="bookings-empty" />;
  return (
    <div className="grid gap-3" data-testid="bookings-list">
      {items.map((b) => (
        <div key={b.id} className="rounded-2xl border border-white/[0.08] bg-surface p-5 grid md:grid-cols-12 gap-4 items-center" data-testid={`booking-row-${b.id}`}>
          <div className="md:col-span-3">
            <p className="text-white font-medium">{b.name}</p>
            <p className="text-xs text-slate-400 break-all">{b.email}</p>
            <p className="text-xs text-slate-400">{b.phone}</p>
          </div>
          <div className="md:col-span-3 text-sm text-slate-200">{SERVICE_LABELS[b.service] || b.service}</div>
          <div className="md:col-span-2 font-mono-x text-sm text-sage">{fmtDate(b.date)} · {b.time}</div>
          <div className="md:col-span-2 text-xs text-slate-400 line-clamp-2">{b.notes || "—"}</div>
          <div className="md:col-span-2 flex items-center gap-2 md:justify-end">
            <StatusSelect value={b.status} options={BOOKING_STATUS} onChange={(s) => onStatus(b.id, s)} testId={`booking-status-${b.id}`} />
            <DelBtn onClick={() => onDelete(b.id)} testId={`booking-delete-${b.id}`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ContactsTable = ({ items, onStatus, onDelete }) => {
  if (!items.length) return <Empty text="Nenhuma mensagem encontrada." testId="contacts-empty" />;
  return (
    <div className="grid gap-3" data-testid="contacts-list">
      {items.map((c) => (
        <div key={c.id} className="rounded-2xl border border-white/[0.08] bg-surface p-5 grid md:grid-cols-12 gap-4" data-testid={`contact-row-${c.id}`}>
          <div className="md:col-span-3">
            <p className="text-white font-medium">{c.name}</p>
            <p className="text-xs text-slate-400 break-all">{c.email}</p>
            <p className="text-xs text-slate-400">{c.phone}</p>
            <p className="text-xs text-slate-500 mt-2 font-mono-x">{new Date(c.created_at).toLocaleString("pt-BR")}</p>
          </div>
          <div className="md:col-span-7">
            <p className="text-sm text-sage">{c.subject}</p>
            <p className="text-sm text-slate-300 mt-1 whitespace-pre-line">{c.message}</p>
          </div>
          <div className="md:col-span-2 flex items-start gap-2 md:justify-end">
            <StatusSelect value={c.status} options={CONTACT_STATUS} onChange={(s) => onStatus(c.id, s)} testId={`contact-status-${c.id}`} />
            <DelBtn onClick={() => onDelete(c.id)} testId={`contact-delete-${c.id}`} />
          </div>
        </div>
      ))}
    </div>
  );
};
