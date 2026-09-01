import { strict as assert } from 'assert';
import { updateCriterionChecks, isCriterionComplete, isRealAssessmentDimension, getRealAssessmentDimensions, getRoadmapSubDimensionItems, filterRoadmapRows } from '../services/domain';
import { CriterionResponse, Definition, Dimension, RoadmapRow } from '../types/domain';

// The compiled tests will live in dist/tests and be run with node --test

export {}; // module

const bulletCount = 4;

Deno?; // placeholder to prevent Deno linting in some editors

// Tests are below. We will write using node's test runner style via assertions.

function runTests() {
  // Test 1: Checking two statements in level 3 sets criterion value to 3.
  let prev: CriterionResponse = { value: 0, checks: {} };
  prev = updateCriterionChecks(prev, 3, 0, true, bulletCount);
  prev = updateCriterionChecks(prev, 3, 1, true, bulletCount);
  assert.equal(prev.value, 3, 'Two checks in level 3 -> value 3');

  // Test 2: Checking one statement in level 3 keeps criterion value at 0.
  let prev2: CriterionResponse = { value: 0, checks: {} };
  prev2 = updateCriterionChecks(prev2, 3, 0, true, bulletCount);
  assert.equal(prev2.value, 0, 'One check -> value 0');

  // Test 3: Checking level 4 after level 3 clears level 3 checks.
  let p: CriterionResponse = { value: 0, checks: {} };
  p = updateCriterionChecks(p, 3, 0, true, bulletCount);
  p = updateCriterionChecks(p, 3, 1, true, bulletCount);
  assert.equal(p.value, 3);
  p = updateCriterionChecks(p, 4, 0, true, bulletCount);
  p = updateCriterionChecks(p, 4, 1, true, bulletCount);
  assert.equal(p.value, 4);
  // previous level 3 should be cleared from checks
  assert(!p.checks[3], 'level 3 checks cleared after setting level 4');

  // Test 4: Unchecking from two selected statements down to one resets criterion value to 0.
  let q: CriterionResponse = { value: 0, checks: {} };
  q = updateCriterionChecks(q, 2, 0, true, bulletCount);
  q = updateCriterionChecks(q, 2, 1, true, bulletCount);
  assert.equal(q.value, 2);
  q = updateCriterionChecks(q, 2, 1, false, bulletCount);
  assert.equal(q.value, 0, 'Dropping from two->one resets to 0');

  // Test 5: Empty levels are not saved in checks.
  let r: CriterionResponse = { value: 0, checks: {} };
  r = updateCriterionChecks(r, 1, 0, true, bulletCount);
  // then uncheck
  r = updateCriterionChecks(r, 1, 0, false, bulletCount);
  assert.equal(Object.keys(r.checks).length, 0, 'Empty levels are removed from checks');

  // isRealAssessmentDimension tests
  const dims: Dimension[] = [
    { id: 'a', label: 'A', criteria: [{ id: 'c1', label: 'C1' }] },
    { id: 'assessment_results', label: 'Results', criteria: [] },
    { id: 'results', label: 'Results2', criteria: [] },
    { id: 'b', label: 'B', criteria: [] }
  ];
  const def: Definition = { id: 'def', label: 'Def', dimensions: dims };
  const real = getRealAssessmentDimensions(def);
  assert.equal(real.length, 1, 'Only one real dimension (A)');

  // Roadmap sub-dimension and filtering
  const def2: Definition = {
    id: 'd', label: 'D', dimensions: [
      { id: 'dim1', label: 'Dimension 1', criteria: [{ id: 'cr1', label: 'SubA' }, { id: 'cr2', label: 'SubB' }] },
      { id: 'dim2', label: 'Dimension 2', criteria: [{ id: 'cr3', label: 'SubX' }] }
    ]
  };
  const subItems = getRoadmapSubDimensionItems(def2, 'Dimension 1');
  assert.deepEqual(subItems, ['SubA','SubB']);

  const rows: RoadmapRow[] = [
    { id: 'r1', definitionId: 'd', dimension: 'Dimension 1', subDimension: 'SubA', level: 2, transition: '2->3' },
    { id: 'r2', definitionId: 'd', dimension: 'Dimension 1', subDimension: 'Legacy', level: 2 },
    { id: 'r3', definitionId: 'd', dimension: 'Dimension 2', subDimension: 'SubX', level: 1 }
  ];

  // Filter: select Dimension 1; sub-dimension dropdown should only include SubA/SubB
  const filtered = filterRoadmapRows(rows, { dimension: 'Dimension 1' }, def2);
  assert.equal(filtered.length, 2, 'Dimension filter applies');

  // If subDimension filter is set to value not in definition, it should exclude rows
  const filtered2 = filterRoadmapRows(rows, { dimension: 'Dimension 1', subDimension: 'Legacy' }, def2);
  assert.equal(filtered2.length, 0, 'Stale roadmap sub-dimensions excluded');

  console.log('All domain tests passed');
}

if (require.main === module) runTests();
