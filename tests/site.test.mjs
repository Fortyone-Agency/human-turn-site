import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { locales, localePath, storeUrl } from '../content/site.mjs';
import { parseMarketing } from '../scripts/generate.mjs';

const escape = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

for (const [locale, copy] of Object.entries(locales)) {
  test(`${locale}: supplied marketing text is complete and preserved`, async () => {
    const marketing = parseMarketing(await readFile(`content/marketing/${locale}.txt`, 'utf8'));
    assert.equal(marketing.states.length, 3);
    assert.equal(marketing.sections.length, 7);
    const html = await readFile(resolve(`dist${localePath(locale)}index.html`), 'utf8');
    for (const text of [marketing.subtitle, marketing.intro, marketing.requirements, ...marketing.sections.map((section) => section.text), ...marketing.states.map((state) => state.text)]) {
      assert.ok(html.includes(escape(text)), `Missing source copy: ${text}`);
    }
  });

  test(`${locale}: homepage and privacy page have localized routes and metadata`, async () => {
    for (const suffix of ['', 'privacy/']) {
      const html = await readFile(resolve(`dist${localePath(locale)}${suffix}index.html`), 'utf8');
      assert.ok(html.includes(`<html lang="${locale}">`));
      assert.ok(html.includes(escape(copy.privacy)));
      assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1);
      assert.ok(!html.includes('undefined'));
      for (const code of Object.keys(locales)) {
        assert.ok(html.includes(`href="${localePath(code)}${suffix}" lang="${code}" hreflang="${code}"`));
        assert.ok(html.includes(`hreflang="${code}"`));
      }
      for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)) {
        assert.ok((await stat(resolve(`dist${match[1]}`))).size > 0, `Missing asset: ${match[1]}`);
      }
    }
  });

  test(`${locale}: all screenshots and gallery labels are localized`, async () => {
    const html = await readFile(resolve(`dist${localePath(locale)}index.html`), 'utf8');
    assert.equal(copy.tabs.length, 4);
    assert.equal(copy.alts.length, 4);
    for (let index = 0; index < 4; index++) {
      assert.ok(html.includes(`/assets/${locale}/${index + 1}.jpg`));
      assert.ok(html.includes(escape(copy.tabs[index])));
      assert.ok(html.includes(escape(copy.alts[index])));
    }
    assert.deepEqual(Object.keys(copy).sort(), Object.keys(locales.en).sort());
  });

  test(`${locale}: App Store links use the correct app, storefront, and language`, async () => {
    const url = new URL(storeUrl(locale));
    assert.equal(url.origin, 'https://apps.apple.com');
    assert.equal(url.pathname, `/${copy.store}/app/human-turn/id6809105741`);
    assert.equal(url.searchParams.get('l'), copy.storeLanguage);
    assert.equal(url.searchParams.get('mt'), '12');
    const html = await readFile(resolve(`dist${localePath(locale)}index.html`), 'utf8');
    const links = [...html.matchAll(/href="(https:\/\/apps\.apple\.com[^"]+)"/g)];
    assert.equal(links.length, 3);
    for (const link of links) assert.equal(link[1], escape(storeUrl(locale)));
  });
}

test('malformed source marketing text fails explicitly', () => {
  assert.throws(() => parseMarketing(''), /Missing marketing/);
  assert.throws(() => parseMarketing('\nSubtitle\nExample\n\nDescription\nIncomplete\n\nKeywords\nword'), /Expected 19/);
});