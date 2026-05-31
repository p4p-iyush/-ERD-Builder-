import type { DataType } from "../../types/column";

export interface DataTypeOption {
  value: DataType;
  label: string;
  category: "numeric" | "text" | "boolean" | "date" | "other";
  color: string;
}

export const DATA_TYPE_OPTIONS: DataTypeOption[] = [
  // Numeric
  { value: "integer",    label: "INTEGER",    category: "numeric",  color: "#f59e0b" },
  { value: "bigint",     label: "BIGINT",     category: "numeric",  color: "#f59e0b" },
  { value: "smallint",   label: "SMALLINT",   category: "numeric",  color: "#f59e0b" },
  { value: "serial",     label: "SERIAL",     category: "numeric",  color: "#f59e0b" },
  { value: "bigserial",  label: "BIGSERIAL",  category: "numeric",  color: "#f59e0b" },
  { value: "float",      label: "FLOAT",      category: "numeric",  color: "#f97316" },
  { value: "decimal",    label: "DECIMAL",    category: "numeric",  color: "#f97316" },
  { value: "numeric",    label: "NUMERIC",    category: "numeric",  color: "#f97316" },
  // Text
  { value: "string",     label: "STRING",     category: "text",     color: "#10b981" },
  { value: "varchar",    label: "VARCHAR",    category: "text",     color: "#10b981" },
  { value: "text",       label: "TEXT",       category: "text",     color: "#10b981" },
  { value: "uuid",       label: "UUID",       category: "text",     color: "#8b5cf6" },
  { value: "json",       label: "JSON",       category: "text",     color: "#8b5cf6" },
  { value: "jsonb",      label: "JSONB",      category: "text",     color: "#8b5cf6" },
  // Boolean
  { value: "boolean",    label: "BOOLEAN",    category: "boolean",  color: "#3b82f6" },
  // Date
  { value: "date",       label: "DATE",       category: "date",     color: "#ec4899" },
  { value: "timestamp",  label: "TIMESTAMP",  category: "date",     color: "#ec4899" },
  { value: "timestamptz",label: "TIMESTAMPTZ",category: "date",     color: "#ec4899" },
];

export const DATA_TYPE_MAP = new Map<DataType, DataTypeOption>(
  DATA_TYPE_OPTIONS.map((opt) => [opt.value, opt])
);

export function getDataTypeColor(type: DataType): string {
  return DATA_TYPE_MAP.get(type)?.color ?? "#737373";
}

export function getDataTypeLabel(type: DataType): string {
  return DATA_TYPE_MAP.get(type)?.label ?? type.toUpperCase();
}