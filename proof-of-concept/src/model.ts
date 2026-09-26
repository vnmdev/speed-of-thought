export interface WordToken {
  index: number;
  text: string;
  start: number;
  end: number;
  sentenceIndex: number;
  paragraphIndex: number;
  pauseAfter: 'none' | 'comma' | 'clause' | 'sentence' | 'paragraph';
}

export interface Passage {
  source: string;
  words: WordToken[];
}

export function parsePassage(source: string): Passage {
  const sentenceSegments = [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(source)];
  const paragraphBreaks = [...source.matchAll(/\n+/g)].map((match) => (match.index ?? 0) + match[0].length);
  let sentenceIndex = 0;
  let paragraphIndex = 0;
  const words: WordToken[] = [];

  for (const segment of new Intl.Segmenter('en', { granularity: 'word' }).segment(source)) {
    if (!segment.isWordLike) continue;
    while (
      sentenceIndex + 1 < sentenceSegments.length &&
      segment.index >= sentenceSegments[sentenceIndex + 1].index
    ) sentenceIndex++;
    while (paragraphIndex < paragraphBreaks.length && segment.index >= paragraphBreaks[paragraphIndex]) {
      paragraphIndex++;
    }
    words.push({
      index: words.length,
      text: segment.segment,
      start: segment.index,
      end: segment.index + segment.segment.length,
      sentenceIndex,
      paragraphIndex,
      pauseAfter: 'none',
    });
  }

  for (let index = 0; index < words.length - 1; index++) {
    const current = words[index];
    const next = words[index + 1];
    const between = source.slice(current.end, next.start);
    if (next.paragraphIndex !== current.paragraphIndex) current.pauseAfter = 'paragraph';
    else if (next.sentenceIndex !== current.sentenceIndex || /[.!?]/.test(between)) current.pauseAfter = 'sentence';
    else if (/[;:]/.test(between)) current.pauseAfter = 'clause';
    else if (/,/.test(between)) current.pauseAfter = 'comma';
  }

  return { source, words };
}
