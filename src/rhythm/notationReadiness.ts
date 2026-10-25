const NOTATION_PRELOAD_TIMEOUT_MS = 4_000;

let notationIsReady = false;
let resolveNotationReady: (() => void) | undefined;

const notationReady = new Promise<void>((resolve) => {
  resolveNotationReady = resolve;
});

/** Mark the hidden VexFlow renderer as initialized. */
export function markNotationReady(): void {
  if (notationIsReady) return;
  notationIsReady = true;
  resolveNotationReady?.();
}

/** Wait for the app-start notation warmup, with a fallback if a WebView cannot report readiness. */
export async function waitForNotationReady(): Promise<void> {
  if (notationIsReady) return;

  let timeout: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    notationReady,
    new Promise<void>((resolve) => {
      timeout = setTimeout(resolve, NOTATION_PRELOAD_TIMEOUT_MS);
    }),
  ]);
  if (timeout !== undefined) clearTimeout(timeout);
}
