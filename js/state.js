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
  { id: 'snippets',          title: 'Snippets',             subtitle: 'Search, Copy, Ship',                 accent: '#10b981', domain: 'snippets.neorgon.com' },
  { id: 'guild-hall',        title: 'Guild Hall',           subtitle: 'Quest Board',                        accent: '#ef4444', domain: 'guildhall.neorgon.com' },
  { id: 'parla',             title: 'Parla',                subtitle: 'Latin American Slang Translator',    accent: '#f97316', domain: 'parla.neorgon.com' },
  { id: 'anatomy',           title: 'Anatomy',              subtitle: 'UI Component Explorer',              accent: '#f97316', domain: 'anatomy.neorgon.com' },
  { id: 'agent-lore',          title: 'Agent Lore',              subtitle: 'Small Tutorials',                accent: '#67e8f9', domain: 'agentlore.neorgon.com' },
  { id: 'buy-hacks',           title: 'Buy Hacks',               subtitle: 'Shopping Tips',                  accent: '#f59e0b', domain: 'buyhacks.neorgon.com' },
  { id: 'team-play',           title: 'Team Play',             subtitle: 'Games & Activities for Teams',   accent: '#0d9488', domain: 'teamplay.neorgon.com' },
  { id: 'playbook',            title: 'Playbook',              subtitle: 'Career Advice for Tech',         accent: '#10b981', domain: 'playbook.neorgon.com' },
  { id: 'gamebin',             title: 'GameBin',               subtitle: 'Curate & Share Game Lists',      accent: '#0063e5', domain: 'gamebin.neorgon.com' },
  { id: 'lockdown',            title: 'Lockdown',              subtitle: 'Site Security Scanner',          accent: '#f97316', domain: 'lockdown.neorgon.com' },
  { id: 'resume-forge',        title: 'Resume Forge',          subtitle: 'Gaming-Inspired Resume Builder', accent: '#8b5cf6', domain: 'resume.neorgon.com' },
  { id: 'safeguard',           title: 'SafeGuard',             subtitle: 'Security Hardening Guides',      accent: '#f87171', domain: 'safeguard.neorgon.com' },
  { id: 'awesome-sites',       title: 'Awesome Sites',         subtitle: 'Curated External Tabs',          accent: '#f97316', domain: 'awesomesites.neorgon.com' },
  { id: 'incident-runbook',    title: 'Incident Runbook',      subtitle: 'Alert to Response Plan',         accent: '#ec4899', domain: 'runbook.neorgon.com' },
  { id: 'prompt-forge',        title: 'Prompt Forge',          subtitle: 'Character Prompts & Image Tags', accent: '#db2777', domain: 'promptforge.neorgon.com' },
  { id: 'hiring-pack',         title: 'Hiring Pack',           subtitle: 'Scorecard to Decision',          accent: '#34d399', domain: 'hiringpack.neorgon.com' },
  { id: 'questline',           title: 'Questline',             subtitle: 'Operating Model Game Console',   accent: '#2aa8ff', domain: 'questline.neorgon.com' },
  { id: 'fitprofile',          title: 'FitProfile',          subtitle: 'Measurements & Size Tracker',    accent: '#14b8a6', domain: 'fitprofile.neorgon.com' },
  { id: 'failsafe',            title: 'Failsafe',            subtitle: 'Emergency Protocol Builder',     accent: '#6ee7b7', domain: 'failsafe.neorgon.com' },
  { id: 'briefcard',           title: 'BriefCard',           subtitle: 'Battle Card Builder',            accent: '#0063e5', domain: 'briefcard.neorgon.com' },
  { id: 'stackrank',           title: 'Stack Rank',          subtitle: 'Shared Priority Lists',          accent: '#f59e0b', domain: 'stackrank.neorgon.com' },
  { id: 'tubestack',           title: 'TubeStack',           subtitle: 'Engineering YouTube Discovery',  accent: '#67e8f9', domain: 'tubestack.neorgon.com' },
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

export const layoutPresets = {
  center: {
    name: 'Center',
    title: { x: W / 2, y: H / 2 - 40, align: 'center', maxWidth: W * 0.82 },
    subtitle: { x: W / 2, y: H / 2 + 55, align: 'center', maxWidth: W * 0.72 },
    showLine: true,
    lineY: H / 2 + 8,
    branding: 'bottom-right',
  },
  left: {
    name: 'Left',
    title: { x: 80, y: H / 2 - 36, align: 'left', maxWidth: W * 0.48 },
    subtitle: { x: 80, y: H / 2 + 44, align: 'left', maxWidth: W * 0.46 },
    showLine: true,
    lineX: 80, lineY: H / 2 + 4, lineW: 120,
    branding: 'bottom-left',
    glassPanel: { x: 56, y: H / 2 - 130, w: W * 0.52 + 48, h: 260, r: 22 },
  },
  bottom: {
    name: 'Bottom',
    title: { x: W / 2, y: H - 176, align: 'center', maxWidth: W * 0.86 },
    subtitle: { x: W / 2, y: H - 100, align: 'center', maxWidth: W * 0.78 },
    showLine: false,
    branding: 'bottom-right',
    fontSizeMultiplier: 1.12,
    glassPanel: { x: 56, y: H - 236, w: W - 112, h: 196, r: 22 },
  },
  topBadge: {
    name: 'Top Badge',
    title: { x: 74, y: 104, align: 'left', maxWidth: W * 0.62 },
    subtitle: { x: 74, y: 168, align: 'left', maxWidth: W * 0.58 },
    showLine: false,
    branding: 'bottom-right',
    glassPanel: { x: 48, y: 48, w: W * 0.66, h: 156, r: 20 },
  },
  split: {
    name: 'Split',
    title: { x: 70, y: H / 2 - 52, align: 'left', maxWidth: W * 0.44 },
    subtitle: { x: W - 70, y: H / 2 + 52, align: 'right', maxWidth: W * 0.44 },
    showLine: true,
    lineX: W / 2, lineY1: H / 2 - 80, lineY2: H / 2 + 80,
    branding: 'bottom-center',
    glassPanel: { x: 48, y: 48, w: W - 96, h: H - 96, r: 24 },
  },
};

export const logoPositions = [
  { id: 'top-left',     label: 'TL', x: 48,  y: 48 },
  { id: 'top-center',   label: 'TC', x: W/2, y: 48 },
  { id: 'top-right',    label: 'TR', x: W-48, y: 48 },
  { id: 'middle-left',  label: 'ML', x: 48,  y: H/2 },
  { id: 'middle-center',label: 'MC', x: W/2, y: H/2 },
  { id: 'middle-right', label: 'MR', x: W-48, y: H/2 },
  { id: 'bottom-left',  label: 'BL', x: 48,  y: H-48 },
  { id: 'bottom-center',label: 'BC', x: W/2, y: H-48 },
  { id: 'bottom-right', label: 'BR', x: W-48, y: H-48 },
  { id: 'custom',       label: 'Custom', x: 0, y: 0 },
];

export const brandingPositions = [
  { id: 'bottom-right',  label: 'Bottom right' },
  { id: 'bottom-left',   label: 'Bottom left' },
  { id: 'bottom-center', label: 'Bottom center' },
  { id: 'top-right',     label: 'Top right' },
  { id: 'top-left',      label: 'Top left' },
  { id: 'top-center',    label: 'Top center' },
];

export function createDefaultCustom() {
  return {
    title: 'My Project',
    subtitle: 'A short description',
    accent: '#0080ff',
    pattern: 'constellation',
    density: 'medium',
    background: {
      type: 'gradient',
      gradientIndex: 0,
      customGradient: {
        angle: 135,
        stops: [{ pos: 0, color: '#B015B0' }, { pos: 0.45, color: '#3D0080' }, { pos: 1, color: '#040714' }],
      },
      solidColor: '#040714',
    },
    layout: 'center',
    fontSize: 96,
    textAlign: 'center',
    titleWeight: 700,
    subtitleWeight: 500,
    letterSpacing: 0,
    lineHeight: 1.22,
    glowIntensity: 0.5,
    showBranding: true,
    brandingText: 'neorgon.com',
    brandingPosition: 'bottom-right',
    logo: {
      src: '',
      x: W - 48,
      y: H - 48,
      scale: 0.75,
      opacity: 0.7,
      rotation: 0,
      position: 'bottom-right',
      tint: false,
      shadow: true,
    },
    showBadge: true,
    effects: {
      vignette: 0.35,
      grain: 0,
      glassPanel: false,
    },
  };
}

function clone(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

export function resolveBackground(custom) {
  const bg = custom.background;
  if (!bg || bg.type === 'solid') {
    return { type: 'solid', solidColor: bg?.solidColor || '#040714' };
  }
  if (bg.gradientIndex === -1 || bg.gradientIndex === 'custom') {
    return { type: 'gradient', angle: bg.customGradient?.angle ?? 135, stops: bg.customGradient?.stops ?? gradientPresets[0].stops };
  }
  const preset = gradientPresets[bg.gradientIndex] || gradientPresets[0];
  return { type: 'gradient', angle: 135, stops: preset.stops };
}

export function serializeCustom(custom) {
  let payload = custom;
  const json = JSON.stringify(payload);
  if (json.length > 24000 && payload.logo?.src) {
    payload = { ...payload, logo: { ...payload.logo, src: '' } };
  }
  const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function deserializeCustom(hash) {
  try {
    const base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const json = decodeURIComponent(escape(atob(padded)));
    const parsed = JSON.parse(json);
    return parsed;
  } catch (e) {
    return null;
  }
}

export const state = {
  activeTab: 'gallery',
  galleryPattern: 'constellation',
  galleryDensity: 'medium',
  canvases: {},
  custom: createDefaultCustom(),
  galleryLogo: {
    src: 'assets/watermark-logo.png',
    scale: 0.6,
    opacity: 0.65,
    rotation: 0,
    position: 'bottom-right',
    tint: false,
    shadow: true,
  },
  history: [],
  historyIndex: -1,
};

export function pushHistory() {
  const snap = clone(state.custom);
  if (state.historyIndex >= 0 && JSON.stringify(state.history[state.historyIndex]) === JSON.stringify(snap)) {
    return;
  }
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snap);
  if (state.history.length > 40) state.history.shift();
  else state.historyIndex++;
}

export function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    state.custom = clone(state.history[state.historyIndex]);
    return true;
  }
  return false;
}

export function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    state.custom = clone(state.history[state.historyIndex]);
    return true;
  }
  return false;
}

if (typeof window !== 'undefined') {
  pushHistory();
}
