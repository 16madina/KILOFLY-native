# KiloFly native — project notes for Claude

KiloFly connects travelers who have spare luggage kilos with people who need to send parcels
(diaspora routes: Paris, Montréal, Dakar, Abidjan, Bamako…). This repo is the **new native app**
(Expo / React Native), replacing the old Lovable web app (`github.com/16madina/KILOFLY`, read-only reference).

Talk to the owner in **French**. Keep explanations non-technical.

## Stack
- Expo SDK 58, expo-router (file routes in `src/app`), TypeScript, React 19, RN 0.88.
- Supabase (new project, ref `biogcqkjpaqvncfpgoki`) — auth, Postgres, storage, edge functions.
- Public client config in `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` = publishable key, safe to commit).
  **Never** put secret/service keys in the app or the repo.
- Run: `npm install`, then `npx expo start` (Expo Go on phone) or `npx expo start --web`.
- Type-check: `npx tsc --noEmit` (edge functions are excluded; they are Deno).

## Design system ("nuit & or")
- Tokens in `src/theme/index.ts` (dark navy surfaces, champagne gold, Playfair Display serif titles + Inter).
- Shared UI in `src/components/ui.tsx` (T, AccentTitle, Logo, BrandHeader, Card, Button gold/outline/dark,
  GoldPill, Avatar, FlightProgress…). Reuse these; don't introduce new colors inline.
- Mockup art cropped from the owner's design images lives in `assets/art`, `assets/avatars`, `assets/brand`.

## App structure
- Tabs (`src/app/(tabs)`): Accueil (`index`), Recherche (`search`), ➕ Annonces (`post`), Suivi (`tracking`:
  inner tabs "Suivi de colis" = my reservations, and "Messages"), Profil (`profile`).
- Data layer: `src/lib/auth.tsx` (session/profile), `src/lib/listings.ts`, `src/lib/reservations.ts`,
  `src/lib/offers.ts`, `src/lib/cities.ts` (city list from old app + airport codes).
- Screens that need an account wait for `useAuth().loading` before redirecting to `/auth`.

## Database rules (important)
- Migrations: `supabase/migrations`. The first 61 are the old Lovable schema; ours start at `20261125…`.
- **Security model: clients never write money/state directly.** Reservations, offers and payments go through
  `security definer` SQL functions (`create_reservation`, `respond_reservation`, `cancel_reservation`,
  `make_offer`, `respond_offer`, `begin_payment`/`confirm_payment` (service role only)…). Price and remaining kg
  are computed server-side. Profiles are readable per column (no phone/email/ID leak). Keep it that way.
- Fees: `kilofly_fees()` — 5 % paid by sender + 5 % taken from traveler.
- **Network quirk on the original Windows machine**: Postgres ports were blocked, so migrations were applied with
  `npx supabase db query --remote --yes -f <file>` and recorded manually in `supabase_migrations.schema_migrations`.
  On a normal network `npx supabase link --project-ref biogcqkjpaqvncfpgoki` then `npx supabase db push` works.
- Auth config is pushed with a *minimal* config file only (never push `supabase/config.jsonc` as-is: it holds
  local-dev values like `site_url=127.0.0.1`). E-mail confirmation is OFF; e-mail is verified later from the
  profile with a 6-digit code (Resend SMTP, template `supabase/templates/magic_link.html`).

## Edge functions (`supabase/functions`, deploy with `npx supabase functions deploy <name> --use-api`)
- `payments-create` (JWT): Stripe Checkout or FeexPay request-to-pay; amount always from DB.
- `payments-check` (JWT): server re-checks payment with Stripe/FeexPay and confirms.
- `stripe-webhook` (`--no-verify-jwt`): verifies Stripe signature.
- `feexpay-webhook` (`--no-verify-jwt`): verifies FeexPay HMAC, then re-reads status from FeexPay API.
- Secrets to set in Supabase (owner enters them, never in chat): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `FEEXPAY_API_KEY`, `FEEXPAY_SHOP_ID`, `FEEXPAY_WEBHOOK_SECRET`, optional `FEEXPAY_API_BASE` (sandbox),
  `ALLOWED_RETURN_PREFIXES` (defaults: `kilofly://,exp://,http://localhost:8081`).

## Status (see docs/MIGRATION_PLAN.md)
- Done: 1 accounts/profile/e-mail verification · 2 listings/search/publish/favorites/route alerts ·
  3 reservations, offers, Stripe + FeexPay payments (code done; needs secrets to test).
- Next: 4 messaging (conversations/messages tables, realtime) + package tracking (tracking_events, delivery
  confirmation → `credit_seller_wallet_on_delivery`) · 5 wallet/withdrawals (old withdrawal code was insecure —
  rebuild server-side), ID verification (old one used Lovable AI gateway → replace, e.g. Claude API),
  reports/blocking · 6 push notifications (Expo + Firebase project `kilofly-33d0c`, package `com.kilofly.app`) ·
  7 admin stays web for now · later: Google/Apple sign-in (needs dev build), migrate old users before launch.
- No mock data left. Wallet: get_my_wallet/request_withdrawal (manual payouts by admin in /admin/withdrawals).
- Done since (Nov 26): admin panel, Expo push, notifications list, secure tracking (delivery code + signature + photo),
  ID verification + admin review, preferences/legal pages/account deletion, search (trips/requests + date range),
  currency conversion, country/city/phone pickers, real messaging (RPCs + realtime + block). Migrations were applied
  through the Supabase SQL editor; demo data in `supabase/demo/` (remove with remove_demo.sql).
- Test account `madina diallo` is marked `id_verified` with `verification_method='manual_test'` — **revert before launch**.

## Google / Apple sign-in (2026-11-26)
- Google: OAuth client "KiloFly Supabase" in Google Cloud project kilofly-33d0c; brand verified (static pages public/a-propos.html, confidentialite.html, conditions.html built by `npx -y tsx scripts/static-pages.ts`; re-run after editing src/data/info.ts).
- Apple: App ID com.kilofly.app has Sign In with Apple; web Services ID com.kilofly.app.web; key M76YC84RVX (team 6XW2XM3NDF). Supabase Apple Client IDs must list com.kilofly.app.web FIRST.
- The Apple web secret is a JWT that EXPIRES 2027-05-25: regenerate from AuthKey_M76YC84RVX.p8 (owner keeps it) and paste into Supabase → Auth → Providers → Apple.
- iPhone uses native Apple sign-in (expo-apple-authentication) → needs a new store build.
