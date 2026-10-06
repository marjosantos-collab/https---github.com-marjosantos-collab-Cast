let instance = null;

export const setLenis = (l) => {
  instance = l;
};

export const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset: -80, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
};
