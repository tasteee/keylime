import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
// import { svelteKitDecorators } from 'vite-plugin-sveltekit-decorators';

// SOUNDFONT_BASE_URL (no VITE_ prefix) overrides VITE_SOUNDFONT_BASE_URL.
// It is read from the shell or .env files, then baked into the app as
// import.meta.env.VITE_SOUNDFONT_BASE_URL.
const getSoundfontBaseUrl = (mode: string): string => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const overrideUrl = process.env.SOUNDFONT_BASE_URL || fileEnv.SOUNDFONT_BASE_URL;
  const viteUrl = process.env.VITE_SOUNDFONT_BASE_URL || fileEnv.VITE_SOUNDFONT_BASE_URL;
  return overrideUrl || viteUrl || '';
};

export default defineConfig(({ mode }) => ({
  define: {
    'import.meta.env.VITE_SOUNDFONT_BASE_URL': JSON.stringify(getSoundfontBaseUrl(mode))
  },
  plugins: [
    // svelteKitDecorators({
    //   enabled: true,
    //   debug: false
    // }),
    sveltekit(),
    devtoolsJson()
  ],
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'client',
          environment: 'browser',
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }]
          },
          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**'],
          setupFiles: ['./vitest-setup-client.ts']
        }
      },
      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
        }
      }
    ]
  }
}));
