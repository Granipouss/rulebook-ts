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

    const ruleDesert = book.create("Has no base yield");
    const ruleGrassland = book.create("Has 2 Food yield");

    expect(ruleDesert).toMatchInlineSnapshot(`
      RuleObject {
        "params": [],
        "template": "Has no base yield",
        "value": "Has no base yield",
      }
    `);
    expect(ruleGrassland).toMatchInlineSnapshot(`
      RuleObject {
        "params": [
          2,
          "Food",
        ],
        "template": "Has [n] [yield] yield",
        "value": "Has 2 Food yield",
      }
    `);

    expect(ruleDesert.is("Has no base yield")).toBe(true);
    expect(ruleGrassland.is("Has no base yield")).toBe(false);
    expect(ruleGrassland.is("Has [n] [yield] yield")).toBe(true);

    expect(() => ruleGrassland.get("Has no base yield")).toThrow(
      `Rule is of type "Has [n] [yield] yield" on not "Has no base yield"`,
    );
    expect(ruleGrassland.get("Has [n] [yield] yield")).toEqual([2, "Food"]);

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

  it('should use "check" for more complex patterns', () => {
    const conditionBook = new RuleBook(
      ["on [terrain]", "next to [terrain]", "next to River"],
      {
        terrain: {
          pattern: /Ocean|Coast|Lake|Snow|Tundra|Plains|Grassland|Desert/,
          parse: (s) => s as TerrainType,
        },
      },
    );

    const book = new RuleBook(
      ["no bonus yield", "[n] [yield]", "[n] [yield] [condition]"],
      {
        n: {
          pattern: /-?\d+/,
          parse: (s) => Number(s),
        },
        yield: {
          pattern: /Food|Production|Gold/,
          parse: (s) => s as YieldType,
        },
        condition: {
          pattern: /(?:on|next to) .+/,
          parse: (s) => conditionBook.create(s).params,
        },
      },
    );

    const bonusA = book.create("2 Gold next to River");
    const bonusB = book.create("2 Food on Desert");

    expect(bonusA).toEqual({
      template: "[n] [yield] [condition]",
      value: "2 Gold next to River",
      params: [2, "Gold", []],
    });
    expect(bonusB).toEqual({
      template: "[n] [yield] [condition]",
      value: "2 Food on Desert",
      params: [2, "Food", ["Desert"]],
    });

    const params = bonusB.get("[n] [yield] [condition]");
    expect(params).toEqual([2, "Food", ["Desert"]]);
  });
});
