# One-Stop Center Portal

Supabase-backed React (Vite) application that centralises Aafiyat’s internal staff profile management together with a visually-rich library module inspired by the provided mockups.

## ✨ Features

- **Staff Profile Module** – Mirrors the reference screen with personal/work/passport/bank sections, quick actions, and edit/export controls.
- **Library Hub** – Gradient hero with category chips, popular carousel, chat assistant, admin-only add button, availability badges, and inline loan assignment controls.
- **Leaderboard & Chat** – Podium-style borrower rankings plus a support chat dock built on the right rail.
- **Role Switching** – Toggle between `Staff` and `Admin` to preview restricted UI states without reloading.
- **Supabase Ready** – Typed client wrapper, env scaffolding, and SQL migration that provisions staff/library tables, views, and RLS policies.

## 🧱 Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS (custom pastel palette)
- Zustand for lightweight session state
- Supabase JS client
- Lucide icons, classnames helpers

## 🚀 Getting Started

```bash
pnpm|npm install
cp .env.example .env    # add Supabase URL & anon key
npm run dev             # open http://localhost:5173
```

> **Node**: Vite 7 currently targets Node ≥20.19. Upgrade if you see the EBADENGINE warning.

## 🗄️ Database & Supabase

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/0001_init.sql` (via Supabase SQL Editor or CLI) to provision:
   - Staff core tables + view (`staff_view`) that powers the profile UI
   - Library catalog (`books`, `book_categories`, `book_copies`, `book_loans`)
   - Row-Level Security policies so staff read only their data while admins manage everything
3. Generate service role and anon keys, then set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env`.

Until real data exists, the UI automatically falls back to the curated mock datasets in `src/data`.

## 📁 Project Structure

```
src/
  components/
    layout/         # Sidebar + shared layout
    ui/             # Reusable controls (role toggle)
  data/             # Mock datasets for staff/library
  lib/              # Supabase client
  modules/
    staff/          # Staff profile screen
    library/        # Library hub UI
  services/         # Data access abstractions
  store/            # Zustand session store
  types/            # Shared TypeScript types
supabase/
  migrations/0001_init.sql
```

## 🧪 Next Steps

- Wire `fetchLibraryOverview` + `fetchStaffProfile` to live Supabase tables.
- Add Supabase Edge Functions to send reminders for overdue loans.
- Extend chat panel with Supabase Realtime to broadcast notifications.
