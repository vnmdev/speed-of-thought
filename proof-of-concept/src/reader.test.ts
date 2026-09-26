import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePassage } from './model.ts';
import { applyWheel, delayFor, initialState, NOTCHES, phraseEndIndex, playbackEndIndex, presentationFor, selectNotch, stepWord } from './reader.ts';

test('downward ticks select F1 through F3 one at a time and clamp at F3', () => {
  assert.deepEqual(NOTCHES, ['P', 'F1', 'F2', 'F3']);
  let state = { ...initialState(), cursor: 8 };
  for (const [delta, expected] of [[0.1, 'F1'], [120, 'F2'], [1000, 'F3'], [1, 'F3']] as const) {
    state = applyWheel(state, delta);
    assert.equal(state.notch, expected);
    assert.equal(state.cursor, 8);
  }
});

test('every upward tick pauses and rewinds exactly one line from any mode', () => {
  const lines = [[0, 1, 2], [3, 4, 5, 6, 7], [8, 9]];
  const passage = parsePassage('one two three four five six seven eight nine ten');
  for (const notch of NOTCHES) {
    let state = { ...selectNotch(initialState(), notch), cursor: 9 };
    state = applyWheel(state, -0.1, lines);
    assert.equal(state.notch, 'P');
    assert.equal(state.cursor, 3);
    assert.equal(delayFor(state, passage), Infinity);
    state = applyWheel(state, -120, lines);
    assert.equal(state.cursor, 0);
    assert.equal(applyWheel(state, -1000, lines).cursor, 0);
    assert.equal(applyWheel(state, 1).notch, 'F1');
  }
});

test('reversing the wheel always resumes at F1 after manual rewind', () => {
  const state = { ...selectNotch(initialState(), 'F3'), cursor: 5 };
  const paused = applyWheel(state, -1, [[0, 1], [2, 3], [4, 5]]);
  assert.equal(paused.cursor, 2);
  const resumed = applyWheel(paused, 1);
  assert.equal(resumed.notch, 'F1');
  assert.equal(resumed.cursor, 2);
});

test('step-down scroll slows through each forward mode before pausing and rewinding', () => {
  let state = selectNotch(initialState(), 'F3');
  state = { ...state, scrollUp: 'step', cursor: 5 };
  const lines = [[0, 1], [2, 3], [4, 5]];
  for (const notch of ['F2', 'F1', 'P']) {
    state = applyWheel(state, -1, lines);
    assert.equal(state.notch, notch);
    assert.equal(state.cursor, 5);
  }
  state = applyWheel(state, -1, lines);
  assert.equal(state.notch, 'P');
  assert.equal(state.cursor, 2);
  state = applyWheel(state, 1);
  assert.equal(state.notch, 'F1');
  assert.equal(state.cursor, 2);
});

test('step-down mode allows direction changes and switching to immediate pause', () => {
  const state = { ...selectNotch(initialState(), 'F3'), scrollUp: 'step' as const, cursor: 5 };
  const slower = applyWheel(state, -1);
  assert.equal(applyWheel(slower, 1).notch, 'F3');
  const paused = applyWheel({ ...slower, scrollUp: 'pause' }, -1, [[0, 1], [2, 3], [4, 5]]);
  assert.equal(paused.notch, 'P');
  assert.equal(paused.cursor, 2);
});

test('wheel ignores zero and invalid deltas and returns ordinary reading to the reader', () => {
  const state = { ...initialState(), view: 'manual' as const, cursor: 3 };
  for (const delta of [0, NaN, Infinity]) assert.equal(applyWheel(state, delta), state);
  const forward = applyWheel(state, 1);
  assert.equal(forward.view, 'focused');
  assert.equal(forward.notch, 'F1');
  const backward = applyWheel(state, -1, [[0, 1], [2, 3]]);
  assert.equal(backward.view, 'focused');
  assert.equal(backward.notch, 'P');
  assert.equal(backward.cursor, 0);
});

test('forward playback stops at the passage boundary', () => {
  const state = { ...selectNotch(initialState(), 'F1'), cursor: 4 };
  assert.equal(stepWord(state, 1, 5).notch, 'P');
  assert.equal(stepWord(state, 1, 5).cursor, 4);
});

test('forward pacing adds punctuation pauses', () => {
  const passage = parsePassage('One, two. Three');
  const state = selectNotch(initialState(), 'F1');
  assert.ok(delayFor({ ...state, cursor: 0 }, passage) > delayFor({ ...state, cursor: 2 }, passage));
  assert.ok(delayFor({ ...state, cursor: 1 }, passage) > delayFor({ ...state, cursor: 0 }, passage));
});

test('phrases contain at most three words and stop at sentence boundaries', () => {
  const passage = parsePassage('One two three four. Five six seven.');
  assert.equal(phraseEndIndex(passage, 0), 2);
  assert.equal(phraseEndIndex(passage, 2), 3);
  assert.equal(phraseEndIndex(passage, 4), 6);
});

test('each word-paced mode uses its own configured WPM', () => {
  const passage = parsePassage('one two three four five');
  const state = initialState();
  state.speeds = { F1: 240, F2: 300, F3: 600 };
  assert.equal(delayFor(selectNotch(state, 'F1'), passage), 250);
  assert.equal(delayFor(selectNotch(state, 'F2'), passage), 200);
  assert.equal(delayFor(selectNotch(state, 'F3'), passage), 100);
  assert.equal(delayFor(selectNotch(state, 'P'), passage), Infinity);
});

test('pause and F1 share context while F2 and F3 use focused views', () => {
  const paused = { ...initialState(), cursor: 8 };
  const forward = applyWheel(paused, 1);
  for (const state of [paused, forward]) {
    assert.equal(state.cursor, 8);
    assert.equal(presentationFor(state), 'context');
    assert.equal(presentationFor({ ...state, unit: 'phrase' }), 'context');
  }
  const strip = applyWheel(forward, 1);
  assert.equal(presentationFor(strip), 'strip');
  assert.equal(presentationFor({ ...strip, unit: 'phrase' }), 'strip');
  assert.equal(presentationFor(applyWheel(strip, 1)), 'word');
});

test('F2 always advances one centred word even when F3 uses phrases', () => {
  const passage = parsePassage('one two three four five six');
  const state = { ...initialState(), cursor: 1, unit: 'phrase' as const };
  assert.equal(playbackEndIndex(selectNotch(state, 'F2'), passage), 1);
  assert.equal(playbackEndIndex(selectNotch(state, 'F3'), passage), 3);
  assert.equal(presentationFor(selectNotch(state, 'F2')), 'strip');
  assert.equal(presentationFor(selectNotch(state, 'F3')), 'phrase');
});
