import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "./get-env";

describe("getEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv("TEST_VAR", "test-value");
    vi.stubEnv("EMPTY_VAR", "");
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("returns the value when variable is defined and non-empty", () => {
    expect(getEnv("TEST_VAR")).toBe("test-value");
  });

  it("throws when variable is undefined", () => {
    expect(() => getEnv("UNDEFINED_VAR")).toThrow(
      "Missing required environment variable: UNDEFINED_VAR",
    );
  });

  it("throws when variable is empty string", () => {
    expect(() => getEnv("EMPTY_VAR")).toThrow(
      "Missing required environment variable: EMPTY_VAR",
    );
  });
});
