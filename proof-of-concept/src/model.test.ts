import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePassage } from './model.ts';

test('keeps source offsets, repeated words, punctuation, and paragraphs', () => {
  const source = 'Wait, wait. Why?\n\nBecause it matters.';
  const passage = parsePassage(source);
  assert.deepEqual(passage.words.map((word) => word.text), ['Wait', 'wait', 'Why', 'Because', 'it', 'matters']);
  for (const word of passage.words) assert.equal(source.slice(word.start, word.end), word.text);
  assert.equal(passage.words[0].pauseAfter, 'comma');
  assert.equal(passage.words[1].pauseAfter, 'sentence');
  assert.equal(passage.words[2].pauseAfter, 'paragraph');
  assert.equal(passage.words[3].paragraphIndex, 1);
});

test('empty or punctuation-only input has no readable words', () => {
  assert.equal(parsePassage('  \n  ').words.length, 0);
  assert.equal(parsePassage('...!?').words.length, 0);
});
