import { FileResourceRepositoryTestImpl } from "@/infra/adapters/test";
import { describe, expect, it } from "vitest";
import { getDescendantResourceIdsUseCase } from "./get-descendant-resource-ids.use-case";

describe("getDescendantResourceIdsUseCase", () => {
  it("returns descendant ids from repo", async () => {
    const fileResourceRepository = new FileResourceRepositoryTestImpl().withDescendantIds(
      (resourceId) =>
        resourceId === "root" ? ["child1", "child2", "child3"] : [resourceId],
    );

    const result = await getDescendantResourceIdsUseCase(
      fileResourceRepository,
      "root",
    );

    expect(result).toEqual(["child1", "child2", "child3"]);
  });
});
