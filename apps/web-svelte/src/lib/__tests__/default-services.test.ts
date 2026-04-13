import { describe, expect, it } from "vitest";
import type { DefaultStartupService, SupportedService } from "../default-services.server";
import {
  STARTUP_LABEL_OVERRIDES,
  defaultStartupServices,
  supportedServices,
  supportedServicesProse,
} from "../default-services.server";
import { DEFAULT_SERVICE_NAMES, SERVICE_NAMES } from "../../../../../packages/emulate/src/service-names";

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

describe("supportedServices derivation", () => {
  it("matches SERVICE_NAMES filtered to exclude foundry, in exact order", () => {
    const expectedNames = SERVICE_NAMES.filter((name) => name !== "foundry");
    const actualNames = supportedServices.map((s) => s.name);
    expect(actualNames).toEqual([...expectedNames]);
  });

  it("includes every default startup service name (DEFAULT_SERVICE_NAMES is a subset)", () => {
    const supportedNames = new Set(supportedServices.map((s) => s.name));
    for (const defaultName of DEFAULT_SERVICE_NAMES) {
      expect(supportedNames.has(defaultName)).toBe(true);
    }
  });

  it("includes clerk in the supported set (regression guard against the pre-derived hardcoded list)", () => {
    const names = supportedServices.map((s) => s.name);
    expect(names).toContain("clerk");
    const clerk = supportedServices.find((s) => s.name === "clerk");
    expect(clerk).toBeDefined();
    expect(clerk!.label).toBe("Clerk");
  });

  it("excludes foundry from the supported set (mentioned separately in the FoundryCI hero prose)", () => {
    const names = supportedServices.map((s) => s.name);
    expect(names).not.toContain("foundry");
  });

  it("applies the same STARTUP_LABEL_OVERRIDES as the default startup list", () => {
    const labels = Object.fromEntries(supportedServices.map((s) => [s.name, s.label]));
    expect(labels.github).toBe("GitHub");
    expect(labels.aws).toBe("AWS");
    expect(labels.mongoatlas).toBe("MongoDB Atlas");
  });

  it("capitalizes the first character for every other supported service name", () => {
    for (const { name, label } of supportedServices) {
      if (name in STARTUP_LABEL_OVERRIDES) continue;
      expect(label).toBe(name.charAt(0).toUpperCase() + name.slice(1));
    }
  });

  it("every entry has the expected SupportedService shape (name + label only, no port)", () => {
    for (const entry of supportedServices) {
      const keys = Object.keys(entry).sort() as Array<keyof SupportedService>;
      expect(keys).toEqual(["label", "name"]);
      expect(typeof entry.name).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });
});

describe("supportedServicesProse formatting", () => {
  it("is a non-empty Oxford-comma English string", () => {
    expect(typeof supportedServicesProse).toBe("string");
    expect(supportedServicesProse.length).toBeGreaterThan(0);
    // Oxford-comma form puts ", and " before the last item.
    expect(supportedServicesProse).toContain(", and ");
  });

  it("contains every supported service label exactly once", () => {
    for (const { label } of supportedServices) {
      const occurrences = supportedServicesProse.split(label).length - 1;
      expect(occurrences).toBe(1);
    }
  });

  it("contains Clerk (the regression guard against the pre-derived hardcoded list)", () => {
    expect(supportedServicesProse).toContain("Clerk");
  });

  it("does NOT contain Foundry (excluded from the supported list)", () => {
    expect(supportedServicesProse).not.toContain("Foundry");
  });

  it("ends with the last supported service label preceded by 'and '", () => {
    const lastLabel = supportedServices[supportedServices.length - 1].label;
    expect(supportedServicesProse.endsWith(`and ${lastLabel}`)).toBe(true);
  });

  it("starts with the first supported service label", () => {
    const firstLabel = supportedServices[0].label;
    expect(supportedServicesProse.startsWith(firstLabel)).toBe(true);
  });
});
