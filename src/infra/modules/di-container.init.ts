/**
 * Side-effect: initializes the DI Container at app startup.
 * Import this once (e.g. from layout.tsx) so dependencies are explicitly wired.
 *
 * @see docs/DI_CONTAINER.md
 */
import { bootstrapDIContainer } from "./di-container";

bootstrapDIContainer();
