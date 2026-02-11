/**
 * Side-effect: initializes the composition root at app startup.
 * Import this once (e.g. from layout.tsx) so the container is explicitly wired.
 *
 * @see docs/CONTAINER.md
 */
import { bootstrapContainer } from "./container";

bootstrapContainer();
