import { beforeAll, describe, expect, it } from "vitest";

let buildQuickStartLines: typeof import("../commands/start.js").buildQuickStartLines;

beforeAll(async () => {
  Object.assign(globalThis, { PKG_VERSION: "0.0.0-test" });
  ({ buildQuickStartLines } = await import("../commands/start.js"));
});

describe("buildQuickStartLines", () => {
  it("uses an api:admin-read token for the current-user curl", () => {
    const lines = buildQuickStartLines(
      [{ name: "foundry", url: "http://localhost:4000" }],
      {
        foundry_test_token: { login: "jane", id: 1, scopes: ["api:admin-read"] },
      },
      {
        foundry: {
          oauth_clients: [
            {
              client_id: "foundry-web",
              redirect_uris: ["http://localhost:3000/callback"],
              allowed_scopes: ["api:admin-read", "offline_access"],
            },
          ],
        },
      },
    );

    expect(lines.join("\n")).toContain("Authorization: Bearer foundry_test_token");
    expect(lines.join("\n")).toContain("/api/v2/admin/users/getCurrent");
  });

  it("does not advertise a non-existent fallback token for current-user quick start", () => {
    const lines = buildQuickStartLines(
      [{ name: "foundry", url: "http://localhost:4000" }],
      {
        foundry_seed_token: { login: "jane", id: 1, scopes: ["api:ontologies-read"] },
      },
      {
        foundry: {
          oauth_clients: [
            {
              client_id: "foundry-web",
              redirect_uris: ["http://localhost:3000/callback"],
              allowed_scopes: ["api:ontologies-read"],
            },
          ],
        },
      },
    );

    expect(lines.join("\n")).toContain("Authorization: Bearer foundry_seed_token");
    expect(lines.join("\n")).not.toContain("Authorization: Bearer test_token_admin");
    expect(lines.join("\n")).toContain("requires a token with api:admin-read");
  });
});
