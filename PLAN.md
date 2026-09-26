# Speed of Thought — initial plan

## The idea

A browser-based reading surface for LLM output. Forward motion can present words at a fixed focal point or keep a context block visible while highlighting each word. When the reader loses the thread, they can move backward through visible lines, pause in context, inspect the surrounding thought, and resume or eventually fork a conversation from it.

This is an interface experiment, not a claim that reading one word at a time is always faster or better. Comprehension and comfort matter more than peak words per minute.

## Interaction hypothesis

- Use the scroll wheel or up/down arrow keys globally, with a linear readout: **P · F1 · F2 · F3**. By default, each upward tick pauses and moves back one rendered line, including the first tick during playback. A saved scroll-up setting optionally steps down F3 → F2 → F1 → P first, without changing word position. Further upward ticks continue rewinding manually. Each downward tick advances one forward mode, starting with F1 after a rewind and clamping at F3.
- Pause and F1 share the same context block and zoom level. Compare context alone with context beside a focused word. The reader can pick a restart point and move forward again. Keep the saved position anchored to words and sentences, since visual lines change with viewport width.
- F1 advances a word highlight through the context block. F2 centres the current word with three faded words on either side; F3 uses an isolated word or short phrase. Each forward mode has configurable WPM. Animate transitions between context, strip, and focus.
- Text fields and the open source editor retain native wheel scrolling. Elsewhere, one vertical wheel event performs one action, without a distance threshold or cooldown. Trackpads and mice behave differently.
- Ordinary reading shows the full passage and preserves the exact reading position. Browse with its scrollbar or click a word; the wheel returns to the reader. Pace control uses the wheel or up/down arrow keys; form fields retain their native keyboard controls.

Use **sentences or short clauses as stable internal anchors**. Visual rows change with viewport width, so a row can be a presentation choice but not the saved location. Manual rewind lands on the first word of the previous rendered line; forward pacing adds pauses at punctuation and thought boundaries.

## Smallest prototype: test the reader, not the model

Build a single browser page with a text box prefilled with a sample answer. The reader can replace it with their own passage. No LLM connection, accounts, persistence service, or agent tools.

1. Segment the entered passage into sentences and words, retaining stable IDs and offsets.
2. Implement focused forward playback with adjustable speed and punctuation pauses.
3. Implement global wheel control and manual line rewind. Keep the surrounding context visible during pause and F1, highlight the current word, and let the reader choose where to resume.
4. Add the ordinary reading view while preserving position.
5. Compare the two context layouts and tune the zoom transitions.

Start with prose. Code, tables, equations, and diagrams should remain spatially visible rather than being fed through one word at a time.

## What to learn from the prototype

- When is a full highlighted line easier to follow than one word or a short phrase at a fixed point?
- Does upward scrolling to pause and rewind feel natural? Is one line per tick the right distance?
- Does contextual rewind actually restore comprehension quickly? How much context is enough?
- Does the wheel feel precise on both a mouse and a trackpad, or does it cause accidental jumps?
- Can a reader move between focused and manual modes without losing their place?

Try the same passages in ordinary scrolling and in the prototype. Note comprehension, comfort, time to find a lost place, and how often rewind is used. A faster animation that makes the argument harder to retain is a failure.

## Later milestones

**Thought forks.** Let the reader select a sentence/short clause, ask a follow-up, and return to the original path. Store the source thought ID, exact quoted span, branch prompt, and return location. A fork from the middle of an answer is product state of our own; ordinary conversation branching is not sufficient by itself.

**Model output.** Stream text into a sentence/paragraph buffer so playback does not repeatedly catch up with generation. If the buffer runs dry, pause at a thought boundary. Playback, rewind, and scrolling stay local UI actions; only new content and follow-ups require model calls.

**Session persistence.** Save passages, reading positions, and branch history locally first. Add sharing or cross-device sync only if the interaction earns it.

## Possible implementation path

- Prototype: small TypeScript browser app; keep segmentation, playback state, and input-control mapping separate so wheel behavior can evolve without changing the reading model.
- Model-backed version: use Pi's TypeScript SDK as a possible session/streaming engine behind the browser UI, or a simpler model API if agent features add no value. Pi is MIT-licensed and exposes streamed text events. Do not fork Pi's core for the reader.
- Treat Pi tools as opt-in. A reading app should not accidentally grant an agent filesystem or shell access merely because the underlying harness supports them.

## Not now

No prose-rewriting model, speech input, elaborate branch-tree visualisation, desktop app, gamification, or Jev-like classifier in the first build. Make the reading and recovery interaction feel good before adding any of them.

## First build session

Create a page containing an editable text box with a sample multi-paragraph answer. Implement the playback state machine and global wheel control. Test one-word versus short-phrase display on the same passage. Then implement the contextual rewind and compare how quickly a reader can recover their place.
