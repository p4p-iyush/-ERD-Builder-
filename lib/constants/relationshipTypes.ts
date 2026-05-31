import type { RelationshipType } from "../../types/relationship";

export interface RelationshipOption {
  value: RelationshipType;
  label: string;
  description: string;
  sourceSymbol: string;
  targetSymbol: string;
}

export const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  {
    value: "one-to-one",
    label: "One to One",
    description: "Each record in A relates to exactly one record in B",
    sourceSymbol: "||",
    targetSymbol: "||",
  },
  {
    value: "one-to-many",
    label: "One to Many",
    description: "Each record in A relates to many records in B",
    sourceSymbol: "||",
    targetSymbol: "}o",
  },
  {
    value: "many-to-many",
    label: "Many to Many",
    description: "Many records in A relate to many records in B",
    sourceSymbol: "}o",
    targetSymbol: "o{",
  },
];