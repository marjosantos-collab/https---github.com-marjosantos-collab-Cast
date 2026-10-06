export const LogoMark = ({ className = "h-9 w-9" }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect width="64" height="64" rx="14" fill="#121721" stroke="rgba(212,175,55,0.35)" />
    <path d="M44 20.5A16 16 0 1 0 44 43.5" fill="none" stroke="#D4AF37" strokeWidth="5" strokeLinecap="round" />
    <path
      d="M32 23l2.6 5.4 5.9.8-4.3 4.1 1 5.8L32 36.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"
      fill="#F8FAFC"
    />
  </svg>
);

export const Logo = ({ testId = "site-logo" }) => (
  <a href="/" data-testid={testId} className="flex items-center gap-3 group">
    <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-[-8deg]" />
    <span className="leading-none">
      <span className="font-display text-2xl font-semibold tracking-tight text-white">Cast</span>
      <span className="block overline !text-[0.6rem] !tracking-[0.35em] mt-1">Assessoria</span>
    </span>
  </a>
);
