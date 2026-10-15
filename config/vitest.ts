/** Browser mode on the three engines net-watch supports. `provider` is `playwright()` from the package's own `@vitest/browser-playwright`, so vitest and its provider resolve from one place. */
export const browser = (provider: unknown) => ({
  enabled: true,
  provider,
  instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
  headless: true,
})
