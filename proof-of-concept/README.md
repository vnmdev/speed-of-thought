# Proof of concept

An interactive desktop browser prototype of the Speed of Thought reader. It starts with a sample answer; replace it with your own prose and press **Load passage** to begin again from the first word.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The page uses no model service and does not save your text or settings after refresh.

## Try the controls

- The six notches are **R2 · R1 · P · F1 · F2 · F3**. F1 keeps the whole rendered line visible and highlights each word. F2 and F3 use a fixed focal point, with a word or short-phrase option. R1 reverses through focused words; R2 reverses through rendered lines and highlights the first word of each line.
- Choose a held drag, a latched drag, or wheel control. In wheel mode, scroll anywhere over the focused reader to change notches. Ordinary reading keeps normal wheel scrolling.
- Select **Ordinary reading** to scroll the full text. Click a word to set your place, then return to focus. In R2, click a context word to pause there.
- Keyboard: Space plays or pauses, `[` and `]` change notches, Left and Right step words while paused, and `M` switches between focused and ordinary reading.

Run `npm test` for the passage and reader-state checks, or `npm run build` to type-check and produce a static build.

See the [prototype plan](PLAN.md) and the [project plan](../PLAN.md) for the design goals.
