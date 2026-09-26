import './style.css';
import { parsePassage, type Passage } from './model.ts';
import {
  delayFor, initialState, phraseEndIndex, selectNotch, shiftNotch, stepPreviousLine,
  stepWord, type ControlScheme, type FocusUnit, type Notch, type ReaderState,
  type RecoveryLayout,
} from './reader.ts';

const SAMPLE = `A good explanation gives you somewhere to stand before it asks you to move. It names the problem, shows why the obvious answer falls short, and leaves enough space for the next idea to arrive. Reading it is rarely a straight line. A surprising sentence can make you pause; a small detail may send you back to an earlier claim.

Most reading tools treat that backward motion as a mistake to correct. But looking back is often where understanding happens. You might need the rest of a sentence, the shape of a paragraph, or just the word before the one that slipped away. The useful amount of context changes from moment to moment.

Imagine a reader that keeps your place while you change your pace. At one speed it offers a word at a fixed point. At another it gives you a whole line and lets your eye settle where it wants. Move backward and the text opens up; move forward and you return to the thought you were following. The question is not how quickly the words can pass. It is whether the meaning stays with you.`;

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header">
    <div class="brand"><span class="brand-mark" aria-hidden="true">S<span>·</span>T</span><span>Speed of Thought</span></div>
    <span class="header-tag">READING EXPERIMENT / 01</span>
  </header>
  <main class="page-shell">
    <div class="page-heading"><div><p class="eyebrow">A READER YOU CAN STEER</p><h1>Stay with the thought.</h1><p class="intro">Set a pace. Slow down to a line. Go back when you need the thread again.</p></div><span class="prototype-pill">Browser prototype</span></div>
    <section class="reader-card" id="reader-card" aria-label="Reader" tabindex="-1">
      <div class="reader-topline"><span id="view-label">FOCUSED READING</span><span id="progress-label">WORD 1 OF 1</span></div>
      <div class="reader-stage" id="reader-stage">
        <div class="stage-main" id="stage-main"><div class="stage-kicker" id="stage-kicker">PAUSED / READY WHEN YOU ARE</div><div id="reader-display" aria-live="off"></div><div class="stage-support" id="stage-support"></div></div>
        <div class="context-panel" id="context-panel" hidden><div class="context-heading"><span>CONTEXT</span><span id="context-position"></span></div><div class="context-lines" id="context-lines"></div><p class="context-hint">Select a word to resume from there.</p></div>
        <div class="manual-panel" id="manual-panel" hidden><p class="manual-hint">Scroll naturally. Select a word to set your place.</p><article id="manual-article" class="passage-text"></article></div>
      </div>
      <div class="reader-bottom">
        <div class="selector-heading"><div><span class="eyebrow">PACE SELECTOR</span><strong id="notch-description">Paused</strong></div><button class="text-button" id="view-toggle" type="button">Ordinary reading ↗</button></div>
        <div class="notch-track" id="notch-track" role="group" aria-label="Reading pace">
          <button type="button" data-notch="R2"><span>R2</span><small>line back</small></button>
          <button type="button" data-notch="R1"><span>R1</span><small>word back</small></button>
          <button type="button" data-notch="P"><span>P</span><small>pause</small></button>
          <button type="button" data-notch="F1"><span>F1</span><small>line forward</small></button>
          <button type="button" data-notch="F2"><span>F2</span><small>focused</small></button>
          <button type="button" data-notch="F3"><span>F3</span><small>fast</small></button>
        </div>
        <div class="track-meta"><span>← MORE CONTEXT</span><span>MORE MOMENTUM →</span></div>
      </div>
    </section>
    <section class="workbench" aria-label="Prototype controls">
      <div class="panel passage-panel"><div class="panel-heading"><div><p class="eyebrow">01 / SOURCE TEXT</p><h2>Bring your own thought.</h2></div><span class="panel-icon">✳</span></div><p>Paste a prose answer, then load it into the reader.</p><label class="field-label" for="passage-input">PASSAGE</label><textarea id="passage-input" spellcheck="false"></textarea><div class="panel-action"><span id="load-message" role="status">A sample is ready to read.</span><button class="primary-button" id="load-button" type="button">Load passage <span aria-hidden="true">↗</span></button></div></div>
      <div class="panel settings-panel"><div class="panel-heading"><div><p class="eyebrow">02 / MAKE IT YOURS</p><h2>Choose how it moves.</h2></div><span class="panel-icon">⌁</span></div><div class="setting"><label for="scheme-select">Input method</label><select id="scheme-select"><option value="latched">Drag · stays on notch</option><option value="held">Drag · release to pause</option><option value="wheel">Wheel · anywhere in reader</option></select></div><div class="setting"><label for="unit-select">Focused display <small>F2 & F3</small></label><select id="unit-select"><option value="word">One word</option><option value="phrase">Short phrase</option></select></div><div class="setting"><label for="layout-select">R2 context layout</label><select id="layout-select"><option value="replace">Replace focused view</option><option value="alongside">Appear alongside</option></select></div><details class="speed-details"><summary>Adjust speeds <span aria-hidden="true">⌄</span></summary><div class="speed-grid"><label>R2 <input data-speed="R2" type="number" min="0.25" max="4" step="0.25" /> <small>lines/sec</small></label><label>R1 <input data-speed="R1" type="number" min="60" max="900" step="10" /> <small>wpm</small></label><label>F1 <input data-speed="F1" type="number" min="60" max="900" step="10" /> <small>wpm</small></label><label>F2 <input data-speed="F2" type="number" min="60" max="900" step="10" /> <small>wpm</small></label><label>F3 <input data-speed="F3" type="number" min="60" max="900" step="10" /> <small>wpm</small></label></div></details><div class="keyboard-note"><span class="keyboard-icon">⌘</span><p><strong>Keyboard, too.</strong> Space plays or pauses · [ / ] changes notch · ← / → steps a word while paused · M switches view.</p></div></div>
    </section>
    <footer><span>SPEED OF THOUGHT</span><span>A small experiment in keeping your place.</span></footer>
  </main>
  <div class="measure-text" id="measure-text" aria-hidden="true"></div>
`;

const $ = <T extends HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
const passageInput = $<HTMLTextAreaElement>('#passage-input');
const stage = $<HTMLDivElement>('#reader-stage');
const stageMain = $<HTMLDivElement>('#stage-main');
const display = $<HTMLDivElement>('#reader-display');
const contextPanel = $<HTMLDivElement>('#context-panel');
const contextLines = $<HTMLDivElement>('#context-lines');
const manualPanel = $<HTMLDivElement>('#manual-panel');
const manualArticle = $<HTMLElement>('#manual-article');
const measure = $<HTMLDivElement>('#measure-text');
const track = $<HTMLDivElement>('#notch-track');
const readerCard = $<HTMLElement>('#reader-card');

let passage: Passage = parsePassage(SAMPLE);
let state: ReaderState = initialState();
let timer: number | undefined;
let passageVersion = 0;
let measured: { key: string; lines: number[][] } | undefined;
let manualVersion = -1;
let wheelAccumulated = 0;
let lastWheelAt = 0;
let lastWheelStepAt = 0;
let pointerActive = false;
let pointerId = -1;

passageInput.value = SAMPLE;

function appendWords(parent: HTMLElement, firstIndex: number, lastIndex: number, interactive = false, whole = false): void {
  const words = passage.words;
  if (!words.length || firstIndex > lastIndex) return;
  if (whole && words[0].start) parent.append(document.createTextNode(passage.source.slice(0, words[0].start)));
  for (let index = firstIndex; index <= lastIndex; index++) {
    const word = words[index];
    const span = document.createElement('span');
    span.className = 'word-token' + (index === state.cursor ? ' current-word' : '');
    span.textContent = word.text;
    span.dataset.wordIndex = String(index);
    if (interactive) {
      span.tabIndex = 0;
      span.setAttribute('role', 'button');
      span.setAttribute('aria-label', `Resume from ${word.text}`);
    }
    parent.append(span);
    const next = words[index + 1];
    if (index < lastIndex && next) parent.append(document.createTextNode(passage.source.slice(word.end, next.start)));
  }
  const last = words[lastIndex];
  const next = words[lastIndex + 1];
  const tail = passage.source.slice(last.end, next?.start ?? passage.source.length);
  parent.append(document.createTextNode(whole ? tail : tail.trimEnd()));
}

function lineGroups(mode: 'f1' | 'r2'): number[][] {
  const width = Math.max(200, Math.floor(mode === 'f1' ? display.clientWidth : contextLines.clientWidth - 26));
  const key = `${passageVersion}:${mode}:${width}`;
  if (measured?.key === key) return measured.lines;
  measure.className = `measure-text ${mode}`;
  measure.style.width = `${width}px`;
  measure.replaceChildren();
  appendWords(measure, 0, passage.words.length - 1, false, true);
  const lines: number[][] = [];
  let previousTop = Number.NaN;
  for (const span of measure.querySelectorAll<HTMLElement>('.word-token')) {
    const top = span.getBoundingClientRect().top;
    if (!lines.length || Math.abs(top - previousTop) > 3) lines.push([]);
    lines[lines.length - 1].push(Number(span.dataset.wordIndex));
    previousTop = top;
  }
  measured = { key, lines };
  return lines;
}

function renderManual(): void {
  if (manualVersion !== passageVersion) {
    manualArticle.replaceChildren();
    appendWords(manualArticle, 0, passage.words.length - 1, true, true);
    manualVersion = passageVersion;
  }
  for (const span of manualArticle.querySelectorAll<HTMLElement>('.current-word')) span.classList.remove('current-word');
  manualArticle.querySelector<HTMLElement>(`[data-word-index="${state.cursor}"]`)?.classList.add('current-word');
}

function renderF1(): void {
  const lines = lineGroups('f1');
  const current = lines.findIndex((line) => line.includes(state.cursor));
  const line = lines[current] ?? [state.cursor];
  display.className = 'line-display';
  display.replaceChildren();
  appendWords(display, line[0], line[line.length - 1]);
  $('#stage-kicker').textContent = 'F1 / READ THE WHOLE LINE';
  $('#stage-support').textContent = `Line ${current + 1} of ${lines.length} · the highlight follows each word`;
}

function renderFocusedWord(): void {
  const isReverse = state.notch === 'R1';
  const word = passage.words[state.cursor];
  const phraseEnd = !isReverse && state.unit === 'phrase'
    ? phraseEndIndex(passage, state.cursor)
    : state.cursor;
  const last = phraseEnd;
  display.className = last > state.cursor ? 'phrase-display' : 'word-display';
  const afterLast = passage.words[last + 1]?.start ?? passage.source.length;
  display.textContent = passage.source.slice(word.start, afterLast).trimEnd();
  $('#stage-kicker').textContent = isReverse ? 'R1 / WORD BY WORD, BACKWARD' : state.notch === 'P' ? 'PAUSED / READY WHEN YOU ARE' : `${state.notch} / FOLLOW THE WORDS`;
  $('#stage-support').textContent = isReverse ? 'One word back at a time.' : state.notch === 'P' ? 'Choose a notch below or press Space.' : state.unit === 'phrase' ? 'A few words at a time.' : 'Keep your eyes here.';
}

function renderR2(): void {
  const lines = lineGroups('r2');
  const current = lines.findIndex((line) => line.includes(state.cursor));
  const from = Math.max(0, current - 2);
  const to = Math.min(lines.length - 1, current + 2);
  contextLines.replaceChildren();
  for (let index = from; index <= to; index++) {
    const line = lines[index];
    const row = document.createElement('div');
    row.className = 'context-line' + (index === current ? ' active-line' : '');
    appendWords(row, line[0], line[line.length - 1], true);
    contextLines.append(row);
  }
  $('#context-position').textContent = `LINE ${current + 1} / ${lines.length}`;
  if (state.layout === 'alongside') {
    display.className = 'word-display side-word';
    const word = passage.words[state.cursor];
    display.textContent = passage.source.slice(word.start, passage.words[state.cursor + 1]?.start ?? passage.source.length).trimEnd();
    $('#stage-kicker').textContent = 'R2 / FIND THE THREAD';
    $('#stage-support').textContent = 'The highlighted word is your restart point.';
  }
}

function render(): void {
  const manual = state.view === 'manual';
  const r2 = !manual && state.notch === 'R2';
  readerCard.classList.toggle('is-manual', manual);
  stage.classList.toggle('is-r2', r2);
  stage.classList.toggle('is-alongside', r2 && state.layout === 'alongside');
  stageMain.hidden = manual || (r2 && state.layout === 'replace');
  contextPanel.hidden = !r2;
  manualPanel.hidden = !manual;
  $('#view-label').textContent = manual ? 'ORDINARY READING' : r2 ? 'CONTEXTUAL REWIND' : 'FOCUSED READING';
  $('#progress-label').textContent = `WORD ${state.cursor + 1} OF ${passage.words.length}`;
  $('#view-toggle').textContent = manual ? 'Return to focus ↗' : 'Ordinary reading ↗';
  $('#notch-description').textContent = {
    R2: 'Rewind by line', R1: 'Rewind by word', P: 'Paused',
    F1: 'Forward with the line', F2: 'Focused pace', F3: 'Fast focused pace',
  }[state.notch];
  track.querySelectorAll<HTMLButtonElement>('button[data-notch]').forEach((button) => {
    const selected = button.dataset.notch === state.notch;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  if (manual) renderManual();
  else if (r2) renderR2();
  else if (state.notch === 'F1') renderF1();
  else renderFocusedWord();
}

function schedule(): void {
  window.clearTimeout(timer);
  timer = undefined;
  if (state.view !== 'focused' || state.notch === 'P') return;
  const phrase = (state.notch === 'F2' || state.notch === 'F3') && state.unit === 'phrase';
  const phraseEnd = phrase ? phraseEndIndex(passage, state.cursor) : state.cursor;
  const wordInterval = (state.notch === 'F2' || state.notch === 'F3') ? 60000 / state.speeds[state.notch] : 0;
  const duration = delayFor({ ...state, cursor: phraseEnd }, passage) + (phraseEnd - state.cursor) * wordInterval;
  timer = window.setTimeout(() => {
    const prior = state;
    if (state.notch === 'R2') state = stepPreviousLine(state, lineGroups('r2'));
    else if (phrase) {
      const next = phraseEnd + 1;
      state = next >= passage.words.length
        ? selectNotch({ ...state, cursor: phraseEnd }, 'P')
        : { ...state, cursor: next };
    } else state = stepWord(state, state.notch === 'R1' ? -1 : 1, passage.words.length);
    if (state === prior) state = selectNotch(state, 'P');
    render();
    schedule();
  }, duration);
}

function update(next: ReaderState): void {
  state = next;
  render();
  schedule();
}

function goToWord(index: number): void {
  if (index < 0 || index >= passage.words.length) return;
  update({ ...state, cursor: index, notch: 'P' });
}

function toggleManual(): void {
  const manual = state.view !== 'manual';
  update({ ...state, view: manual ? 'manual' : 'focused', notch: 'P' });
  if (manual) {
    requestAnimationFrame(() => manualArticle.querySelector<HTMLElement>(`[data-word-index="${state.cursor}"]`)?.scrollIntoView({ block: 'center' }));
  }
}

function notchFromPointer(clientX: number): Notch {
  const buttons = [...track.querySelectorAll<HTMLButtonElement>('button[data-notch]')];
  const closest = buttons.reduce((best, button) => {
    const box = button.getBoundingClientRect();
    const distance = Math.abs(clientX - (box.left + box.width / 2));
    return distance < best.distance ? { button, distance } : best;
  }, { button: buttons[0], distance: Infinity });
  return closest.button.dataset.notch as Notch;
}

track.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  readerCard.focus({ preventScroll: true });
  pointerActive = true;
  pointerId = event.pointerId;
  track.setPointerCapture(event.pointerId);
  update({ ...selectNotch(state, notchFromPointer(event.clientX)), view: 'focused' });
});
track.addEventListener('pointermove', (event) => {
  if (pointerActive && event.pointerId === pointerId) update(selectNotch(state, notchFromPointer(event.clientX)));
});
function endPointer(event: PointerEvent): void {
  if (!pointerActive || event.pointerId !== pointerId) return;
  pointerActive = false;
  if (state.scheme === 'held') update(selectNotch(state, 'P'));
}
track.addEventListener('pointerup', endPointer);
track.addEventListener('pointercancel', endPointer);
track.addEventListener('click', (event) => {
  if (event.detail !== 0) return;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-notch]');
  if (button) update({ ...selectNotch(state, button.dataset.notch as Notch), view: 'focused' });
});

readerCard.addEventListener('wheel', (event) => {
  if (state.scheme !== 'wheel' || state.view !== 'focused' || (event.target as HTMLElement).closest('input, select, textarea')) return;
  event.preventDefault();
  const now = performance.now();
  if (now - lastWheelAt > 300) wheelAccumulated = 0;
  lastWheelAt = now;
  const amount = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 600 : 1);
  wheelAccumulated += amount;
  if (Math.abs(wheelAccumulated) >= 75 && now - lastWheelStepAt >= 180) {
    update(shiftNotch(state, Math.sign(wheelAccumulated)));
    wheelAccumulated = 0;
    lastWheelStepAt = now;
  }
}, { passive: false });

function wordTarget(event: Event): HTMLElement | null {
  const target = event.target;
  return target instanceof HTMLElement ? target.closest<HTMLElement>('[data-word-index]') : null;
}
function selectWordEvent(event: Event): void {
  const target = wordTarget(event);
  if (target) goToWord(Number(target.dataset.wordIndex));
}
manualArticle.addEventListener('click', selectWordEvent);
contextLines.addEventListener('click', selectWordEvent);
for (const element of [manualArticle, contextLines]) element.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && wordTarget(event)) {
    event.preventDefault();
    selectWordEvent(event);
  }
});

$('#view-toggle').addEventListener('click', toggleManual);
$('#load-button').addEventListener('click', () => {
  const next = parsePassage(passageInput.value);
  if (!next.words.length) {
    $('#load-message').textContent = 'Add some prose before loading.';
    return;
  }
  passage = next;
  passageVersion++;
  measured = undefined;
  manualVersion = -1;
  $('#load-message').textContent = `${next.words.length} words loaded. Ready from the start.`;
  update({ ...state, cursor: 0, notch: 'P', view: 'focused' });
});

$<HTMLSelectElement>('#scheme-select').addEventListener('change', (event) => {
  const scheme = (event.target as HTMLSelectElement).value as ControlScheme;
  update({ ...state, scheme, notch: scheme === 'held' ? 'P' : state.notch });
});
$<HTMLSelectElement>('#unit-select').addEventListener('change', (event) => {
  update({ ...state, unit: (event.target as HTMLSelectElement).value as FocusUnit });
});
$<HTMLSelectElement>('#layout-select').addEventListener('change', (event) => {
  measured = undefined;
  update({ ...state, layout: (event.target as HTMLSelectElement).value as RecoveryLayout });
});
document.querySelectorAll<HTMLInputElement>('input[data-speed]').forEach((input) => {
  const key = input.dataset.speed as keyof ReaderState['speeds'];
  input.value = String(state.speeds[key]);
  input.addEventListener('change', () => {
    const minimum = Number(input.min);
    const maximum = Number(input.max);
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      input.value = String(state.speeds[key]);
      return;
    }
    update({ ...state, speeds: { ...state.speeds, [key]: value } });
  });
});

document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  if (event.defaultPrevented || target.closest('input, textarea, select, button, [data-word-index], [contenteditable="true"]') || event.metaKey || event.ctrlKey || event.altKey) return;
  let next: ReaderState | undefined;
  if (event.key === ' ') next = selectNotch(state, state.notch === 'P' ? state.lastForward : 'P');
  else if (event.key === '[') next = shiftNotch(state, -1);
  else if (event.key === ']') next = shiftNotch(state, 1);
  else if (event.key === 'ArrowLeft' && state.notch === 'P') next = stepWord(state, -1, passage.words.length);
  else if (event.key === 'ArrowRight' && state.notch === 'P') next = stepWord(state, 1, passage.words.length);
  else if (event.key.toLowerCase() === 'm') { event.preventDefault(); toggleManual(); return; }
  else if (event.key === 'Escape') next = selectNotch(state, 'P');
  if (next) { event.preventDefault(); update({ ...next, view: 'focused' }); }
});

new ResizeObserver(() => {
  measured = undefined;
  if (state.notch === 'F1' || state.notch === 'R2') render();
}).observe(stage);

document.fonts.ready.then(() => {
  measured = undefined;
  if (state.notch === 'F1' || state.notch === 'R2') render();
});

render();
