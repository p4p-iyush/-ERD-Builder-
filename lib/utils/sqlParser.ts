import { v4 as uuidv4 } from "uuid";
import type { TableNode, RelationshipEdge } from "../../types/diagram";
import type { Column, DataType } from "../../types/column";

// ── Helpers ───────────────────────────────────────────────────────────────

function stripComments(sql: string): string {
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, "");
  sql = sql.replace(/--[^\n]*/g, "");
  return sql;
}

function normalizeWhitespace(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function unquote(name: string): string {
  return name.replace(/^["'`]|["'`]$/g, "").trim();
}

// ── Data type mapper ──────────────────────────────────────────────────────

function mapToDataType(raw: string): DataType {
  const t = raw.toLowerCase().trim();

  if (/^(bigserial|bigint\s+generated)/.test(t)) return "bigserial";
  if (/^serial/.test(t))                          return "serial";
  if (/^bigint/.test(t))                          return "bigint";
  if (/^smallint/.test(t))                        return "smallint";
  if (/^int/.test(t))                             return "integer";
  if (/^integer/.test(t))                         return "integer";
  if (/^numeric/.test(t))                         return "numeric";
  if (/^decimal/.test(t))                         return "decimal";
  if (/^float|^real|^double/.test(t))             return "float";
  if (/^bool/.test(t))                            return "boolean";
  if (/^uuid/.test(t))                            return "uuid";
  if (/^jsonb/.test(t))                           return "jsonb";
  if (/^json/.test(t))                            return "json";
  if (/^timestamptz|^timestamp with/.test(t))     return "timestamptz";
  if (/^timestamp/.test(t))                       return "timestamp";
  if (/^date/.test(t))                            return "date";
  if (/^text/.test(t))                            return "text";
  if (/^varchar|^character varying/.test(t))      return "varchar";
  if (/^char/.test(t))                            return "varchar";

  return "string";
}

// ── Column parser ─────────────────────────────────────────────────────────

interface ParsedColumn {
  name:         string;
  dataType:     DataType;
  isPrimaryKey: boolean;
  isUnique:     boolean;
  isNullable:   boolean;
  defaultValue: string;
}

interface ParsedConstraint {
  type:            "pk" | "fk" | "unique";
  columns:         string[];
  refTable?:       string;
  refColumns?:     string[];
  constraintName?: string;
}

function parseColumnDef(def: string): ParsedColumn | null {
  def = normalizeWhitespace(def);

  if (/^(PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK|CONSTRAINT|INDEX)/i.test(def)) {
    return null;
  }

  const colMatch = def.match(
    /^["'`]?(\w+)["'`]?\s+([A-Z][A-Z0-9\s\(\),]*?)(?:\s+(.*?))?$/i
  );
  if (!colMatch) return null;

  const name    = unquote(colMatch[1]);
  const typeRaw = colMatch[2].trim();
  const rest    = (colMatch[3] ?? "").toUpperCase();

  const dataType     = mapToDataType(typeRaw);
  const isPrimaryKey = /PRIMARY\s+KEY/.test(rest);
  const isUnique     = /\bUNIQUE\b/.test(rest) || isPrimaryKey;
  const isNullable   = !isPrimaryKey && !/NOT\s+NULL/.test(rest);

  const defaultMatch = rest.match(/DEFAULT\s+(\S+)/i);
  const defaultValue = defaultMatch
    ? def.match(/DEFAULT\s+(\S+)/i)?.[1] ?? ""
    : "";

  return { name, dataType, isPrimaryKey, isUnique, isNullable, defaultValue };
}

// ── Table-level constraint parser ─────────────────────────────────────────

function parseConstraint(def: string): ParsedConstraint | null {
  def = normalizeWhitespace(def);

  const pkMatch = def.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
  if (pkMatch) {
    return {
      type:    "pk",
      columns: pkMatch[1].split(",").map((c) => unquote(c.trim())),
    };
  }

  const uqMatch = def.match(/UNIQUE\s*\(([^)]+)\)/i);
  if (uqMatch) {
    return {
      type:    "unique",
      columns: uqMatch[1].split(",").map((c) => unquote(c.trim())),
    };
  }

  const fkMatch = def.match(
    /FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["'`]?(\w+)["'`]?\s*\(([^)]+)\)/i
  );
  if (fkMatch) {
    return {
      type:       "fk",
      columns:    fkMatch[1].split(",").map((c) => unquote(c.trim())),
      refTable:   unquote(fkMatch[2]),
      refColumns: fkMatch[3].split(",").map((c) => unquote(c.trim())),
    };
  }

  const namedFkMatch = def.match(
    /CONSTRAINT\s+["'`]?\w+["'`]?\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["'`]?(\w+)["'`]?\s*\(([^)]+)\)/i
  );
  if (namedFkMatch) {
    return {
      type:       "fk",
      columns:    namedFkMatch[1].split(",").map((c) => unquote(c.trim())),
      refTable:   unquote(namedFkMatch[2]),
      refColumns: namedFkMatch[3].split(",").map((c) => unquote(c.trim())),
    };
  }

  return null;
}

// ── CREATE TABLE parser ───────────────────────────────────────────────────

interface ParsedTable {
  tableName:   string;
  columns:     Column[];
  constraints: ParsedConstraint[];
}

function parseCreateTable(sql: string): ParsedTable | null {
  const tableMatch = sql.match(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(([\s\S]+)\)/i
  );
  if (!tableMatch) return null;

  const tableName = unquote(tableMatch[1]);
  const body      = tableMatch[2];

  const defs: string[] = [];
  let depth   = 0;
  let current = "";

  for (const ch of body) {
    if (ch === "(")                    { depth++; current += ch; }
    else if (ch === ")")               { depth--; current += ch; }
    else if (ch === "," && depth === 0){ defs.push(current.trim()); current = ""; }
    else                               { current += ch; }
  }
  if (current.trim()) defs.push(current.trim());

  const columns:     Column[]           = [];
  const constraints: ParsedConstraint[] = [];

  defs.forEach((def, idx) => {
    const constraint = parseConstraint(def);
    if (constraint) { constraints.push(constraint); return; }

    const col = parseColumnDef(def);
    if (col) {
      columns.push({
        id:           uuidv4(),
        name:         col.name,
        dataType:     col.dataType,
        isPrimaryKey: col.isPrimaryKey,
        isForeignKey: false,
        isUnique:     col.isUnique,
        isNullable:   col.isNullable,
        defaultValue: col.defaultValue,
        order:        idx,
      });
    }
  });

  // Apply table-level constraints to columns
  constraints.forEach((c) => {
    if (c.type === "pk") {
      c.columns.forEach((colName) => {
        const col = columns.find((col) => col.name === colName);
        if (col) { col.isPrimaryKey = true; col.isUnique = true; col.isNullable = false; }
      });
    }
    if (c.type === "unique") {
      c.columns.forEach((colName) => {
        const col = columns.find((col) => col.name === colName);
        if (col) col.isUnique = true;
      });
    }
    if (c.type === "fk") {
      c.columns.forEach((colName) => {
        const col = columns.find((col) => col.name === colName);
        if (col) {
          col.isForeignKey     = true;
          col.referencedTable  = c.refTable;
          col.referencedColumn = c.refColumns?.[0] ?? "id";
        }
      });
    }
  });

  return { tableName, columns, constraints };
}

// ── ALTER TABLE parser ────────────────────────────────────────────────────

export interface AlterFKAction {
  tableName:  string;
  columnName: string;
  refTable:   string;
  refColumn:  string;
}

function parseAlterTable(sql: string): AlterFKAction | null {
  const match = sql.match(
    /ALTER\s+TABLE\s+["'`]?(\w+)["'`]?\s+ADD\s+(?:CONSTRAINT\s+["'`]?\w+["'`]?\s+)?FOREIGN\s+KEY\s*\(["'`]?(\w+)["'`]?\)\s+REFERENCES\s+["'`]?(\w+)["'`]?\s*\(["'`]?(\w+)["'`]?\)/i
  );
  if (!match) return null;

  return {
    tableName:  unquote(match[1]),
    columnName: unquote(match[2]),
    refTable:   unquote(match[3]),
    refColumn:  unquote(match[4]),
  };
}

// ── INSERT INTO parser ────────────────────────────────────────────────────

function parseInsertTable(sql: string): string | null {
  const match = sql.match(/INSERT\s+INTO\s+["'`]?(\w+)["'`]?/i);
  return match ? unquote(match[1]) : null;
}

// ── Parse result ──────────────────────────────────────────────────────────

export interface SQLParseResult {
  tables:       ParsedTable[];
  alterActions: AlterFKAction[];
  insertTables: string[];
  errors:       string[];
  warnings:     string[];
}

// ── Main parser ───────────────────────────────────────────────────────────

export function parseSQL(sql: string): SQLParseResult {
  const errors:       string[]        = [];
  const warnings:     string[]        = [];
  const tables:       ParsedTable[]   = [];
  const alterActions: AlterFKAction[] = [];
  const insertTables: string[]        = [];

  if (!sql.trim()) {
    return { tables, alterActions, insertTables, errors, warnings };
  }

  const cleaned    = stripComments(sql);
  const statements = cleaned
    .split(/;/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  statements.forEach((stmt, idx) => {
    const upper = stmt.toUpperCase().trimStart();

    try {
      if (upper.startsWith("CREATE TABLE")) {
        const parsed = parseCreateTable(stmt);
        if (parsed) {
          tables.push(parsed);
        } else {
          errors.push(`Statement ${idx + 1}: Could not parse CREATE TABLE.`);
        }
      } else if (upper.startsWith("ALTER TABLE")) {
        const action = parseAlterTable(stmt);
        if (action) {
          alterActions.push(action);
        } else {
          warnings.push(
            `Statement ${idx + 1}: ALTER TABLE skipped ` +
            `(only ADD FOREIGN KEY is supported).`
          );
        }
      } else if (upper.startsWith("INSERT INTO")) {
        const tbl = parseInsertTable(stmt);
        if (tbl) insertTables.push(tbl);
      } else if (
        upper.startsWith("CREATE EXTENSION") ||
        upper.startsWith("CREATE INDEX") ||
        upper.startsWith("CREATE UNIQUE INDEX") ||
        upper.startsWith("COMMENT ON") ||
        upper.startsWith("SET ") ||
        upper.startsWith("--")
      ) {
        // Silently skip
      } else if (upper.length > 0) {
        warnings.push(
          `Statement ${idx + 1}: Skipped — ` +
          `"${stmt.slice(0, 40)}…".`
        );
      }
    } catch (err) {
      errors.push(
        `Statement ${idx + 1}: Parse error — ` +
        `${err instanceof Error ? err.message : String(err)}`
      );
    }
  });

  return { tables, alterActions, insertTables, errors, warnings };
}

// ── Auto-layout grid positions ────────────────────────────────────────────

export function autoLayoutNodes(nodes: TableNode[]): TableNode[] {
  if (nodes.length === 0) return nodes;

  const MAX_COLS   = nodes.length <= 2 ? nodes.length : 3;
  const COL_WIDTH  = 320;
  const ROW_HEIGHT = 280;
  const START_X    = 80;
  const START_Y    = 80;

  return nodes.map((node, idx) => ({
    ...node,
    position: {
      x: START_X + (idx % MAX_COLS) * COL_WIDTH,
      y: START_Y + Math.floor(idx / MAX_COLS) * ROW_HEIGHT,
    },
  }));
}

// ── Auto-generate edges from FK columns + ALTER TABLE ─────────────────────

export function generateEdgesFromNodes(
  nodes:        TableNode[],
  alterActions: AlterFKAction[]
): RelationshipEdge[] {
  const edges:   RelationshipEdge[] = [];
  const edgeSet  = new Set<string>();

  const tableIdMap = new Map<string, string>(
    nodes.map((n) => [n.data.tableName.toLowerCase(), n.id])
  );

  // From FK columns
  nodes.forEach((node) => {
    node.data.columns
      .filter((col) => col.isForeignKey && col.referencedTable)
      .forEach((col) => {
        const targetId = tableIdMap.get(col.referencedTable!.toLowerCase());
        if (!targetId) return;

        const key = `${node.id}->${targetId}`;
        if (edgeSet.has(key)) return;
        edgeSet.add(key);

        edges.push({
          id:     uuidv4(),
          source: node.id,
          target: targetId,
          type:   "relationshipEdge",
          data: {
            relationshipType: "one-to-many",
            label:            "",
            style:            "curved",
            sourceColumnId:   col.id,
            targetColumnId:   col.referencedColumn ?? "id",
          },
        });
      });
  });

  // From ALTER TABLE foreign keys
  alterActions.forEach((action) => {
    const sourceId = tableIdMap.get(action.tableName.toLowerCase());
    const targetId = tableIdMap.get(action.refTable.toLowerCase());
    if (!sourceId || !targetId) return;

    const key = `${sourceId}->${targetId}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);

    edges.push({
      id:     uuidv4(),
      source: sourceId,
      target: targetId,
      type:   "relationshipEdge",
      data: {
        relationshipType: "one-to-many",
        label:            "",
        style:            "curved",
        sourceColumnId:   action.columnName,
        targetColumnId:   action.refColumn,
      },
    });
  });

  return edges;
}

// ── Smart replace + keep strategy ─────────────────────────────────────────

export function applySmartReplace(
  result:        SQLParseResult,
  existingNodes: TableNode[],
  existingEdges: RelationshipEdge[]
): {
  nodes:    TableNode[];
  edges:    RelationshipEdge[];
  replaced: string[];
  kept:     string[];
  added:    string[];
} {
  const TABLE_COLORS = [
    "#6270f1","#10b981","#f59e0b","#ef4444",
    "#3b82f6","#8b5cf6","#ec4899","#14b8a6",
    "#f97316","#84cc16",
  ];

  // Names coming in from new SQL
  const incomingNames = new Set(
    result.tables.map((t) => t.tableName.toLowerCase())
  );

  // Tables NOT in new SQL → keep untouched
  const keptNodes = existingNodes.filter(
    (n) => !incomingNames.has(n.data.tableName.toLowerCase())
  );

  const replaced: string[] = [];
  const added:    string[] = [];

  const existingNameMap = new Map(
    existingNodes.map((n) => [n.data.tableName.toLowerCase(), n])
  );

  // Build fresh nodes from parsed SQL
  const newNodes: TableNode[] = result.tables.map((parsed, idx) => {
    const nameLower = parsed.tableName.toLowerCase();
    const existed   = existingNameMap.has(nameLower);

    if (existed) replaced.push(parsed.tableName);
    else         added.push(parsed.tableName);

    const color =
      TABLE_COLORS[(keptNodes.length + idx) % TABLE_COLORS.length];

    return {
      id:       uuidv4(),
      type:     "tableNode" as const,
      position: { x: 0, y: 0 }, // set by autoLayoutNodes below
      data: {
        tableName:     parsed.tableName,
        columns:       parsed.columns,
        color,
        isHighlighted: false,
        isFaded:       false,
      },
    };
  });

  // Apply ALTER TABLE FK actions to new nodes
  result.alterActions.forEach((action) => {
    const targetNode = newNodes.find(
      (n) => n.data.tableName.toLowerCase() === action.tableName.toLowerCase()
    );
    if (!targetNode) return;
    const col = targetNode.data.columns.find(
      (c) => c.name.toLowerCase() === action.columnName.toLowerCase()
    );
    if (col) {
      col.isForeignKey     = true;
      col.referencedTable  = action.refTable;
      col.referencedColumn = action.refColumn;
    }
  });

  // Auto-layout ALL nodes (kept + new) together in one clean grid
  const combined = autoLayoutNodes([...keptNodes, ...newNodes]);

  // Remove edges that pointed to replaced/deleted table IDs
  const replacedIds = new Set(
    existingNodes
      .filter((n) => incomingNames.has(n.data.tableName.toLowerCase()))
      .map((n) => n.id)
  );

  const survivingEdges = existingEdges.filter(
    (e) => !replacedIds.has(e.source) && !replacedIds.has(e.target)
  );

  // Generate fresh edges for new nodes
  const freshEdges = generateEdgesFromNodes(combined, result.alterActions);

  // Merge: surviving old + fresh new (deduplicated by source→target pair)
  const existingEdgePairs = new Set(
    survivingEdges.map((e) => `${e.source}->${e.target}`)
  );
  const uniqueFreshEdges = freshEdges.filter(
    (e) => !existingEdgePairs.has(`${e.source}->${e.target}`)
  );

  return {
    nodes:    combined,
    edges:    [...survivingEdges, ...uniqueFreshEdges],
    replaced,
    kept:     keptNodes.map((n) => n.data.tableName),
    added,
  };
}

// ── Legacy merge helper (kept for backward compatibility) ─────────────────

export function parsedTablesToNodes(
  result:        SQLParseResult,
  existingNodes: TableNode[]
): {
  newNodes: TableNode[];
  skipped:  string[];
  merged:   string[];
} {
  const skipped:  string[]     = [];
  const merged:   string[]     = [];
  const newNodes: TableNode[]  = [];

  const TABLE_COLORS = [
    "#6270f1","#10b981","#f59e0b","#ef4444",
    "#3b82f6","#8b5cf6","#ec4899","#14b8a6",
    "#f97316","#84cc16",
  ];

  const existingNames = new Set(
    existingNodes.map((n) => n.data.tableName.toLowerCase())
  );

  result.tables.forEach((parsed, idx) => {
    const nameLower = parsed.tableName.toLowerCase();
    if (existingNames.has(nameLower)) { skipped.push(parsed.tableName); return; }

    const color =
      TABLE_COLORS[(existingNodes.length + newNodes.length) % TABLE_COLORS.length];

    newNodes.push({
      id:       uuidv4(),
      type:     "tableNode",
      position: {
        x: 80 + (idx % 3) * 320,
        y: 80 + Math.floor(idx / 3) * 280,
      },
      data: {
        tableName:     parsed.tableName,
        columns:       parsed.columns,
        color,
        isHighlighted: false,
        isFaded:       false,
      },
    });
    merged.push(parsed.tableName);
    existingNames.add(nameLower);
  });

  return { newNodes, skipped, merged };
}