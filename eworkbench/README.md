# EWorkbench — JB Lab electrical workbench

A static GitHub Pages workbench for multiple electronics projects and multiple schematics per project. The first project is the reverse-engineered wireless microphone in `TODO-001`.

**Published site:** https://jmbjr.github.io/lab/eworkbench/ (after merging the PR and a successful Pages build)

## How the Pages site is assembled

The repository's pre-existing Pages workflow published `inventory/` at the public root. The updated `.github/workflows/pages.yml` **retains that mapping** and assembles:

- `inventory/.` → site root (`/lab/`)
- `eworkbench/.` → `/lab/eworkbench/`
- compiled CircuitJS1 (`ts/dist/.`) → `/lab/eworkbench/vendor/circuitjs/`

The workflow checks out [pfalstad/circuitjs1](https://github.com/pfalstad/circuitjs1), runs `npm ci` and `npm run build` in its `ts/` folder, then copies the Vite assets under the same origin as this website. The CircuitJS1 source follows GPL v2-or-later; its upstream README and exact Git commit identifier are included in the deployed vendor directory (not checked in). The Pages build excludes the optional upstream Dropbox script and its root-scoped manifest link. Only the compiled deployment artifact is served.

**Important:** This version uses the upstream `master` branch at deploy time; pinning a tested commit is recommended after the first successful build. Changes to the simulator itself are upstream-controlled.

## Adding projects and schematics

1. Add a project folder under `eworkbench/projects/<slug>/`.
2. Put a `project.json` in it (see `projects/wireless-mic/project.json`).
3. Add it to `projects/index.json`.
4. Add one or more entries to the project `schematics` array:
   - `kind: observed` → references a measured-netlist JSON and an SVG diagram; records facts and unknowns, **not** a circuit simulation.
   - `kind: simulation` → references a CircuitJS1 `.txt` circuit and declares its assumptions.
5. The selector will present every schematic in that project automatically.

Schematics have stable IDs. The URL uses `?project=<id>&schematic=<id>`, so you can bookmark or share an exact workbench selection.

## U1 component placeholder

The wireless-mic project includes **U1: a provisional JieLi chip symbol**, a separate 20-contact positional map, and a machine-readable model with every unknown manufacturer pin and function explicitly unassigned. See [the identification notes](projects/wireless-mic/jl-u1-references.md) and [the U1 model](projects/wireless-mic/jl-u1-chip.json).

The AC7006D 32-pin datasheet and the AC7066M wireless-microphone reference schematic are **related-design references only**; neither establishes the target chip's exact pinout. The observed connectivity and CircuitJS1 simulation remain separate.

## Editing and saving

CircuitJS1 is embedded in a same-origin iframe. The workbench uses the documented `importCircuit` / `exportCircuit` API and native simulator editing. A user can:

- Run/pause the selected CircuitJS1 simulation
- Edit circuit components using CircuitJS1's UI
- Save a **browser-local** draft
- Import/download a CircuitJS1 `.txt` circuit
- Reset the draft to the repository version

GitHub Pages cannot write back to the repository unauthenticated. In-repo saving via an authenticated GitHub workflow is explicitly deferred. To commit a change now, download the circuit `.txt` and update its matching file in the GitHub repository.

## Interpretation and safety

The `wireless-mic/mic-input-observed.json` schematic preserves measured continuity only, with unknown values and unidentified JL pins. The `ac-coupling-sandbox.txt` schematic is **an illustrative RC circuit with assumed values**, not the real microphone board or an AC7006 behavioral model. Do not use it to choose component values for soldering without independent measurement.

CircuitJS1 is an educational simulator, not a sign-off tool for battery safety, RF behavior, or full mixed-signal SoC modeling.

## License and provenance

CircuitJS1 © its respective authors, [source repository](https://github.com/pfalstad/circuitjs1), licensed under the GNU GPL v2 or later. The upstream project is compiled as part of this GitHub Pages site, with the optional Dropbox script and manifest link removed during the build; the workbench wrapper uses its public JavaScript API. See `vendor/circuitjs/UPSTREAM-README.md` and `vendor/circuitjs/UPSTREAM-COMMIT.txt` on the published site.

## Future evaluation

See GitHub [issue #10](https://github.com/jmbjr/lab/issues/10) for reviewing ngspice/WASM, KiCad interoperability, and other engines.
