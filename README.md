# 📘 RuleBook

A tiny, type-safe rule parsing system for TypeScript.

Designed for game development.

Define string templates with typed placeholders, parse runtime values into strongly-typed parameters, and query them safely.

## ✨ Features

🧩 Template-based string matching ("user:[id]")
🔒 Fully type-safe parameter inference
⚡ Fast runtime matching using compiled RegExp
🧠 Typed query API (ruleset.get(...))
🔗 Merge multiple rule sets easily

## 📦 Installation

```bash
npm install rulebook-ts
```

## 🚀 Quick Start

```ts
import { RuleBook } from "rulebook-ts";

const placeholders = {
  id: {
    pattern: /\d+/,
    parse: (s: string) => Number(s),
  },
  slug: {
    pattern: /[a-z-]+/,
    parse: (s: string) => s,
  },
};

const templates = ["user:[id]", "post:[slug]"] as const;

const book = new RuleBook(templates, placeholders);

const ruleset = book.createSet(["user:42", "post:hello-world"]);
```

## 🧠 Type Inference

The magic is that parameters are inferred directly from your template:

```ts
const users = ruleset.get("user:[id]");
//     ⇖ [number][]

const posts = ruleset.get("post:[slug]");
//     ⇖ [string][]
```

Each entry corresponds to one matched rule.

## 🔍 API

### `new RuleBook(templates, placeholders)`

Create a rule book.

#### Templates

An array of template strings:

```ts
"user:[id]";
"post:[slug]";
```

Use `as const` to preserve literal types.

#### Placeholders

A map of placeholder definitions:

```ts
const placeholders = {
  id: {
    pattern: /\d+/,
    parse: (s: string) => Number(s),
  },
};
```

- `pattern`: RegExp used for matching
- `parse`: transforms matched string into typed value

### `createSet(rules: string[]): Ruleset`

Parse a list of strings into a typed ruleset.

```ts
const ruleset = book.createSet(["user:1", "user:2"]);
```

Throws if a rule does not match any template.

```ts
ruleset.get(template);
```

Get all parsed params for a template.

```ts
ruleset.get("user:[id]");
// => [[1], [2]]
ruleset.has(template);
```

Check if any rule matches a template:

```ts
ruleset.has("user:[id]"); // true
```

### `mergeSets(...sets)`

Merge multiple rulesets into one (deduplicated by value):

```ts
const merged = book.mergeSets(setA, setB);
```

Falsy values are ignored, so this is safe:

```ts
book.mergeSets(setA, maybeSet && setB);
```

## 🧩 Multiple Parameters

Templates can contain multiple placeholders:

```ts
const templates = ["range:[min]-[max]"] as const;

const placeholders = {
  min: {
    pattern: /\d+/,
    parse: Number,
  },
  max: {
    pattern: /\d+/,
    parse: Number,
  },
};

const book = new RuleBook(templates, placeholders);

const ruleset = book.createSet(["range:10-20"]);

ruleset.get("range:[min]-[max]");
// => [[10, 20]]
```

## ❗ Errors

### `Unknown placeholder`

If a template references a placeholder that is not defined:

```ts
"user:[unknown]";
```

➡️ Throws at construction time.

### `Unmatched rule`

If a rule doesn't match any template:

```ts
book.createSet(["invalid"]);
```

➡️ Throws at construction time.

## 🧪 Tips

### Preserve literal types

Always use `as const`:

```ts
const templates = ["user:[id]"] as const;
```

Otherwise, TypeScript will treat them as `string[]` and you’ll lose inference.

### Keep parsing pure

Your parse functions should be deterministic and side-effect free.

## 📄 License

MIT
