import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bootstrapDIContainer,
  getConnectionRepository,
  getFileResourceRepository,
  getKnowledgeBaseRepository,
  resetRepositories,
  setRepositories,
} from "./di-container";

const mockAuthRepo = { getAccessToken: vi.fn(), getOrganizationId: vi.fn() };
const mockConnectionRepo = { getConnectionId: vi.fn() };
const mockFileResourceRepo = { fetchContents: vi.fn(), getDescendantIds: vi.fn(), getDescendantPaths: vi.fn() };
const mockKnowledgeBaseRepo = { sync: vi.fn(), delete: vi.fn() };

describe("di-container", () => {
  beforeEach(() => {
    resetRepositories();
  });

  afterEach(() => {
    resetRepositories();
  });

  describe("setRepositories", () => {
    it("injects auth repository override", async () => {
      mockAuthRepo.getAccessToken.mockResolvedValue("token");
      setRepositories({ authRepository: mockAuthRepo as never });

      const connectionRepo = getConnectionRepository();
      expect(connectionRepo).toBeDefined();
    });

    it("injects connection repository override", async () => {
      mockConnectionRepo.getConnectionId.mockResolvedValue("conn-1");
      setRepositories({ connectionRepository: mockConnectionRepo as never });

      const repo = getConnectionRepository();
      expect(repo).toBe(mockConnectionRepo);
    });

    it("injects file resource repository override", () => {
      setRepositories({ fileResourceRepository: mockFileResourceRepo as never });

      const repo = getFileResourceRepository();
      expect(repo).toBe(mockFileResourceRepo);
    });

    it("injects knowledge base repository override", () => {
      setRepositories({ knowledgeBaseRepository: mockKnowledgeBaseRepo as never });

      const repo = getKnowledgeBaseRepository();
      expect(repo).toBe(mockKnowledgeBaseRepo);
    });
  });

  describe("resetRepositories", () => {
    it("clears overrides so getters return new instances", () => {
      setRepositories({ connectionRepository: mockConnectionRepo as never });
      const repo1 = getConnectionRepository();
      expect(repo1).toBe(mockConnectionRepo);

      resetRepositories();
      const repo2 = getConnectionRepository();
      expect(repo2).not.toBe(mockConnectionRepo);
    });
  });

  describe("bootstrapDIContainer", () => {
    it("is idempotent — does not throw when called multiple times", () => {
      expect(() => {
        bootstrapDIContainer();
        bootstrapDIContainer();
      }).not.toThrow();
    });
  });
});
