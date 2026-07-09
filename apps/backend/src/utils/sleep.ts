export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function exponentialBackoff(attempt: number, baseMs = 1000): number {
  return baseMs * Math.pow(2, attempt);
}
