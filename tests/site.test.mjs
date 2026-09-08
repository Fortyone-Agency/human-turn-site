import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { privacyEffectiveDate, privacyPolicies } from "../content/privacy.mjs";
import {
  localePath,
  locales,
  site,
  sitePath,
  storeUrl,
} from "../content/site.mjs";
import { parseMarketing } from "../scripts/generate.mjs";

const escape = (value) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

for (const [locale, copy] of Object.entries(locales)) {
  test(`${locale}: code sources row has the localized label and four sources`, async () => {
    const html = await readFile(
      resolve(`dist${localePath(locale)}index.html`),
      "utf8",
    );
    assert.ok(!html.includes('class="kicker hero-eyebrow"'));
    assert.ok(!html.includes(escape(copy.eyebrow)));
    const row = html.match(
      /<section class="integrations"[\s\S]*?<\/section>/,
    )?.[0];
    assert.ok(row, "Missing code sources row");
    assert.ok(row.includes(`<p>${escape(copy.integrations)}</p>`));
    assert.deepEqual(
      [...row.matchAll(/<li>([^<]+)<\/li>/g)].map((match) => match[1]),
      ["GitHub", "GitLab", "Bitbucket", "Cursor"],
    );
  });

  test(`${locale}: privacy policy includes all translated sections and a fixed revision date`, async () => {
    const policy = privacyPolicies[locale];
    assert.deepEqual(
      Object.keys(policy).sort(),
      Object.keys(privacyPolicies.en).sort(),
    );
    const html = await readFile(
      resolve(`dist${localePath(locale)}privacy/index.html`),
      "utf8",
    );
    for (const text of Object.values(policy))
      assert.ok(html.includes(escape(text)), `Missing policy text: ${text}`);
    assert.ok(html.includes(`<h1>${escape(policy.title)}</h1>`));
    assert.ok(html.includes(`<time datetime="${privacyEffectiveDate}">`));
    assert.ok(
      html.includes(
        escape(
          new Intl.DateTimeFormat(locale, {
            dateStyle: "long",
            timeZone: "UTC",
          }).format(new Date(`${privacyEffectiveDate}T00:00:00Z`)),
        ),
      ),
    );
    assert.equal([...html.matchAll(/<h2>/g)].length, 9);
    assert.ok(html.includes(`href="${escape(storeUrl(locale))}"`));
    assert.ok(html.includes('href="https://www.apple.com/legal/privacy/"'));
    assert.ok(
      html.includes(
        'href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"',
      ),
    );
  });

  test(`${locale}: supplied marketing text is complete and preserved`, async () => {
    const marketing = parseMarketing(
      await readFile(`content/marketing/${locale}.txt`, "utf8"),
    );
    assert.equal(marketing.states.length, 3);
    assert.equal(marketing.sections.length, 7);
    const html = await readFile(
      resolve(`dist${localePath(locale)}index.html`),
      "utf8",
    );
    for (const text of [
      marketing.subtitle,
      marketing.intro,
      marketing.requirements,
      ...marketing.sections.map((section) => section.text),
      ...marketing.states.map((state) => state.text),
    ]) {
      assert.ok(html.includes(escape(text)), `Missing source copy: ${text}`);
    }
  });

  test(`${locale}: homepage and privacy page have localized routes and metadata`, async () => {
    for (const suffix of ["", "privacy/"]) {
      const html = await readFile(
        resolve(`dist${localePath(locale)}${suffix}index.html`),
        "utf8",
      );
      assert.ok(html.includes(`<html lang="${locale}">`));
      assert.ok(html.includes(escape(copy.privacy)));
      assert.ok(
        html.includes(
          `<p>© <span data-year>${new Date().getFullYear()}</span> Fortyone Agency LLC</p>`,
        ),
        "Footer must use the current year and Fortyone Agency LLC",
      );
      assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1);
      assert.ok(!html.includes("undefined"));
      for (const code of Object.keys(locales)) {
        assert.ok(
          html.includes(
            `href="${sitePath(localePath(code))}${suffix}" lang="${code}" hreflang="${code}"`,
          ),
        );
        assert.ok(html.includes(`hreflang="${code}"`));
      }
      for (const match of html.matchAll(/(?:src|href)="(\/[^"#]*)"/g)) {
        assert.ok(
          match[1].startsWith(sitePath("/")),
          `Link escapes deployment path: ${match[1]}`,
        );
        const assetPath = match[1].slice(site.basePath.length);
        if (!assetPath.startsWith("/assets/")) continue;
        assert.ok(
          (await stat(resolve(`dist${assetPath}`))).size > 0,
          `Missing asset: ${match[1]}`,
        );
      }
      if (site.origin) {
        const canonical = site.origin + sitePath(localePath(locale) + suffix);
        assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
        assert.ok(
          html.includes(
            `content="${site.origin}${sitePath(`/assets/${locale}/1.jpg`)}"`,
          ),
        );
      }
    }
  });

  test(`${locale}: all screenshots and gallery labels are localized`, async () => {
    const html = await readFile(
      resolve(`dist${localePath(locale)}index.html`),
      "utf8",
    );
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
    assert.equal(url.origin, "https://apps.apple.com");
    assert.equal(url.pathname, `/${copy.store}/app/human-turn/id6809105741`);
    assert.equal(url.searchParams.get("l"), copy.storeLanguage);
    assert.equal(url.searchParams.get("mt"), "12");
    const html = await readFile(
      resolve(`dist${localePath(locale)}index.html`),
      "utf8",
    );
    const links = [
      ...html.matchAll(/href="(https:\/\/apps\.apple\.com[^"]+)"/g),
    ];
    assert.equal(links.length, 3);
    for (const link of links) assert.equal(link[1], escape(storeUrl(locale)));
  });
}

test("malformed source marketing text fails explicitly", () => {
  assert.throws(() => parseMarketing(""), /Missing marketing/);
  assert.throws(
    () =>
      parseMarketing(
        "\nSubtitle\nExample\n\nDescription\nIncomplete\n\nKeywords\nword",
      ),
    /Expected 19/,
  );
});

test("sitemap and robots respect the deployment URL", async () => {
  if (!site.origin) {
    await assert.rejects(stat("dist/sitemap.xml"), { code: "ENOENT" });
    await assert.rejects(stat("dist/robots.txt"), { code: "ENOENT" });
    return;
  }
  const sitemap = await readFile("dist/sitemap.xml", "utf8");
  const robots = await readFile("dist/robots.txt", "utf8");
  for (const locale of Object.keys(locales)) {
    for (const suffix of ["", "privacy/"]) {
      assert.ok(
        sitemap.includes(
          `<loc>${site.origin}${sitePath(localePath(locale) + suffix)}</loc>`,
        ),
      );
    }
  }
  assert.ok(
    robots.includes(`Sitemap: ${site.origin}${sitePath("/sitemap.xml")}`),
  );
});
