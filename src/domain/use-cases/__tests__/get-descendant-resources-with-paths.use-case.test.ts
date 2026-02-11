import { getDescendantResourcesWithPathsUseCase } from "../get-descendant-resources-with-paths.use-case";
import { FileResourceRepositoryTestImpl } from "@/infra/adapters/test";
import { describe, expect, it } from "vitest";

describe("getDescendantResourcesWithPathsUseCase", () => {
  it("returns descendant paths from repo", async () => {
    const fileResourceRepository =
      new FileResourceRepositoryTestImpl().withDescendantPaths(
        (_resourceId, rootResourcePath) => [
          { resourceId: "a", resourcePath: `${rootResourcePath}/a` },
          { resourceId: "b", resourcePath: `${rootResourcePath}/b` },
        ],
      );

    const result = await getDescendantResourcesWithPathsUseCase(
      fileResourceRepository,
      "folder-id",
      "/root/folder",
    );

    expect(result).toEqual([
      { resourceId: "a", resourcePath: "/root/folder/a" },
      { resourceId: "b", resourcePath: "/root/folder/b" },
    ]);
  });
});
