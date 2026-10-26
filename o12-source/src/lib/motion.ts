/** Navigation commits immediately. Native View Transitions can defer route
 * updates and fail in WebKit; existing CSS still handles local feedback. */
export function transition(update: () => void) {
  update();
}

/** Keep opening a word independent of optional browser animation APIs. */
export function morphFrom(_el: HTMLElement | null | undefined, update: () => void) {
  update();
}
