export function gameCenterStatusMessage(error: string | undefined): string | undefined {
  if (!error) return undefined;

  const normalizedError = error.toLowerCase();
  if (normalizedError.includes('local player') && normalizedError.includes('authenticat')) {
    return 'Game Center sign-in did not complete. Check your Game Center account in iOS Settings, then try again.';
  }
  return error;
}
