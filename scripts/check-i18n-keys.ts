import en from "../messages/en.json" with { type: "json" };
import pl from "../messages/pl.json" with { type: "json" };

// DoD for task 1.20 ("Польська мова"): en.json and pl.json carry the exact
// same set of keys, so a screen never silently falls back to the wrong
// language because a translator forgot one. Run with `pnpm check:i18n-keys`.
//
// Arrays (e.g. InstallPage.iosSteps) are leaves, not recursed into: they
// hold ordered content, not a nested namespace, and two catalogs are free
// to have different step counts for the same instructions in principle —
// only that the key itself exists on both sides is checked here.

type Messages = { [key: string]: Messages | string | string[] };

function keyPaths(messages: Messages, prefix = ""): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && !Array.isArray(value)) {
      paths.push(...keyPaths(value, path));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

function main() {
  const enKeys = new Set(keyPaths(en));
  const plKeys = new Set(keyPaths(pl));

  const missingInPl = [...enKeys].filter((key) => !plKeys.has(key)).sort();
  const missingInEn = [...plKeys].filter((key) => !enKeys.has(key)).sort();

  if (missingInPl.length === 0 && missingInEn.length === 0) {
    console.log(
      `messages/en.json and messages/pl.json agree on ${String(enKeys.size)} keys.`,
    );
    return;
  }

  if (missingInPl.length > 0) {
    console.error(
      `In en.json but missing from pl.json (${String(missingInPl.length)}):`,
    );
    for (const key of missingInPl) console.error(`  ${key}`);
  }
  if (missingInEn.length > 0) {
    console.error(
      `In pl.json but missing from en.json (${String(missingInEn.length)}):`,
    );
    for (const key of missingInEn) console.error(`  ${key}`);
  }
  process.exitCode = 1;
}

main();
