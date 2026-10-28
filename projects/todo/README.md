# TODO Projects

Defined lab projects that are not yet complete.

| ID | Project | Phase | Current objective |
| --- | --- | --- | --- |
| [TODO-001](./TODO-001/todo.json) | Wireless microphone mod for ON M45 speaker | Define / Iteration 1 | Identify and prove a usable audio interface inside the wireless microphone, then reproduce intelligible microphone audio through the M45 AUX input. |
| [TODO-002](./TODO-002/todo.json) | Circuit basics tutorial | Define / Iteration 1 | Predict, simulate, build, and measure voltage division, loading, and RC timing on a separate approximately 3 V breadboard circuit. |

## TODO-001 — Wireless microphone mod

The microphone has been confirmed by ESP-SDR testing to transmit in the 2.4 GHz ISM band, but its exact wireless protocol remains unresolved. It does not appear as an ordinary pairable Bluetooth microphone.

The current project deliberately does **not** make RF protocol decoding the critical path. Iteration 1 focuses on opening and documenting the microphone, mapping its audio/RF functional blocks, identifying a practical audio interception point, characterizing that signal, and proving a wired microphone-to-ON-M45 AUX path.

The machine-readable roadmap, dependencies, decision points, and exit criteria are in [`TODO-001/todo.json`](./TODO-001/todo.json).

## TODO-002 — Circuit basics tutorial

Three guided lessons introduce voltage dividers, loading, and capacitor charge/discharge. Each lesson has a designed schematic, an editable CircuitJS1 model, build instructions, measurement prompts, hidden expected results, and troubleshooting guidance. Use a separate breadboard and two-AA supply; these circuits are not reconstructions of the microphone.

Start in [EWorkbench](https://jmbjr.github.io/lab/eworkbench/?project=circuit-basics&schematic=voltage-divider), or read the [tutorial overview](../../eworkbench/projects/circuit-basics/README.md). The [roadmap](./TODO-002/todo.json) starts at bench preparation. No physical results or lesson completions are claimed.
