import { describe, expect, it } from "vitest";
import {
  parseSortOrderUseCase,
  parseStatusUseCase,
  parseTypeUseCase,
} from "./parse-filter-params.use-case";

describe("parseStatusUseCase", () => {
  it("returns value when valid", () => {
    expect(parseStatusUseCase("indexed")).toBe("indexed");
    expect(parseStatusUseCase("not-indexed")).toBe("not-indexed");
    expect(parseStatusUseCase("all")).toBe("all");
  });

  it("returns all for invalid or empty", () => {
    expect(parseStatusUseCase(null)).toBe("all");
    expect(parseStatusUseCase("")).toBe("all");
    expect(parseStatusUseCase("invalid")).toBe("all");
  });
});

describe("parseTypeUseCase", () => {
  it("returns value when valid", () => {
    expect(parseTypeUseCase("folder")).toBe("folder");
    expect(parseTypeUseCase("file")).toBe("file");
    expect(parseTypeUseCase("pdf")).toBe("pdf");
    expect(parseTypeUseCase("all")).toBe("all");
  });

  it("returns all for invalid or empty", () => {
    expect(parseTypeUseCase(null)).toBe("all");
    expect(parseTypeUseCase("")).toBe("all");
    expect(parseTypeUseCase("unknown")).toBe("all");
  });
});

describe("parseSortOrderUseCase", () => {
  it("returns value when valid", () => {
    expect(parseSortOrderUseCase("asc")).toBe("asc");
    expect(parseSortOrderUseCase("desc")).toBe("desc");
  });

  it("returns asc for invalid or empty", () => {
    expect(parseSortOrderUseCase(null)).toBe("asc");
    expect(parseSortOrderUseCase("")).toBe("asc");
    expect(parseSortOrderUseCase("invalid")).toBe("asc");
  });
});
