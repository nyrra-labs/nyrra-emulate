import { describe, expect, it } from "vitest";
import type { DefaultStartupService } from "../default-services.server";
import { STARTUP_LABEL_OVERRIDES, defaultStartupServices } from "../default-services.server";
import { DEFAULT_SERVICE_NAMES } from "../../../../../packages/emulate/src/registry";

describe("defaultStartupServices derivation", () => {
  it("matches DEFAULT_SERVICE_NAMES in exact order and length", () => {
    expect(defaultStartupServices.length).toBe(DEFAULT_SERVICE_NAMES.length);
    expect(defaultStartupServices.map((s) => s.name)).toEqual([...DEFAULT_SERVICE_NAMES]);
  });

  it("starts port allocation at 4000 and increments by one per service", () => {
    expect(defaultStartupServices[0].port).toBe(4000);
    for (let i = 0; i < defaultStartupServices.length; i++) {
      expect(defaultStartupServices[i].port).toBe(4000 + i);
    }
  });

  it("never includes foundry (which the runtime keeps in EXTRA_SERVICE_NAME_LIST)", () => {
    const names = defaultStartupServices.map((s) => s.name);
    expect(names).not.toContain("foundry");
  });

  it("includes clerk in the default startup set (regression guard against the pre-derived hardcoded list)", () => {
    const names = defaultStartupServices.map((s) => s.name);
    expect(names).toContain("clerk");
    const clerk = defaultStartupServices.find((s) => s.name === "clerk");
    expect(clerk).toBeDefined();
    expect(clerk!.label).toBe("Clerk");
  });

  it("applies STARTUP_LABEL_OVERRIDES to the brand-sensitive names", () => {
    expect(STARTUP_LABEL_OVERRIDES).toEqual({
      github: "GitHub",
      aws: "AWS",
      mongoatlas: "MongoDB Atlas",
    });
    const labels = Object.fromEntries(defaultStartupServices.map((s) => [s.name, s.label]));
    expect(labels.github).toBe("GitHub");
    expect(labels.aws).toBe("AWS");
    expect(labels.mongoatlas).toBe("MongoDB Atlas");
  });

  it("capitalizes the first character for every other service name", () => {
    for (const { name, label } of defaultStartupServices) {
      if (name in STARTUP_LABEL_OVERRIDES) continue;
      expect(label).toBe(name.charAt(0).toUpperCase() + name.slice(1));
    }
  });

  it("every entry has the expected DefaultStartupService shape", () => {
    for (const entry of defaultStartupServices) {
      const keys = Object.keys(entry).sort() as Array<keyof DefaultStartupService>;
      expect(keys).toEqual(["label", "name", "port"]);
      expect(typeof entry.name).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.port).toBe("number");
      expect(entry.port).toBeGreaterThanOrEqual(4000);
    }
  });
});
