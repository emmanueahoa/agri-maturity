# SF Maturity Suite — Roadmap & Assessment

A single-file React application for running smart-farming / digital-maturity assessments, managing assessment definitions, storing company assessment cases, and generating roadmap recommendations from assessment outcomes.

> **Current architecture:** the app is currently packaged as one standalone HTML file with inlined JavaScript/CSS and browser-local persistence. This README is written with a future split into `logic`, `db`, `ui`, `services`, and `domain` modules in mind.

---

## 1. What the app does

SF Maturity Suite supports a complete maturity-assessment workflow:

1. **Login gate**
   - Simple password-based access using a SHA-256 password hash in the browser.
   - Intended for lightweight controlled testing, not production-grade authentication.

2. **Assessment definitions**
   - Ships with a built-in `Default` definition.
   - Supports imported/custom definitions through persisted app state.
   - Tracks definition-specific buckets for assessments and systems.

3. **Assessment screen**
   - Displays assessment dimensions as tabs/cards.
   - Each criterion contains maturity levels 1–5.
   - Each level contains statement checkboxes.
   - A maturity level becomes valid only when at least two statements are checked within that same level.
   - Only one maturity level can be active per criterion.
   - `Assessment Results` is a UI-only summary tab and must never be treated as a real assessment dimension.

4. **Assessment results**
   - Summarises completed assessment scores across dimensions/sub-dimensions.
   - Supports navigation into roadmap generation once assessment data is available.

5. **Roadmap screen**
   - Filters roadmap recommendations by dimension, sub-dimension, maturity level, and transition.
   - Dimension and sub-dimension lists should be aligned with the active assessment definition.
   - Roadmap sub-dimensions must not be inferred from stale roadmap rows if they do not exist in the assessment definition.

6. **Companies / saved assessments**
   - Stores assessment cases per active definition.
   - Allows loading/editing previously saved company assessments.

7. **Systems inventory**
   - Supports adding systems connected to the active definition/case context.

8. **Admin tools**
   - Provides admin-style maintenance for definitions/roadmap data.
   - Supports roadmap row editing and definition-aware data buckets.

---

## 2. Current technical stack

- **Frontend:** React rendered inside a single HTML file.
- **Styling:** Tailwind/shadcn-style classes with inlined Tailwind runtime/assets.
- **Storage:** Browser `localStorage`.
- **State model:** Definition-aware state object, currently persisted under a v2 DMA state key.
- **Build system:** None currently. The app runs directly as a standalone HTML file.

---

## 3. Important domain concepts

### 3.1 Definition

A definition describes the assessment model. It contains:

```ts
Definition = {
  id: string;
  label: string;
  version?: string;
  resultsDimensionId?: string;
  dimensions: Dimension[];
}
```

### 3.2 Dimension

A real assessment dimension contains criteria/questions.

```ts
Dimension = {
  id: string;
  label: string;
  tooltip?: string;
  criteria: Criterion[];
}
```

> Important: `assessment_results` / `results` is **not** a real dimension. It is a pseudo-tab used only for showing summary results.

### 3.3 Criterion / sub-dimension

In the current model, roadmap sub-dimensions often align with assessment criteria. Future code should make this explicit by introducing a `SubDimension` or `CriterionGroup` domain type.

```ts
Criterion = {
  id: string;
  label: string;
  tooltip?: string;
  question: string;
  options: MaturityLevel[];
}
```

### 3.4 Maturity level

```ts
MaturityLevel = {
  value: 1 | 2 | 3 | 4 | 5;
  title: string;
  bullets: string[];
}
```

### 3.5 Criterion response

```ts
CriterionResponse = {
  value: 0 | 1 | 2 | 3 | 4 | 5;
  checks: Record<number, boolean[]>;
  note?: string;
}
```

Rules:

- Only one maturity level may have checked statements for a criterion.
- A maturity level is valid when at least two statements are checked.
- If fewer than two statements are checked, `value` must be `0`.
- Empty levels should not be persisted in `checks`.

---

## 4. Current persistence model

The app currently uses browser `localStorage`. The important persisted areas are:

```ts
DmaStateV2 = {
  version: 2;
  activeDefinitionId: string;
  definitionsById: Record<string, Definition>;
  definitionMetaById: Record<string, DefinitionMeta>;
  assessmentsByDefinitionId: Record<string, AssessmentCase[]>;
  systemsByDefinitionId: Record<string, SystemInventoryItem[]>;
}
```

There is also case-scoped storage for in-progress assessment answers.

### Future DB considerations

When splitting the app, move persistence behind a repository interface:

```ts
interface DefinitionRepository {
  list(): Promise<Definition[]>;
  getById(id: string): Promise<Definition | null>;
  save(definition: Definition): Promise<void>;
}

interface AssessmentRepository {
  listByDefinition(definitionId: string): Promise<AssessmentCase[]>;
  getCase(definitionId: string, caseId: string): Promise<AssessmentCase | null>;
  saveCase(definitionId: string, assessment: AssessmentCase): Promise<void>;
  deleteCase(definitionId: string, caseId: string): Promise<void>;
}

interface RoadmapRepository {
  listRows(definitionId: string): Promise<RoadmapRow[]>;
  saveRow(definitionId: string, row: RoadmapRow): Promise<void>;
}
```

This makes it possible to swap `localStorage` for IndexedDB, Supabase, Firebase, SQLite, PostgreSQL, SharePoint Lists, Dataverse, or an API backend without rewriting UI logic.

---

## 5. Recommended future folder structure

```text
sf-maturity-suite/
├─ README.md
├─ package.json
├─ index.html
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ routes.tsx
│  │  └─ providers/
│  │     ├─ ThemeProvider.tsx
│  │     └─ DefinitionProvider.tsx
│  ├─ domain/
│  │  ├─ assessment/
│  │  │  ├─ types.ts
│  │  │  ├─ scoring.ts
│  │  │  ├─ validation.ts
│  │  │  └─ dimensionSelectors.ts
│  │  ├─ roadmap/
│  │  │  ├─ types.ts
│  │  │  ├─ filtering.ts
│  │  │  ├─ sorting.ts
│  │  │  └─ alignment.ts
│  │  ├─ definitions/
│  │  │  ├─ types.ts
│  │  │  ├─ defaultDefinition.ts
│  │  │  └─ definitionValidation.ts
│  │  └─ systems/
│  │     └─ types.ts
│  ├─ db/
│  │  ├─ localStorage/
│  │  │  ├─ localStorageClient.ts
│  │  │  ├─ definitionRepository.local.ts
│  │  │  ├─ assessmentRepository.local.ts
│  │  │  └─ roadmapRepository.local.ts
│  │  └─ repositoryInterfaces.ts
│  ├─ services/
│  │  ├─ authService.ts
│  │  ├─ importExportService.ts
│  │  ├─ assessmentService.ts
│  │  └─ roadmapService.ts
│  ├─ ui/
│  │  ├─ components/
│  │  ├─ screens/
│  │  │  ├─ AssessmentScreen.tsx
│  │  │  ├─ RoadmapScreen.tsx
│  │  │  ├─ CompaniesScreen.tsx
│  │  │  └─ AdminScreen.tsx
│  │  └─ layout/
│  ├─ utils/
│  │  ├─ ids.ts
│  │  ├─ normalize.ts
│  │  └─ storageKeys.ts
│  └─ tests/
│     ├─ assessment.scoring.test.ts
│     ├─ roadmap.alignment.test.ts
│     └─ definition.validation.test.ts
└─ docs/
   ├─ architecture.md
   ├─ data-model.md
   └─ migration-plan.md
```

---

## 6. Suggested module boundaries

### 6.1 `domain/assessment`

Owns business rules for assessment behaviour.

Should contain:

- criterion scoring
- checkbox state transitions
- active-level enforcement
- assessment completion checks
- dimension/sub-dimension extraction from definitions

Example functions:

```ts
export function updateCriterionChecks(
  previous: CriterionResponse,
  levelValue: number,
  statementIndex: number,
  checked: boolean,
  bulletCount: number
): CriterionResponse;

export function isCriterionComplete(response: CriterionResponse): boolean;

export function getRealAssessmentDimensions(definition: Definition): Dimension[];
```

### 6.2 `domain/roadmap`

Owns roadmap-specific rules.

Should contain:

- roadmap row filtering
- roadmap row sorting
- transition-level mapping
- dimension/sub-dimension alignment with definitions
- protection against stale roadmap labels

Example functions:

```ts
export function getRoadmapDimensionItems(definition: Definition): string[];

export function getRoadmapSubDimensionItems(
  definition: Definition,
  selectedDimensionLabel: string
): string[];

export function filterRoadmapRows(
  rows: RoadmapRow[],
  filters: RoadmapFilters,
  definition: Definition
): RoadmapRow[];
```

### 6.3 `db`

Owns persistence. UI code should not call `localStorage` directly after the split.

Recommended first step:

- Keep `localStorage`, but wrap it in repository classes.
- Add repository interfaces.
- Later replace implementations with a real database/API.

### 6.4 `services`

Coordinates domain logic and repositories.

Examples:

- `assessmentService.saveAssessmentCase(...)`
- `roadmapService.getFilteredRoadmap(...)`
- `importExportService.importDefinition(...)`
- `authService.validatePassword(...)`

### 6.5 `ui`

Owns React components only.

UI components should receive prepared data and callbacks from hooks/services. UI components should avoid:

- direct `localStorage` calls
- embedded scoring rules
- embedded roadmap alignment rules
- direct definition mutation

---

## 7. Key rules to preserve during refactoring

### 7.1 `Assessment Results` is not a real dimension

Always filter pseudo-dimensions from real dimension lists:

```ts
export function isRealAssessmentDimension(d?: Dimension): boolean {
  return Boolean(
    d &&
    d.id !== 'assessment_results' &&
    d.id !== 'results' &&
    Array.isArray(d.criteria) &&
    d.criteria.length > 0
  );
}
```

Use this everywhere:

- assessment tabs, except where explicitly appending the results tab
- roadmap dimension dropdown
- roadmap sorting
- saved assessment validation
- export/import validation

### 7.2 Roadmap sub-dimensions must align with the assessment definition

Do not populate the roadmap sub-dimension dropdown from roadmap row values. Roadmap rows may contain legacy labels, aliases, or inferred values. The dropdown should be driven by the active definition.

### 7.3 Definition-scoped data must stay isolated

Assessment cases, systems, roadmap edits, and in-progress responses should be scoped by `activeDefinitionId`.

### 7.4 Scoring rules must remain deterministic

For each criterion:

- one active maturity level at a time
- 0/empty score if fewer than two statements are selected
- level score if two or more statements are selected
- no empty level arrays persisted

---

## 8. Migration plan from single-file app

### Phase 1 — Safety extraction

- Move pure helper functions into `src/domain` without changing behaviour.
- Add tests around current known rules.
- Keep the single-file app as the reference implementation.

Recommended first extraction targets:

1. `isRealAssessmentDimension`
2. `getAssessmentDimensions`
3. `getRoadmapDimensionItems`
4. `getRoadmapSubDimensionItems`
5. `updateCriterionChecks`
6. `filterRoadmapRows`
7. `sortRoadmapRows`

### Phase 2 — Persistence boundary

- Wrap all `localStorage` reads/writes in repository classes.
- Replace direct storage calls in React components with service calls.
- Add migration helpers for existing `dma_state_v2` data.

### Phase 3 — UI split

- Move each screen into its own React component file.
- Move shared UI components into `ui/components`.
- Move stateful screen hooks into `ui/screens/*/use*.ts` files.

### Phase 4 — DB/backend-ready architecture

- Keep repository interfaces stable.
- Add a new DB-backed implementation.
- Use feature flags or dependency injection to switch between local and backend persistence.

### Phase 5 — Build and deployment

- Introduce Vite or another lightweight React build setup.
- Add TypeScript.
- Add unit tests and integration tests.
- Add CI checks for linting, type checking, and tests.

---

## 9. Suggested tests before and after refactor

### Assessment scoring tests

- Checking two statements in level 3 sets criterion value to `3`.
- Checking one statement in level 3 keeps criterion value at `0`.
- Checking level 4 after level 3 clears level 3 checks.
- Unchecking from two selected statements down to one resets criterion value to `0`.
- Empty levels are not saved in `checks`.

### Dimension alignment tests

- `Assessment Results` never appears in roadmap dimension dropdown.
- `assessment_results` and `results` are filtered from all real dimension lists.
- Imported definitions without a results dimension still work.
- Default definition keeps the results UI tab but does not expose it as a real dimension.

### Roadmap sub-dimension tests

- Sub-dimension dropdown only contains criteria/sub-dimensions from the active assessment dimension.
- Roadmap row-only sub-dimensions do not appear in the dropdown.
- Switching dimensions clears stale sub-dimensions.
- Duplicate labels are de-duplicated while preserving order.

### Persistence tests

- Assessment cases are saved under the correct `definitionId`.
- Switching definitions does not show cases from another definition.
- Systems inventory is scoped by definition.
- Legacy/corrupt state falls back safely.

---

## 10. Known technical debt

- The app is currently a large single-file implementation.
- Business rules are mixed with UI rendering in several places.
- `localStorage` access is spread across the app and should be wrapped.
- The default definition currently includes `RESULTS_MODEL` inside its dimensions array for compatibility, so all real-dimension consumers must filter pseudo-dimensions.
- Roadmap data and assessment definitions use related but not fully unified concepts for sub-dimensions/practice areas.
- Authentication is suitable only for lightweight testing and should be replaced for production.

---

## 11. Development notes

When editing the current single-file version, be careful to preserve:

- definition-scoped storage
- assessment results pseudo-tab behaviour
- dimension/sub-dimension alignment rules
- roadmap sort order by active definition
- single-active-level assessment scoring
- saved company assessment editing
- admin roadmap editing
- systems inventory scoping

Before releasing a change, manually check:

1. Default definition opens correctly.
2. Imported definition opens correctly.
3. `Assessment Results` appears only as a results tab, not as a selectable dimension.
4. Roadmap sub-dimension dropdown matches the assessment dimension.
5. Existing saved assessment cases still load.
6. Assessment scoring still resets correctly when fewer than two statements are selected.
7. Roadmap search still works after switching dimensions.

---

## 12. Future production considerations

- Replace browser-only authentication with proper identity provider integration.
- Replace `localStorage` with a database/API layer.
- Add audit/history for assessment changes.
- Add import/export schema versions.
- Add validation reports when importing definitions.
- Add telemetry/error logging.
- Add role-based access for admin tools.
- Add automated tests for all domain rules before major refactoring.

---

## 13. Glossary

- **Definition:** A full assessment model containing dimensions and criteria.
- **Dimension:** A real assessment area, such as business processes, people, strategy, data, technology, etc.
- **Pseudo-dimension:** A UI-only tab such as `Assessment Results`; not a real assessment dimension.
- **Criterion:** A question or sub-dimension with five maturity levels.
- **Maturity level:** One of levels 1–5 with multiple statements/bullets.
- **Roadmap row:** A recommendation/action item linked to dimension, sub-dimension, level, and transition.
- **Transition:** Movement from one maturity level to the next.
- **Definition-scoped data:** Assessments, systems, and roadmap data stored separately per definition.
