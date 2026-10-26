import type { Intent } from '../../types';

const patterns: Array<{ regex: RegExp; intent: (m: RegExpMatchArray) => Intent }> = [
  {
    regex: /navigate to (.+)|take me to (.+)|go to (.+)|show me way to (.+)/i,
    intent: (m) => ({ type: 'navigate', destination: (m[1] || m[2] || m[3] || m[4]).trim() }),
  },
  {
    regex: /where am i|my location|where are we|current location/i,
    intent: () => ({ type: 'where_am_i' }),
  },
  {
    regex: /repeat|say again|what did you say|repeat instruction/i,
    intent: () => ({ type: 'repeat' }),
  },
  {
    regex: /how far|distance|how long|remaining distance/i,
    intent: () => ({ type: 'how_far' }),
  },
  {
    regex: /stop|cancel|exit navigation|end navigation/i,
    intent: () => ({ type: 'stop' }),
  },
  {
    regex: /help|what can (i|you) (say|do)|commands/i,
    intent: () => ({ type: 'help' }),
  },
  {
    regex: /what'?s around me|nearby|points? nearby|around here/i,
    intent: () => ({ type: 'whats_around' }),
  },
];

export function parseIntent(text: string): Intent {
  if (!text) return { type: 'unknown' };
  const normalized = text.toLowerCase().trim();
  for (const { regex, intent } of patterns) {
    const match = normalized.match(regex);
    if (match) return intent(match);
  }
  return { type: 'unknown' };
}
