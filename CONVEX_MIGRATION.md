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

## Stage 2 — Cutover (next, after Stage 1 is live)

Swap the app from Supabase to Convex. Planned edits:

- `src/hooks.server.ts` — replace the Supabase session guard with the Better Auth
  token hook (`getToken` + `withServerConvexToken`), keeping the existing
  redirect/route-protection logic.
- `src/routes/+layout.svelte` — initialise the Svelte auth client.
- `src/lib/database/auth.ts` — reimplement `login` / `logout` / `signup` /
  `resetPassword` / `updatePassword` / `updateUserSettings` on `authClient`
  (+ call `api.users.ensureProfile` after sign-up, replacing the old DB trigger).
- `src/lib/modules/database/index.ts` and `src/lib/modules/projects.ts` — swap the
  Supabase calls for Convex `query`/`mutation` calls, keeping the exact same
  function signatures and `{ data, error }` return shapes so `ContextFrame`, the
  stores, and the pages don't need changes.
- Server loads (`+layout.server.ts`, `dashboard/+page.server.js`,
  `projects/+page.server.js`, `users/[userName]/+page.server.js`,
  `project/[id]/+layout.server.ts`) — call Convex via the server HTTP client.
- `src/app.d.ts` — replace the Supabase `Locals` with `{ token }`.
- Delete `src/lib/supabase/`, `src/routes/auth/callback/`, the dead
  `src/lib/stores/auth.svelte.ts`, and remove `@supabase/*` from `package.json`.

## Stage 3 — Cleanup / optional

- Password-reset emails need an email provider (e.g. Resend) wired into
  `createAuth`. Until then, request-reset is a no-op / disabled.
- Remove the `supabase/` SQL files and Supabase env vars once verified.
