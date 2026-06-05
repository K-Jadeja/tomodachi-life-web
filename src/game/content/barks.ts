// Scripted barks. Short, in-character lines that Tomodachis say
// without using the LLM. Tagged by mood and situation so the AI can pick
// relevant ones when no LLM call is desired.

export type BarkContext =
  | 'idle'
  | 'walk'
  | 'hungry'
  | 'sleepy'
  | 'happy'
  | 'sad'
  | 'social'
  | 'morning'
  | 'day'
  | 'evening'
  | 'night'
  | 'beach'
  | 'cafe'
  | 'park'
  | 'apartment'
  | 'town'
  | 'greeting'
  | 'thinking'
  | 'eating'
  | 'giggle'
  | 'shock'
  | 'excuse'
  | 'excited'
  | 'angry'
  | 'walking'
  | 'talking'
  | 'sleeping'
  | 'sitting';

export interface Bark {
  text: string;
  contexts: BarkContext[];
}

export const BARKS: Bark[] = [
  { text: 'La la la~', contexts: ['idle', 'happy', 'morning'] },
  { text: 'Hmm, what to do…', contexts: ['idle', 'thinking'] },
  { text: 'Nice day, isn’t it?', contexts: ['idle', 'day', 'park', 'beach'] },
  { text: 'I’m bored…', contexts: ['idle', 'sad'] },
  { text: 'Whatcha doin’?', contexts: ['idle', 'social'] },
  { text: 'Today feels… wobbly.', contexts: ['idle', 'thinking'] },
  { text: 'Just vibing.', contexts: ['idle', 'happy'] },
  { text: 'Oh! A thought!', contexts: ['idle', 'thinking'] },
  { text: 'My shoes are squeaky.', contexts: ['idle', 'beach', 'town'] },
  { text: 'I like this spot.', contexts: ['idle', 'park', 'cafe'] },

  { text: 'Off we go!', contexts: ['walk', 'happy'] },
  { text: 'One foot, then the other.', contexts: ['walk', 'thinking'] },
  { text: 'Where am I going?', contexts: ['walk', 'idle'] },
  { text: 'Wheee~', contexts: ['walk', 'excited'] },

  { text: 'My tummy is rumbling…', contexts: ['hungry'] },
  { text: 'Got any snacks?', contexts: ['hungry', 'cafe'] },
  { text: 'Is it lunchtime yet?', contexts: ['hungry', 'day'] },
  { text: 'I could eat a whole cake.', contexts: ['hungry'] },

  { text: '*yawn*', contexts: ['sleepy', 'night'] },
  { text: 'My eyelids are heavy…', contexts: ['sleepy'] },
  { text: 'Just a quick nap…', contexts: ['sleepy', 'apartment'] },
  { text: 'Five more minutes…', contexts: ['sleepy'] },

  { text: 'This is the BEST!', contexts: ['happy', 'excited'] },
  { text: 'I love it here!', contexts: ['happy', 'park', 'beach', 'cafe'] },
  { text: 'Yay yay yay!', contexts: ['happy', 'excited'] },
  { text: 'I feel so light!', contexts: ['happy'] },

  { text: '…', contexts: ['sad'] },
  { text: 'Why is everything so loud?', contexts: ['sad', 'thinking'] },
  { text: 'I miss someone.', contexts: ['sad'] },
  { text: 'It’s too quiet.', contexts: ['sad', 'apartment'] },

  { text: 'Hi hi!', contexts: ['greeting', 'social'] },
  { text: 'Oh hey!', contexts: ['greeting'] },
  { text: 'Heeey, long time!', contexts: ['greeting', 'happy'] },
  { text: 'It’s you!', contexts: ['greeting'] },
  { text: 'You came!', contexts: ['greeting', 'excited'] },
  { text: 'We should hang out.', contexts: ['greeting', 'social'] },
  { text: 'Fancy meeting you here.', contexts: ['greeting', 'cafe', 'town'] },

  { text: 'Good morning!', contexts: ['morning'] },
  { text: 'Hello sunshine!', contexts: ['morning', 'happy'] },
  { text: 'Afternoon vibes.', contexts: ['day'] },
  { text: 'The light is so warm.', contexts: ['evening', 'beach', 'park'] },
  { text: 'It’s getting dark…', contexts: ['night'] },
  { text: 'Stars are coming out.', contexts: ['night', 'apartment', 'town'] },
  { text: 'I love nighttime.', contexts: ['night', 'happy'] },

  { text: 'I smell salt!', contexts: ['beach', 'happy'] },
  { text: 'Sandy toes!', contexts: ['beach'] },
  { text: 'Mmm, coffee.', contexts: ['cafe', 'happy'] },
  { text: 'One espresso please!', contexts: ['cafe', 'day'] },
  { text: 'Look at the trees!', contexts: ['park', 'happy'] },
  { text: 'Bench. Sit. Breathe.', contexts: ['park', 'thinking'] },
  { text: 'Hello neighbor!', contexts: ['apartment'] },
  { text: 'Home sweet home.', contexts: ['apartment', 'happy'] },
  { text: 'What a busy square!', contexts: ['town', 'excited'] },
  { text: 'So many shops!', contexts: ['town'] },

  { text: 'I wonder what the sea is doing.', contexts: ['thinking', 'beach'] },
  { text: 'I should call someone.', contexts: ['thinking'] },
  { text: 'What’s my purpose?', contexts: ['thinking', 'sad'] },
  { text: 'Today I will be kind.', contexts: ['thinking', 'happy'] },
  { text: 'Numbers are fun.', contexts: ['thinking'] },
  { text: 'Birds have secrets.', contexts: ['thinking', 'park'] },
  { text: 'I want to learn guitar.', contexts: ['thinking'] },
  { text: 'Pasta or rice?', contexts: ['thinking', 'hungry'] },
  { text: 'I think I left the stove on.', contexts: ['thinking', 'shock'] },

  { text: 'Hehe!', contexts: ['giggle', 'happy'] },
  { text: 'Pfft!', contexts: ['giggle'] },
  { text: 'Eek!', contexts: ['shock'] },
  { text: 'Wha—?!', contexts: ['shock'] },
  { text: 'Oops, sorry!', contexts: ['excuse'] },
  { text: 'My bad!', contexts: ['excuse'] },
  { text: 'Watch it!', contexts: ['excuse', 'angry'] },

  { text: 'Mmm, delicious!', contexts: ['eating', 'happy'] },
  { text: 'So tasty!', contexts: ['eating'] },
  { text: 'I’ll save some for later.', contexts: ['eating'] },
  { text: 'Yum yum!', contexts: ['eating', 'happy'] },
];

export function pickBark(
  contexts: BarkContext[],
  rng: () => number = Math.random
): string {
  const matches = BARKS.filter((b) => b.contexts.some((c) => contexts.includes(c)));
  if (matches.length === 0) {
    return BARKS[Math.floor(rng() * BARKS.length)].text;
  }
  return matches[Math.floor(rng() * matches.length)].text;
}
