/** Delay before prefetch to avoid requests when cursor is just passing through */
export const PREFETCH_DELAY_MS = 150;

/** Delay before cancelling prefetch — prevents spurious cancels from mouse jitter */
export const PREFETCH_CANCEL_DEBOUNCE_MS = 80;

/** Number of skeleton rows shown while loading folder children */
export const SKELETON_ROWS_PER_FOLDER = 3;
