// Tags an outbound booking link so the club's own analytics (and our outbound
// click log, task 2.13) can tell SpinBuddy traffic apart from the rest.
// Existing query parameters are kept — a club's own booking URL sometimes
// already points at a specific court or day — only utm_source is added or
// overwritten.
export function addUtmSource(url: string, source = "matchfinder"): string {
  const parsed = new URL(url);
  parsed.searchParams.set("utm_source", source);
  return parsed.toString();
}
