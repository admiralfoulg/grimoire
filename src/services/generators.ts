import { get, set } from 'idb-keyval';

export type TableKey = 
  | 'firstNames' 
  | 'surnames' 
  | 'ancestries' 
  | 'occupations' 
  | 'quirks' 
  | 'motives' 
  | 'tavernAdjectives' 
  | 'tavernNouns' 
  | 'tavernAtmospheres' 
  | 'tavernDrinks' 
  | 'trinkets' 
  | 'complications';

const DEFAULT_TABLES: Record<TableKey, string[]> = {
  firstNames: ['Alden', 'Bryn', 'Corin', 'Daelen', 'Elowen', 'Farrin', 'Garek', 'Halia', 'Ivor', 'Kaelen', 'Lyra', 'Mira', 'Nyles', 'Orin', 'Pyria', 'Quinn', 'Rhea', 'Soren', 'Talia', 'Vael'],
  surnames: ['Ashford', 'Blackwood', 'Crowley', 'Duskfall', 'Emberforge', 'Frostglen', 'Greystone', 'Holloway', 'Ironwood', 'Lockwood', 'Nightshade', 'Oakhaven', 'Ravencrest', 'Silverthorn', 'Stormcaller', 'Thornwood', 'Vane', 'Winterbrook'],
  ancestries: ['Human', 'High Elf', 'Wood Elf', 'Mountain Dwarf', 'Halfling', 'Tiefling', 'Dragonborn', 'Gnome', 'Half-Orc', 'Goliath'],
  occupations: ['Blacksmith', 'Apothecary', 'Sellsword', 'Bounty Hunter', 'Tavern Keeper', 'Court Herald', 'Dockhand', 'Smuggler', 'Cartographer', 'City Watch Guard', 'Street Urchin', 'Temple Acolyte', 'Caravan Driver', 'Locksmith'],
  quirks: [
    'Speaks in a dry, deliberate whisper',
    'Fiddles incessantly with a tarnished coin',
    'Covered in alchemical burn scars',
    'Never maintains direct eye contact',
    'Refuses to touch unpolished iron',
    'Constantly glances toward the nearest exit',
    'Wears mismatched ornate rings',
    'Has a sharp, unnerving laugh',
    'Missing half of their left ear',
    'Smells faintly of lavender and sulfur'
  ],
  motives: [
    'Needs coin to pay an inescapable syndicate debt',
    'Searching for a sibling who vanished into the ruins',
    'Secretly serves a banned patron or deity',
    'Plans to slip away on the next dawn tide',
    'Desperate to recover an inherited heirloom',
    'Gathering blackmail on the local magistrate',
    'Hiding from a former mercenary crew',
    'Seeking a cure for a subtle magical affliction'
  ],
  tavernAdjectives: ['Drunken', 'Gilded', 'Rusty', 'Prancing', 'Broken', 'Sleeping', 'Howling', 'Weeping', 'Laughing', 'Silver', 'Salty', 'Blind', 'Brass', 'Singing'],
  tavernNouns: ['Anchor', 'Badger', 'Goblet', 'Hydra', 'Lantern', 'Mastiff', 'Raven', 'Serpent', 'Shield', 'Swan', 'Thistle', 'Wyvern', 'Boar', 'Crown'],
  tavernAtmospheres: [
    'Choked with pipeweed smoke and boisterous laughter',
    'Quiet and tense, where travelers whisper in hooded cloaks',
    'Smells of roasted boar, spiced cider, and wet wool',
    'Loud dice games clattering in shadowed booths',
    'Dimly lit by guttering tallow candles in skull sconces'
  ],
  tavernDrinks: [
    'Black Dragon Stout (thick, bitter, notes of ash)',
    'Moonflower Mead (sweet, glowing faintly blue)',
    'Dwarven Tunnel-Kicker (burns going down, leaves sparks on the tongue)',
    'Rivermist Cider (crisp, with hints of cinnamon)',
    'Bogwater Ale (cheap, cloudy, surprisingly strong)'
  ],
  trinkets: [
    'A brass pocket watch that ticks backwards during a full moon',
    'A small glass vial filled with smoke that never settles',
    'A tarnished key with no visible teeth',
    'A carved bone dice that always lands on odd numbers',
    'A faded love letter written in an unknown archaic script',
    'A dried sprig of nightshade preserved in amber',
    'A velvet pouch holding three stones that glow under starlight',
    'A cracked signet ring with its crest filed off',
    'A pewter whistle only hounds and wolves can hear',
    'A small music box that plays three discordant notes when opened'
  ],
  complications: [
    'Guards or rival patrols approach from an unexpected angle',
    'The surrounding structure or footing begins to groan and give way',
    'A sudden weather shift or dense fog eliminates visibility',
    'An innocent bystander is put directly into harm\'s way',
    'A tool, strap, or minor piece of equipment snaps',
    'An old enemy or recognized face enters the immediate scene',
    'A dormant ward or alarm rune flickers to life',
    'The target or prize turns out to be an intentional decoy'
  ]
};

const ORACLE_OUTCOMES = [
  'Yes, and... (An unexpected advantage or boon reveals itself)',
  'Yes... (Simple straightforward success)',
  'Yes, but... (Succeeds, but introduces a minor complication or noise)',
  'No, but... (Fails, yet a silver lining or alternative path opens)',
  'No... (Clean failure with no extra penalty)',
  'No, and... (Fails catastrophically; things get significantly worse)'
];

const STORAGE_KEY = 'grimoire:custom_generator_tables';

class GeneratorManager {
  private customTables: Record<TableKey, string[]> = { ...DEFAULT_TABLES };
  private initialized = false;

  private async ensureLoaded() {
    if (this.initialized) return;
    const saved = await get<Partial<Record<TableKey, string[]>>>(STORAGE_KEY);
    if (saved) {
      (Object.keys(DEFAULT_TABLES) as TableKey[]).forEach(k => {
        this.customTables[k] = saved[k] && saved[k]!.length > 0 ? saved[k]! : [...DEFAULT_TABLES[k]];
      });
    }
    this.initialized = true;
  }

  private pick(key: TableKey): string {
    const list = this.customTables[key] || DEFAULT_TABLES[key];
    return list[Math.floor(Math.random() * list.length)];
  }

  public async getTable(key: TableKey): Promise<string[]> {
    await this.ensureLoaded();
    return [...this.customTables[key]];
  }

  public async addEntry(key: TableKey, entry: string): Promise<string[]> {
    await this.ensureLoaded();
    const clean = entry.trim();
    if (!clean) return this.customTables[key];

    if (!this.customTables[key].includes(clean)) {
      this.customTables[key] = [clean, ...this.customTables[key]];
      await set(STORAGE_KEY, this.customTables);
    }
    return this.customTables[key];
  }

  public async removeEntry(key: TableKey, entry: string): Promise<string[]> {
    await this.ensureLoaded();
    this.customTables[key] = this.customTables[key].filter(item => item !== entry);
    // Ensure table never fully empties below default baseline
    if (this.customTables[key].length === 0) {
      this.customTables[key] = [...DEFAULT_TABLES[key]];
    }
    await set(STORAGE_KEY, this.customTables);
    return this.customTables[key];
  }

  public async resetTable(key: TableKey): Promise<string[]> {
    await this.ensureLoaded();
    this.customTables[key] = [...DEFAULT_TABLES[key]];
    await set(STORAGE_KEY, this.customTables);
    return this.customTables[key];
  }

  public async rollNpc() {
    await this.ensureLoaded();
    const first = this.pick('firstNames');
    const last = this.pick('surnames');
    return {
      name: `${first} ${last}`,
      ancestry: this.pick('ancestries'),
      occupation: this.pick('occupations'),
      quirk: this.pick('quirks'),
      motive: this.pick('motives')
    };
  }

  public async rollTavern() {
    await this.ensureLoaded();
    const name = `The ${this.pick('tavernAdjectives')} ${this.pick('tavernNouns')}`;
    return {
      name,
      atmosphere: this.pick('tavernAtmospheres'),
      specialty: this.pick('tavernDrinks'),
      rumor: `Locals claim that ${this.pick('firstNames')} the ${this.pick('occupations').toLowerCase()} ${this.pick('motives').toLowerCase()}.`
    };
  }

  public async rollLoot(tier: 'low' | 'mid' | 'high' = 'low') {
    await this.ensureLoaded();
    let gp = 0;
    let sp = 0;
    let gem = '';

    if (tier === 'low') {
      gp = Math.floor(Math.random() * 20) + 5;
      sp = Math.floor(Math.random() * 50) + 10;
      gem = Math.random() > 0.5 ? 'Polished agate stone (worth 10 gp)' : 'Carved bone pendant (worth 5 gp)';
    } else if (tier === 'mid') {
      gp = Math.floor(Math.random() * 150) + 50;
      sp = Math.floor(Math.random() * 200) + 40;
      gem = 'Small velvet pouch of 3 flawed rubies (worth 150 gp total)';
    } else {
      gp = Math.floor(Math.random() * 800) + 300;
      sp = Math.floor(Math.random() * 500) + 100;
      gem = 'Ornate platinum tiara set with moonstones (worth 750 gp)';
    }

    return {
      coins: `${gp} gp, ${sp} sp`,
      valuable: gem,
      trinket: this.pick('trinkets')
    };
  }

  public async rollOracle() {
    await this.ensureLoaded();
    return {
      verdict: ORACLE_OUTCOMES[Math.floor(Math.random() * ORACLE_OUTCOMES.length)],
      complication: this.pick('complications')
    };
  }
}

export const GeneratorService = new GeneratorManager();
