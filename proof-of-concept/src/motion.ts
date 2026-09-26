interface WordFrame {
  text: string;
  wordIndex?: string;
  rect: DOMRect;
  font: string;
  letterSpacing: string;
  color: string;
  backgroundColor: string;
  borderRadius: string;
}

// Carry the same word between views, then let playback resume after it settles.
export class ReaderZoom {
  private animations: Animation[] = [];
  private ghost?: HTMLElement;
  private hiddenWord?: HTMLElement;
  private previousVisibility = '';
  private settlesAt = 0;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor() {
    this.reducedMotion.addEventListener('change', () => this.cancel());
  }

  cancel(): void {
    for (const animation of this.animations) animation.cancel();
    this.animations = [];
    if (this.hiddenWord) this.hiddenWord.style.visibility = this.previousVisibility;
    this.hiddenWord = undefined;
    this.ghost?.remove();
    this.ghost = undefined;
    this.settlesAt = 0;
  }

  capture(word: HTMLElement | null): WordFrame | undefined {
    this.cancel();
    if (!word || this.reducedMotion.matches) return;
    const rect = word.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const style = getComputedStyle(word);
    return {
      text: word.textContent ?? '', wordIndex: word.dataset.wordIndex, rect,
      font: style.font, letterSpacing: style.letterSpacing,
      color: style.color, backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
    };
  }

  play(before: WordFrame, word: HTMLElement | null, content: HTMLElement): void {
    if (!word || this.reducedMotion.matches || word.textContent !== before.text) return;
    const after = word.getBoundingClientRect();
    if (!after.width || !after.height) return;
    const contentRect = content.getBoundingClientRect();
    const destinationStyle = getComputedStyle(word);
    const ghost = document.createElement('span');
    ghost.className = 'zoom-word';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.textContent = before.text;
    Object.assign(ghost.style, {
      left: `${before.rect.left}px`, top: `${before.rect.top}px`,
      width: `${before.rect.width}px`, height: `${before.rect.height}px`,
      font: before.font, lineHeight: `${before.rect.height}px`,
      letterSpacing: before.letterSpacing, color: before.color,
      backgroundColor: before.backgroundColor, borderRadius: before.borderRadius,
    });
    document.body.append(ghost);
    this.ghost = ghost;
    this.hiddenWord = word;
    this.previousVisibility = word.style.visibility;
    word.style.visibility = 'hidden';

    const duration = 300;
    const timing = { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' as const };
    const zoomingOut = after.height < before.rect.height;
    const origin = `${after.left + after.width / 2 - contentRect.left}px ${after.top + after.height / 2 - contentRect.top}px`;
    const reveal = content.animate([
      { opacity: 0, transform: `scale(${zoomingOut ? 1.12 : 0.9})`, transformOrigin: origin },
      { opacity: 1, transform: 'scale(1)', transformOrigin: origin },
    ], timing);
    const travel = ghost.animate([
      { transform: 'translate(0, 0) scale(1, 1)' },
      {
        transform: `translate(${after.left - before.rect.left}px, ${after.top - before.rect.top}px) scale(${after.width / before.rect.width}, ${after.height / before.rect.height})`,
        color: destinationStyle.color,
        backgroundColor: destinationStyle.backgroundColor,
        borderRadius: destinationStyle.borderRadius,
      },
    ], timing);
    this.animations = [reveal, travel];
    this.settlesAt = performance.now() + duration;
    void travel.finished.then(() => {
      if (this.ghost === ghost) this.cancel();
    }).catch(() => { /* A new notch can interrupt a zoom. */ });
  }

  remainingMs(): number {
    return Math.max(0, this.settlesAt - performance.now());
  }
}
