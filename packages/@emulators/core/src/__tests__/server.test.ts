import { describe, expect, it } from "vitest";
import { createServer } from "../server.js";
import type { ServicePlugin } from "../plugin.js";

function plugin(name: string): ServicePlugin {
  return {
    name,
    register() {},
  };
}

describe("createServer default documentation URLs", () => {
  it("uses the FoundryCI service docs URL for not found responses", async () => {
    const { app } = createServer(plugin("foundry"));

    const res = await app.request("/missing");

    expect(res.status).toBe(404);
    const body = (await res.json()) as { message: string; documentation_url: string };
    expect(body.message).toBe("Not Found");
    expect(body.documentation_url).toBe("https://foundryci.com/foundry");
  });

  it("uses the service slug under foundryci.com for other services too", async () => {
    const { app } = createServer(plugin("github"));

    const res = await app.request("/missing");

    expect(res.status).toBe(404);
    const body = (await res.json()) as { documentation_url: string };
    expect(body.documentation_url).toBe("https://foundryci.com/github");
  });

  it("still allows an explicit docsUrl override", async () => {
    const { app } = createServer(plugin("foundry"), { docsUrl: "https://example.com/custom-docs" });

    const res = await app.request("/missing");

    expect(res.status).toBe(404);
    const body = (await res.json()) as { documentation_url: string };
    expect(body.documentation_url).toBe("https://example.com/custom-docs");
  });
});
