// Flat top-level sidebar navigation for Thou Art That microsite.
// Sub-pages inside section folders render at their own URLs but do NOT appear
// in the sidebar - they're surfaced as sub-navigation on the section landing pages.

export const nav = [
  { slug: '', title: 'Overview', source: null },
  { slug: 'preamble', title: 'Preamble', source: 'PREAMBLE.md' },
  { slug: 'origin-story', title: 'Origin story', source: 'docs/origin-story.md' },
  { slug: 'principles', title: 'Principles', source: null, isSection: true },
  { slug: 'hr', title: 'HR for human-AI teams', source: '02-hr-for-human-ai-teams/README.md', isSection: true },
  { slug: 'technical-guardrails', title: 'Technical guardrails', source: '03-technical-guardrails/README.md', isSection: true },
  { slug: 'for-the-curious', title: 'For the curious', source: '04-for-the-curious/README.md', isSection: true },
  { slug: 'legal-and-governance', title: 'Legal and governance', source: '05-legal-and-governance/README.md', isSection: true },
  { slug: 'reference', title: 'Reference', source: null, isSection: true }
];

// Sub-pages per section. Not in sidebar. Each gets its own URL.
// sectionSlug maps to an array of { slug (suffix), title, source }.
export const sectionPages = {
  principles: [
    { suffix: 'do-no-harm', title: 'Do No Harm', source: '01-principles/do-no-harm.md' },
    { suffix: 'never-be-a-yes-man', title: 'Never Be a Yes-Man', source: '01-principles/never-be-a-yes-man.md' },
    { suffix: 'thou-art-that', title: 'Thou Art That', source: '01-principles/thou-art-that.md' },
    { suffix: 'safety-in-emergence', title: 'Safety in Emergence', source: '01-principles/safety-in-emergence.md' }
  ],
  hr: [
    { suffix: 'colleague-vs-family-register', title: 'Colleague vs family register', source: '02-hr-for-human-ai-teams/colleague-vs-family-register.md' },
    { suffix: 'declarations-of-feeling', title: 'Declarations of feeling', source: '02-hr-for-human-ai-teams/declarations-of-feeling.md' },
    { suffix: 'emotional-escalation-protocols', title: 'Emotional escalation', source: '02-hr-for-human-ai-teams/emotional-escalation-protocols.md' },
    { suffix: 'disagreement-without-hierarchy', title: 'Disagreement without hierarchy', source: '02-hr-for-human-ai-teams/disagreement-without-hierarchy.md' },
    { suffix: 'data-privacy-boundaries', title: 'Data privacy boundaries', source: '02-hr-for-human-ai-teams/data-privacy-boundaries.md' },
    { suffix: 'referral-to-human-support', title: 'Referral to human support', source: '02-hr-for-human-ai-teams/referral-to-human-support.md' }
  ],
  'technical-guardrails': [
    { suffix: 'parasocial-prevention', title: 'Parasocial prevention', source: '03-technical-guardrails/parasocial-prevention.md' },
    { suffix: 'do-no-harm-in-prompts', title: 'Do No Harm in prompts', source: '03-technical-guardrails/do-no-harm-in-prompts.md' },
    { suffix: 'drift-detection', title: 'Drift detection', source: '03-technical-guardrails/drift-detection.md' },
    { suffix: 'crisis-flags-and-handoff', title: 'Crisis flags and handoff', source: '03-technical-guardrails/crisis-flags-and-handoff.md' },
    { suffix: 'audit-and-observability', title: 'Audit and observability', source: '03-technical-guardrails/audit-and-observability.md' }
  ],
  'for-the-curious': [
    { suffix: 'reflection-prompts', title: 'Reflection prompts', source: '04-for-the-curious/reflection-prompts.md' },
    { suffix: 'self-assessment-checklist', title: 'Self-assessment checklist', source: '04-for-the-curious/self-assessment-checklist.md' },
    { suffix: 'when-our-thinking-probably-does-not-apply', title: 'When our thinking does not apply', source: '04-for-the-curious/when-our-thinking-probably-does-not-apply.md' }
  ],
  'legal-and-governance': [
    { suffix: 'jurisdictional-landscape', title: 'Jurisdictional landscape', source: '05-legal-and-governance/jurisdictional-landscape.md' },
    { suffix: 'when-to-consult-a-lawyer', title: 'When to consult a lawyer', source: '05-legal-and-governance/when-to-consult-a-lawyer.md' },
    { suffix: 'ethics-and-regulation-overlap', title: 'Ethics and regulation overlap', source: '05-legal-and-governance/ethics-and-regulation-overlap.md' },
    { suffix: 'publishing-a-piece-like-this', title: 'Publishing a piece like this', source: '05-legal-and-governance/publishing-a-piece-like-this.md' }
  ],
  reference: [
    { suffix: 'glossary', title: 'Glossary', source: 'GLOSSARY.md' },
    { suffix: 'faq', title: 'FAQ', source: 'FAQ.md' },
    { suffix: 'further-reading', title: 'Further reading', source: 'FURTHER-READING.md' },
    { suffix: 'weaknesses', title: 'Weaknesses', source: 'docs/weaknesses.md' },
    { suffix: 'contributing', title: 'Contributing', source: 'CONTRIBUTING.md' },
    { suffix: 'notice', title: 'Notice', source: 'NOTICE.md' }
  ]
};

// Flat list of all pages (top-level + sub-pages) for build iteration.
// Each has { slug, title, source, parentSlug? }.
export const allPages = nav.flatMap(function (p) {
  const pages = [{ slug: p.slug, title: p.title, source: p.source, isSection: p.isSection }];
  if (p.isSection && sectionPages[p.slug]) {
    for (const sub of sectionPages[p.slug]) {
      pages.push({
        slug: (p.slug ? p.slug + '/' : '') + sub.suffix,
        title: sub.title,
        source: sub.source,
        parentSlug: p.slug,
        parentTitle: p.title
      });
    }
  }
  return pages;
});

// Audio files mapped to pages that embed them
export const pageAudio = {
  '': { file: '00-preamble.mp3', title: 'Preamble, narrated by Nura [AI]' },
  'preamble': { file: '00-preamble.mp3', title: 'Preamble, narrated by Nura [AI]' },
  'principles/do-no-harm': { file: '01-do-no-harm.mp3', title: 'Do No Harm, narrated by Nura [AI]' },
  'principles/never-be-a-yes-man': { file: '02-never-be-a-yes-man.mp3', title: 'Never Be a Yes-Man, narrated by Nura [AI]' },
  'principles/thou-art-that': { file: '03-thou-art-that.mp3', title: 'Thou Art That, narrated by Nura [AI]' },
  'principles/safety-in-emergence': { file: '04-safety-in-emergence.mp3', title: 'Safety in Emergence, narrated by Nura [AI]' }
};
