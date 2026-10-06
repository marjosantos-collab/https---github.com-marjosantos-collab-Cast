import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";
import { SITE } from "@/lib/siteInfo";
import { scrollToId } from "@/lib/lenis";

export const Footer = () => (
  <footer className="relative pt-24 pb-10 overflow-hidden border-t border-white/5" data-testid="site-footer">
    <div className="max-w-7xl mx-auto px-5 sm:px-8">
      <div className="grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <Logo testId="footer-logo" />
          <p className="mt-6 text-slate-300 max-w-sm leading-relaxed">
            Assessoria especializada em Passaporte Brasileiro e Visto Americano.
          </p>
          <button onClick={() => scrollToId("agendar")} data-testid="footer-book-button" className="mt-8 inline-flex items-center gap-2 text-sage font-semibold text-sm group">
            Agendar assessoria <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </button>
        </div>
        <div className="md:col-span-4 space-y-2 text-sm text-slate-300">
          <p className="overline mb-4">Contato</p>
          <p>{SITE.phone}</p>
          <p>{SITE.whatsapp}</p>
          <p>{SITE.email}</p>
          <p>{SITE.address}</p>
        </div>
        <div className="md:col-span-3 space-y-2 text-sm text-slate-300">
          <p className="overline mb-4">Empresa</p>
          <p>{SITE.cnpj}</p>
          <p>{SITE.instagram}</p>
          <p>{SITE.hours}</p>
        </div>
      </div>

      <p className="font-display select-none leading-[0.8] text-[26vw] lg:text-[20rem] tracking-tighter outline-text mt-16 -mb-4" aria-hidden="true">
        Cast
      </p>

      <div className="mt-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-between text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Cast Assessoria. Todos os direitos reservados.</p>
        <Link to="/admin/login" data-testid="footer-admin-link" className="hover:text-sage transition-colors">
          Área administrativa
        </Link>
      </div>
    </div>
  </footer>
);
