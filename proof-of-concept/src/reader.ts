import type { Passage } from './model.ts';

export const NOTCHES = ['P', 'F1', 'F2', 'F3'] as const;
export type Notch = typeof NOTCHES[number];
export type ReaderView = 'focused' | 'manual';
export type ContextLayout = 'replace' | 'alongside';
export type FocusUnit = 'word' | 'phrase';
export type ScrollUpBehavior = 'pause' | 'step';

export interface SpeedSettings {
  F1: number;
  F2: number;
  F3: number;
}

export interface ReaderState {
  cursor: number;
  notch: Notch;
  view: ReaderView;
  layout: ContextLayout;
  unit: FocusUnit;
  scrollUp: ScrollUpBehavior;
  speeds: SpeedSettings;
}

export const DEFAULT_SPEEDS: SpeedSettings = { F1: 180, F2: 280, F3: 420 };

export function initialState(): ReaderState {
  return {
    cursor: 0,
    notch: 'P',
    view: 'focused',
    layout: 'replace',
    unit: 'word',
    scrollUp: 'pause',
    speeds: { ...DEFAULT_SPEEDS },
  };
}

export function selectNotch(state: ReaderState, notch: Notch): ReaderState {
  return { ...state, notch };
}

export function presentationFor(state: ReaderState): 'manual' | 'context' | 'strip' | 'word' | 'phrase' {
  if (state.view === 'manual') return 'manual';
  if (state.notch === 'P' || state.notch === 'F1') return 'context';
  if (state.notch === 'F2') return 'strip';
  return state.unit;
}

export function applyWheel(state: ReaderState, deltaY: number, lines: number[][] = []): ReaderState {
  if (!Number.isFinite(deltaY) || deltaY === 0) return state;
  const focused: ReaderState = { ...state, view: 'focused' };
  if (deltaY < 0) {
    if (state.scrollUp === 'step' && state.notch !== 'P') {
      return selectNotch(focused, NOTCHES[NOTCHES.indexOf(state.notch) - 1]);
    }
    return stepPreviousLine(focused, lines);
  }
  const next = Math.min(NOTCHES.length - 1, NOTCHES.indexOf(state.notch) + 1);
  return selectNotch(focused, NOTCHES[next]);
}

export function stepWord(state: ReaderState, count: number, wordCount: number): ReaderState {
  if (!wordCount) return selectNotch(state, 'P');
  const next = state.cursor + count;
  if (next < 0 || next >= wordCount) return selectNotch(state, 'P');
  return { ...state, cursor: next };
}

export function stepPreviousLine(state: ReaderState, lines: number[][]): ReaderState {
  const lineIndex = lines.findIndex((line) => line.includes(state.cursor));
  const cursor = lineIndex < 0 ? state.cursor : lines[Math.max(0, lineIndex - 1)][0];
  return { ...state, notch: 'P', cursor };
}

export function phraseEndIndex(passage: Passage, first: number): number {
  const sentence = passage.words[first].sentenceIndex;
  let last = first;
  while (last + 1 < passage.words.length && last < first + 2 && passage.words[last + 1].sentenceIndex === sentence) last++;
  return last;
}

export function playbackEndIndex(state: ReaderState, passage: Passage): number {
  return state.notch === 'F3' && state.unit === 'phrase' ? phraseEndIndex(passage, state.cursor) : state.cursor;
}

export function delayFor(state: ReaderState, passage: Passage): number {
  const notch = state.notch;
  if (notch === 'P') return Infinity;
  const base = 60000 / state.speeds[notch];
  const pause = passage.words[state.cursor]?.pauseAfter;
  return base + (pause === 'paragraph' ? 420 : pause === 'sentence' ? 260 : pause === 'clause' ? 160 : pause === 'comma' ? 90 : 0);
}
