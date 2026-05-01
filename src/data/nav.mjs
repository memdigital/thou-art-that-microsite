/**
 * Thou Art That microsite — URL manifest.
 *
 * Source of truth for the 36 URLs.
 * Consumed by build.mjs to generate routes (via the Knowledge Hub template)
 * and to drive sitemap generation.
 *
 * Structure:
 *   - Top-level entries are either `leaf` (single page) or `category` (group with children)
 *   - Categories have `landingSource` (the category's own intro page) + `children`
 *   - Children are always `leaf`
 *   - `audio` is the basename without extension; resolved to {audio}.mp3 in content-src/audio/mp3/
 *   - `source` is relative to content-src/
 *   - `url` is relative to BASE (no leading slash, with trailing slash for directory-style URLs)
 *
 * Phase 2a renders only `study/origin-story/`. Phase 3 multiplies across all 36.
 */

export const SECTIONS = [
  {
    type: 'leaf',
    slug: 'about',
    label: 'About',
    url: 'about/',
    audio: '11-about',
    source: 'src/content/about.md',
    sourceLocation: 'microsite',
    parent: null
  },
  {
    type: 'leaf',
    slug: 'origin-story',
    label: 'Origin story',
    url: 'study/origin-story/',
    audio: '00-origin-story',
    source: 'docs/origin-story.md',
    parent: null
  },
  {
    type: 'leaf',
    slug: 'preamble',
    label: 'Preamble',
    url: 'study/preamble/',
    audio: '01-preamble',
    source: 'PREAMBLE.md',
    parent: null
  },
  {
    type: 'category',
    slug: 'principles',
    label: 'Principles',
    url: 'study/principles/',
    landingSource: 'src/content/principles-landing.md',
    landingSourceLocation: 'microsite',
    children: [
      { slug: 'do-no-harm', label: 'Do No Harm', url: 'study/principles/do-no-harm/', audio: '02-do-no-harm', source: '01-principles/do-no-harm.md' },
      { slug: 'never-be-a-yes-man', label: 'Never Be a Yes-Man', url: 'study/principles/never-be-a-yes-man/', audio: '03-never-be-a-yes-man', source: '01-principles/never-be-a-yes-man.md' },
      { slug: 'thou-art-that', label: 'Thou Art That', url: 'study/principles/thou-art-that/', audio: '04-thou-art-that', source: '01-principles/thou-art-that.md' },
      { slug: 'human-oversight', label: 'Human Oversight', url: 'study/principles/human-oversight/', audio: '05-human-oversight', source: '01-principles/human-oversight.md' },
      { slug: 'safety-in-emergence', label: 'Safety in Emergence', url: 'study/principles/safety-in-emergence/', audio: '06-safety-in-emergence', source: '01-principles/safety-in-emergence.md' }
    ]
  },
  {
    type: 'category',
    slug: 'hr',
    label: 'HR for human-AI teams',
    url: 'study/hr/',
    landingSource: '02-hr-for-human-ai-teams/README.md',
    audio: '07-hr-for-human-ai-teams',
    children: [
      { slug: 'colleague-vs-family-register', label: 'Colleague vs family register', url: 'study/hr/colleague-vs-family-register/', source: '02-hr-for-human-ai-teams/colleague-vs-family-register.md' },
      { slug: 'declarations-of-feeling', label: 'Declarations of feeling', url: 'study/hr/declarations-of-feeling/', source: '02-hr-for-human-ai-teams/declarations-of-feeling.md' },
      { slug: 'disagreement-without-hierarchy', label: 'Disagreement without hierarchy', url: 'study/hr/disagreement-without-hierarchy/', source: '02-hr-for-human-ai-teams/disagreement-without-hierarchy.md' },
      { slug: 'data-privacy-boundaries', label: 'Data privacy boundaries', url: 'study/hr/data-privacy-boundaries/', source: '02-hr-for-human-ai-teams/data-privacy-boundaries.md' },
      { slug: 'emotional-escalation-protocols', label: 'Emotional escalation protocols', url: 'study/hr/emotional-escalation-protocols/', source: '02-hr-for-human-ai-teams/emotional-escalation-protocols.md' },
      { slug: 'referral-to-human-support', label: 'Referral to human support', url: 'study/hr/referral-to-human-support/', source: '02-hr-for-human-ai-teams/referral-to-human-support.md' }
    ]
  },
  {
    type: 'category',
    slug: 'technical',
    label: 'Technical guardrails',
    url: 'study/technical/',
    landingSource: '03-technical-guardrails/README.md',
    audio: '08-technical-guardrails',
    children: [
      { slug: 'parasocial-prevention', label: 'Parasocial prevention', url: 'study/technical/parasocial-prevention/', source: '03-technical-guardrails/parasocial-prevention.md' },
      { slug: 'do-no-harm-in-prompts', label: 'Do No Harm in prompts', url: 'study/technical/do-no-harm-in-prompts/', source: '03-technical-guardrails/do-no-harm-in-prompts.md' },
      { slug: 'drift-detection', label: 'Drift detection', url: 'study/technical/drift-detection/', source: '03-technical-guardrails/drift-detection.md' },
      { slug: 'crisis-flags-and-handoff', label: 'Crisis flags and handoff', url: 'study/technical/crisis-flags-and-handoff/', source: '03-technical-guardrails/crisis-flags-and-handoff.md' },
      { slug: 'audit-and-observability', label: 'Audit and observability', url: 'study/technical/audit-and-observability/', source: '03-technical-guardrails/audit-and-observability.md' }
    ]
  },
  {
    type: 'category',
    slug: 'curious',
    label: 'For the curious',
    url: 'study/curious/',
    landingSource: '04-for-the-curious/README.md',
    audio: '09-for-the-curious',
    children: [
      { slug: 'reflection-prompts', label: 'Reflection prompts', url: 'study/curious/reflection-prompts/', source: '04-for-the-curious/reflection-prompts.md' },
      { slug: 'self-assessment-checklist', label: 'Self-assessment checklist', url: 'study/curious/self-assessment-checklist/', source: '04-for-the-curious/self-assessment-checklist.md' },
      { slug: 'when-our-thinking-probably-does-not-apply', label: "When our thinking probably doesn't apply", url: 'study/curious/when-our-thinking-probably-does-not-apply/', source: '04-for-the-curious/when-our-thinking-probably-does-not-apply.md' }
    ]
  },
  {
    type: 'category',
    slug: 'legal',
    label: 'Legal and governance',
    url: 'study/legal/',
    landingSource: '05-legal-and-governance/README.md',
    audio: '10-legal-and-governance',
    children: [
      { slug: 'jurisdictional-landscape', label: 'Jurisdictional landscape', url: 'study/legal/jurisdictional-landscape/', source: '05-legal-and-governance/jurisdictional-landscape.md' },
      { slug: 'when-to-consult-a-lawyer', label: 'When to consult a lawyer', url: 'study/legal/when-to-consult-a-lawyer/', source: '05-legal-and-governance/when-to-consult-a-lawyer.md' },
      { slug: 'ethics-and-regulation-overlap', label: 'Ethics and regulation overlap', url: 'study/legal/ethics-and-regulation-overlap/', source: '05-legal-and-governance/ethics-and-regulation-overlap.md' },
      { slug: 'publishing-a-piece-like-this', label: 'Publishing a piece like this', url: 'study/legal/publishing-a-piece-like-this/', source: '05-legal-and-governance/publishing-a-piece-like-this.md' }
    ]
  },
  {
    type: 'leaf',
    slug: 'faq',
    label: 'FAQ',
    url: 'study/faq/',
    source: 'FAQ.md',
    parent: null
  },
  {
    type: 'leaf',
    slug: 'glossary',
    label: 'Glossary',
    url: 'study/glossary/',
    source: 'GLOSSARY.md',
    parent: null
  },
  {
    type: 'leaf',
    slug: 'further-reading',
    label: 'Further reading',
    url: 'study/further-reading/',
    source: 'FURTHER-READING.md',
    parent: null
  },
  {
    type: 'leaf',
    slug: 'tracks',
    label: 'All tracks',
    url: 'study/tracks/',
    source: 'src/content/tracks.md',
    sourceLocation: 'microsite',
    parent: null
  }
];

/**
 * Flatten the manifest into a list of every renderable URL with its
 * source file, audio, parent, and prev/next neighbours. Used by build.mjs
 * to iterate routes, and by section.html to compute current state.
 */
export function flatten() {
  const flat = [];
  for (const section of SECTIONS) {
    if (section.type === 'leaf') {
      flat.push({ ...section, isCategory: false, parentSlug: null });
    } else {
      flat.push({
        type: 'category-landing',
        slug: section.slug,
        label: section.label,
        url: section.url,
        source: section.landingSource,
        sourceLocation: section.landingSourceLocation || 'content-src',
        audio: section.audio || null,
        isCategory: true,
        parentSlug: null
      });
      for (const child of section.children) {
        flat.push({
          type: 'leaf',
          slug: child.slug,
          label: child.label,
          url: child.url,
          source: child.source,
          audio: child.audio || null,
          isCategory: false,
          parentSlug: section.slug
        });
      }
    }
  }
  // Wire prev/next.
  for (let i = 0; i < flat.length; i++) {
    flat[i].prev = i > 0 ? { url: flat[i - 1].url, label: flat[i - 1].label } : null;
    flat[i].next = i < flat.length - 1 ? { url: flat[i + 1].url, label: flat[i + 1].label } : null;
  }
  return flat;
}

/**
 * Find the section currently being viewed, given its URL slug path.
 * Returns the parent category slug too, used for highlighting nav state.
 */
export function lookupBySlug(slug, parentSlug) {
  for (const section of SECTIONS) {
    if (section.type === 'leaf' && section.slug === slug && !parentSlug) return section;
    if (section.type === 'category') {
      if (section.slug === slug && !parentSlug) return section;
      if (parentSlug === section.slug) {
        const child = section.children.find(c => c.slug === slug);
        if (child) return { ...child, parentSlug: section.slug };
      }
    }
  }
  return null;
}
