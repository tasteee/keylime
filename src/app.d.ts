// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      // Better Auth token for the current request (from cookies), used to make
      // authenticated Convex calls in server load functions.
      token: string | undefined;
    }
  }
}

export { };
