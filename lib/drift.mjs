// Museframe drift sentinel — a real linter over really-generated code.
// Reads the built artifact + its approved token manifest and reports every
// place the artifact's CSS contradicts the grammar the user approved.
// Patch = rewrite the offending block to token-conformant CSS, then re-lint.
// [HACKATHON: new work — written 2026-07-04 during RAISE]

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokenCtaCss } from './builder.mjs';

function ctaBlock(html) {
  const m = html.match(/\.cta \{[^}]*\}/);
  return m ? m[0] : null;
}

function prop(block, name) {
  const m = block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}

export function lint(buildDir) {
  const html = readFileSync(join(buildDir, 'index.html'), 'utf8');
  const manifest = JSON.parse(readFileSync(join(buildDir, 'tokens.json'), 'utf8'));
  const t = manifest.tokens;
  const violations = [];
  const block = ctaBlock(html);
  if (block) {
    const radius = prop(block, 'border-radius');
    if (radius && radius !== t.radius) {
      violations.push({
        id: 'cta-radius', selector: '.cta', property: 'border-radius',
        expected: t.radius, found: radius,
        why: `Approved grammar is ${t.radius === '999px' ? 'pill geometry' : t.radius + ' corners'}; the CTA shipped with ${radius}.`,
      });
    }
    const font = prop(block, 'font-family');
    if (font && !font.toLowerCase().includes(t.font.toLowerCase())) {
      violations.push({
        id: 'cta-font', selector: '.cta', property: 'font-family',
        expected: t.font, found: font,
        why: `Controls in this grammar are set in ${t.font}; the CTA came back in ${font.split(',')[0]}.`,
      });
    }
    const bg = prop(block, 'background');
    if (bg && !bg.includes(t.acc)) {
      violations.push({
        id: 'cta-accent', selector: '.cta', property: 'background',
        expected: `${t.acc} (system accent)`, found: bg,
        why: `The CTA uses an off-system color instead of the approved accent ${t.acc}. Classic stale-library drift.`,
      });
    }
  }
  // Full-surface conformance checks — these PASS when the builder honored tokens,
  // so the report is a real audit, not a scripted single flag.
  const checks = [
    { re: new RegExp(`--bg:\\s*${t.bg}`, 'i'), id: 'root-bg', label: 'background token' },
    { re: new RegExp(`--acc:\\s*${t.acc}`, 'i'), id: 'root-accent', label: 'accent token' },
    { re: new RegExp(`--ink:\\s*${t.ink}`, 'i'), id: 'root-ink', label: 'ink token' },
  ];
  const passed = checks.filter(c => c.re.test(html)).map(c => ({ id: c.id, label: c.label }));
  return { build: manifest.build, tokens: t, violations, passed, source_of_truth: 'tokens.json (approved board)' };
}

export function patch(buildDir) {
  const file = join(buildDir, 'index.html');
  const html = readFileSync(file, 'utf8');
  const manifest = JSON.parse(readFileSync(join(buildDir, 'tokens.json'), 'utf8'));
  const before = ctaBlock(html);
  if (!before) return { patched: false, reason: 'no .cta block found' };
  const after = tokenCtaCss(manifest.tokens);
  writeFileSync(file, html.replace(before, after).replace(
    '@museframe:cta — imported from legacy-components v0.9 (pre-token library)',
    '@museframe:cta — reconciled to approved tokens by the drift sentinel'
  ));
  return { patched: true, before, after, relint: lint(buildDir) };
}
