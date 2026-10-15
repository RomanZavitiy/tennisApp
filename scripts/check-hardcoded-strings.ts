import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import ts from "typescript";

// DoD for task 1.20 ("Польська мова"): no hardcoded string survives in the
// JSX under app/ and components/ — this is the lint-script half of that
// check (the other half is tests/lib/.../messages key-parity, checked by
// scripts/check-i18n-keys.ts). Run with `pnpm check:i18n-strings`.
//
// It's a heuristic, not a full type-checker: it flags JSX text and a
// curated set of "this prop is shown to a player" attributes/props that
// contain a run of letters, so decorative glue ("·", "→", numbers) and
// non-visible props (className, href, data-*, enum values like "SINGLES")
// never need an allowlist entry. False negatives are possible (a literal
// string handed to some prop name this script doesn't know to check); false
// positives are fixed by naming the prop one of the names below, or quoting
// non-letter content.

const ROOTS = ["app", "components"];

function findTsxFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...findTsxFiles(path));
    } else if (entry.endsWith(".tsx")) {
      files.push(path);
    }
  }
  return files;
}

// Attributes/props carrying player-visible text in this codebase's own
// conventions (label/pendingLabel/confirmLabel on OfferActionButton,
// submitLabel on ProfileForm, urlLabel/phoneLabel on BookingLink, the usual
// HTML text attributes). Not exhaustive — see the module comment.
const TEXT_PROP_NAMES = new Set([
  "alt",
  "title",
  "placeholder",
  "aria-label",
  "label",
  "confirmLabel",
  "pendingLabel",
  "submitLabel",
  "urlLabel",
  "phoneLabel",
]);

// A run of 2+ letters (any script) means "this looks like a word", not
// punctuation/glue/a number/a single decorative letter.
const HAS_WORD = /[A-Za-zÀ-ÖØ-öø-ÿĀ-žА-я]{2,}/u;

type Violation = { file: string; line: number; text: string; where: string };

function checkFile(file: string): Violation[] {
  const sourceText = readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const violations: Violation[] = [];

  function lineOf(pos: number): number {
    return source.getLineAndCharacterOfPosition(pos).line + 1;
  }

  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      const text = node.text.trim().replaceAll(/\s+/gu, " ");
      if (text && HAS_WORD.test(text)) {
        violations.push({
          file,
          line: lineOf(node.getStart(source)),
          text,
          where: "JSX text",
        });
      }
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(source);
      if (
        TEXT_PROP_NAMES.has(name) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      ) {
        const text = node.initializer.text.trim();
        if (text && HAS_WORD.test(text)) {
          violations.push({
            file,
            line: lineOf(node.getStart(source)),
            text,
            where: `attribute "${name}"`,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return violations;
}

function main() {
  const root = resolve(import.meta.dirname, "..");
  const files = ROOTS.flatMap((dir) => findTsxFiles(join(root, dir)));
  const violations = files.flatMap(checkFile);

  if (violations.length === 0) {
    console.log(`No hardcoded strings found in ${String(files.length)} files.`);
    return;
  }

  console.error(
    `Found ${String(violations.length)} hardcoded string(s) in app/ or components/:\n`,
  );
  for (const v of violations) {
    console.error(
      `  ${relative(root, v.file)}:${String(v.line)} — ${v.where}: "${v.text}"`,
    );
  }
  console.error(
    "\nEvery player-visible string must come from next-intl (useTranslations/getTranslations) — see messages/en.json and messages/pl.json.",
  );
  process.exitCode = 1;
}

main();
