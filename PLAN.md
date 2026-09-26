# Speed of Thought — initial plan

## The idea

A browser-based reading surface for LLM output. Forward motion presents text at a fixed focal point, potentially one word at a time. When the reader loses the thread, moving backward should reveal *more context*, not flash individual words in reverse. The reader can pause, inspect the surrounding thought, and resume or eventually fork a conversation from it.

This is an interface experiment, not a claim that reading one word at a time is always faster or better. Comprehension and comfort matter more than peak words per minute.

## Interaction hypothesis

- A spring-loaded drag control has a neutral centre. Dragging right moves forward; distance from centre controls speed. Returning to centre pauses.
- Dragging left enters **recovery mode**: show the current sentence or visual row with the last-read word highlighted. Farther left reveals preceding sentences or the paragraph. The reader can pick a restart point and move forward again. Reverse means navigation, not backwards playback.
- The scroll wheel may offer a second control scheme: forward scroll advances or accelerates, reverse scroll opens context. This is an experiment, not yet a settled mapping; trackpads and mice behave differently.
- A keyboard fallback should cover play/pause, speed, rewind, and manual mode. The experience must not require holding a mouse button for a long answer.
- Manual mode shows ordinary scrollable text and preserves the exact reading position when switching modes.

Use **sentences or short clauses as stable internal anchors**. Visual rows change with viewport width, so a row can be a presentation choice but not the saved location. Pause and rewind should snap sensibly at punctuation and thought boundaries.

## Smallest prototype: test the reader, not the model

Build a single browser page with a few fixed sample passages. No LLM connection, accounts, persistence service, or agent tools.

1. Segment a passage into sentences and words, retaining stable IDs and offsets.
2. Implement focused forward playback with adjustable speed and punctuation pauses.
3. Implement drag-to-control and contextual rewind. Display the current sentence, highlight the last-read word, and let the reader choose where to resume.
4. Add manual scrolling and keyboard controls while preserving position.
5. Test the wheel as an alternative, with an obvious way to switch schemes or disable it.

Start with prose. Code, tables, equations, and diagrams should remain spatially visible rather than being fed through one word at a time.

## What to learn from the prototype

- Is one word the right display unit, or are short phrases easier to follow?
- Does the drag control feel natural, or tiring? Is release-to-pause the right behaviour?
- Does contextual rewind actually restore comprehension quickly? How much context is enough?
- Does the wheel feel precise on both a mouse and a trackpad, or does it cause accidental jumps?
- Can a reader move between focused and manual modes without losing their place?

Try the same passages in ordinary scrolling and in the prototype. Note comprehension, comfort, time to find a lost place, and how often rewind is used. A faster animation that makes the argument harder to retain is a failure.

## Later milestones

**Thought forks.** Let the reader select a sentence/short clause, ask a follow-up, and return to the original path. Store the source thought ID, exact quoted span, branch prompt, and return location. A fork from the middle of an answer is product state of our own; ordinary conversation branching is not sufficient by itself.

**Model output.** Stream text into a sentence/paragraph buffer so playback does not repeatedly catch up with generation. If the buffer runs dry, pause at a thought boundary. Playback, rewind, and scrolling stay local UI actions; only new content and follow-ups require model calls.

**Session persistence.** Save passages, reading positions, and branch history locally first. Add sharing or cross-device sync only if the interaction earns it.

## Possible implementation path

- Prototype: small TypeScript browser app; keep segmentation, playback state, and input-control mapping separate so different control schemes can be compared.
- Model-backed version: use Pi's TypeScript SDK as a possible session/streaming engine behind the browser UI, or a simpler model API if agent features add no value. Pi is MIT-licensed and exposes streamed text events. Do not fork Pi's core for the reader.
- Treat Pi tools as opt-in. A reading app should not accidentally grant an agent filesystem or shell access merely because the underlying harness supports them.

## Not now

No prose-rewriting model, speech input, elaborate branch-tree visualisation, desktop app, gamification, or Jev-like classifier in the first build. Make the reading and recovery interaction feel good before adding any of them.

## First build session

Create a page containing one fixed, multi-paragraph answer. Implement the playback state machine and a simple keyboard control before polishing the drag control. Test one-word versus short-phrase display on the same passage. Then implement the contextual rewind and compare how quickly a reader can recover their place.
