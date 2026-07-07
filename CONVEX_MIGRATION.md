# Supabase → Convex + Better Auth migration

Tracks the migration off Supabase (Auth + Postgres) onto **Convex** (database)
with **Better Auth** (email/password) via the `@convex-dev/better-auth` component
and the community SvelteKit adapters (`@mmailaender/convex-*`).

The work is staged so the app keeps running on Supabase until the final cutover.

---

## Stage 1 — Convex backend scaffold ✅ (this commit)

Additive only. Nothing here is wired into the running app yet, so the app still
runs entirely on Supabase.

Added:

- `convex.json` — points Convex at `src/convex/`.
- `svelte.config.js` — `$convex` alias → `./src/convex`.
- `src/convex/convex.config.ts` — registers the Better Auth component.
- `src/convex/auth.config.ts` — Better Auth provider config.
- `src/convex/auth.ts` — `authComponent`, `createAuth` (email/password enabled),
  `getCurrentUser`.
- `src/convex/http.ts` — mounts Better Auth's HTTP routes.
- `src/convex/schema.ts` — `allUsers` + `allProjects` tables (mirrors the old
  `all_users` / `all_projects`, keyed to the Better Auth user id).
- `src/convex/users.ts` — profile queries/mutations (`getById`, `getByUserName`,
  `getCurrentProfile`, `getPublicUsers`, `isUserNameAvailable`, `ensureProfile`,
  `updateProfile`). RLS is replaced by `ctx.auth` checks inside each function.
- `src/convex/projects.ts` — project queries/mutations (`getById`, `getByUserId`,
  `getPublic` with all the browse filters, `getPublicByUserName`, `save`, `add`,
  `remove`). Owner-only writes replace the old RLS write policies.
- `src/lib/auth-client.ts` — Better Auth Svelte client.
- `src/routes/api/auth/[...all]/+server.ts` — Better Auth catch-all handler.
- `.env.example` — documents the new env vars.

> Note: `src/convex/_generated/` does not exist until you run `npx convex dev`
> (below). Until then, the `./_generated/*` and `$convex/_generated/*` imports and
> `svelte-check` will show errors in the `src/convex` files — that's expected.

### To bring Stage 1 online (needs your Convex account)

```bash
# 1. Install the new dependencies (versions per the official guide)
bun add convex @mmailaender/convex-svelte
bun add @convex-dev/better-auth @mmailaender/convex-better-auth-svelte
bun add better-auth@~1.6.15

# 2. Log in / create a deployment. This writes CONVEX_DEPLOYMENT +
#    PUBLIC_CONVEX_URL to .env.local, generates src/convex/_generated/,
#    and pushes the schema + functions.
npx convex dev

# 3. Set the auth secrets ON the Convex deployment
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
npx convex env set SITE_URL http://localhost:3124

# 4. Fill in PUBLIC_CONVEX_SITE_URL and PUBLIC_SITE_URL in .env.local
#    (see .env.example)
```

**What I need from you to finish:** confirm `npx convex dev` succeeded (so the
generated API exists) and share your `PUBLIC_CONVEX_URL` / deployment name. Do
**not** paste `BETTER_AUTH_SECRET` or any key into chat — set those via the CLI
above.

---

## Stage 2 — Cutover ✅ (this commit)

The app now runs on Convex + Better Auth. Supabase is fully removed.

Changed:

- `src/hooks.server.ts` — Better Auth token hook (`getToken` +
  `withServerConvexToken`) with the same redirect/route-protection logic;
  auth is checked via `api.auth.getCurrentUser`.
- `src/routes/+layout.svelte` — initialises the Svelte auth client.
- `src/lib/auth-client.ts` — Better Auth client (from Stage 1).
- `src/lib/convex.ts` — browser Convex client + `convexQuery` / `convexMutation`
  helpers (auth token pulled from Better Auth per call).
- `src/lib/server/convex.ts` — `serverConvex(token)` for load functions.
- `src/lib/database/auth.ts` — `login` / `logout` / `signup` / `resetPassword` /
  `updatePassword` / `updateUserSettings` reimplemented on `authClient`; sign-up
  calls `api.users.ensureProfile` (replaces the old `handle_new_user` DB trigger).
- `src/lib/modules/database/index.ts` + `src/lib/modules/projects.ts` — Convex
  calls behind the **same signatures and `{ data, error }` shapes**, so
  `ContextFrame`, the stores, and the pages were untouched.
- `src/lib/stores/project.svelte.ts` — uses the module functions instead of the
  Supabase client directly.
- Server loads (`+layout.server.ts`, `dashboard`, `projects`, `users/[userName]`,
  `project/[id]/+layout.server.ts`) — call Convex via `serverConvex`.
- `src/routes/auth/{forgot,reset}-password/+page.svelte` — use `authClient`.
- `src/app.d.ts` — `Locals` is now just `{ token }`.
- **Deleted**: `src/lib/supabase/`, `src/routes/auth/callback/`, the dead
  `src/lib/stores/auth.svelte.ts`. **Removed** `@supabase/*` from `package.json`.

### ⚠️ Two things to verify when you run it

1. **Convex token accessor** — `src/lib/convex.ts` reads the JWT via
   `authClient.convex.token()`. If your installed `@convex-dev/better-auth`
   version exposes it differently, that one function is the only place to fix.
2. **Password-reset / email-change need an email provider.** Better Auth's
   `requestPasswordReset` / `changeEmail` only actually send mail once an email
   provider (e.g. Resend) is wired into `createAuth` (Stage 3). Login, signup,
   and everything else work without it. Inline password change in the settings
   dialog is intentionally disabled (Better Auth needs the current password);
   use the reset flow.

### Verify checklist (after `npx convex dev` + `bun install`)

```bash
bun run check          # typecheck — needs src/convex/_generated (from convex dev)
bun run dev            # sign up, sign in, create/save/load a project, sign out
```

## Stage 3 — Cleanup / optional

- Wire an email provider (Resend) into `createAuth` to enable password-reset and
  email-change emails.
- Delete the now-unused `supabase/` SQL files and the Supabase env vars in
  `.env.example`.
- Optionally drop the leftover Supabase `DatabaseT` types in `src/global.d.ts`.
