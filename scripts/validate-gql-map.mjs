#!/usr/bin/env node
/**
 * scripts/validate-gql-map.mjs
 *
 * Offline validation of every `GQL_MAP` entry against the BFF's real GraphQL schema.
 *
 * WHY THIS EXISTS
 * ---------------
 * When `VITE_USE_GRAPHQL === "true"` the hybrid base query has no REST fallback
 * (`src/core/store/api/hybridBaseQuery.ts`): a mapping whose root/operation/field the BFF does
 * not define is a hard, user-facing failure. Nothing in `tsc` or eslint can see that - the
 * mapping is a string template. Two real defects this catches, both invisible to the compiler:
 *
 *   1. `root: "Organization"` on `/organizations/:orgId/map-settings` and
 *      `/organizations/:orgId/assignment-rules` - the BFF has no `Organization` root at all.
 *   2. Fields requested in `fields:` that no longer exist on the operation's return type. A
 *      GraphQL document requests a projection; the "read model" in `src/**\/types` does not
 *      describe it (see the anti-regression lesson on `GET_LIST_CASE_QUERY.fields`).
 *
 * HOW IT WORKS
 * ------------
 * 1. Introspects the BFF (anonymous introspection is open on staging; all operations are sent
 *    as a field selection, so nothing beyond the schema is exposed).
 * 2. Re-parses every `src/**\/store/api/graphql/*Queries.ts` entry with the same shape
 *    `buildGraphQLQuery` builds (`gqlMapper.ts`) and walks the selection set against the schema.
 *
 * The document is never sent, so this needs no token and cannot mutate data.
 *
 * USAGE
 *   node scripts/validate-gql-map.mjs                       # uses VITE_GRAPHQL_BASE_URL from .env
 *   node scripts/validate-gql-map.mjs https://host/graphql   # explicit endpoint
 *   exit code 1 when any entry fails.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GRAPHQL_DIRS = ["src/core/store/api/graphql", "src/cms/store/api/graphql", "src/cc/store/api/graphql"];

const readEnvUrl = () => {
  for (const f of [".env.local", ".env.dev", ".env"]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, "utf8").match(/^VITE_GRAPHQL_BASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
    if (m) return m[1].trim();
  }
  return null;
};

const endpoint = process.argv[2] || process.env.VITE_GRAPHQL_BASE_URL || readEnvUrl();
if (!endpoint) {
  console.error("No GraphQL endpoint: pass one as argv[2] or set VITE_GRAPHQL_BASE_URL.");
  process.exit(2);
}

// ---------------------------------------------------------------- introspection
const INTROSPECT = `query SchemaProbe {
  __schema {
    queryType { name }
    mutationType { name }
    types {
      name kind
      fields { name args { name type { kind name ofType { kind name ofType { kind name } } } } type { kind name ofType { kind name } } }
      inputFields { name type { kind name ofType { kind name ofType { kind name } } } }
    }
  }
}`;

const typeMap = new Map();
const schema = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: INTROSPECT }),
}).then((r) => r.json());

if (!schema.data?.__schema) {
  console.error("Introspection failed:", JSON.stringify(schema.errors ?? schema).slice(0, 400));
  process.exit(2);
}
for (const t of schema.data.__schema.types) typeMap.set(t.name, t);

const namedType = (t) => {
  let cur = t;
  while (cur && (cur.kind === "NON_NULL" || cur.kind === "LIST")) cur = cur.ofType;
  return cur?.name ?? null;
};

// ---------------------------------------------------------------- parse maps
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".ts")) out.push(p);
  }
  return out;
};

const blockAt = (c, i) => {
  let depth = 0;
  for (let j = i; j < c.length; j++) {
    if (c[j] === "{") depth++;
    else if (c[j] === "}") { depth--; if (depth === 0) return c.slice(i, j + 1); }
  }
  return c.slice(i);
};
const props = (body) => {
  const out = {};
  for (const key of ["operationName", "root", "inputType", "fields", "mutation"]) {
    const m = body.match(new RegExp(`\\b${key}\\s*:\\s*(\`[^\`]*\`|"[^"]*"|'[^']*'|true|false)`));
    if (!m) continue;
    // `mutation: true` is a boolean in the source - keep it one, or every mutation is
    // validated against the Query root and reported as a phantom defect.
    out[key] = m[1] === "true" ? true : m[1] === "false" ? false : m[1].replace(/^[`"']|[`"']$/g, "");
  }
  return out;
};

/** Entries as {key, method, config} - the shape matchUrl/buildGraphQLQuery consume. */
const readEntries = () => {
  const entries = [];
  for (const dir of GRAPHQL_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      // Comment lines are dropped before parsing. Documentation *quotes* the strings it describes
      // ("/role/add must be declared before /role/:id"), and a scanner that reads raw source sees
      // those quotes as real entries - which is how a validator ends up reporting its own prose.
      const c = fs
        .readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
        .join("\n");
      const consts = {};
      const cre = /const\s+([A-Z0-9_]+)\s*=\s*\{/g;
      let cm;
      while ((cm = cre.exec(c))) consts[cm[1]] = props(blockAt(c, c.indexOf("{", cm.index + cm[0].length - 1)));
      const kre = /"(\/[^"]*)"\s*:\s*/g;
      let km;
      while ((km = kre.exec(c))) {
        const key = km[1];
        const after = c.slice(km.index + km[0].length);
        const rel = path.relative(ROOT, file).replace(/\\/g, "/");
        if (after.startsWith("{")) {
          const body = blockAt(after, 0);
          if (/\boperationName\s*:/.test(body)) entries.push({ key, method: "*", config: props(body), file: rel });
          else {
            const mre = /([{,]\s*|\n\s*)(GET|POST|PUT|PATCH|DELETE)\s*:\s*([A-Z0-9_]+)/g;
            let mm;
            while ((mm = mre.exec(body))) {
              const cfg = consts[mm[3]] ?? {};
              entries.push({ key, method: mm[2], config: cfg, file: rel });
            }
          }
        } else {
          const id = (after.match(/^([A-Z0-9_]+)/) || [])[1];
          entries.push({ key, method: "*", config: consts[id] ?? {}, file: rel });
        }
      }
    }
  }
  return entries;
};

// ---------------------------------------------------------------- selection-set check
/** "status msg data { id name }" -> [{name,children}], so nested sets are checked against the
 *  nested type instead of being flattened onto the parent (which invents defects). */
const parseSelection = (text) => {
  const out = [];
  let i = 0;
  const readList = (stopAtBrace) => {
    const items = [];
    let buf = "";
    while (i < text.length) {
      const ch = text[i];
      if (ch === "{") {
        i++;
        const children = readList(true);
        if (buf.trim()) items.push({ name: buf.trim(), children });
        buf = "";
        continue;
      }
      if (ch === "}") {
        i++;
        if (buf.trim()) items.push({ name: buf.trim(), children: [] });
        if (stopAtBrace) return items;
        buf = "";
        continue;
      }
      if (/\s/.test(ch) || ch === ",") {
        if (buf.trim()) { items.push({ name: buf.trim(), children: [] }); buf = ""; }
        i++;
        continue;
      }
      buf += ch;
      i++;
    }
    if (buf.trim()) items.push({ name: buf.trim(), children: [] });
    return items;
  };
  return readList(false);
};

const checkSelection = (typeName, selection) => {
  const problems = [];
  const t = typeMap.get(typeName);
  if (!t) return [`type ${typeName} not in schema`];
  for (const field of parseSelection(selection)) {
    const fieldName = field.name.split(":")[0].split("(")[0];
    const def = t.fields?.find((f) => f.name === fieldName);
    if (!def) {
      problems.push(`${typeName}.${fieldName} does not exist`);
      continue;
    }
    if (field.children.length) {
      const childType = namedType(def.type);
      const childDef = typeMap.get(childType);
      if (!childDef?.fields) problems.push(`${typeName}.${fieldName} is ${childType} (not selectable) but has a selection set`);
      else problems.push(...checkSelection(childType, field.children.map((c) => (c.children.length ? `${c.name} { ${c.children.map((x) => x.name).join(" ")} }` : c.name)).join(" ")));
    }
  }
  return problems;
};

const checkEntry = (entry) => {
  const { config, method } = entry;
  const problems = [];
  if (!config.operationName || !config.root) return { problems: ["entry has no operationName/root"], skipped: true };

  // `buildGraphQLQuery` picks the document keyword from `config.mutation` ALONE - the HTTP method
  // only decides which key applies and how the input is cleaned. A POST mapped to a read
  // (`{ POST: GET_FORM_LINK_WF_QUERY }`) is therefore a `query` on the wire, and must be checked
  // against the Query root or this reports a phantom "Mutation.X does not exist".
  const isMutation = config.mutation === true;
  const containerName = isMutation ? schema.data.__schema.mutationType?.name : schema.data.__schema.queryType?.name;
  const container = typeMap.get(containerName);
  const rootField = container?.fields?.find((f) => f.name === config.root);
  if (!rootField) {
    problems.push(`${isMutation ? "Mutation" : "Query"}.${config.root} does not exist (mapped root is unknown to the BFF)`);
    return { problems };
  }
  const rootType = namedType(rootField.type);
  const rootTypeDef = typeMap.get(rootType);
  const op = rootTypeDef?.fields?.find((f) => f.name === config.operationName);
  if (!op) {
    problems.push(`${rootType}.${config.operationName} does not exist`);
    return { problems };
  }
  if (config.inputType) {
    const baseInput = config.inputType.replace(/[[\]!]/g, "");
    const inputDef = typeMap.get(baseInput);
    if (!inputDef || inputDef.kind !== "INPUT_OBJECT") problems.push(`input type ${baseInput} is not an input type in the schema`);
    const declared = op.args?.[0]?.name;
    if (declared && declared !== "input") problems.push(`operation's argument is named "${declared}", the mapper always sends "input"`);
  }
  const returnType = namedType(op.type);
  problems.push(...checkSelection(returnType, config.fields ?? ""));
  return { problems };
};

// ---------------------------------------------------------------- report
const entries = readEntries();
const failures = [];
for (const e of entries) {
  const { problems } = checkEntry(e);
  if (problems.length) failures.push({ ...e, problems });
}

console.log(`validated ${entries.length} GQL_MAP entries against ${endpoint}`);
if (!failures.length) {
  console.log("PASS - every root, operation, input type and requested field exists in the BFF schema.");
  process.exit(0);
}
console.log(`FAIL - ${failures.length} entries reference something the BFF does not define:\n`);
for (const f of failures) {
  console.log(`  ${f.file}`);
  console.log(`    ${f.method === "*" ? "ANY" : f.method} ${f.key} -> ${f.config.root ?? "?"}.${f.config.operationName ?? "?"}`);
  for (const p of f.problems) console.log(`      - ${p}`);
}
process.exit(1);
