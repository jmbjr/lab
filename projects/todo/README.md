# TODO Projects

Defined lab projects that are not yet complete.

| ID | Project | Phase | Current objective |
| --- | --- | --- | --- |
| [TODO-001](./TODO-001/todo.json) | Wireless microphone mod for ON M45 speaker | Define / Iteration 1 | Identify and prove a usable audio interface inside the wireless microphone, then reproduce intelligible microphone audio through the M45 AUX input. |

## TODO-001 — Wireless microphone mod

The microphone has been confirmed by ESP-SDR testing to transmit in the 2.4 GHz ISM band, but its exact wireless protocol remains unresolved. It does not appear as an ordinary pairable Bluetooth microphone.

The current project deliberately does **not** make RF protocol decoding the critical path. Iteration 1 focuses on opening and documenting the microphone, mapping its audio/RF functional blocks, identifying a practical audio interception point, characterizing that signal, and proving a wired microphone-to-ON-M45 AUX path.

The machine-readable roadmap, dependencies, decision points, and exit criteria are in [`TODO-001/todo.json`](./TODO-001/todo.json).
