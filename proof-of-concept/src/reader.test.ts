import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePassage } from './model.ts';
import { delayFor, initialState, phraseEndIndex, selectNotch, shiftNotch, stepPreviousLine, stepWord } from './reader.ts';

test('the selector stays inside six notches and keeps the last forward pace', () => {
  let state = initialState();
  state = shiftNotch(state, 20);
  assert.equal(state.notch, 'F3');
  state = selectNotch(state, 'P');
  assert.equal(state.lastForward, 'F3');
  state = shiftNotch(state, -20);
  assert.equal(state.notch, 'R2');
});

test('word and line rewind stop at passage boundaries', () => {
  let state = initialState();
  state = selectNotch(state, 'R1');
  assert.equal(stepWord(state, -1, 5).notch, 'P');
  state = { ...state, cursor: 4 };
  assert.equal(stepWord(state, 1, 5).notch, 'P');
  state = { ...state, cursor: 3 };
  assert.equal(stepPreviousLine(state, [[0, 1], [2, 3], [4]]).cursor, 0);
  assert.equal(stepPreviousLine({ ...state, cursor: 0 }, [[0, 1], [2, 3]]).notch, 'P');
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
