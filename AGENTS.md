# Kras OS Agent Instructions

This project is the internal business operating system for Kras Digital and the reusable foundation for future software products.

## Tech Stack

- Expo React Native
- TypeScript
- Supabase
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Row Level Security
- GitHub
- Codex

## Software Standard

Every major app we build should be designed around these 12 layers:

1. Users & Auth
2. Roles & Permissions
3. Organizations / Clients
4. Projects / Jobs / Orders
5. Tasks / Workflows
6. Files & Assets
7. Notes & Communication
8. Dashboards & Reports
9. Notifications & Follow-Ups
10. Finance / Billing Layer
11. Audit Logs & Security
12. Automation / AI Layer

## Rules

- Use TypeScript.
- Keep features modular inside src/features.
- Keep reusable UI inside src/components.
- Never expose Supabase service-role keys in the app.
- Use generated Supabase database types once the schema exists.
- Every important record should belong to an organization.
- Do not build random screens without connecting them to the OS structure.
- Prefer clean, readable code over clever code.
- Phone layout should be fast and simple.
- iPad layout should support meetings, notes, dashboards, and client-facing review.
- Desktop/web layout should support deeper management views.