export type DataType =
  | "integer"
  | "bigint"
  | "smallint"
  | "serial"
  | "bigserial"
  | "string"
  | "varchar"
  | "text"
  | "boolean"
  | "float"
  | "decimal"
  | "numeric"
  | "date"
  | "timestamp"
  | "timestamptz"
  | "uuid"
  | "json"
  | "jsonb";

export interface Column {
  id: string;
  name: string;
  dataType: DataType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isNullable: boolean;
  defaultValue?: string;
  referencedTable?: string;
  referencedColumn?: string;
  order: number;
}

export interface ColumnFormData {
  name: string;
  dataType: DataType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isNullable: boolean;
  defaultValue?: string;
  referencedTable?: string;
  referencedColumn?: string;
}