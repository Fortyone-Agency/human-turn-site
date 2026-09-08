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
- `content/privacy.mjs`: privacy-policy translations and the fixed effective date.
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

Privacy policies are available at `/privacy/`, `/de/privacy/`, `/fr/privacy/`,
`/es/privacy/`, and `/ja/privacy/`. They follow the Times policy's dated,
section-based format with Human Turn-specific disclosures. Update
`privacyEffectiveDate` only when revising the policy; unlike the copyright year,
the policy revision date must not advance automatically. Review the text against
actual app and hosting practices before publishing; it is not a legal compliance
certification.

## Deployment

The repository uses GitHub Pages with \*\*Settings > Pages > Build and deployment

> Source: GitHub Actions\*\*. Its configured custom domain is
> `human-turn.fortyoneagency.com`.

The `Check and deploy website` workflow in `.github/workflows/check.yml`:

1. Installs dependencies and runs the production build, TypeScript, lint, and tests.
2. Reads the actual Pages URL with `actions/configure-pages` and supplies it as
   `SITE_URL`, including a repository subpath when applicable.
3. Uploads `dist/` with `actions/upload-pages-artifact`.
4. Deploys with `actions/deploy-pages` using the `github-pages` environment.

Pushes to `main` deploy automatically after checks pass. Pull requests only run
checks and never deploy. You can also choose **Actions > Check and deploy
website > Run workflow** on `main`. Commit and push the workflow, code, and all
five `content/marketing/*.txt` inputs together before the first deployment.

No personal access token or additional repository secret is required. Only the
deployment job has Pages write and OIDC permissions. Existing custom-domain
settings are preserved; this workflow does not change DNS.

To reproduce the custom-domain build locally:

```sh
SITE_URL=https://human-turn.fortyoneagency.com npm run check
```

`SITE_URL` also supports a project URL such as
`https://fortyone-agency.github.io/human-turn-site`. Both the generator and Vite
use its path for links and assets. Absolute canonical, Open Graph, alternate
language URLs, and the sitemap use the same deployment URL.

Without `SITE_URL`, local development stays at `/`; canonical URLs, the sitemap,
and robots file are omitted. After a production build, run `npm run dev` again
to regenerate local links. The build is self-contained and does not require the
neighboring app repository or a backend.

Privacy-page content is based on the supplied app description. Review it against
your final hosting configuration before publishing.
