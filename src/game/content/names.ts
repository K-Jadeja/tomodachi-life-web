// Random name generator. Bias toward short, friendly, distinct syllables.

const FIRST_SYLLABLES = [
  'Aki', 'Ari', 'Bun', 'Cho', 'Da', 'Ei', 'Fum', 'Gin', 'Ha', 'Iku',
  'Jun', 'Kai', 'Lum', 'Mio', 'Nao', 'Olu', 'Pip', 'Qin', 'Ren', 'Su',
  'Tsu', 'Umi', 'Vio', 'Wen', 'Yu', 'Yum', 'Zen', 'Riku', 'Sho', 'Tama',
  'Hana', 'Yuki', 'Sora', 'Mika', 'Rin', 'Niko', 'Koko', 'Momo', 'Yui', 'Aya',
];

const LAST_SYLLABLES = [
  'maru', 'chan', 'taro', 'bei', 'lin', 'ko', 'ka', 'mi', 'na', 'ru',
  'suke', 'chi', 'tan', 'lani', 'tama', 'hime', 'no', 'to', 'ta', 'ku',
  'ni', 're', 'ha', 'ke', 'sa', 'mu', 'yo', 'ya', 'mo', 'ro',
];

const FIRST_NAMES = [
  'Akira', 'Bean', 'Chibi', 'Dango', 'Echo', 'Frodo', 'Goma', 'Han', 'Iro',
  'Jiji', 'Kumo', 'Lumi', 'Mimi', 'Nori', 'Oki', 'Pocky', 'Q', 'Riku',
  'Sora', 'Tama', 'Ume', 'Vivi', 'Wally', 'Yuki', 'Zuzu', 'Mika', 'Ren',
  'Hana', 'Taro', 'Jiro', 'Kira', 'Lulu', 'Niko', 'Pico', 'Suzu', 'Toto',
  'Yumi', 'Akane', 'Botan', 'Kiki', 'Lala',
];

const LAST_NAMES = [
  'Maru', 'Chan', 'Bear', 'Panda', 'Bun', 'Cat', 'Mochi', 'Star',
  'Drop', 'Sun', 'Moon', 'Sky', 'Wave', 'Note', 'Bean', 'Cloud',
  'Puff', 'Dumpling', 'Noodle', 'Pickle', 'Peach', 'Berry', 'Mint',
  'Tofu', 'Bento', 'Tea', 'Roll', 'Sushi', 'Wagashi',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(): number {
  return Math.random();
}

export function randomFirstName(): string {
  if (rand() < 0.45) {
    return pick(FIRST_NAMES);
  }
  return pick(FIRST_SYLLABLES) + pick(LAST_SYLLABLES);
}

export function randomFullName(): string {
  if (rand() < 0.5) {
    return randomFirstName();
  }
  return randomFirstName() + ' ' + pick(LAST_NAMES);
}

export function randomName(seed?: number): string {
  if (seed != null) {
    const r = mulberry32(seed >>> 0);
    const a = FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)];
    const b = LAST_NAMES[Math.floor(r() * LAST_NAMES.length)];
    return rand() < 0.5 ? a : `${a} ${b}`;
  }
  return randomFullName();
}

function mulberry32(a: number) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
