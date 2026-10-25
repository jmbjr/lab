# Projects

This directory tracks lab projects and their state in a form that is readable by people and parseable by tools.

## Directory map

```text
projects/
├── README.md
└── todo/
    ├── README.md
    └── TODO-NNN/
        └── todo.json
```

Current lifecycle directories:

- `todo/` — defined projects that have not yet reached completion.
- Future lifecycle directories may include `active/`, `done/`, or `archive/`. Project IDs remain stable if a project moves between lifecycle directories.

The README files are the fast human-readable map. Each project's JSON file is the machine-readable source for roadmap structure, dependency visualization, status, decisions, and exit criteria.

## Project IDs

Use stable IDs in the form `TODO-001`, `TODO-002`, etc. A project ID should not be reused. The directory name and `project.id` inside its JSON must match.

## `todo.json` schema

The schema is intentionally lightweight and versioned by the top-level `schema_version`.

### Top level

```json
{
  "schema_version": "1.0",
  "project": { "...": "project metadata" },
  "nodes": ["...DAG nodes..."]
}
```

### Project metadata

Recommended `project` fields:

- `id` — stable project ID.
- `title` — human-readable project name.
- `slug` — short machine-friendly name.
- `status` — lifecycle state such as `todo`, `active`, `done`, or `blocked`.
- `phase` — engineering phase such as `discover`, `define`, `develop`, or `validate`.
- `iteration` — current development iteration number.
- `objective` — concise objective for the current iteration.
- `created_at` / `updated_at` — ISO `YYYY-MM-DD` dates.
- `current_node_ids` — nodes currently ready or in progress.
- `entry_node_ids` — graph roots that establish project context.
- `terminal_node_ids` — graph leaves representing an iteration exit or explicit blocker.
- `iteration_exit_criteria` — conditions required to complete the current iteration.
- `out_of_scope_for_iteration` — work intentionally deferred.

### Nodes

Every object in `nodes` is a graph node with a unique `id`.

Common fields:

- `id` — unique within the project. Recommended prefixes: `INFO-`, `STEP-`, `DEC-`.
- `kind` — one of `info`, `step`, or `decision`.
- `title` — short human-readable name.
- `status` — recommended values: `pending`, `ready`, `in_progress`, `blocked`, `done`, `not_applicable`.
- `summary` — optional explanatory text.
- `upstream` — node IDs that point into this node.
- `downstream` — node IDs this node points to.
- `dependency_mode` — optional; defaults to `all`. Use `any` when completion of any one upstream branch is sufficient.

The graph must be a DAG: no cycles are allowed.

Dependency links are deliberately stored in both directions so a simple tool can traverse either way without building a reverse index. Links must remain symmetric:

- if `A.downstream` contains `B`, then `B.upstream` must contain `A`;
- if `B.upstream` contains `A`, then `A.downstream` must contain `B`.

### Info nodes

`info` nodes capture established facts, constraints, evidence, or context. They preserve why a roadmap begins where it does without misrepresenting established findings as future tasks.

```json
{
  "id": "INFO-001",
  "kind": "info",
  "title": "Known constraint",
  "status": "done",
  "summary": "The target speaker accepts analog AUX input.",
  "upstream": [],
  "downstream": ["STEP-001"]
}
```

### Step nodes

`step` nodes represent executable work. Useful optional fields are:

- `acceptance_criteria` — observable conditions for completion.
- `outputs` — expected artifacts, measurements, prototypes, or notes.

### Decision nodes

`decision` nodes capture choices that branch the roadmap.

Recommended fields:

- `question` — the decision being made.
- `decision_rule` — how to choose.
- `options` — possible outcomes.
- `selected_option_id` — `null` until a decision is made.

Each option contains:

- `id` — stable option ID.
- `label` — human-readable outcome.
- `next_node_ids` — nodes activated by that outcome.

All possible `next_node_ids` should also appear in the decision node's `downstream` array. After a decision is made, unselected conditional branches may be marked `not_applicable`.

## DAG visualization

A future visualization tool can:

1. parse `nodes`;
2. create one vertex per node `id`;
3. create directed edges from each `downstream` link;
4. style vertices by `kind`;
5. style progress by `status`;
6. highlight `current_node_ids`;
7. use `selected_option_id` to emphasize the active branch from decision nodes;
8. display `iteration_exit_criteria` as the goal for the current graph.

## Updating a project

When knowledge changes:

1. update relevant node statuses and outputs;
2. record the selected option on completed decision nodes;
3. add new nodes when newly discovered work is required;
4. preserve stable IDs for existing nodes;
5. keep upstream/downstream links symmetric;
6. keep the graph acyclic;
7. update `project.current_node_ids` and `project.updated_at`;
8. update the lifecycle README entry if the project's state or headline changes.

The goal is a small, durable structure that a future chat or tool can understand quickly without reading an entire conversation history.
