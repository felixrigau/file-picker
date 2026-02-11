import { describe, expect, it } from "vitest";
import {
  isMissingEnvErrorUseCase,
  MISSING_ENV_ERROR_PATTERN,
} from "./detect-missing-env-error.use-case";

describe("isMissingEnvErrorUseCase", () => {
  it("returns true when error message includes pattern", () => {
    expect(
      isMissingEnvErrorUseCase(
        new Error("Missing required environment variable: API_KEY"),
      ),
    ).toBe(true);
  });

  it("returns false when error is not an Error instance", () => {
    expect(isMissingEnvErrorUseCase("some string")).toBe(false);
    expect(isMissingEnvErrorUseCase(null)).toBe(false);
    expect(isMissingEnvErrorUseCase(undefined)).toBe(false);
  });

  it("returns false when error message does not include pattern", () => {
    expect(isMissingEnvErrorUseCase(new Error("Network error"))).toBe(false);
  });
});

describe("MISSING_ENV_ERROR_PATTERN", () => {
  it("is exported constant", () => {
    expect(MISSING_ENV_ERROR_PATTERN).toBe(
      "Missing required environment variable",
    );
  });
});
