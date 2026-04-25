export type Rule<
  T extends string = string,
  TParams extends unknown[] = unknown[],
> = {
  value: string;
  template: T;
  params: TParams[];
};

export type RuleParams<
  T extends string,
  PlaceholderMap extends Record<string, unknown>,
> = T extends `${string}[${infer P}]${infer Rest}`
  ? P extends keyof PlaceholderMap
    ? [PlaceholderMap[P], ...RuleParams<Rest, PlaceholderMap>]
    : [...RuleParams<Rest, PlaceholderMap>]
  : [];

type IPlaceholders = Record<
  string,
  { pattern: RegExp; parse: (s: string) => any }
>;

type PlaceholderMap<TPlaceholders extends IPlaceholders> = {
  [p in keyof TPlaceholders]: ReturnType<TPlaceholders[p]["parse"]>;
};

export class RuleBook<T extends string, TPlaceholders extends IPlaceholders> {
  private readonly templates: RuleTemplate<T, PlaceholderMap<TPlaceholders>>[];
  private readonly placeholders: TPlaceholders;

  constructor(templates: T[], placeholders: TPlaceholders) {
    this.templates = templates.map((t) => new RuleTemplate(t, placeholders));
    this.placeholders = placeholders;
  }

  createSet(rules: string[]): Ruleset<T, PlaceholderMap<TPlaceholders>> {
    return new Ruleset<T, PlaceholderMap<TPlaceholders>>(
      rules.map((rule) => {
        for (const template of this.templates) {
          const match = template.match(rule);
          if (match) return match;
        }
        throw new Error(`Could not parse: ${rule}`);
      }),
    );
  }

  mergeSets(
    ...sets: (
      | Ruleset<T, PlaceholderMap<TPlaceholders>>
      | null
      | undefined
      | false
    )[]
  ): Ruleset<T, PlaceholderMap<TPlaceholders>> {
    const rules = new Map<string, Rule>();
    sets.forEach((set) => {
      if (!set) return;
      set.rules.forEach((rule) => rules.set(rule.value, rule));
    });
    return new Ruleset(Array.from(rules.values()));
  }
}

/**
 * @internal
 */
export class RuleTemplate<
  T extends string,
  PlaceholderMap extends Record<string, unknown>,
> {
  readonly name: T;
  private regex: RegExp;
  private paramTypes: string[];
  private placeholders: IPlaceholders;

  constructor(template: T, placeholders: IPlaceholders) {
    this.name = template;
    this.placeholders = placeholders;

    const paramTypes: string[] = [];
    const pattern = template.replace(/\[([^\]]+)\]/g, (_, name: string) => {
      if (!(name in placeholders)) {
        throw new Error(`Unknown placeholder: ${name}`);
      }
      paramTypes.push(name);
      return `(${placeholders[name].pattern.toString().replaceAll(/(^\/)|(\/$)/g, "")})`;
    });

    this.regex = new RegExp(`^${pattern}$`);
    this.paramTypes = paramTypes;
  }

  match(value: string): Rule<T, RuleParams<T, PlaceholderMap>> | null {
    const match = value.match(this.regex);
    if (!match) return null;

    const params = this.paramTypes.map((type, i) => {
      const raw = match[i + 1];
      return this.placeholders[type].parse(raw);
    });

    return { value, template: this.name, params };
  }
}

export class Ruleset<
  T extends string,
  PlaceholderMap extends Record<string, unknown>,
> {
  readonly rules: Rule<T, RuleParams<T, PlaceholderMap>>[] = [];

  constructor(rules: Rule[]) {
    this.rules = rules as Rule<T, RuleParams<T, PlaceholderMap>>[];
  }

  get<U extends T>(template: U): RuleParams<U, PlaceholderMap>[] {
    return this.rules
      .filter((rule) => rule.template === template)
      .map((m) => m.params as RuleParams<U, PlaceholderMap>);
  }

  has(template: T): boolean {
    return this.get(template).length > 0;
  }
}
