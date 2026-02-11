export const MISSING_ENV_ERROR_PATTERN = "Missing required environment variable";

export function isMissingEnvErrorUseCase(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(MISSING_ENV_ERROR_PATTERN)
  );
}
