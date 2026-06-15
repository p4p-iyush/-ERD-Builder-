// lib/utils/queryParser.ts

export type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS";

export interface ParsedJoin {
  type: JoinType;
  table: string;
  alias?: string;
  leftTable: string;
  leftColumn: string;
  rightTable: string;
  rightColumn: string;
}

export interface ParsedWhereColumn {
  table?: string;
  column: string;
  operator: string;
}

export interface ParsedSelectedColumn {
  table?: string;
  column: string;
  alias?: string;
  aggregateFn?: string;
}

export interface ParsedQuery {
  isValid: boolean;
  error?: string;
  /** All table names referenced in query */
  tables: string[];
  /** alias → real table name */
  aliasMap: Record<string, string>;
  fromTable: string;
  fromAlias?: string;
  joins: ParsedJoin[];
  selectedColumns: ParsedSelectedColumn[];
  whereColumns: ParsedWhereColumn[];
  groupByColumns: Array<{ table?: string; column: string }>;
  havingColumns: Array<{ table?: string; column: string; aggregateFn?: string }>;
  /**
   * Per-table column highlight map.
   * tableName → Set of column names used in any clause.
   */
  highlightMap: Record<string, Set<string>>;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function stripComments(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitDotRef(ref: string): { table?: string; column: string } {
  const clean = ref.replace(/["`[\]]/g, "");
  const parts = clean.split(".");
  if (parts.length >= 2) {
    return { table: parts[parts.length - 2], column: parts[parts.length - 1] };
  }
  return { column: clean };
}

function extractTableName(token: string): { table: string; alias?: string } {
  const clean = token.trim().replace(/["`[\]]/g, "");
  const parts = clean.split(/\s+/);
  // handle schema-qualified: public.orders → orders
  const table = parts[0].includes(".")
    ? parts[0].split(".").pop()!
    : parts[0];
  const alias =
    parts.length >= 3 && parts[1].toUpperCase() === "AS"
      ? parts[2]
      : parts.length === 2
      ? parts[1]
      : undefined;
  return { table, alias };
}

// ── Main parser ───────────────────────────────────────────────────────────

export function parseQuery(rawSql: string): ParsedQuery {
  const empty: ParsedQuery = {
    isValid: false,
    tables: [],
    aliasMap: {},
    fromTable: "",
    joins: [],
    selectedColumns: [],
    whereColumns: [],
    groupByColumns: [],
    havingColumns: [],
    highlightMap: {},
  };

  if (!rawSql?.trim()) return { ...empty, error: "Empty query" };

  const sql = stripComments(rawSql);
  const upper = sql.toUpperCase();

  if (!upper.trimStart().startsWith("SELECT")) {
    return { ...empty, error: "Only SELECT queries are supported" };
  }

  // ── FROM ─────────────────────────────────────────────────────────────────
  const fromMatch = sql.match(
    /\bFROM\s+([\w."'`[\]]+(?:\s+(?:AS\s+)?[\w]+)?)/i
  );
  if (!fromMatch) return { ...empty, error: "Could not find FROM clause" };

  const { table: fromTable, alias: fromAlias } = extractTableName(fromMatch[1]);
  const aliasMap: Record<string, string> = {};
  aliasMap[fromTable] = fromTable;
  if (fromAlias) aliasMap[fromAlias] = fromTable;

  // ── JOINs ────────────────────────────────────────────────────────────────
  const joinRegex =
    /\b(INNER\s+|LEFT(?:\s+OUTER)?\s+|RIGHT(?:\s+OUTER)?\s+|FULL(?:\s+OUTER)?\s+|CROSS\s+)?JOIN\s+([\w."'`[\]]+(?:\s+(?:AS\s+)?[\w]+)?)\s+ON\s+([\w.\s"'`[\]=]+?)(?=\b(?:INNER|LEFT|RIGHT|FULL|CROSS|WHERE|GROUP|HAVING|ORDER|LIMIT|UNION|$))/gi;

  const joins: ParsedJoin[] = [];
  let jm: RegExpExecArray | null;

  while ((jm = joinRegex.exec(sql)) !== null) {
    const rawType = (jm[1] ?? "INNER").trim().toUpperCase().split(/\s+/)[0];
    const joinType = (
      ["INNER", "LEFT", "RIGHT", "FULL", "CROSS"].includes(rawType)
        ? rawType
        : "INNER"
    ) as JoinType;

    const { table: joinTable, alias: joinAlias } = extractTableName(jm[2]);
    const condition = jm[3].trim();

    aliasMap[joinTable] = joinTable;
    if (joinAlias) aliasMap[joinAlias] = joinTable;

    // Parse ON a.col = b.col
    const onMatch = condition.match(/([\w.`"[\]]+)\s*=\s*([\w.`"[\]]+)/);
    let leftTable = fromTable,
      leftColumn = "",
      rightTable = joinTable,
      rightColumn = "";

    if (onMatch) {
      const left = splitDotRef(onMatch[1]);
      const right = splitDotRef(onMatch[2]);
      leftTable = left.table
        ? (aliasMap[left.table] ?? left.table)
        : fromTable;
      leftColumn = left.column;
      rightTable = right.table
        ? (aliasMap[right.table] ?? right.table)
        : joinTable;
      rightColumn = right.column;
    }

    joins.push({
      type: joinType,
      table: joinTable,
      alias: joinAlias,
      leftTable,
      leftColumn,
      rightTable,
      rightColumn,
    });
  }

  const allTables = [fromTable, ...joins.map((j) => j.table)];

  // ── SELECT columns ────────────────────────────────────────────────────────
  const fromIdx = upper.indexOf(" FROM ");
  const selectBody = fromIdx > 6 ? sql.slice(6, fromIdx).trim() : "";
  const selectedColumns: ParsedSelectedColumn[] = [];

  if (selectBody && selectBody !== "*") {
    for (const token of selectBody.split(",")) {
      const t = token.trim();
      // AGG(table.col) AS alias
      const aggMatch = t.match(/^(\w+)\(\s*([\w.*`"[\]]+)\s*\)(?:\s+AS\s+(\w+))?$/i);
      if (aggMatch) {
        const ref = splitDotRef(aggMatch[2]);
        selectedColumns.push({
          aggregateFn: aggMatch[1].toUpperCase(),
          table: ref.table ? (aliasMap[ref.table] ?? ref.table) : undefined,
          column: ref.column,
          alias: aggMatch[3],
        });
        continue;
      }
      // table.col AS alias  or  col AS alias
      const plainMatch = t.match(/^([\w.`"[\]]+)(?:\s+AS\s+(\w+))?$/i);
      if (plainMatch) {
        const ref = splitDotRef(plainMatch[1]);
        selectedColumns.push({
          table: ref.table ? (aliasMap[ref.table] ?? ref.table) : undefined,
          column: ref.column,
          alias: plainMatch[2],
        });
      }
    }
  }

  // ── WHERE columns ─────────────────────────────────────────────────────────
  const whereMatch = sql.match(
    /\bWHERE\s+([\s\S]+?)(?=\b(?:GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|UNION|$))/i
  );
  const whereColumns: ParsedWhereColumn[] = [];

  if (whereMatch) {
    const condRegex =
      /([\w.`"[\]]+)\s*(=|!=|<>|<=|>=|<|>|LIKE|ILIKE|IN|IS(?:\s+NOT)?\s+NULL|BETWEEN)/gi;
    let wm: RegExpExecArray | null;
    while ((wm = condRegex.exec(whereMatch[1])) !== null) {
      const ref = splitDotRef(wm[1]);
      // Skip SQL keywords accidentally matched
      if (["AND", "OR", "NOT"].includes(ref.column.toUpperCase())) continue;
      whereColumns.push({
        table: ref.table ? (aliasMap[ref.table] ?? ref.table) : undefined,
        column: ref.column,
        operator: wm[2].trim(),
      });
    }
  }

  // ── GROUP BY ──────────────────────────────────────────────────────────────
  const groupByMatch = sql.match(
    /\bGROUP\s+BY\s+([\s\S]+?)(?=\b(?:HAVING|ORDER\s+BY|LIMIT|UNION|$))/i
  );
  const groupByColumns: Array<{ table?: string; column: string }> = [];

  if (groupByMatch) {
    for (const part of groupByMatch[1].split(",")) {
      const ref = splitDotRef(part.trim());
      if (ref.column) {
        groupByColumns.push({
          table: ref.table ? (aliasMap[ref.table] ?? ref.table) : undefined,
          column: ref.column,
        });
      }
    }
  }

  // ── HAVING ────────────────────────────────────────────────────────────────
  const havingMatch = sql.match(
    /\bHAVING\s+([\s\S]+?)(?=\b(?:ORDER\s+BY|LIMIT|UNION|$))/i
  );
  const havingColumns: Array<{
    table?: string;
    column: string;
    aggregateFn?: string;
  }> = [];

  if (havingMatch) {
    const havingRegex =
      /(?:(\w+)\(\s*)?([\w.`"[\]]+)\s*(?:\))?\s*(?:=|!=|<>|<=|>=|<|>)/gi;
    let hm: RegExpExecArray | null;
    while ((hm = havingRegex.exec(havingMatch[1])) !== null) {
      const ref = splitDotRef(hm[2]);
      if (ref.column) {
        havingColumns.push({
          aggregateFn: hm[1]?.toUpperCase(),
          table: ref.table ? (aliasMap[ref.table] ?? ref.table) : undefined,
          column: ref.column,
        });
      }
    }
  }

  // ── Build highlight map ───────────────────────────────────────────────────
  const highlightMap: Record<string, Set<string>> = {};

  const addHighlight = (table: string | undefined, column: string) => {
    if (!column || column === "*") return;
    const realTable = table ?? fromTable;
    if (!highlightMap[realTable]) highlightMap[realTable] = new Set();
    highlightMap[realTable].add(column);
  };

  for (const col of selectedColumns) addHighlight(col.table, col.column);
  for (const join of joins) {
    addHighlight(join.leftTable, join.leftColumn);
    addHighlight(join.rightTable, join.rightColumn);
  }
  for (const col of whereColumns) addHighlight(col.table, col.column);
  for (const col of groupByColumns) addHighlight(col.table, col.column);
  for (const col of havingColumns) addHighlight(col.table, col.column);

  return {
    isValid: true,
    tables: allTables,
    aliasMap,
    fromTable,
    fromAlias,
    joins,
    selectedColumns,
    whereColumns,
    groupByColumns,
    havingColumns,
    highlightMap,
  };
}

// ── Clause tag helper ─────────────────────────────────────────────────────

export type ClauseTag = "SELECT" | "JOIN" | "WHERE" | "GROUP BY" | "HAVING";

export function getColumnClauses(
  parsed: ParsedQuery,
  tableName: string,
  columnName: string
): ClauseTag[] {
  const clauses = new Set<ClauseTag>();

  for (const col of parsed.selectedColumns) {
    if (col.column === columnName && (!col.table || col.table === tableName))
      clauses.add("SELECT");
  }
  for (const join of parsed.joins) {
    if (
      (join.leftTable === tableName && join.leftColumn === columnName) ||
      (join.rightTable === tableName && join.rightColumn === columnName)
    )
      clauses.add("JOIN");
  }
  for (const col of parsed.whereColumns) {
    if (col.column === columnName && (!col.table || col.table === tableName))
      clauses.add("WHERE");
  }
  for (const col of parsed.groupByColumns) {
    if (col.column === columnName && (!col.table || col.table === tableName))
      clauses.add("GROUP BY");
  }
  for (const col of parsed.havingColumns) {
    if (col.column === columnName && (!col.table || col.table === tableName))
      clauses.add("HAVING");
  }

  return Array.from(clauses);
}