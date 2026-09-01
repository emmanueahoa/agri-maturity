export type MaturityLevel = {
  value: 1 | 2 | 3 | 4 | 5;
  title: string;
  bullets: string[];
};

export type Criterion = {
  id: string;
  label: string;
  tooltip?: string;
  question?: string;
  options?: MaturityLevel[];
};

export type Dimension = {
  id: string;
  label: string;
  tooltip?: string;
  criteria: Criterion[];
};

export type Definition = {
  id: string;
  label: string;
  version?: string;
  resultsDimensionId?: string;
  dimensions: Dimension[];
};

export type CriterionResponse = {
  value: 0 | 1 | 2 | 3 | 4 | 5;
  checks: Record<number, boolean[]>;
  note?: string;
};
