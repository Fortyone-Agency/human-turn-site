# Human Turn Website

Multilingual website for the Human Turn macOS app. Built with Vite, TypeScript,
and static HTML, following the lightweight approach of the Times website.

## Development

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Vite prints the local URL. The site supports English at `/`, German at `/de/`,
French at `/fr/`, Spanish at `/es/`, and Japanese at `/ja/`. Each language also
has a `privacy/` page. Language switching preserves the page type.

## Build and Checks

```sh
npm run check
npm run preview
```

`check` generates all ten HTML pages, runs TypeScript, builds production files,
lints with zero warnings, and tests localized content, images, navigation, and
App Store destinations. Production output is in `dist/`.

The pages contain the full content before JavaScript executes. JavaScript adds
the screenshot gallery, keyboard navigation, and an accessible image dialog.
Without JavaScript, screenshot links open the images directly and the language
menu still works.

## Content

- `content/marketing/`: supplied App Store text, preserved in all five languages.
- `content/site.mjs`: website-specific translations and localized App Store URLs.
- `scripts/generate.mjs`: shared homepage and privacy-page templates.
- `src/site.css`: responsive styles and reduced-motion support.
- `src/main.ts`: gallery and menu interactions.
- `public/assets/`: the supplied app icon and optimized, localized screenshots.

The hero crops retain the actual menu-bar view. The gallery uses all four
supplied screenshots per language. Source assets in the app repository are not
modified. Generated HTML is ignored by Git; edit the templates and content,
then run `npm run generate` (or restart `npm run dev`).

The App Store ID is `6809105741`. Storefronts are `us`, `de`, `fr`, `es`, and
`jp`, with explicit language parameters for each locale.

## Deployment

Deploy the contents of `dist/` to the root of a static website. No backend,
runtime environment variables, external fonts, or analytics service is needed.
The build is self-contained and does not require the neighboring app repository.

Set the actual public origin at build time to generate absolute canonical,
Open Graph, and language-alternate URLs, plus a sitemap and robots file:

```sh
SITE_URL=https://your-domain.example npm run check
```

Use an origin without a subdirectory. Without `SITE_URL`, local previews still
work, but canonical URLs and a sitemap are intentionally omitted rather than
publishing an invented domain. GitHub Actions runs the checks on pushes and pull
requests; deployment and DNS are not configured automatically.

Privacy-page content is based on the supplied app description. Review it against
your final hosting configuration before publishing.
