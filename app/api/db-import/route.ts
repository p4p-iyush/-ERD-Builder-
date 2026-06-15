// app/api/db-import/route.ts
import { NextRequest, NextResponse } from "next/server";

export interface ImportedColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
  referencedTable?: string;
  referencedColumn?: string;
}

export interface ImportedTable {
  tableName: string;
  columns: ImportedColumn[];
}

export interface ImportedRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface DBImportResult {
  tables: ImportedTable[];
  relationships: ImportedRelationship[];
  dbName: string;
}

function mapPgType(pgType: string): string {
  const typeMap: Record<string, string> = {
    "character varying": "VARCHAR",
    varchar: "VARCHAR",
    text: "TEXT",
    integer: "INTEGER",
    int4: "INTEGER",
    int: "INTEGER",
    bigint: "BIGINT",
    int8: "BIGINT",
    smallint: "SMALLINT",
    int2: "SMALLINT",
    boolean: "BOOLEAN",
    bool: "BOOLEAN",
    "double precision": "FLOAT",
    float8: "FLOAT",
    real: "FLOAT",
    float4: "FLOAT",
    numeric: "DECIMAL",
    decimal: "DECIMAL",
    date: "DATE",
    "timestamp without time zone": "TIMESTAMP",
    "timestamp with time zone": "TIMESTAMPTZ",
    timestamptz: "TIMESTAMPTZ",
    timestamp: "TIMESTAMP",
    uuid: "UUID",
    json: "JSON",
    jsonb: "JSONB",
    bytea: "BYTEA",
    char: "CHAR",
    "USER-DEFINED": "TEXT",
  };
  return typeMap[pgType.toLowerCase()] ?? "TEXT";
}

export async function POST(req: NextRequest) {
  let connectionString: string;

  try {
    const body = await req.json();
    connectionString = body.connectionString;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!connectionString) {
    return NextResponse.json({ error: "connectionString is required" }, { status: 400 });
  }

  let Client: any;
  try {
    const pg = await import("pg");
    Client = pg.Client ?? pg.default?.Client;
  } catch {
    return NextResponse.json(
      { error: "pg package not installed. Run: npm install pg" },
      { status: 500 }
    );
  }

  const client = new Client({ connectionString, connectionTimeoutMillis: 8000 });

  try {
    await client.connect();

    // 1. Columns
    const columnsRes = await client.query(`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        c.column_default,
        c.ordinal_position
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY c.table_name, c.ordinal_position
    `);

    // 2. Primary keys
    const pkRes = await client.query(`
      SELECT kcu.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
    `);

    // 3. Foreign keys
    const fkRes = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.table_name       AS from_table,
        kcu.column_name      AS from_column,
        ccu.table_name       AS to_table,
        ccu.column_name      AS to_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);

    // Build lookup sets
    const pkSet = new Set<string>(
      pkRes.rows.map((r: any) => `${r.table_name}.${r.column_name}`)
    );
    const fkMap = new Map<string, { toTable: string; toColumn: string }>();
    for (const row of fkRes.rows) {
      fkMap.set(`${row.from_table}.${row.from_column}`, {
        toTable: row.to_table,
        toColumn: row.to_column,
      });
    }

    // Build tables
    const tableMap = new Map<string, ImportedTable>();
    for (const row of columnsRes.rows) {
      if (!tableMap.has(row.table_name)) {
        tableMap.set(row.table_name, { tableName: row.table_name, columns: [] });
      }
      const colKey = `${row.table_name}.${row.column_name}`;
      const fkRef = fkMap.get(colKey);

      tableMap.get(row.table_name)!.columns.push({
        name: row.column_name,
        dataType: mapPgType(
          row.data_type === "USER-DEFINED" ? row.udt_name : row.data_type
        ),
        isNullable: row.is_nullable === "YES",
        isPrimaryKey: pkSet.has(colKey),
        isForeignKey: !!fkRef,
        defaultValue: row.column_default ?? undefined,
        referencedTable: fkRef?.toTable,
        referencedColumn: fkRef?.toColumn,
      });
    }

    const relationships: ImportedRelationship[] = fkRes.rows.map((row: any) => ({
      fromTable: row.from_table,
      fromColumn: row.from_column,
      toTable: row.to_table,
      toColumn: row.to_column,
    }));

    const dbName = connectionString.split("/").pop()?.split("?")[0] ?? "database";

    await client.end();

    return NextResponse.json({
      tables: Array.from(tableMap.values()),
      relationships,
      dbName,
    } satisfies DBImportResult);

  } catch (err: any) {
    await client.end().catch(() => {});
    const message = err.message ?? "Unknown error";

    if (message.includes("ECONNREFUSED"))
      return NextResponse.json({ error: "Connection refused — check host/port." }, { status: 400 });
    if (message.includes("password authentication"))
      return NextResponse.json({ error: "Wrong username or password." }, { status: 400 });
    if (message.includes("does not exist"))
      return NextResponse.json({ error: "Database not found — check the DB name." }, { status: 400 });
    if (message.includes("timeout"))
      return NextResponse.json({ error: "Connection timed out — host may be unreachable." }, { status: 400 });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Test connection
export async function GET(req: NextRequest) {
  const connectionString = req.nextUrl.searchParams.get("connectionString");
  if (!connectionString)
    return NextResponse.json({ error: "connectionString param required" }, { status: 400 });

  let Client: any;
  try {
    const pg = await import("pg");
    Client = pg.Client ?? pg.default?.Client;
  } catch {
    return NextResponse.json({ error: "pg not installed" }, { status: 500 });
  }

  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const res = await client.query(
      "SELECT current_database() AS db, version() AS version"
    );
    await client.end();
    return NextResponse.json({
      ok: true,
      db: res.rows[0].db,
      version: res.rows[0].version.split(" ").slice(0, 2).join(" "),
    });
  } catch (err: any) {
    await client.end().catch(() => {});
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}