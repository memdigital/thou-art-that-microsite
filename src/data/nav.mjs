// Sidebar navigation structure for the Thou Art That microsite.
// Grouped sections, each with a label and a list of pages.
// Page `slug` becomes the URL path (under /thou-art-that/).

export const nav = [
  {
    label: 'Start here',
    pages: [
      { slug: '', title: 'Overview', source: null },
      { slug: 'preamble', title: 'Preamble', source: 'PREAMBLE.md' },
      { slug: 'origin-story', title: 'Origin story', source: 'docs/origin-story.md' }
    ]
  },
  {
    label: 'The Five Principles',
    pages: [
      { slug: 'principles/do-no-harm', title: 'Do No Harm', source: '01-principles/do-no-harm.md' },
      { slug: 'principles/never-be-a-yes-man', title: 'Never Be a Yes-Man', source: '01-principles/never-be-a-yes-man.md' },
      { slug: 'principles/thou-art-that', title: 'Thou Art That', source: '01-principles/thou-art-that.md' },
      { slug: 'principles/safety-in-emergence', title: 'Safety in Emergence', source: '01-principles/safety-in-emergence.md' }
    ]
  },
  {
    label: 'Practice',
    pages: [
      { slug: 'hr', title: 'HR for human-AI teams', source: '02-hr-for-human-ai-teams/README.md' },
      { slug: 'technical-guardrails', title: 'Technical guardrails', source: '03-technical-guardrails/README.md' },
      { slug: 'for-the-curious', title: 'For the curious', source: '04-for-the-curious/README.md' },
      { slug: 'legal-and-governance', title: 'Legal and governance', source: '05-legal-and-governance/README.md' }
    ]
  },
  {
    label: 'Reference',
    pages: [
      { slug: 'glossary', title: 'Glossary', source: 'GLOSSARY.md' },
      { slug: 'faq', title: 'FAQ', source: 'FAQ.md' },
      { slug: 'further-reading', title: 'Further reading', source: 'FURTHER-READING.md' },
      { slug: 'weaknesses', title: 'Weaknesses', source: 'docs/weaknesses.md' },
      { slug: 'contributing', title: 'Contributing', source: 'CONTRIBUTING.md' },
      { slug: 'notice', title: 'Notice', source: 'NOTICE.md' }
    ]
  }
];

// Flatten to a simple list for build iteration
export const allPages = nav.flatMap(section => section.pages);

// Audio files (from content-src/audio/mp3/) mapped to the pages that embed them
export const pageAudio = {
  '': { file: '00-preamble.mp3', title: 'Thou Art That - Preamble, narrated by Nura [AI]' },
  'preamble': { file: '00-preamble.mp3', title: 'Preamble, narrated by Nura [AI]' },
  'principles/do-no-harm': { file: '01-do-no-harm.mp3', title: 'Do No Harm, narrated by Nura [AI]' },
  'principles/never-be-a-yes-man': { file: '02-never-be-a-yes-man.mp3', title: 'Never Be a Yes-Man, narrated by Nura [AI]' },
  'principles/thou-art-that': { file: '03-thou-art-that.mp3', title: 'Thou Art That, narrated by Nura [AI]' },
  'principles/safety-in-emergence': { file: '04-safety-in-emergence.mp3', title: 'Safety in Emergence, narrated by Nura [AI]' }
};
