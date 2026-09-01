import { CriterionResponse, Definition, Dimension } from '../types/domain';

export function isRealAssessmentDimension(d?: Dimension): boolean {
  return Boolean(
    d &&
    d.id !== 'assessment_results' &&
    d.id !== 'results' &&
    Array.isArray(d.criteria) &&
    d.criteria.length > 0
  );
}

export function getRealAssessmentDimensions(def: Definition) {
  return (def.dimensions || []).filter(isRealAssessmentDimension);
}

export function isCriterionComplete(response: CriterionResponse): boolean {
  return response.value > 0;
}

// Updates the checks for a given criterion
export function updateCriterionChecks(
  previous: CriterionResponse,
  levelValue: number,
  statementIndex: number,
  checked: boolean,
  bulletCount: number
): CriterionResponse {
  // Clone
  const checks: Record<number, boolean[]> = {};
  for (const k of Object.keys(previous.checks || {})) {
    const n = Number(k);
    checks[n] = Array.from(previous.checks[n] || []);
  }

  // Ensure arrays have proper length
  function ensureArray(arr: boolean[] | undefined) {
    const a = arr ? Array.from(arr) : Array(bulletCount).fill(false);
    while (a.length < bulletCount) a.push(false);
    if (a.length > bulletCount) a.length = bulletCount;
    return a;
  }

  // Clear other levels (only one active level allowed)
  for (const k of Object.keys(checks)) {
    const n = Number(k);
    if (n !== levelValue) {
      delete checks[n];
    }
  }

  // Toggle the target statement
  const arr = ensureArray(checks[levelValue]);
  arr[statementIndex] = checked;
  // Assign
  checks[levelValue] = arr;

  // Determine if this level is valid (>=2 checked)
  const checkedCount = (checks[levelValue] || []).filter(Boolean).length;
  const value: 0 | 1 | 2 | 3 | 4 | 5 = checkedCount >= 2 ? (levelValue as any) : 0;

  // Remove empty levels (no true values)
  for (const k of Object.keys(checks)) {
    const n = Number(k);
    const arr2 = checks[n] || [];
    if (arr2.filter(Boolean).length === 0) {
      delete checks[n];
    } else {
      // trim trailing falses beyond bulletCount
      if (arr2.length > bulletCount) arr2.length = bulletCount;
    }
  }

  return { value, checks };
}

// Roadmap / definition helpers
export function getRoadmapDimensionItems(def: Definition): string[] {
  return getRealAssessmentDimensions(def).map(d => d.label);
}

export function getRoadmapSubDimensionItems(def: Definition, selectedDimensionLabel: string): string[] {
  const dims = getRealAssessmentDimensions(def);
  const dim = dims.find(d => d.label === selectedDimensionLabel);
  if (!dim) return [];
  // Map criteria to labels (sub-dimensions)
  return dim.criteria.map(c => c.label);
}

export type RoadmapRow = {
  id: string;
  definitionId: string;
  dimension?: string;
  subDimension?: string;
  level?: number;
  transition?: string;
  content?: any;
};

export type RoadmapFilters = {
  dimension?: string;
  subDimension?: string;
  minLevel?: number;
  maxLevel?: number;
  transition?: string;
};

export function filterRoadmapRows(rows: RoadmapRow[], filters: RoadmapFilters, def: Definition): RoadmapRow[] {
  const subItems = filters.dimension ? getRoadmapSubDimensionItems(def, filters.dimension) : null;
  return rows.filter(r => {
    if (filters.dimension && r.dimension !== filters.dimension) return false;
    if (filters.subDimension) {
      // Ensure subDimension exists in the active definition for the selected dimension
      if (subItems && !subItems.includes(filters.subDimension)) return false;
      if (r.subDimension !== filters.subDimension) return false;
    }
    if (typeof filters.minLevel === 'number' && (typeof r.level !== 'number' || r.level < filters.minLevel)) return false;
    if (typeof filters.maxLevel === 'number' && (typeof r.level !== 'number' || r.level > filters.maxLevel)) return false;
    if (filters.transition && r.transition !== filters.transition) return false;
    return true;
  });
}
