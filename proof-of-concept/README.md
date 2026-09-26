# Proof of concept

An interactive desktop browser prototype of the Speed of Thought reader, with a dark monospace interface inspired by [Monkeytype](https://monkeytype.com/). It starts with a sample answer; open **edit passage**, replace it with your own prose, and press **load passage** to begin again from the first word.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The page uses no model service. F1–F3 WPM settings and the scroll-up behavior are saved automatically in this browser's local storage and restored when you reopen the same URL. Passage text and other settings reset on refresh.

## Try the controls

- The mode readout is **P · F1 · F2 · F3**. Pace is controlled by the scroll wheel or **↑ / ↓ arrow keys** across the page. Arrow keys mirror the wheel, including the saved up-direction behavior and line rewind. Form fields retain their normal keyboard controls.
- **Scroll up:** choose **straight to pause** (the default: immediately pause and move back one line) or **step down speeds** (F3 → F2 → F1 → P, one mode per tick without moving your word position). Once paused, each upward tick moves back one rendered line. The choice is saved in this browser. There is no reverse playback mode.
- **Scroll down:** start F1, then advance through F2 and F3 on successive ticks. After rewinding, the next downward tick always starts F1. Each vertical wheel event triggers one action; there is no distance threshold or cooldown.
- P and F1 share the context block. F1 advances the word highlight. F2 centres the current word with up to three faded neighbors on either side. F3 shows an isolated word or short phrase, controlled by the **f3** setting.
- The **context** setting compares a block with a split view beside a focused word. Transitions to and from F2/F3 animate the word into its new position and size. Playback waits for the zoom to settle; reduced-motion preferences disable it.
- Configure each forward mode directly below its label (minimum 60 WPM, no upper limit; controls step by 10). Defaults: F1 180, F2 280, F3 420. Forward punctuation pauses are added to the base word pace. Pause stays at zero.
- **Ordinary reading** shows the full passage: use its scrollbar to browse and click a word to set your place. Wheel input returns to the reader. Clicking any context word pauses there.
- **edit passage** replaces the reader with the source editor and pauses playback. Wheel and arrow-key pace controls are disabled while editing, so the editor scrolls normally. **load passage** returns to the reader at the first word; **cancel / back to reader** discards edits and returns to your previous position, paused.

Run `npm test` for the passage and reader-state checks, or `npm run build` to type-check and produce a static build.

See the [prototype plan](PLAN.md) and the [project plan](../PLAN.md) for the design goals.
