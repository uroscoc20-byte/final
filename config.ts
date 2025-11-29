// Role IDs
export const ROLE_IDS = {
  ADMIN: "1345073680610496602",
  STAFF: "1374821509268373686",
  HELPER: "1392803882115010734",
};

// Channel/Category IDs
export const CHANNEL_IDS = {
  TICKET_PANEL: "1358536986679443496",
  RULES: "1395830522877579304",
  VERIFICATION_CATEGORY: "1351864881585852479",
  TICKETS_CATEGORY: "1357314571525816442",
};

// Custom emoji for ticket buttons
export const CUSTOM_EMOJI = "<:URE:1429522388395233331>";

// Category metadata with descriptions
export const CATEGORY_METADATA: Record<string, { description: string; prefix: string }> = {
  "UltraSpeaker Express": {
    description: "The First Speaker",
    prefix: "UltraSpeaker",
  },
  "Ultra Gramiel Express": {
    description: "Ultra Gramiel",
    prefix: "UltraGramiel",
  },
  "Daily 4-Man Express": {
    description: "Daily 4-Man Ultra Bosses",
    prefix: "4Man",
  },
  "Daily 7-Man Express": {
    description: "Daily 7-Man Ultra Bosses",
    prefix: "7Man",
  },
  "Weekly Ultra Express": {
    description: "Weekly Ultra Bosses (excluding speaker, grim and gramiel)",
    prefix: "Weekly",
  },
  "GrimChallenge Express": {
    description: "Mechabinky & Raxborg 2.0",
    prefix: "GrimChallenge",
  },
  "Daily Temple Express": {
    description: "Daily TempleShrine",
    prefix: "TempleShrine",
  },
};

export const HELPER_SLOTS: Record<string, number> = {
  "GrimChallenge Express": 6,
  "Daily 7-Man Express": 6,
  "Weekly Ultra Express": 6,
  "UltraSpeaker Express": 3,
  "Ultra Gramiel Express": 3,
  "Daily 4-Man Express": 3,
  "Daily Temple Express": 3,
};

export const POINT_VALUES: Record<string, number> = {
  "GrimChallenge Express": 10,
  "UltraSpeaker Express": 8,
  "Weekly Ultra Express": 12,
  "Daily 7-Man Express": 10,
  "Daily 4-Man Express": 4,
  "Daily Temple Express": 6,
  "Ultra Gramiel Express": 7,
};

// Order of categories in the panel
export const CATEGORIES = [
  "UltraSpeaker Express",
  "Ultra Gramiel Express",
  "Daily 4-Man Express",
  "Daily 7-Man Express",
  "Weekly Ultra Express",
  "GrimChallenge Express",
  "Daily Temple Express",
];

export const CATEGORY_CHANNEL_PREFIX: Record<string, string> = {
  "UltraSpeaker Express": "UltraSpeaker",
  "Ultra Gramiel Express": "UltraGramiel",
  "GrimChallenge Express": "GrimChallenge",
  "Daily Temple Express": "TempleShrine",
  "Daily 4-Man Express": "4Man",
  "Daily 7-Man Express": "7Man",
  "Weekly Ultra Express": "Weekly",
};

export const DAILY_4MAN_BOSSES = [
  "UltraEzrajal",
  "UltraWarden",
  "UltraEngineer",
  "UltraTyndarius",
  "UltraDage",
  "UltraIara",
  "UltraKala",
];

export const DAILY_7MAN_BOSSES: Record<string, string[]> = {
  "Astralshrine": ["Astralshrine"],
  "KathoolDepths": ["KathoolDepths"],
  "Originul": ["VoidFlibbi", "VoidNightbane", "VoidXyfrag"],
  "ApexAzalith": ["ApexAzalith"],
  "Lich Lord/Beast/Deimos": ["LichLord"],
  "Lavarockshore": ["Lavarockshore"],
};

export const WEEKLY_ULTRA_BOSSES = [
  "UltraDarkon",
  "ChampionDrakath",
  "UltraDage",
  "UltraNulgath",
  "UltraDrago",
];

export const COLORS = {
  PRIMARY: 0x5865f2,
  SUCCESS: 0x57f287,
  WARNING: 0xfee75c,
  DANGER: 0xed4245,
  GOLD: 0xffd700,
};

export const HARDCODED_COMMANDS = {
  proof: {
    text: "📸 **Proof Submission Guidelines**\n\nPlease attach your proof here:\n• Screenshot of completion\n• Video recording\n• Game logs\n\n⚠️ Make sure the proof clearly shows the activity was completed.",
    image: null as string | null,
  },
  rrules: {
    text: `📜 **Runner Rules**\n\nPlease check <#${CHANNEL_IDS.RULES}> for the complete runner rules and guidelines.`,
    image: null as string | null,
  },
  hrules: {
    text: `📜 **Helper Rules**\n\nPlease check <#${CHANNEL_IDS.RULES}> for the complete helper rules and guidelines.`,
    image: null as string | null,
  },
};
