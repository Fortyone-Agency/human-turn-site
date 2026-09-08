import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { locales, localePath, site, storeUrl } from '../content/site.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function parseMarketing(source) {
  const subtitle = source.match(/\nSubtitle\n([^\n]+)/)?.[1];
  const description = source.match(/\nDescription\n([\s\S]+?)\n\nKeywords\n/)?.[1];
  if (!subtitle || !description) throw new Error('Missing marketing subtitle or description');
  const paragraphs = description.trim().split(/\n\s*\n/);
  if (paragraphs.length !== 19) throw new Error(`Expected 19 marketing paragraphs, received ${paragraphs.length}`);
  const states = paragraphs[3].split('\n').map((line) => {
    const match = line.match(/^- (.+?)[:：]\s*(.+)$/);
    if (!match) throw new Error(`Invalid state: ${line}`);
    return { title: match[1], text: match[2] };
  });
  return {
    subtitle, lead: paragraphs[0], intro: paragraphs[1], stateIntro: paragraphs[2], states,
    sections: Array.from({ length: 7 }, (_, index) => ({ heading: paragraphs[4 + index * 2], text: paragraphs[5 + index * 2] })),
    requirements: paragraphs[18],
  };
}

const arrow = '<span aria-hidden="true">↗</span>';
const storeButton = (locale, small = false) => `<a class="button${small ? ' button-small' : ''}" href="${escape(storeUrl(locale))}">${escape(small ? locales[locale].download : locales[locale].appStore)} ${arrow}</a>`;

function languageMenu(locale, privacy) {
  return `<details class="language-menu"><summary>${escape(locales[locale].name)}<span aria-hidden="true">⌄</span></summary><nav aria-label="${escape(locales[locale].language)}">${Object.entries(locales).map(([code, copy]) => `<a href="${localePath(code)}${privacy ? 'privacy/' : ''}" lang="${code}" hreflang="${code}"${code === locale ? ' aria-current="page"' : ''}>${escape(copy.name)}${code === locale ? '<span aria-hidden="true">✓</span>' : ''}</a>`).join('')}</nav></details>`;
}

function layout(locale, marketing, body, privacy = false) {
  const copy = locales[locale];
  const home = localePath(locale);
  const route = `${home}${privacy ? 'privacy/' : ''}`;
  const title = `Human Turn | ${privacy ? copy.privacy : marketing.subtitle}`;
  const canonical = site.origin ? `${site.origin.replace(/\/$/, '')}${route}` : '';
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#f4f7f5">
  <meta name="description" content="${escape(privacy ? copy.privacyIntro : marketing.intro)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(marketing.intro)}">
  <meta property="og:image" content="${escape(site.origin.replace(/\/$/, ''))}/assets/${locale}/1.jpg">
  <meta name="twitter:card" content="summary_large_image">
  ${canonical ? `<link rel="canonical" href="${escape(canonical)}"><meta property="og:url" content="${escape(canonical)}">` : ''}
  ${Object.keys(locales).map((code) => `<link vite-ignore rel="alternate" hreflang="${code}" href="${escape(site.origin.replace(/\/$/, ''))}${localePath(code)}${privacy ? 'privacy/' : ''}">`).join('\n  ')}
  <link vite-ignore rel="alternate" hreflang="x-default" href="${escape(site.origin.replace(/\/$/, ''))}/${privacy ? 'privacy/' : ''}">
  <link rel="icon" type="image/png" href="/assets/human-turn.png">
  <link rel="apple-touch-icon" href="/assets/human-turn.png">
  <title>${escape(title)}</title>
  <script type="module" src="/src/main.ts"></script>
</head>
<body>
  <a class="skip-link" href="#main">${escape(copy.skip)}</a>
  <header class="site-header">
    <div class="header-inner shell">
      <a class="brand" href="${home}"><img src="/assets/human-turn.png" alt="" width="38" height="38"><span>Human Turn</span></a>
      <nav class="primary-nav" aria-label="${escape(copy.navigation)}">
        <a class="nav-detail" href="${home}#features">${escape(copy.features)}</a>
        <a class="nav-detail" href="${home}privacy/">${escape(copy.privacy)}</a>
        ${languageMenu(locale, privacy)}
        ${storeButton(locale, true)}
      </nav>
    </div>
  </header>
  <main id="main">${body}</main>
  <footer class="site-footer shell">
    <a class="brand" href="${home}"><img src="/assets/human-turn.png" alt="" width="28" height="28"><span>Human Turn</span></a>
    <p>© <span data-year>${new Date().getFullYear()}</span> ${escape(copy.rights)}</p>
    <a href="${home}privacy/">${escape(copy.privacy)}</a>
    <div class="footer-languages" aria-label="${escape(copy.language)}">${Object.entries(locales).map(([code, translation]) => `<a href="${localePath(code)}${privacy ? 'privacy/' : ''}" lang="${code}" hreflang="${code}"${code === locale ? ' aria-current="page"' : ''}>${escape(translation.name)}</a>`).join('')}</div>
  </footer>
</body>
</html>`;
}

function homePage(locale, marketing) {
  const copy = locales[locale];
  const feature = (index, extra = '') => `<article class="feature-copy ${extra}"><p class="kicker">${escape(marketing.sections[index].heading)}</p><h2>${escape(copy.featureTitles[index])}</h2><p>${escape(marketing.sections[index].text)}</p></article>`;
  return layout(locale, marketing, `
    <section class="hero">
      <img class="hero-scene" src="/assets/${locale}/hero.jpg" alt="${escape(copy.alts[0])}" width="1040" height="1300" fetchpriority="high">
      <div class="shell hero-inner">
        <div class="hero-copy">
          <p class="kicker hero-eyebrow"><span class="status-dot"></span>${escape(copy.eyebrow)}</p>
          <h1>Human Turn<span class="title-period">.</span></h1>
          <p class="hero-tagline">${escape(marketing.subtitle)}</p>
          <p class="hero-lede">${escape(marketing.lead)}</p>
          <div class="hero-actions">${storeButton(locale)}<a class="text-link" href="#screenshots">${escape(copy.tour)} <span aria-hidden="true">↓</span></a></div>
          <p class="availability">${escape(copy.requirement)}</p>
        </div>
      </div>
    </section>
    <section class="integrations" aria-label="${escape(copy.integrations)}"><div class="shell integration-inner"><p>${escape(copy.integrations)}</p><ul><li>GitHub</li><li>GitLab</li><li>Bitbucket</li><li>Cursor</li><li>GitHub Copilot</li></ul></div></section>
    <section class="overview shell section-space" id="features">
      <div class="section-heading"><p class="kicker">${escape(copy.features)}</p><h2>${escape(copy.intro)}</h2><p>${escape(marketing.intro)}</p></div>
      <div class="states" aria-label="${escape(marketing.stateIntro)}">${marketing.states.map((state, index) => `<article class="state state-${index}"><div class="state-label"><span class="status-dot"></span><h3>${escape(state.title)}</h3><span class="state-index" aria-hidden="true">0${index + 1}</span></div><p>${escape(state.text)}</p></article>`).join('')}</div>
    </section>
    <section class="gallery-band" id="screenshots"><div class="shell section-space">
      <div class="section-heading"><p class="kicker">${escape(copy.screenshotKicker)}</p><h2>${escape(copy.screenshots)}</h2></div>
      <nav class="gallery-tabs" aria-label="${escape(copy.screenshotKicker)}">${copy.tabs.map((tab, index) => `<a href="/assets/${locale}/${index + 1}.jpg" data-shot="${index}" data-alt="${escape(copy.alts[index])}"${index === 0 ? ' aria-current="true"' : ''}>${escape(tab)}</a>`).join('')}</nav>
      <figure class="gallery-figure"><a data-enlarge href="/assets/${locale}/1.jpg" aria-label="${escape(copy.openImage)}"><img id="gallery-image" src="/assets/${locale}/1.jpg" alt="${escape(copy.alts[0])}" width="1800" height="1125" loading="lazy"><span class="enlarge-label">${escape(copy.openImage)} ${arrow}</span></a><figcaption id="gallery-caption" aria-live="polite">${escape(copy.tabs[0])}</figcaption></figure>
    </div></section>
    <section class="shell section-space feature-grid">${feature(0)}${feature(1)}${feature(2)}${feature(3)}</section>
    <section class="intelligence-band"><div class="shell section-space intelligence-grid">${feature(4)}<div class="intelligence-note"><p class="monogram" aria-hidden="true">Aa<span>✦</span></p><p class="requirements">${escape(marketing.requirements)}</p></div></div></section>
    <section class="privacy-band"><div class="shell section-space privacy-grid">${feature(5)}<div>${feature(6)}<a class="text-link" href="${localePath(locale)}privacy/">${escape(copy.privacy)} ${arrow}</a></div></div></section>
    <section class="final-cta shell section-space"><img src="/assets/human-turn.png" alt="" width="80" height="80"><h2>${escape(copy.closing)}</h2><p>${escape(copy.closingText)}</p>${storeButton(locale)}<p class="availability">${escape(copy.requirement)}</p></section>
    <dialog class="lightbox" aria-label="${escape(copy.screenshotKicker)}"><form method="dialog"><button class="close-lightbox" aria-label="${escape(copy.close)}" title="${escape(copy.close)}">×</button></form><img src="/assets/${locale}/1.jpg" alt="${escape(copy.alts[0])}" width="1800" height="1125"></dialog>
  `);
}

function privacyPage(locale, marketing) {
  const copy = locales[locale];
  return layout(locale, marketing, `<article class="privacy-document shell section-space"><a class="text-link" href="${localePath(locale)}">← ${escape(copy.back)}</a><p class="kicker">Human Turn</p><h1>${escape(copy.privacyTitle)}</h1><p class="document-intro">${escape(copy.privacyIntro)}</p><h2>${escape(copy.privacyHeadings[0])}</h2><p>${escape(marketing.sections[6].text)}</p><p>${escape(marketing.sections[0].text)}</p><h2>${escape(copy.privacyHeadings[1])}</h2><p>${escape(marketing.sections[4].text)}</p><p>${escape(marketing.requirements)}</p><h2>${escape(copy.privacyHeadings[2])}</h2><p>${escape(marketing.sections[3].text)}</p><h2>${escape(copy.privacyHeadings[3])}</h2><p>${escape(copy.privacyWeb)}</p></article>`, true);
}

async function generate() {
  for (const locale of Object.keys(locales)) {
    const marketing = parseMarketing(await readFile(resolve(root, `content/marketing/${locale}.txt`), 'utf8'));
    const folder = resolve(root, locale === 'en' ? '.' : locale);
    await mkdir(resolve(folder, 'privacy'), { recursive: true });
    await writeFile(resolve(folder, 'index.html'), homePage(locale, marketing));
    await writeFile(resolve(folder, 'privacy/index.html'), privacyPage(locale, marketing));
  }
  if (site.origin) {
    const origin = new URL(site.origin).origin;
    const urls = Object.keys(locales).flatMap((locale) => [localePath(locale), `${localePath(locale)}privacy/`]);
    await writeFile(resolve(root, 'public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escape(origin + url)}</loc></url>`).join('')}</urlset>`);
    await writeFile(resolve(root, 'public/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  }
  console.log('Generated 5 localized homepages and 5 privacy pages.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await generate();