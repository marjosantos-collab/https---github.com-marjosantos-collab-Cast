export const LogoMark = ({ className = "h-9 w-9" }) => (
  <img src="/images/logo-mark.png" alt="" aria-hidden="true" className={`object-contain ${className}`} />
);

export const Logo = ({ testId = "site-logo" }) => (
  <a href="/" data-testid={testId} className="group inline-flex items-center">
    <img
      src="/images/logo.png"
      alt="Cast Assessoria"
      className="h-10 sm:h-11 w-auto transition-opacity duration-300 group-hover:opacity-80"
    />
  </a>
);
