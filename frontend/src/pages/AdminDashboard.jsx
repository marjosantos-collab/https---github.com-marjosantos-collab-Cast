import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Search, CalendarDays, Mail, Clock3, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { BookingsTable, ContactsTable } from "@/components/admin/Tables";

const Metric = ({ icon: Icon, label, value, testId }) => (
  <div className="rounded-2xl border border-white/[0.08] bg-surface p-5" data-testid={testId}>
    <Icon className="h-5 w-5 text-sage" />
    <p className="mt-4 font-display text-4xl text-white">{value}</p>
    <p className="text-xs text-slate-400 uppercase tracking-widest font-mono-x mt-1">{label}</p>
  </div>
);

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([api.get("/admin/bookings"), api.get("/admin/contacts")]);
      setBookings(Array.isArray(b.data) ? b.data : []);
      setContacts(Array.isArray(c.data) ? c.data : []);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filter = (list) => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((i) => [i.name, i.email, i.phone, i.subject].some((v) => v?.toLowerCase().includes(s)));
  };

  const metrics = useMemo(() => ({
    total: bookings.length,
    pend: bookings.filter((b) => b.status === "pendente").length,
    conf: bookings.filter((b) => b.status === "confirmado").length,
    msgs: contacts.filter((c) => c.status === "novo").length,
  }), [bookings, contacts]);

  const update = async (kind, id, body) => {
    try {
      const { data } = await api.patch(`/admin/${kind}/${id}`, body);
      const setter = kind === "bookings" ? setBookings : setContacts;
      setter((list) => list.map((i) => (i.id === id ? data : i)));
      toast.success("Status atualizado.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const remove = async (kind, id) => {
    try {
      await api.delete(`/admin/${kind}/${id}`);
      const setter = kind === "bookings" ? setBookings : setContacts;
      setter((list) => list.filter((i) => i.id !== id));
      toast.success("Registro removido.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const doLogout = async () => {
    await logout();
    nav("/admin/login");
  };

  return (
    <div className="min-h-screen bg-ink text-white" data-testid="admin-dashboard">
      <header className="border-b border-white/5 bg-ink/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          <Logo testId="admin-logo" />
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-slate-400" data-testid="admin-user-email">{user?.email}</span>
            <ThemeToggle testId="admin-theme-toggle" />
            <button onClick={doLogout} data-testid="admin-logout-button" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:border-sage transition-colors">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <p className="overline">Painel administrativo</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2">Agendamentos & contatos</h1>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric icon={CalendarDays} label="Agendamentos" value={metrics.total} testId="metric-total-bookings" />
          <Metric icon={Clock3} label="Pendentes" value={metrics.pend} testId="metric-pending-bookings" />
          <Metric icon={CheckCircle2} label="Confirmados" value={metrics.conf} testId="metric-confirmed-bookings" />
          <Metric icon={Mail} label="Mensagens novas" value={metrics.msgs} testId="metric-new-messages" />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="inline-flex rounded-full border border-white/10 p-1 w-fit">
            {[["bookings", `Agendamentos (${bookings.length})`], ["contacts", `Mensagens (${contacts.length})`]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} data-testid={`admin-tab-${k}`} className={`rounded-full px-5 py-2 text-sm transition-colors ${tab === k ? "bg-sage text-onsage font-semibold" : "text-slate-300 hover:text-white"}`}>
                {l}
              </button>
            ))}
          </div>
          <label className="relative sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail..." data-testid="admin-search-input" className="w-full rounded-full border border-white/10 bg-surface pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-sage" />
          </label>
        </div>

        <div className="mt-6">
          {tab === "bookings" ? (
            <BookingsTable items={filter(bookings)} onStatus={(id, status) => update("bookings", id, { status })} onDelete={(id) => remove("bookings", id)} />
          ) : (
            <ContactsTable items={filter(contacts)} onStatus={(id, status) => update("contacts", id, { status })} onDelete={(id) => remove("contacts", id)} />
          )}
        </div>
      </main>
    </div>
  );
}
