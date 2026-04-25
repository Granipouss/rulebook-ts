import { describe, expect, it } from "vitest";
import { RuleBook } from "../src";

type YieldType = "Food" | "Production" | "Gold";

type TerrainType =
  | "Ocean"
  | "Coast"
  | "Lake"
  | "Snow"
  | "Tundra"
  | "Plains"
  | "Grassland"
  | "Desert";

describe("RuleBook", () => {
  it("should create a working rule book", () => {
    const book = new RuleBook(
      [
        "Has no base yield",
        "Has [n] [yield] yield",
        "Has [n] [yield] yield on [terrain]",
      ],
      {
        n: {
          pattern: /-?\d+/,
          parse: (s) => Number(s),
        },
        yield: {
          pattern: /Food|Production|Gold/,
          parse: (s) => s as YieldType,
        },
        terrain: {
          pattern: /Ocean|Coast|Lake|Snow|Tundra|Plains|Grassland|Desert/,
          parse: (s) => s as TerrainType,
        },
      },
    );

    const rulesetSnow = book.createSet(["Has no base yield"]);
    const rulesetTundra = book.createSet(["Has 1 Food yield"]);
    const rulesetPlains = book.createSet([
      "Has 1 Food yield",
      "Has 1 Production yield",
    ]);

    const rulesetCold = book.mergeSets(
      rulesetSnow,
      rulesetTundra,
      rulesetPlains,
    );

    expect(rulesetSnow.rules).toEqual([
      {
        template: "Has no base yield",
        value: "Has no base yield",
        params: [],
      },
    ]);
    expect(rulesetTundra.rules).toEqual([
      {
        template: "Has [n] [yield] yield",
        value: "Has 1 Food yield",
        params: [1, "Food"],
      },
    ]);
    expect(rulesetPlains.rules).toEqual([
      {
        template: "Has [n] [yield] yield",
        value: "Has 1 Food yield",
        params: [1, "Food"],
      },
      {
        template: "Has [n] [yield] yield",
        value: "Has 1 Production yield",
        params: [1, "Production"],
      },
    ]);
    expect(rulesetCold.rules).toEqual([
      {
        template: "Has no base yield",
        value: "Has no base yield",
        params: [],
      },
      {
        template: "Has [n] [yield] yield",
        value: "Has 1 Food yield",
        params: [1, "Food"],
      },
      {
        template: "Has [n] [yield] yield",
        value: "Has 1 Production yield",
        params: [1, "Production"],
      },
    ]);

    expect(rulesetSnow.has("Has [n] [yield] yield")).toBe(false);
    expect(rulesetSnow.has("Has no base yield")).toBe(true);

    expect(rulesetPlains.get("Has [n] [yield] yield")).toEqual([
      [1, "Food"],
      [1, "Production"],
    ]);
    expect(rulesetPlains.get("Has [n] [yield] yield on [terrain]")).toEqual([]);
  });
});
