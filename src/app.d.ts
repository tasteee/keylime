// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { D1Database } from '@cloudflare/workers-types';

declare global {
  namespace App {
    interface Locals {
      user: { id: string; email: string } | null;
    }
    interface Platform {
      env: {
        DB: D1Database;
        // Resend API key for sign-in emails. Secret.
        RESEND_API_KEY?: string;
        // Sender, like "keylime <hello@yourdomain.com>".
        MAIL_FROM?: string;
        // "true" only on your machine: links show on screen instead of email.
        DEV_SHOW_LINKS?: string;
      };
    }
  }
}

export { };
