# Speed of Thought

Speed of Thought is a planned LLM harness for conversations that are easier to read and follow. The first working piece is a browser-based RSVP (rapid serial visual presentation) reader for large blocks of text.

## Planned capabilities

- A conversational interface with LLMs from various API providers.
- The RSVP reader already present in the prototype, integrated into conversations to help with reading large blocks of text.
- A system prompt that adjusts prose for easier reading.
- Full Markdown support.
- Possible split views or branching that keep both the original content and a more digestible version available.

## Current prototype

The local reader supports adjustable playback, line rewind, context and focused views, wheel and arrow-key controls, and saved WPM preferences. It starts with a sample passage and lets you enter your own text.

LLM connections, the conversational interface, prose-adjusting prompts, full Markdown rendering, and branching are planned; they are not implemented yet. This first experiment explores whether the reading interaction is comfortable and useful.

See [proof-of-concept](proof-of-concept/) for the prototype and instructions for running it locally.

See [PLAN.md](PLAN.md) for the interaction design, milestones, and open questions.
