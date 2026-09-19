/** Strip StatTrak™ / Souvenir / ★ prefixes for collection matching. */
export function normalizeSkinName(name: string): string {
  return name
    .replace(/^StatTrak™\s*/i, '')
    .replace(/^StatTrak\s*/i, '')
    .replace(/^Souvenir\s*/i, '')
    .replace(/^★\s*/u, '')
    .replace(/^\*\s*/, '')
    .trim()
}
