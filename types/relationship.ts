export type RelationshipType =
  | "one-to-one"
  | "one-to-many"
  | "many-to-many";

export type EdgeStyle = "straight" | "curved" | "step";

export interface Relationship {
  id: string;
  sourceTableId: string;
  targetTableId: string;
  sourceColumnId: string;
  targetColumnId: string;
  type: RelationshipType;
  label?: string;
  style?: EdgeStyle;
}