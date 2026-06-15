// lib/utils/connectionStringParser.ts

export interface ParsedConnection {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
  isValid: boolean;
  error?: string;
}

/**
 * Parses a PostgreSQL connection string.
 * Supports URI format: postgresql://user:password@host:port/database
 */
export function parseConnectionString(raw: string): ParsedConnection {
  const empty: ParsedConnection = {
    user: "",
    password: "",
    host: "",
    port: "5432",
    database: "",
    isValid: false,
  };

  if (!raw?.trim()) {
    return { ...empty, error: "Empty connection string" };
  }

  const trimmed = raw.trim();

  // ── URI format ─────────────────────────────────────────────────────────
  if (trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://")) {
    try {
      const url = new URL(trimmed);
      return {
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        host: url.hostname,
        port: url.port || "5432",
        database: url.pathname.replace("/", ""),
        isValid: true,
      };
    } catch (e: any) {
      return { ...empty, error: `Invalid URI: ${e.message}` };
    }
  }

  // ── Key=value format ───────────────────────────────────────────────────
  if (trimmed.includes("=")) {
    const kv: Record<string, string> = {};
    const pairs = trimmed.match(/(\w+)\s*=\s*(?:'([^']*)'|"([^"]*)"|(\S+))/g) ?? [];

    for (const pair of pairs) {
      const eqIdx = pair.indexOf("=");
      const key = pair.slice(0, eqIdx).trim();
      let val = pair.slice(eqIdx + 1).trim();
      if (
        (val.startsWith("'") && val.endsWith("'")) ||
        (val.startsWith('"') && val.endsWith('"'))
      ) {
        val = val.slice(1, -1);
      }
      kv[key] = val;
    }

    return {
      user: kv.user ?? kv.username ?? "",
      password: kv.password ?? "",
      host: kv.host ?? kv.hostname ?? "localhost",
      port: kv.port ?? "5432",
      database: kv.dbname ?? kv.database ?? "",
      isValid: !!(kv.host || kv.hostname),
    };
  }

  return {
    ...empty,
    error: "Unrecognized format. Use postgresql://user:pass@host:port/db",
  };
}

/**
 * Masks password for safe display.
 */
export function maskConnectionString(raw: string): string {
  if (!raw) return "";
  if (raw.includes("@")) {
    return raw.replace(/:([^:@]+)@/, ":••••••••@");
  }
  return raw.replace(/password\s*=\s*\S+/gi, "password=••••••••");
}

/**
 * Returns { valid, hint } for inline validation feedback.
 */
export function validateConnectionString(raw: string): {
  valid: boolean;
  hint?: string;
} {
  const parsed = parseConnectionString(raw);

  if (!parsed.isValid) return { valid: false, hint: parsed.error };
  if (!parsed.host)     return { valid: false, hint: "Missing host" };
  if (!parsed.database) return { valid: false, hint: "Missing database name" };
  if (!parsed.user)     return { valid: false, hint: "Missing username" };

  return { valid: true };
}