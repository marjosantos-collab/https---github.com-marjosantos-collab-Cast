import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";
import { scrollToId } from "@/lib/lenis";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  ["servicos", "Serviços"],
  ["processo", "Como funciona"],
  ["agendar", "Agendar"],
  ["faq", "Dúvidas"],
  ["contato", "Contato"],
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-ink/75 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
        <Logo />
        <nav className="hidden lg:flex items-center gap-9">
          {LINKS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => go(id)}
              data-testid={`nav-link-${id}`}
              className="relative text-sm text-slate-300 hover:text-white transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-sage after:transition-[width] after:duration-300 hover:after:w-full"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => go("agendar")}
            data-testid="header-book-button"
            className="btn-gold hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Agendar Assessoria <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden h-11 w-11 grid place-items-center rounded-full border border-white/10 text-white"
            data-testid="mobile-menu-toggle"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden bg-ink/95 backdrop-blur-xl border-b border-white/5"
            data-testid="mobile-menu"
          >
            <div className="px-5 py-6 flex flex-col gap-1">
              {LINKS.map(([id, label], i) => (
                <button
                  key={id}
                  onClick={() => go(id)}
                  data-testid={`mobile-nav-link-${id}`}
                  className="text-left font-display text-3xl text-white py-2 flex items-baseline gap-4"
                >
                  <span className="font-mono-x text-xs text-sage">0{i + 1}</span>
                  {label}
                </button>
              ))}
              <button
                onClick={() => go("agendar")}
                data-testid="mobile-book-button"
                className="btn-gold mt-4 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Agendar Assessoria
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
