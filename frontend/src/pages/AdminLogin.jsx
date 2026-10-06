import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { Field } from "@/components/site/BookingParts";
import { LogoMark } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      toast.success("Bem-vindo ao painel.");
      nav("/admin");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grain min-h-screen bg-ink grid place-items-center px-5" data-testid="admin-login-page">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-[28px] border border-white/[0.08] bg-surface p-8 sm:p-10 space-y-7"
        data-testid="admin-login-form"
      >
        <div className="flex items-start justify-between">
          <LogoMark className="h-12 w-12" />
          <ThemeToggle testId="admin-login-theme-toggle" />
        </div>
        <div>
          <p className="overline">Área restrita</p>
          <h1 className="font-display text-4xl text-white mt-2">Painel Cast</h1>
        </div>
        <Field label="E-mail" type="email" value={email} onChange={setEmail} testId="admin-login-email-input" required />
        <Field label="Senha" type="password" value={password} onChange={setPassword} testId="admin-login-password-input" required />
        {error && <p className="text-sm text-red-400" data-testid="admin-login-error">{error}</p>}
        <button type="submit" disabled={loading} data-testid="admin-login-submit-button" className="btn-gold w-full rounded-full py-4 text-sm font-semibold disabled:opacity-60">
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <Link to="/" data-testid="admin-login-back-link" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
      </motion.form>
    </div>
  );
}
