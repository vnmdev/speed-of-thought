import './style.css';
import { parsePassage, type Passage } from './model.ts';
import { ReaderZoom } from './motion.ts';
import {
  applyWheel, delayFor, initialState, playbackEndIndex, presentationFor, selectNotch,
  stepWord, type FocusUnit, type ReaderState,
  type ContextLayout,
} from './reader.ts';

const SAMPLE = `A good explanation gives you somewhere to stand before it asks you to move. It names the problem, shows why the obvious answer falls short, and leaves enough space for the next idea to arrive. Reading it is rarely a straight line. A surprising sentence can make you pause; a small detail may send you back to an earlier claim.

Most reading tools treat that backward motion as a mistake to correct. But looking back is often where understanding happens. You might need the rest of a sentence, the shape of a paragraph, or just the word before the one that slipped away. The useful amount of context changes from moment to moment.

Imagine a reader that keeps your place while you change your pace. At one speed it offers a word at a fixed point. At another it gives you a whole line and lets your eye settle where it wants. Move backward and the text opens up; move forward and you return to the thought you were following. The question is not how quickly the words can pass. It is whether the meaning stays with you.`;

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#reader-card" aria-label="Speed of Thought reader"><span class="brand-mark" aria-hidden="true">&gt;_</span><span>speedofthought<small>read at your own pace</small></span></a>
    <span class="header-tag">local / prototype</span>
  </header>
  <main class="page-shell">
    <section class="reader-card" id="reader-card" aria-label="Reader" tabindex="-1">
      <div class="reader-toolbar" aria-label="Reader settings">
        <span class="wheel-label">wheel / arrow keys</span>
        <span class="toolbar-divider" aria-hidden="true">/</span>
        <div class="setting"><label for="scroll-up-select">up ↑</label><select id="scroll-up-select"><option value="pause">straight to pause</option><option value="step">step down speeds</option></select></div>
        <span class="toolbar-divider" aria-hidden="true">/</span>
        <div class="setting"><label for="unit-select">f3</label><select id="unit-select"><option value="word">one word</option><option value="phrase">short phrase</option></select></div>
        <span class="toolbar-divider" aria-hidden="true">/</span>
        <div class="setting"><label for="layout-select">context</label><select id="layout-select"><option value="replace">block</option><option value="alongside">split</option></select></div>
        <span class="toolbar-divider" aria-hidden="true">/</span>
        <button class="text-button" id="edit-button" type="button">edit passage ↗</button>
      </div>
      <div class="reader-topline"><span id="view-label">reading in context</span><span id="progress-label">word 1 of 1</span></div>
      <div class="reader-stage" id="reader-stage">
        <div class="stage-main" id="stage-main"><div class="stage-kicker" id="stage-kicker"></div><div id="reader-display" aria-live="off"></div><div class="stage-support" id="stage-support"></div></div>
        <div class="context-panel" id="context-panel" hidden><div class="context-heading"><span>context</span><span id="context-position"></span></div><div class="context-lines" id="context-lines"></div><p class="context-hint">click a word to set your place</p></div>
        <div class="manual-panel" id="manual-panel" hidden><p class="manual-hint">drag the scrollbar to browse / wheel returns to the reader / click a word to set your place</p><article id="manual-article" class="passage-text"></article></div>
      </div>
      <div class="reader-bottom">
        <div class="selector-heading"><strong id="notch-description">paused in context</strong><button class="text-button" id="view-toggle" type="button">ordinary reading ↗</button></div>
        <div class="notch-track" id="notch-track" role="list" aria-label="Reading pace, controlled by the scroll wheel or up and down arrow keys">
          <div class="notch" role="listitem" data-notch="P"><span>P</span><small>pause</small></div>
          <div class="notch" role="listitem" data-notch="F1"><span>F1</span><small>context</small></div>
          <div class="notch" role="listitem" data-notch="F2"><span>F2</span><small>word strip</small></div>
          <div class="notch" role="listitem" data-notch="F3"><span>F3</span><small>focus</small></div>
        </div>
        <div class="mode-speeds" role="group" aria-label="Words per minute for each mode">
          <div class="paused-speed"><strong>0</strong><small>wpm</small></div>
          <label for="speed-F1"><input id="speed-F1" data-speed="F1" aria-label="F1 words per minute" type="number" min="60" step="10" required /><small>wpm</small></label>
          <label for="speed-F2"><input id="speed-F2" data-speed="F2" aria-label="F2 words per minute" type="number" min="60" step="10" required /><small>wpm</small></label>
          <label for="speed-F3"><input id="speed-F3" data-speed="F3" aria-label="F3 words per minute" type="number" min="60" step="10" required /><small>wpm</small></label>
        </div>
        <p class="speed-hint">edit the pace below each forward mode</p>
      </div>
      <p class="wheel-note"><span id="scroll-up-hint"></span><span>·</span> ↓ F1 → F2 → F3 (wheel or keys)</p>
    </section>
    <section class="source-panel" id="source-panel" aria-labelledby="editor-heading" hidden>
      <div class="editor-heading"><h1 id="editor-heading">edit passage</h1><button class="text-button" id="cancel-edit-button" type="button">cancel / back to reader</button></div>
      <label class="field-label" for="passage-input">source text</label>
      <textarea id="passage-input" spellcheck="false"></textarea>
      <div class="panel-action"><span id="load-message" role="status">sample loaded</span><button class="primary-button" id="load-button" type="button">load passage ↵</button></div>
    </section>
    <footer><span>speedofthought / experimental reader</span><span>context → strip → focus</span></footer>
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
const sourcePanel = $<HTMLElement>('#source-panel');
let editing = false;

let passage: Passage = parsePassage(SAMPLE);
let state: ReaderState = initialState();
const speedStorageKey = 'speed-of-thought.wpm.v1';
try {
  const saved: unknown = JSON.parse(localStorage.getItem(speedStorageKey) ?? 'null');
  if (saved && typeof saved === 'object') {
    for (const mode of ['F1', 'F2', 'F3'] as const) {
      const value = (saved as Record<string, unknown>)[mode];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 60) {
        state.speeds[mode] = value;
      }
    }
  }
} catch {
  // Keep the defaults if storage is unavailable or its contents are invalid.
}
const scrollUpStorageKey = 'speed-of-thought.scroll-up.v1';
try {
  const saved = localStorage.getItem(scrollUpStorageKey);
  if (saved === 'pause' || saved === 'step') state.scrollUp = saved;
} catch {
  // Keep the default wheel behavior when browser storage is unavailable.
}
let timer: number | undefined;
let passageVersion = 0;
let measured: { key: string; lines: number[][] } | undefined;
let manualVersion = -1;
const zoom = new ReaderZoom();
let renderedPresentation = '';
let renderedPassageVersion = -1;

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

function lineGroups(): number[][] {
  const width = Math.max(200, Math.floor(contextLines.clientWidth - 26));
  const contextStyle = getComputedStyle(contextLines);
  const key = `${passageVersion}:${width}:${contextStyle.font}`;
  if (measured?.key === key) return measured.lines;
  measure.className = 'measure-text context';
  measure.style.width = `${width}px`;
  measure.style.font = contextStyle.font;
  measure.style.letterSpacing = contextStyle.letterSpacing;
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

function renderFocusedWord(): void {
  const last = playbackEndIndex(state, passage);
  display.className = last > state.cursor ? 'phrase-display' : 'word-display';
  display.replaceChildren();
  appendWords(display, state.cursor, last);
  $('#stage-kicker').textContent = `${state.notch} / FOLLOW THE WORDS`;
  $('#stage-support').textContent = state.unit === 'phrase' ? 'A few words at a time.' : 'Keep your eyes here.';
}

function renderWordStrip(): void {
  display.className = 'word-strip';
  display.replaceChildren();
  const before = document.createElement('div');
  before.className = 'strip-neighbors before';
  const center = document.createElement('div');
  center.className = 'strip-center';
  const after = document.createElement('div');
  after.className = 'strip-neighbors after';

  for (const [container, first, last] of [
    [before, Math.max(0, state.cursor - 3), state.cursor - 1],
    [after, state.cursor + 1, Math.min(passage.words.length - 1, state.cursor + 3)],
  ] as const) {
    const text = document.createElement('span');
    text.className = 'strip-neighbor-text';
    appendWords(text, first, last);
    for (const word of text.querySelectorAll<HTMLElement>('.word-token')) {
      word.dataset.distance = String(Math.abs(Number(word.dataset.wordIndex) - state.cursor));
    }
    container.append(text);
  }
  appendWords(center, state.cursor, state.cursor);
  display.append(before, center, after);
  $('#stage-kicker').textContent = 'f2 / word strip';
  $('#stage-support').textContent = 'current word centred · three words either side';
}

function renderContext(): void {
  const lines = lineGroups();
  const current = lines.findIndex((line) => line.includes(state.cursor));
  const from = Math.max(0, Math.min(current - 2, lines.length - 5));
  const to = Math.min(lines.length - 1, from + 4);
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
    display.replaceChildren();
    appendWords(display, state.cursor, state.cursor);
    $('#stage-kicker').textContent = state.notch === 'P' ? 'PAUSED / TAKE IN THE CONTEXT' : 'F1 / FOLLOW THE HIGHLIGHT';
    $('#stage-support').textContent = 'The highlighted word is your restart point.';
  }
}

function render(): void {
  if (editing) return;
  $('#scroll-up-hint').textContent = state.scrollUp === 'step'
    ? '↑ F3 → F2 → F1 → P → lines back'
    : '↑ pause + one line back';
  const view = presentationFor(state);
  const manual = view === 'manual';
  const context = view === 'context';
  const presentation = context ? `context-${state.layout}` : view;
  const shouldZoom = renderedPresentation && presentation !== renderedPresentation
    && !manual && renderedPresentation !== 'manual' && renderedPassageVersion === passageVersion;
  const previousWord = shouldZoom ? zoom.capture(visibleWord()) : undefined;
  if (!shouldZoom) zoom.cancel();
  readerCard.classList.toggle('is-manual', manual);
  stage.classList.toggle('is-context', context);
  stage.classList.toggle('is-alongside', context && state.layout === 'alongside');
  stageMain.hidden = manual || (context && state.layout === 'replace');
  contextPanel.hidden = !context;
  manualPanel.hidden = !manual;
  $('#view-label').textContent = manual ? 'ORDINARY READING' : context ? 'READING IN CONTEXT' : 'FOCUSED READING';
  $('#progress-label').textContent = `WORD ${state.cursor + 1} OF ${passage.words.length}`;
  $('#view-toggle').textContent = manual ? 'Return to focus ↗' : 'Ordinary reading ↗';
  $('#notch-description').textContent = {
    P: 'Paused / scroll up to rewind',
    F1: 'Forward in context', F2: 'Word strip', F3: 'Focused pace',
  }[state.notch] + (state.notch === 'P' ? '' : ` · ${state.speeds[state.notch]} WPM`);
  track.querySelectorAll<HTMLElement>('[data-notch]').forEach((indicator) => {
    const selected = indicator.dataset.notch === state.notch;
    indicator.classList.toggle('selected', selected);
    if (selected) indicator.setAttribute('aria-current', 'step');
    else indicator.removeAttribute('aria-current');
  });
  if (manual) renderManual();
  else if (context) renderContext();
  else if (view === 'strip') renderWordStrip();
  else renderFocusedWord();
  if (previousWord) zoom.play(previousWord, visibleWord(previousWord.wordIndex), context ? contextLines : display);
  renderedPresentation = presentation;
  renderedPassageVersion = passageVersion;
}

function visibleWord(wordIndex?: string): HTMLElement | null {
  const selector = wordIndex === undefined ? '.current-word' : `[data-word-index="${wordIndex}"]`;
  if (!contextPanel.hidden) return contextLines.querySelector<HTMLElement>(selector);
  if (!stageMain.hidden) return display.querySelector<HTMLElement>(selector);
  return null;
}

function schedule(): void {
  window.clearTimeout(timer);
  timer = undefined;
  if (editing || state.view !== 'focused' || state.notch === 'P') return;
  const phrase = state.notch === 'F3' && state.unit === 'phrase';
  const phraseEnd = playbackEndIndex(state, passage);
  const wordInterval = state.notch === 'F3' ? 60000 / state.speeds.F3 : 0;
  const duration = delayFor({ ...state, cursor: phraseEnd }, passage) + (phraseEnd - state.cursor) * wordInterval + zoom.remainingMs();
  timer = window.setTimeout(() => {
    const prior = state;
    if (phrase) {
      const next = phraseEnd + 1;
      state = next >= passage.words.length
        ? selectNotch({ ...state, cursor: phraseEnd }, 'P')
        : { ...state, cursor: next };
    } else state = stepWord(state, 1, passage.words.length);
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

// Measure the context layout even when a focused word or ordinary text is showing.
// Restore the visible layout synchronously so the next render can animate from it.
function linesForWheel(): number[][] {
  if (!contextPanel.hidden) return lineGroups();
  const previous = {
    mainHidden: stageMain.hidden, contextHidden: contextPanel.hidden,
    manualHidden: manualPanel.hidden,
    context: stage.classList.contains('is-context'),
    alongside: stage.classList.contains('is-alongside'),
  };
  stageMain.hidden = state.layout === 'replace';
  contextPanel.hidden = false;
  manualPanel.hidden = true;
  stage.classList.add('is-context');
  stage.classList.toggle('is-alongside', state.layout === 'alongside');
  try {
    return lineGroups();
  } finally {
    stageMain.hidden = previous.mainHidden;
    contextPanel.hidden = previous.contextHidden;
    manualPanel.hidden = previous.manualHidden;
    stage.classList.toggle('is-context', previous.context);
    stage.classList.toggle('is-alongside', previous.alongside);
  }
}

function changePace(direction: number): void {
  const rewind = direction < 0 && (state.scrollUp === 'pause' || state.notch === 'P');
  const next = applyWheel(state, direction, rewind ? linesForWheel() : []);
  if (next.notch !== state.notch || next.cursor !== state.cursor || next.view !== state.view) update(next);
}

window.addEventListener('wheel', (event) => {
  const target = event.target;
  if (editing || event.ctrlKey || !Number.isFinite(event.deltaY) || event.deltaY === 0
    || (target instanceof Element && target.closest('input, select, textarea, [contenteditable="true"]'))) return;
  event.preventDefault();
  // One vertical event is one action, regardless of wheel delta or deltaMode.
  changePace(event.deltaY);
}, { passive: false });

window.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  const target = event.target;
  if (editing || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
    || (target instanceof HTMLElement && target.isContentEditable)
    || (target instanceof Element && target.closest('input, select, textarea'))) return;
  event.preventDefault();
  changePace(event.key === 'ArrowUp' ? -1 : 1);
});

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
$('#edit-button').addEventListener('click', () => {
  state = selectNotch(state, 'P');
  editing = true;
  schedule();
  zoom.cancel();
  passageInput.value = passage.source;
  $('#load-message').textContent = 'paste your text, then load it to start from the beginning';
  readerCard.hidden = true;
  sourcePanel.hidden = false;
  sourcePanel.scrollIntoView({ block: 'start' });
  passageInput.focus({ preventScroll: true });
});

function closeEditor(next: ReaderState): void {
  editing = false;
  sourcePanel.hidden = true;
  readerCard.hidden = false;
  measured = undefined;
  renderedPresentation = '';
  update(next);
  readerCard.scrollIntoView({ block: 'start' });
  $('#edit-button').focus({ preventScroll: true });
}

$('#cancel-edit-button').addEventListener('click', () => closeEditor(state));
$('.brand').addEventListener('click', (event) => {
  if (!editing) return;
  event.preventDefault();
  closeEditor(state);
});
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
  closeEditor({ ...state, cursor: 0, notch: 'P', view: 'focused' });
});

const scrollUpSelect = $<HTMLSelectElement>('#scroll-up-select');
scrollUpSelect.value = state.scrollUp;
scrollUpSelect.addEventListener('change', () => {
  const scrollUp = scrollUpSelect.value === 'step' ? 'step' : 'pause';
  update({ ...state, scrollUp });
  try {
    localStorage.setItem(scrollUpStorageKey, scrollUp);
  } catch {
    $('.speed-hint').textContent = 'wheel setting updated / browser storage unavailable; changes will reset on reload';
  }
});

$<HTMLSelectElement>('#unit-select').addEventListener('change', (event) => {
  update({ ...state, unit: (event.target as HTMLSelectElement).value as FocusUnit });
});
$<HTMLSelectElement>('#layout-select').addEventListener('change', (event) => {
  measured = undefined;
  update({ ...state, layout: (event.target as HTMLSelectElement).value as ContextLayout });
});
document.querySelectorAll<HTMLInputElement>('input[data-speed]').forEach((input) => {
  const key = input.dataset.speed as keyof ReaderState['speeds'];
  input.value = String(state.speeds[key]);
  input.addEventListener('input', () => {
    const minimum = Number(input.min);
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < minimum) {
      return;
    }
    update({ ...state, speeds: { ...state.speeds, [key]: value } });
    try {
      localStorage.setItem(speedStorageKey, JSON.stringify(state.speeds));
      $('.speed-hint').textContent = 'pace saved in this browser';
    } catch {
      $('.speed-hint').textContent = 'pace updated / browser storage unavailable; changes will reset on reload';
    }
  });
  input.addEventListener('change', () => {
    input.value = String(state.speeds[key]);
  });
});

new ResizeObserver(() => {
  measured = undefined;
  if (presentationFor(state) === 'context') { render(); schedule(); }
}).observe(stage);

document.fonts.ready.then(() => {
  measured = undefined;
  if (presentationFor(state) === 'context') { render(); schedule(); }
});

render();
