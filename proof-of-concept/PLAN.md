# Browser proof of concept — build plan

## Goal

Explore whether focused playback and contextual rewind make long prose easier and more comfortable to read. Use a local browser page with an editable default passage. Keep the interface dark, monospace, and inspired by Monkeytype.

## Reading model

- Segment prose into paragraphs, sentences, and words, preserving source offsets and a single word position across views and viewport changes.
- Loading a changed passage starts paused at the first word.
- P and F1 share a context block with a highlighted current word. Compare the block alone with a split layout beside a focused word.
- F2 centres one current word with up to three faded neighbors on each side. F3 presents an isolated word or a short phrase.
- Each forward mode has configurable WPM, saved in browser local storage across refreshes, with punctuation pauses added. Animate zoom between context, strip, and focused text; respect reduced-motion preferences.

## Wheel and arrow-key control

The linear mode readout is **P · F1 · F2 · F3**. Up and down arrow keys mirror the wheel using the same saved behavior, except when editing a form field or using modified key shortcuts. It is not clickable or draggable.

| Action | Behavior |
| --- | --- |
| Scroll up: straight to pause (default) | Immediately pause and jump to the first word of the previous rendered line. |
| Scroll up: step down speeds | Decrease one mode per tick: F3 → F2 → F1 → P, keeping the word position. Further upward ticks rewind one line. |
| Further upward ticks | Move back one line per tick while paused, clamping at the passage start. |
| Scroll down while paused | Start F1 at the selected word. |
| Further downward ticks | Advance to F2, then F3; remain at F3 on further ticks. |

Save the scroll-up setting in browser local storage alongside WPM preferences. There is no reverse playback mode. Each vertical wheel event triggers one action without a distance threshold or cooldown. Listen across the page, including ordinary reading. Preserve native scrolling in form fields and the open source editor, and preserve browser pinch zoom.

## Implementation

1. Keep segmentation and wheel transitions separate from DOM rendering. Cover transition behavior and passage boundaries with state tests.
2. Measure visual lines at the context layout's actual width, including when rewinding from F2/F3. Preserve word position when the viewport changes.
3. In straight-to-pause mode, cancel playback immediately on upward input. In step-down mode, slow one mode per tick until P. Keep the paused context visible until another action.
4. Maintain the same context layout across P/F1, and animate transitions to and from F2/F3.
5. Retain per-mode WPM inputs, the F3 word/phrase setting, and both context layouts.
6. Keep an ordinary passage view with a scrollbar and clickable restart words. Wheel input returns to the reader. Use an edit-passage button to replace the reader with the editor in the same space. Suspend pace controls while editing, and provide load and cancel actions to return to the reader.
7. Compare comprehension, comfort, and recovery time on the same passage. Check single ticks and rapid direction changes on a mouse and trackpad.

## Done when

- Straight-to-pause mode pauses and rewinds one line per upward tick. Step-down mode visits each slower mode before pausing, then rewinds on further upward ticks.
- Downward ticks proceed from P through F1–F3, and resume at F1 after rewind.
- Both context layouts preserve word position and line rewind at different widths.
- A reader can edit the passage, configure WPM, select a restart word, and switch views.
- Unit tests and production build pass; browser checks cover wheel scope, timer cancellation, and zoom transitions when browser tooling is available.

## Out of scope

Model calls, conversation forks, passage/session persistence, code and table playback, accounts, and a full chat interface. No drag-based transport controls in this iteration.
