# PRD — Cast Assessoria

## Original problem statement
"Crie um website para uma empresa de consultoria especializada em assistencia para obtenção de Passaporte Brasileiro, Visto Americano, chamada Cast Assessoria, com possibilidade de agendar Assessoria, com formulário de contato, com visual moderno"
Follow-up: "ajuste o logotipo conforme o arquivo enviado"

## User choices
- Booking form with date + time saved in the system
- Password-protected admin panel (bookings + contacts)
- No email notifications for now
- Company info: visible placeholders

## Architecture
- FastAPI + MongoDB (bookings, contacts, users, login_attempts); JWT httpOnly cookies (access 15min + refresh 7d), admin seeded from .env, brute-force lockout
- React + Tailwind + framer-motion + lenis; pt-BR; dark/gold editorial art direction; customer logo in /public/images/logo.png, favicon.png

## Implemented (2026-10-06)
- Landing: kinetic masked hero + 3D tilt photo frame, editorial marquee, services bento, scroll-progress process, booking (service, calendar weekdays only from tomorrow, slot availability, 409 on taken slot), FAQ, contact form, footer with placeholders
- Admin: /admin/login, /admin dashboard with metrics, tabs, search, status updates, delete
- Customer logo applied (header, footer, admin, favicon)
- Sage green accent (from logo) for buttons/highlights; light/dark theme toggle (persisted, site + admin); light version with white background; hero badge fixed ("AGENDE", no stray "C")

- Booking notification email (Emergent managed Resend) to agendamento@castassessoria.com.br on every new booking (BOOKING_NOTIFY_EMAIL in backend .env); booking still saved even if email fails

## Placeholders
Phone, WhatsApp, e-mail, address, CNPJ, Instagram in /app/frontend/src/lib/siteInfo.js

## Backlog
- P1: Email/WhatsApp notifications for new bookings
- P1: Admin-configurable time slots / blocked dates
- P2: Palette aligned to logo's sage green; testimonials; pricing
