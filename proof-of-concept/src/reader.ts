import type { Passage } from './model.ts';

export const NOTCHES = ['R2', 'R1', 'P', 'F1', 'F2', 'F3'] as const;
export type Notch = typeof NOTCHES[number];
export type ControlScheme = 'held' | 'latched' | 'wheel';
export type ReaderView = 'focused' | 'manual';
export type RecoveryLayout = 'replace' | 'alongside';
export type FocusUnit = 'word' | 'phrase';

export interface SpeedSettings {
  R2: number;
  R1: number;
  F1: number;
  F2: number;
  F3: number;
}

export interface ReaderState {
  cursor: number;
  notch: Notch;
  lastForward: 'F1' | 'F2' | 'F3';
  view: ReaderView;
  scheme: ControlScheme;
  layout: RecoveryLayout;
  unit: FocusUnit;
  speeds: SpeedSettings;
}

export const DEFAULT_SPEEDS: SpeedSettings = { R2: 1, R1: 220, F1: 180, F2: 280, F3: 420 };

export function initialState(): ReaderState {
  return {
    cursor: 0,
    notch: 'P',
    lastForward: 'F2',
    view: 'focused',
    scheme: 'latched',
    layout: 'replace',
    unit: 'word',
    speeds: { ...DEFAULT_SPEEDS },
  };
}

export function selectNotch(state: ReaderState, notch: Notch): ReaderState {
  return { ...state, notch, lastForward: notch.startsWith('F') ? notch as ReaderState['lastForward'] : state.lastForward };
}

export function shiftNotch(state: ReaderState, by: number): ReaderState {
  const next = Math.max(0, Math.min(NOTCHES.length - 1, NOTCHES.indexOf(state.notch) + by));
  return selectNotch(state, NOTCHES[next]);
}

export function stepWord(state: ReaderState, count: number, wordCount: number): ReaderState {
  if (!wordCount) return selectNotch(state, 'P');
  const next = state.cursor + count;
  if (next < 0 || next >= wordCount) return selectNotch(state, 'P');
  return { ...state, cursor: next };
}

export function stepPreviousLine(state: ReaderState, lines: number[][]): ReaderState {
  const lineIndex = lines.findIndex((line) => line.includes(state.cursor));
  if (lineIndex <= 0) return selectNotch(state, 'P');
  return { ...state, cursor: lines[lineIndex - 1][0] };
}

export function phraseEndIndex(passage: Passage, first: number): number {
  const sentence = passage.words[first].sentenceIndex;
  let last = first;
  while (last + 1 < passage.words.length && last < first + 2 && passage.words[last + 1].sentenceIndex === sentence) last++;
  return last;
}

export function delayFor(state: ReaderState, passage: Passage): number {
  const notch = state.notch;
  if (notch === 'P') return Infinity;
  if (notch === 'R2') return 1000 / state.speeds.R2;
  const base = 60000 / state.speeds[notch];
  if (notch === 'R1') return base;
  const pause = passage.words[state.cursor]?.pauseAfter;
  return base + (pause === 'paragraph' ? 420 : pause === 'sentence' ? 260 : pause === 'clause' ? 160 : pause === 'comma' ? 90 : 0);
}
