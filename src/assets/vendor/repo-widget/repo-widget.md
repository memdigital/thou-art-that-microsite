# Repo Widget

A small canonical card showing meaningful state for a Marbl-owned (or Marbl-affiliated) GitHub repository - stars, forks, version, licence, last-updated, and links into the repo + discussions. Two visual variants: solid card for body content, transparent for sidebar use.

**Live preview:** `./preview.html`
**Status:** v1.5.1 - static (build-time data fetch). Live mode (client-side fetch with localStorage cache) deferred to v2.

**Depends on:** `ui-items/button.css` (canonical buttons used for the action footer). Vendor it alongside this component.

**SEO baseline:** see [`../_seo-aeo-geo-baseline.md`](../_seo-aeo-geo-baseline.md). Microdata for `SoftwareSourceCode` + `InteractionCounter` is built into the partial.

---

## The rule

Anywhere a Marbl site references one of our public GitHub repositories - in body content, in a sidebar, in a footer - use this component. Do not write ad-hoc "View on GitHub" links. The widget exists so visitors can see signal (is this current? actively used? what licence?) at a glance, and the markup carries the structured data for AI agents and search.

---

## 1. Structure

The partial lives at `./repo-widget.html`. It uses double-brace placeholders consumed by the consuming site's build pipeline.

```html
<article class="repo-widget repo-widget--{{REPO_VARIANT}}"
         itemscope itemtype="https://schema.org/SoftwareSourceCode">
  <meta itemprop="codeRepository" content="{{REPO_URL}}">
  <meta itemprop="license" content="{{REPO_LICENSE_URL}}">

  <header class="repo-widget__header">
    <svg class="repo-widget__icon" aria-hidden="true">[GitHub logo]</svg>
    <h3 class="repo-widget__name">
      <a href="{{REPO_URL}}" target="_blank" rel="noopener noreferrer"
         data-fathom-event="Repo widget - name click" itemprop="url">
        <span itemprop="name">{{REPO_OWNER}}/{{REPO_NAME}}</span>
      </a>
    </h3>
  </header>

  <p class="repo-widget__description repo-widget__description--filled-only" itemprop="description">{{REPO_DESCRIPTION}}</p>

  <ul class="repo-widget__meta" aria-label="Repository statistics">
    <li class="repo-widget__stat repo-widget__stat--stars" itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
      <meta itemprop="interactionType" content="https://schema.org/LikeAction">
      <a href="{{REPO_URL}}/stargazers" target="_blank" rel="noopener noreferrer" data-fathom-event="Repo widget - stargazers click">
        <svg class="repo-widget__stat-icon" aria-hidden="true">[star]</svg>
        <span class="repo-widget__stat-value" itemprop="userInteractionCount">{{REPO_STARS}}</span>
        <span class="repo-widget__stat-label">stars</span>
      </a>
    </li>
    <!-- forks / version / licence / updated stats follow -->
  </ul>

  <footer class="repo-widget__actions">
    <a class="repo-widget__cta repo-widget__cta--primary" href="{{REPO_URL}}" ...>View on GitHub</a>
    <a class="repo-widget__cta repo-widget__cta--secondary repo-widget__cta--filled-only" href="{{REPO_DISCUSSIONS_URL}}" ...>Join the discussion</a>
  </footer>
</article>
```

See `./repo-widget.html` for the full canonical partial.

---

## 2. Variants

### `repo-widget--filled` (default)

Solid card on a slightly raised background. Use in body content, dedicated "Source" sections, or anywhere with breathing room. Shows the full set: header, description, four stats (stars / forks / version / last-updated), primary + secondary CTA.

### `repo-widget--transparent`

No background, lighter border, tighter padding. Use in sidebars (KH "On this page" column, footer columns, narrow rails). Hides everything marked `--filled-only`: description and version stat. Shows: header, three stats (stars / forks / last-updated), both CTAs.

---

## 3. Placeholders

| Placeholder | Required | Example | Notes |
|---|---|---|---|
| `{{REPO_VARIANT}}` | yes | `filled` or `transparent` | dropped into class name |
| `{{REPO_OWNER}}` | yes | `memdigital` | |
| `{{REPO_NAME}}` | yes | `thou-art-that` | |
| `{{REPO_URL}}` | yes | `https://github.com/memdigital/thou-art-that` | |
| `{{REPO_DISCUSSIONS_URL}}` | yes | `{{REPO_URL}}/discussions` | for secondary CTA |
| `{{REPO_DESCRIPTION}}` | filled only | "A study piece on..." | omit on transparent |
| `{{REPO_STARS}}` | yes | `42` or `1.2k` | format integers >= 1000 as `1.2k` |
| `{{REPO_FORKS}}` | yes | `3` | |
| `{{REPO_VERSION}}` | filled only | `v0.1.0` | from CITATION.cff or latest GH release |
| `{{REPO_UPDATED}}` | yes | `2 days ago` | relative time string |
| `{{REPO_UPDATED_ISO}}` | yes | `2026-04-30` | ISO 8601 for `<time datetime>` |
| `{{REPO_DISCUSSIONS_SUFFIX}}` | yes | ` (3)` or empty | `(N)` if N > 0 |

Empty placeholders (omit a stat) should resolve to `""` in the build, so the markup stays valid HTML even if a value is missing.

---

## 4. Data fetching (build time)

Each consuming site implements its own fetch. The canonical pattern:

```js
async function fetchRepoStats(owner, repo, githubToken) {
  const headers = {
    'User-Agent': 'marbl-codes-build',
    'Accept': 'application/vnd.github+json'
  };
  if (githubToken) headers.Authorization = 'Bearer ' + githubToken;

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) throw new Error('GitHub API ' + repoRes.status);
  const repoData = await repoRes.json();

  // Optional: latest release
  let version = '';
  const relRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers });
  if (relRes.ok) {
    const rel = await relRes.json();
    version = rel.tag_name || '';
  }

  return {
    stars: formatCount(repoData.stargazers_count),
    forks: repoData.forks_count,
    description: repoData.description || '',
    updatedAt: repoData.pushed_at,
    updatedRelative: timeAgo(repoData.pushed_at),
    version
  };
}

function formatCount(n) {
  if (n < 1000) return String(n);
  return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
}
```

If the API call fails (rate limit, network error), fall back to placeholder values from `CITATION.cff` so the build never breaks.

---

## 5. Schema.org microdata

The widget carries `SoftwareSourceCode` itemscope on the root, with these itemprops:

- `codeRepository` (URL) - via `<meta>`
- `name` - inside the `<h3>`
- `url` - on the title `<a>`
- `description` - on the `<p>` (filled only)
- `softwareVersion` - on the version stat `<span>`

The stars stat carries `interactionStatistic` itemscope with `InteractionCounter` itemtype, `LikeAction` interactionType, and `userInteractionCount`. Standard pattern for "likes/stars on social media" - parsed by Schema.org-aware crawlers and AI agents.

No JSON-LD `<script>` tag - microdata is CSP-compliant and equivalent in machine-readability.

---

## 6. Accessibility

- `<article>` root with implicit landmark
- `<header>` and `<footer>` inside the article for structure
- `<h3>` for the repo name (not h2, to nest correctly inside page article context)
- `<ul aria-label="Repository statistics">` for the meta row
- `<time datetime="...">` for the updated date
- `aria-hidden="true"` on all decorative SVGs
- All interactive `<a>` have visible focus-visible rings (ember 2px outline, 2px offset)
- All external `<a>` open in new tab with `rel="noopener noreferrer"` (security + indicates new context)
- `<span class="repo-widget__stat-label">` carries the unit ("stars", "forks") for screen reader clarity (visually subordinate, semantically present)

WCAG AA contrast: white-85 on charcoal-light = 11.5:1, white-65 = 7.8:1, ember on charcoal = 4.6:1. All pass.

---

## 7. Tracking

Every link in the widget carries `data-fathom-event` for the site-level Fathom delegator (see `tat-tracking.js` pattern). Events fired:

- `Repo widget - name click` - the repo title link
- `Repo widget - star intent click` - the stars stat (link points at the repo root so a logged-in user can star with one extra click)
- `Repo widget - forks click` - the forks stat (filled only)
- `Repo widget - View on GitHub` - primary CTA
- `Repo widget - Join discussion` - secondary CTA (filled only)

If a consuming site uses a different analytics provider, the same `data-fathom-event` attributes work as a generic tracking-event hook.

---

## 8. Tokens used

All values from `marbl-v2.css`. No invented px values, no local aliases.

- Spacing: `--gap-3xs` (5px), `--gap-xs` (10px), `--gap-sm` (20px)
- Radius: `--radius` (10px), `--radius-sm` (5px)
- Type: `--text-xs` (11px), `--text-sm` (13px)
- Colour: `--marbl-charcoal-light`, `--marbl-charcoal-darkest`, `--marbl-white-*` alpha scale, `--marbl-ember`, `--marbl-ember-dark`
- Font: `--marbl-font-body`

---

## 9. Changelog

- **v1.5.1** - 1 May 2026 - kill FOUC: inline a tiny critical-path `<style>` block at the top of the partial that resets `<a>`/`<ul>`/`<li>`/`<p>` defaults before the external `repo-widget.css` loads. Was flashing blue underlined links on first paint when many vendored stylesheets compete for browser bandwidth. CSP-compliant via `style-src 'unsafe-inline'`.
- **v1.5.0** - 1 May 2026 - action button layout split by variant + viewport: filled (full-width contexts) keeps buttons inline at natural widths; transparent (sidebars) stacks them vertically full-width on desktop; both variants drop to inline 50/50 equal-width on mobile (≤768px viewport). Container-query approach from v1.2/v1.4 retired in favour of viewport + variant rules so behaviour is predictable per context.
- **v1.4.0** - 1 May 2026 - narrow-context (≤320px container width) action buttons now stay inline side-by-side with 50/50 equal width and centred labels (was stacked + full-width). Reads as a tighter, deliberate pair on sidebar/mobile.
- **v1.3.0** - 1 May 2026 - hover treatment simplified: every link inside the widget (name, stars, forks, etc.) drops to a plain colour shift to ember on hover - no underline, no border-bottom (was a 1px white-30 underline on stat links). Version stat moved back to `--filled-only` so the transparent variant in narrow sidebars carries just stars / forks / last-updated. Container-query button stack (v1.2-era) kept.
- **v1.2.0** - 1 May 2026 - **brand discipline pass**: action buttons now use canonical `.btn .btn--fill-up.btn--mini` (primary) + `.btn .btn--outline.btn--mini` (secondary) from `ui-items/button.css` instead of bespoke `.repo-widget__cta*` classes. Licence stat dropped per Richard. Forks + last-updated promoted to always-visible (was filled-only). Both CTAs now show on the transparent variant. Repo widget became the standard reference for "Marbl-only? load `/marbl-design-system` skill, read `brand-kit.md` + `ui-items.md`, then build."
- **v1.1.0** - 1 May 2026 - stars stat now links to repo root (where the GitHub Star button lives) so logged-in users can star with one extra click; aria-label and title updated accordingly. Tracking event renamed to `Repo widget - star intent click`.
- **v1.0.0** - 1 May 2026 - initial canonical. Filled + transparent variants, six stats, two CTAs, microdata, build-time data fetching.
