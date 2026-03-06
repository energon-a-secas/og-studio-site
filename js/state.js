export const W = 1200;
export const H = 630;

export const sites = [
  { id: 'neorgon',          title: 'Neorgon',              subtitle: 'Developer Tools Hub',                accent: '#818cf8', domain: 'neorgon.com' },
  { id: 'skill-roadmap',    title: 'Skill Roadmap',        subtitle: 'Visual Learning Path Builder',       accent: '#a78bfa', domain: 'skillmap.neorgon.com' },
  { id: 'infra-drills',     title: 'Infra Drills',         subtitle: 'Break-Fix Challenges',               accent: '#fbbf24', domain: 'infradrills.neorgon.com' },
  { id: 'json-studio',      title: 'JSON Studio',          subtitle: 'Visual Block Editor',                accent: '#2dd4bf', domain: 'jsonstudio.neorgon.com' },
  { id: 'client-says',      title: 'Client Says',          subtitle: 'Timezone Converter',                 accent: '#f472b6', domain: 'clientsays.neorgon.com' },
  { id: 'decision-wheel',   title: 'Decision Wheel',       subtitle: 'Spin to Decide',                     accent: '#34d399', domain: 'decisionwheel.neorgon.com' },
  { id: 'reference-matrix', title: 'Reference Matrix',     subtitle: 'Cultural References API',            accent: '#f472b6', domain: 'references.neorgon.com' },
  { id: 'presentation-sage',title: 'Presentation Sage',    subtitle: 'YAML Slide Editor',                  accent: '#fb923c', domain: 'slides.neorgon.com' },
  { id: 'emoji-archive',    title: 'Emoji Archive',        subtitle: 'Slack Emoji Collection',             accent: '#22d3ee', domain: 'emojis.neorgon.com' },
  { id: 'pathfinder',       title: 'Pathfinder',           subtitle: 'Visual Strategy Canvas',             accent: '#4ade80', domain: 'pathfinder.neorgon.com' },
  { id: 'meme-vault',       title: 'Meme Vault',           subtitle: 'Browse and Vote on Memes',           accent: '#f43f5e', domain: 'memes.neorgon.com' },
  { id: 'og-studio',        title: 'OG Studio',            subtitle: 'Social Preview Generator',           accent: '#a3e635', domain: 'ogstudio.neorgon.com' },
  { id: 'vibe-check',       title: 'Vibe Check',           subtitle: 'Behavioral Interview Scorecard',     accent: '#38bdf8', domain: 'interviews.neorgon.com' },
  { id: 'character-sheet',  title: 'Character Sheet',      subtitle: 'RPG Personality Interview',          accent: '#e879f9', domain: 'charactersheet.neorgon.com' },
  { id: 'autopilot',        title: 'Autopilot',            subtitle: 'Idle Schedule Builder',              accent: '#22d3ee', domain: 'autopilot.neorgon.com' },
  { id: 'rush-q-cards',     title: 'Rush Q Cards',         subtitle: 'Corporate Strategy Card Game',       accent: '#0080ff', domain: '' },
];

export const gradientPresets = [
  { name: 'Neorgon',     stops: [{ pos: 0, color: '#B015B0' }, { pos: 0.45, color: '#3D0080' }, { pos: 1, color: '#040714' }] },
  { name: 'Ocean',       stops: [{ pos: 0, color: '#0077b6' }, { pos: 0.5, color: '#023e8a' }, { pos: 1, color: '#03045e' }] },
  { name: 'Sunset',      stops: [{ pos: 0, color: '#f72585' }, { pos: 0.5, color: '#7209b7' }, { pos: 1, color: '#3a0ca3' }] },
  { name: 'Forest',      stops: [{ pos: 0, color: '#2d6a4f' }, { pos: 0.5, color: '#1b4332' }, { pos: 1, color: '#081c15' }] },
  { name: 'Fire',        stops: [{ pos: 0, color: '#ff6b35' }, { pos: 0.5, color: '#d00000' }, { pos: 1, color: '#370617' }] },
  { name: 'Arctic',      stops: [{ pos: 0, color: '#48cae4' }, { pos: 0.5, color: '#0077b6' }, { pos: 1, color: '#001233' }] },
  { name: 'Midnight',    stops: [{ pos: 0, color: '#4361ee' }, { pos: 0.5, color: '#3a0ca3' }, { pos: 1, color: '#10002b' }] },
  { name: 'Ember',       stops: [{ pos: 0, color: '#ffd60a' }, { pos: 0.5, color: '#e85d04' }, { pos: 1, color: '#370617' }] },
];

export const patternList = [
  { id: 'constellation', name: 'Constellation' },
  { id: 'dots',          name: 'Dot Grid' },
  { id: 'circuits',      name: 'Circuits' },
  { id: 'waves',         name: 'Waves' },
  { id: 'hexgrid',       name: 'Hex Grid' },
  { id: 'diagonal',      name: 'Diagonal' },
  { id: 'radial',        name: 'Radial' },
  { id: 'noise',         name: 'Noise' },
  { id: 'none',          name: 'None' },
];

export const state = {
  activeTab: 'gallery',
  galleryPattern: 'constellation',
  galleryDensity: 'medium',
  canvases: {},
  custom: {
    title: 'My Project',
    subtitle: 'A short description',
    accent: '#0080ff',
    pattern: 'constellation',
    density: 'medium',
    gradientIndex: 0,
    fontSize: 64,
    showBranding: true,
    brandingText: 'neorgon.com',
  },
};
