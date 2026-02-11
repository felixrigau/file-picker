import { getConnectionIdUseCase } from "../get-connection-id.use-case";
import { ConnectionRepositoryTestImpl } from "@/infra/adapters/test";
import { describe, expect, it } from "vitest";

describe("getConnectionIdUseCase", () => {
  it("returns connectionId from repo", async () => {
    const connectionRepo = new ConnectionRepositoryTestImpl("my-conn-id");

    const result = await getConnectionIdUseCase(connectionRepo);

    expect(result.connectionId).toBe("my-conn-id");
  });
});
