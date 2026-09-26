# Browser proof of concept — draft build plan

## Goal

Find out whether focused playback and contextual rewind make long prose answers easier and more comfortable to read. Use a single browser page with an editable text box prefilled with a representative multi-paragraph answer. Compare each interaction with ordinary scrolling of the same text.

## Reading model

- Segment the entered passage into paragraphs, sentences, and words. Give segments stable IDs and text offsets so a change in viewport width cannot move the saved reading position. Loading changed text starts a new reading position.
- Keep one reading position shared by focused playback, recovery, and ordinary scrolling.
- Start with one-word playback, then add a short-phrase display option. Add modest punctuation pauses and a visible speed setting.
- Keep controls separate from the playback state. This lets us compare them without changing the text or position model.

## Shared pace selector

The selector is linear: **R2 · R1 · P · F1 · F2 · F3**.

| Notch | Behavior |
| --- | --- |
| R2 | Move backward through visual lines at a configurable pace, showing context and highlighting the current word. |
| R1 | Move backward word by word at a configurable pace. |
| P | Pause. |
| F1 | Play forward at a slow, configurable pace. |
| F2 | Play forward at a comfortable, configurable pace. |
| F3 | Play forward at a maximum, configurable pace. |

The held drag returns to P on release. The latched drag stays on the selected notch. Wheel movement changes the selected notch. Since visual lines reflow, the saved location remains a word position rather than a line number.

## Build sequence

1. Add a text box with a reasonable multi-paragraph default passage and a way to load edited text into the reader. Build the segment model, position tracking, and keyboard play/pause and step controls.
2. Add focused playback, speed adjustment, punctuation pauses, and a switch between one word and short phrases.
3. Add two reverse modes. R1 backs up word by word at a configurable pace. R2 moves through earlier visual lines at a configurable pace while highlighting the current word. Let the reader choose a restart point. Provide two layouts to compare: context replaces the focused view, or context appears beside it.
4. Add ordinary scrolling with synchronized position when entering or leaving focused mode.
5. Add three selectable input schemes using the shared six-notch selector: a held drag that returns to P on release, a latched drag that stays on the chosen notch, and a scroll wheel that changes notches. Let the reader adjust the speed values of the paced zones.
6. Compare the same passage in ordinary and focused reading. Record subjective comfort and comprehension, how often recovery is used, and time to find a lost place. Keep this lightweight; no account or analytics service is needed.

## Done when

- A reader can start, pause, adjust pace, rewind into context, select a restart point, and resume without losing their place.
- The three input schemes and two recovery layouts can be switched on the same passage.
- A reader can enter a passage and read it in any mode.
- Focused and ordinary views agree on the current reading position.
- Keyboard access works without a sustained pointer gesture.
- The page behaves sensibly with both a mouse wheel and a trackpad.

## Out of scope

Model calls, conversation forks, persistence, code and table playback, accounts, and a full chat interface.

## Implementation detail to test

- Tune wheel movement so a mouse wheel and trackpad can select one notch deliberately without accidental jumps.
